import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { encoding_for_model, get_encoding } from 'tiktoken';
import {
  IOpenAIService,
  ChatCompletionRequest,
  ChatCompletionResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  ModerationRequest,
  ModerationResponse,
  OpenAIConfig,
} from './openai.interface';
import { OpenAIModel, OpenAIErrorType } from './enums/openai.enums';
import { ChatCompletionCreateDto } from './dto/chat-completion.dto';
import {
  EmbeddingCreateDto,
  EmbeddingCreateBatchDto,
} from './dto/embedding.dto';
import {
  ModerationCreateDto,
  ModerationAnalysisDto,
} from './dto/moderation.dto';
import {
  OpenAIExceptionFactory,
  OpenAIRateLimitException,
  isRetryableError,
} from './exceptions/openai.exceptions';

interface RateLimitState {
  requests: number;
  tokens: number;
  windowStart: number;
}

interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  exponentialBackoff: boolean;
  retryableErrors: string[];
}

@Injectable()
export class OpenAIService implements IOpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly openai: OpenAI;
  private readonly config: OpenAIConfig;
  private readonly rateLimitState: RateLimitState = {
    requests: 0,
    tokens: 0,
    windowStart: Date.now(),
  };
  private readonly embeddingCache = new Map<
    string,
    { embedding: number[]; timestamp: number }
  >();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutos

  // Thresholds para análise de risco
  private readonly riskThresholds = {
    high: 0.8,
    medium: 0.5,
    low: 0.2,
  };

  // Configuração para retry logic
  private readonly retryConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    exponentialBackoff: true,
    retryableErrors: [
      OpenAIErrorType.RATE_LIMIT_ERROR,
      OpenAIErrorType.API_ERROR,
      OpenAIErrorType.TIMEOUT_ERROR,
      OpenAIErrorType.CONNECTION_ERROR,
    ],
  };

  constructor(private readonly configService: ConfigService) {
    this.config = this.loadConfig();
    this.openai = this.createClient();
    this.logger.log('OpenAI Service initialized successfully');
  }

  /**
   * Carrega configurações do ambiente
   */
  private loadConfig(): OpenAIConfig {
    const config: OpenAIConfig = {
      apiKey: this.configService.get<string>('OPENAI_API_KEY', ''),
      organizationId: this.configService.get<string>('OPENAI_ORGANIZATION_ID'),
      projectId: this.configService.get<string>('OPENAI_PROJECT_ID'),
      defaultChatModel: this.configService.get<string>(
        'OPENAI_DEFAULT_CHAT_MODEL',
        OpenAIModel.GPT_4O_MINI,
      ),
      defaultEmbeddingModel: this.configService.get<string>(
        'OPENAI_DEFAULT_EMBEDDING_MODEL',
        OpenAIModel.TEXT_EMBEDDING_3_SMALL,
      ),
      defaultTemperature: +this.configService.get<number>(
        'OPENAI_DEFAULT_TEMPERATURE',
        0.7,
      ),
      defaultMaxTokens: +this.configService.get<number>(
        'OPENAI_DEFAULT_MAX_TOKENS',
        1000,
      ),
      defaultTopP: +this.configService.get<number>('OPENAI_DEFAULT_TOP_P', 1.0),
      requestTimeout: +this.configService.get<number>(
        'OPENAI_REQUEST_TIMEOUT',
        30000,
      ),
      retryAttempts: +this.configService.get<number>(
        'OPENAI_RETRY_ATTEMPTS',
        3,
      ),
      retryDelay: +this.configService.get<number>('OPENAI_RETRY_DELAY', 1000),
      maxRequestsPerMinute: +this.configService.get<number>(
        'OPENAI_MAX_REQUESTS_PER_MINUTE',
        60,
      ),
      maxTokensPerMinute: +this.configService.get<number>(
        'OPENAI_MAX_TOKENS_PER_MINUTE',
        150000,
      ),
      logRequests: this.configService.get<boolean>('OPENAI_LOG_REQUESTS', true),
      logResponses: this.configService.get<boolean>(
        'OPENAI_LOG_RESPONSES',
        false,
      ),
      logErrors: this.configService.get<boolean>('OPENAI_LOG_ERRORS', true),
    };

    if (!config.apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    // Atualiza configuração de retry
    this.retryConfig.maxAttempts = config.retryAttempts;
    this.retryConfig.baseDelay = config.retryDelay;

    return config;
  }

  /**
   * Cria cliente OpenAI com configurações
   */
  private createClient(): OpenAI {
    return new OpenAI({
      apiKey: this.config.apiKey,
      organization: this.config.organizationId,
      project: this.config.projectId,
      timeout: this.config.requestTimeout,
      maxRetries: 0, // Desabilitamos retry do cliente para usar nosso próprio
    });
  }

  /**
   * Executa operação com retry logic
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    requestId?: string,
    model?: string,
  ): Promise<T> {
    let lastError: Error;
    let attempt = 1;

    while (attempt <= this.retryConfig.maxAttempts) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        const mappedError = OpenAIExceptionFactory.createFromUnknownError(
          error,
          requestId,
          model,
        );

        // Verifica se é um erro que pode ser retentado
        const isRetryableErr = isRetryableError(mappedError);

        if (!isRetryableErr || attempt >= this.retryConfig.maxAttempts) {
          this.logger.error(
            `${operationName} failed after ${attempt} attempts`,
            {
              error: mappedError.message,
              errorType: mappedError.errorType,
              attempts: attempt,
              finalAttempt: true,
              requestId,
              model,
            },
          );
          throw mappedError;
        }

        // Calcula delay para próxima tentativa
        let delay = this.retryConfig.exponentialBackoff
          ? Math.min(
              this.retryConfig.baseDelay * Math.pow(2, attempt - 1),
              this.retryConfig.maxDelay,
            )
          : this.retryConfig.baseDelay;

        // Se for rate limit, usa o retryAfter se disponível
        if (
          mappedError instanceof OpenAIRateLimitException &&
          mappedError.retryAfter
        ) {
          delay = Math.max(delay, mappedError.retryAfter * 1000);
        }

        this.logger.warn(
          `${operationName} failed, retrying in ${delay}ms (attempt ${attempt}/${this.retryConfig.maxAttempts})`,
          {
            error: mappedError.message,
            errorType: mappedError.errorType,
            attempt,
            nextDelay: delay,
            requestId,
            model,
          },
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
        attempt++;
      }
    }

    throw lastError!;
  }

  /**
   * Obtém encoding para modelo específico
   */
  private getModelEncoding(model: string) {
    try {
      // Tenta obter encoding específico do modelo
      return encoding_for_model(
        model as 'gpt-4' | 'gpt-3.5-turbo' | 'text-embedding-ada-002',
      );
    } catch {
      // Fallback para encoding geral se modelo não for suportado
      if (model.includes('gpt-4')) {
        return get_encoding('cl100k_base'); // GPT-4 e GPT-3.5-turbo
      } else if (model.includes('gpt-3.5')) {
        return get_encoding('cl100k_base');
      } else if (model.includes('text-embedding')) {
        return get_encoding('cl100k_base'); // Embeddings também usam cl100k_base
      } else {
        return get_encoding('cl100k_base'); // Padrão mais comum
      }
    }
  }

  /**
   * Conta tokens precisamente usando tiktoken
   */
  countTokens(text: string, model?: string): number {
    if (!text) return 0;

    try {
      const selectedModel = model || this.config.defaultChatModel;
      const encoding = this.getModelEncoding(selectedModel);
      const tokens = encoding.encode(text);

      // Libera recursos do encoding
      encoding.free();

      return tokens.length;
    } catch (error) {
      this.logger.warn(`Error counting tokens with tiktoken, using fallback`, {
        error: (error as Error).message,
        model,
      });

      // Fallback para estimativa básica
      return this.countTokensFallback(text, model);
    }
  }

  /**
   * Contador de tokens fallback (sem tiktoken)
   */
  private countTokensFallback(text: string, model?: string): number {
    if (!text) return 0;

    // Estimativa mais precisa baseada no modelo
    let tokensPerChar = 0.25; // Padrão: 4 chars por token

    if (model) {
      // Modelos mais novos são mais eficientes na tokenização
      if (model.includes('gpt-4o')) {
        tokensPerChar = 0.22; // ~4.5 chars por token
      } else if (model.includes('gpt-4')) {
        tokensPerChar = 0.27; // ~3.7 chars por token
      } else if (model.includes('gpt-3.5')) {
        tokensPerChar = 0.25; // ~4 chars por token
      } else if (model.includes('text-embedding')) {
        tokensPerChar = 0.24; // Embeddings são similares
      }
    }

    // Considera espaços e pontuação
    const estimatedTokens = Math.ceil(text.length * tokensPerChar);

    this.logger.debug(
      `Token estimation (fallback) for model ${model || 'default'}: ${estimatedTokens} tokens for ${text.length} characters`,
    );

    return estimatedTokens;
  }

  /**
   * Calcula tokens para mensagens de chat com precisão
   */
  private countChatTokens(
    messages: Array<{ role?: string; content?: string | any[] }>,
    model: string,
  ): number {
    let totalTokens = 0;

    try {
      const encoding = this.getModelEncoding(model);

      // Tokens base por mensagem baseado no modelo
      const baseTokensPerMessage = model.includes('gpt-4') ? 3 : 4;
      const tokensPerName = -1; // Se name for especificado

      for (const message of messages) {
        totalTokens += baseTokensPerMessage;

        // Conta tokens do role
        if (message.role) {
          totalTokens += encoding.encode(message.role).length;
        }

        // Conta tokens do content
        const content = Array.isArray(message.content)
          ? message.content.map((c: any) => String(c.text || '')).join(' ')
          : String(message.content || '');

        if (content) {
          totalTokens += encoding.encode(content).length;
        }

        // Se tem name field
        const messageName = (message as { name?: string }).name;
        if (messageName) {
          totalTokens += encoding.encode(messageName).length + tokensPerName;
        }
      }

      // Tokens extras para o assistant reply priming
      totalTokens += 3;

      encoding.free();
      return totalTokens;
    } catch (error) {
      this.logger.warn(
        'Error counting chat tokens with tiktoken, using fallback',
        {
          error: (error as Error).message,
          model,
        },
      );

      // Fallback para método anterior
      return this.estimateChatTokens(messages, model);
    }
  }

  /**
   * Gera cache key para embeddings
   */
  private generateCacheKey(input: string, model: string): string {
    return `${model}:${Buffer.from(input).toString('base64')}`;
  }

  /**
   * Obtém embedding do cache se disponível
   */
  private getCachedEmbedding(input: string, model: string): number[] | null {
    const key = this.generateCacheKey(input, model);
    const cached = this.embeddingCache.get(key);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      this.logger.debug(`Cache hit for embedding: ${key.substring(0, 50)}...`);
      return cached.embedding;
    }

    if (cached) {
      this.embeddingCache.delete(key); // Remove cache expirado
    }

    return null;
  }

  /**
   * Armazena embedding no cache
   */
  private setCachedEmbedding(
    input: string,
    model: string,
    embedding: number[],
  ): void {
    const key = this.generateCacheKey(input, model);
    this.embeddingCache.set(key, {
      embedding,
      timestamp: Date.now(),
    });

    // Limita o tamanho do cache (máximo 1000 entradas)
    if (this.embeddingCache.size > 1000) {
      const firstKey = this.embeddingCache.keys().next().value as string;
      this.embeddingCache.delete(firstKey);
    }
  }

  /**
   * Limpa cache de embeddings expirados
   */
  private cleanupEmbeddingCache(): void {
    const now = Date.now();
    for (const [key, value] of this.embeddingCache.entries()) {
      if (now - value.timestamp >= this.cacheTimeout) {
        this.embeddingCache.delete(key);
      }
    }
  }

  /**
   * Analisa resultado de moderação e determina risco
   */
  private analyzeModeration(
    moderationResult: ModerationResponse,
  ): ModerationAnalysisDto {
    const result = moderationResult.results[0];
    if (!result) {
      throw new Error('Resultado de moderação inválido');
    }

    const violatedCategories: string[] = [];
    const highRiskCategories: string[] = [];
    let maxScore = 0;

    // Analisa cada categoria
    for (const [category, flagged] of Object.entries(
      result.categories as Record<string, boolean>,
    )) {
      const score =
        (result.category_scores as Record<string, number>)[category] || 0;
      maxScore = Math.max(maxScore, score);

      if (flagged) {
        violatedCategories.push(category);
      }

      if (score >= this.riskThresholds.high) {
        highRiskCategories.push(category);
      }
    }

    // Determina recomendação baseada no risco
    let recommendation: 'allow' | 'review' | 'block' = 'allow';
    let reason = 'Conteúdo considerado seguro';

    if (result.flagged || maxScore >= this.riskThresholds.high) {
      recommendation = 'block';
      reason = 'Conteúdo violou diretrizes de segurança';
    } else if (maxScore >= this.riskThresholds.medium) {
      recommendation = 'review';
      reason = 'Conteúdo requer revisão manual';
    }

    const analysis: ModerationAnalysisDto = {
      isSafe: !result.flagged && maxScore < this.riskThresholds.medium,
      riskScore: maxScore,
      violatedCategories,
      highRiskCategories,
      recommendation,
      reason,
    };

    return analysis;
  }

  /**
   * Verifica e atualiza rate limiting
   */
  private checkRateLimit(estimatedTokens: number = 0): void {
    const now = Date.now();
    const windowDuration = 60 * 1000; // 1 minuto em ms

    // Reset window se passou 1 minuto
    if (now - this.rateLimitState.windowStart >= windowDuration) {
      this.rateLimitState.requests = 0;
      this.rateLimitState.tokens = 0;
      this.rateLimitState.windowStart = now;
    }

    // Verifica limite de requisições
    if (this.rateLimitState.requests >= this.config.maxRequestsPerMinute) {
      throw OpenAIExceptionFactory.createRateLimitException(
        `Limite de requisições por minuto excedido (${this.config.maxRequestsPerMinute})`,
        {
          requests: this.rateLimitState.requests,
          tokens: this.rateLimitState.tokens,
        },
        {
          maxRequests: this.config.maxRequestsPerMinute,
          maxTokens: this.config.maxTokensPerMinute,
        },
        60, // retry after 60 seconds
      );
    }

    // Verifica limite de tokens
    if (
      this.rateLimitState.tokens + estimatedTokens >=
      this.config.maxTokensPerMinute
    ) {
      throw OpenAIExceptionFactory.createRateLimitException(
        `Limite de tokens por minuto excedido (${this.config.maxTokensPerMinute})`,
        {
          requests: this.rateLimitState.requests,
          tokens: this.rateLimitState.tokens + estimatedTokens,
        },
        {
          maxRequests: this.config.maxRequestsPerMinute,
          maxTokens: this.config.maxTokensPerMinute,
        },
        60, // retry after 60 seconds
      );
    }

    // Atualiza contadores
    this.rateLimitState.requests++;
    this.rateLimitState.tokens += estimatedTokens;
  }

  /**
   * Calcula tokens estimados para mensagens de chat (método legado)
   */
  private estimateChatTokens(
    messages: Array<{ role?: string; content?: string | any[] }>,
    model: string,
  ): number {
    let totalTokens = 0;

    // Tokens base por mensagem baseado no modelo
    const baseTokensPerMessage = model.includes('gpt-4') ? 3 : 4;

    for (const message of messages) {
      // Tokens base da mensagem + role + content
      totalTokens += baseTokensPerMessage;
      totalTokens += this.countTokens(String(message.role || ''));

      // Handle different content types
      const content = Array.isArray(message.content)
        ? message.content.map((c: any) => String(c.text || '')).join(' ')
        : String(message.content || '');

      totalTokens += this.countTokens(content);
    }

    // Tokens extras para formatação da conversa
    totalTokens += 3;

    return totalTokens;
  }

  /**
   * Mapeia erros da API OpenAI para tipos conhecidos (método legado)
   * @deprecated Use OpenAIExceptionFactory.createFromUnknownError instead
   */
  private mapOpenAIError(error: any): Error {
    return OpenAIExceptionFactory.createFromUnknownError(error);
  }

  /**
   * Valida DTO usando class-validator
   */
  private async validateDto<T>(
    dto: unknown,
    dtoClass: new () => T,
    requestId?: string,
    model?: string,
  ): Promise<void> {
    const dtoInstance = plainToClass(dtoClass, dto);
    const errors = await validate(dtoInstance as object);

    if (errors.length > 0) {
      const errorMessages = errors
        .map((error) => Object.values(error.constraints || {}).join(', '))
        .join('; ');

      throw OpenAIExceptionFactory.createValidationException(
        `Validation failed: ${errorMessages}`,
        errorMessages.split('; '),
        requestId,
        model,
      );
    }
  }

  /**
   * Log estruturado para requisições
   */
  private logRequest(method: string, params: any): void {
    if (this.config.logRequests) {
      this.logger.log(`OpenAI Request - ${method}`, {
        method,
        model: params.model,
        messageCount: params.messages?.length,
        inputType: Array.isArray(params.input) ? 'batch' : 'single',
        rateLimitState: {
          requests: this.rateLimitState.requests,
          tokens: this.rateLimitState.tokens,
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Log estruturado para respostas
   */
  private logResponse(method: string, response: any): void {
    if (this.config.logResponses) {
      this.logger.log(`OpenAI Response - ${method}`, {
        method,
        model: response.model,
        usage: response.usage,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Log estruturado para erros
   */
  private logError(method: string, error: any): void {
    if (this.config.logErrors) {
      this.logger.error(`OpenAI Error - ${method}`, {
        method,
        error: error.message,
        type: error.type || 'unknown',
        code: error.code,
        status: error.status,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Cria uma resposta usando o endpoint responses
   */
  async createResponse(request: {
    model: string;
    store: boolean;
    previous_response_id?: string;
    prompt_cache_key?: string;
    input: { role: string; content: string }[];
  }): Promise<any> {
    // Log quando prompt cache é utilizado
    if (request.prompt_cache_key) {
      this.logger.debug(`Using prompt cache key: ${request.prompt_cache_key}`);
    }

    const params = {
      model: request?.model,
      store: request?.store,
      previous_response_id: request?.previous_response_id,
      prompt_cache_key: request?.prompt_cache_key,
      input: request.input as any,
    };

    return await this.openai.responses.create(params);
  }

  /**
   * Cria uma chat completion usando modelos GPT
   */
  async createChatCompletion(
    request: ChatCompletionRequest,
  ): Promise<ChatCompletionResponse> {
    // Validação de entrada
    const requestId = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await this.validateDto(request, ChatCompletionCreateDto, requestId);

    const maxTokens = request.model?.includes('5')
      ? undefined
      : this.config.defaultMaxTokens;

    const params = {
      model: request.model || this.config.defaultChatModel,
      messages: request.messages,
      temperature: request.temperature ?? this.config.defaultTemperature,
      max_tokens: maxTokens,
      top_p: request.top_p ?? this.config.defaultTopP,
      frequency_penalty: request.frequency_penalty,
      presence_penalty: request.presence_penalty,
      stop: request.stop,
      user: request.user,
    };

    // Remove propriedades undefined
    Object.keys(params).forEach((key) => {
      if (params[key] === undefined) {
        delete params[key];
      }
    });

    // Estima tokens usando contagem precisa e verifica rate limiting
    const estimatedTokens = this.countChatTokens(
      params.messages as Array<{ role?: string; content?: string | any[] }>,
      params.model,
    );
    this.checkRateLimit(estimatedTokens);

    this.logRequest('createChatCompletion', params);

    return this.executeWithRetry(async () => {
      const response = await this.openai.chat.completions.create(params);
      this.logResponse('createChatCompletion', response);
      return response as ChatCompletionResponse;
    }, 'createChatCompletion');
  }

  /**
   * Gera embeddings para textos
   */
  async createEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const requestId = `embedding-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await this.validateDto(request, EmbeddingCreateDto, requestId);

    const model = request.model || this.config.defaultEmbeddingModel;

    // Se for input único, verifica cache
    if (typeof request.input === 'string') {
      const cachedEmbedding = this.getCachedEmbedding(request.input, model);
      if (cachedEmbedding) {
        return {
          object: 'list',
          data: [
            {
              object: 'embedding',
              embedding: cachedEmbedding,
              index: 0,
            },
          ],
          model,
          usage: {
            prompt_tokens: this.countTokens(request.input, model),
            total_tokens: this.countTokens(request.input, model),
          },
        };
      }
    }

    const params = {
      model,
      ...request,
    };

    // Estima tokens para embeddings usando contagem precisa
    const inputText = Array.isArray(request.input)
      ? request.input.join(' ')
      : request.input;
    const estimatedTokens = this.countTokens(inputText, model);
    this.checkRateLimit(estimatedTokens);

    this.logRequest('createEmbedding', params);

    return this.executeWithRetry(async () => {
      const response = await this.openai.embeddings.create(params);
      this.logResponse('createEmbedding', response);

      // Cache embedding se for input único
      if (typeof request.input === 'string' && response.data[0]) {
        this.setCachedEmbedding(
          request.input,
          model,
          response.data[0].embedding,
        );
      }

      // Limpeza periódica do cache
      if (Math.random() < 0.01) {
        // 1% de chance
        this.cleanupEmbeddingCache();
      }

      return response as EmbeddingResponse;
    }, 'createEmbedding');
  }

  /**
   * Gera embeddings em lote para múltiplos textos
   */
  async createEmbeddingBatch(
    inputs: string[],
    model?: string,
  ): Promise<EmbeddingResponse> {
    const selectedModel = model || this.config.defaultEmbeddingModel;

    const batchRequest = {
      inputs,
      model: selectedModel,
    };

    const requestId = `embedding-batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await this.validateDto(
      batchRequest,
      EmbeddingCreateBatchDto,
      requestId,
      selectedModel,
    );
    const totalText = inputs.join(' ');
    const estimatedTokens = this.countTokens(totalText, selectedModel);

    this.checkRateLimit(estimatedTokens);

    const params = {
      model: selectedModel,
      input: inputs,
    };

    this.logRequest('createEmbeddingBatch', params);

    return this.executeWithRetry(async () => {
      const response = await this.openai.embeddings.create(params);
      this.logResponse('createEmbeddingBatch', response);

      // Cache embeddings individuais
      response.data.forEach((embedding, index) => {
        if (inputs[index]) {
          this.setCachedEmbedding(
            inputs[index],
            selectedModel,
            embedding.embedding,
          );
        }
      });

      return response as EmbeddingResponse;
    }, 'createEmbeddingBatch');
  }

  /**
   * Modera conteúdo para verificar se é apropriado
   */
  async moderateContent(
    request: ModerationRequest,
  ): Promise<ModerationResponse> {
    const requestId = `moderation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await this.validateDto(request, ModerationCreateDto, requestId);

    // Rate limiting básico para moderação
    this.checkRateLimit();

    this.logRequest('moderateContent', request);

    return this.executeWithRetry(async () => {
      const response = await this.openai.moderations.create(request);
      this.logResponse('moderateContent', response);
      return response as unknown as ModerationResponse;
    }, 'moderateContent');
  }

  /**
   * Modera conteúdo com análise de risco avançada
   */
  async moderateContentWithAnalysis(
    input: string | string[],
    model?: string,
  ): Promise<{
    moderation: ModerationResponse;
    analysis: ModerationAnalysisDto;
  }> {
    const request: ModerationRequest = { input, model };
    const moderation = await this.moderateContent(request);
    const analysis = this.analyzeModeration(moderation);

    // Log análise de segurança
    this.logger.log('Content Moderation Analysis', {
      isSafe: analysis.isSafe,
      riskScore: analysis.riskScore,
      recommendation: analysis.recommendation,
      violatedCategories: analysis.violatedCategories,
      highRiskCategories: analysis.highRiskCategories,
      timestamp: new Date().toISOString(),
    });

    return { moderation, analysis };
  }

  /**
   * Verifica se um conteúdo é seguro (método simplificado)
   */
  async isContentSafe(input: string | string[]): Promise<boolean> {
    try {
      const { analysis } = await this.moderateContentWithAnalysis(input);
      return analysis.isSafe;
    } catch (error) {
      this.logger.error('Error checking content safety', error);
      // Em caso de erro, por segurança, considera não seguro
      return false;
    }
  }

  /**
   * Verifica se o serviço está funcionando
   */
  async healthCheck(): Promise<boolean> {
    return this.executeWithRetry(async () => {
      const response = await this.openai.models.list();
      return !!response.data && response.data.length > 0;
    }, 'healthCheck').catch(() => false); // Em caso de falha, retorna false
  }

  /**
   * Obtém estatísticas de rate limiting
   */
  getRateLimitStats(): {
    requests: number;
    tokens: number;
    maxRequests: number;
    maxTokens: number;
    windowStart: Date;
  } {
    return {
      requests: this.rateLimitState.requests,
      tokens: this.rateLimitState.tokens,
      maxRequests: this.config.maxRequestsPerMinute,
      maxTokens: this.config.maxTokensPerMinute,
      windowStart: new Date(this.rateLimitState.windowStart),
    };
  }

  /**
   * Obtém estatísticas do cache de embeddings
   */
  getEmbeddingCacheStats(): {
    size: number;
    maxSize: number;
    hitRate?: number;
  } {
    return {
      size: this.embeddingCache.size,
      maxSize: 1000,
    };
  }

  /**
   * Limpa todo o cache de embeddings
   */
  clearEmbeddingCache(): void {
    this.embeddingCache.clear();
    this.logger.log('Embedding cache cleared');
  }

  /**
   * Configura thresholds de risco para moderação
   */
  setRiskThresholds(thresholds: {
    high?: number;
    medium?: number;
    low?: number;
  }): void {
    if (thresholds.high !== undefined) {
      this.riskThresholds.high = thresholds.high;
    }
    if (thresholds.medium !== undefined) {
      this.riskThresholds.medium = thresholds.medium;
    }
    if (thresholds.low !== undefined) {
      this.riskThresholds.low = thresholds.low;
    }

    this.logger.log('Risk thresholds updated', this.riskThresholds);
  }

  /**
   * Obtém estatísticas de retry
   */
  getRetryStats(): RetryConfig {
    return { ...this.retryConfig };
  }

  /**
   * Configura retry logic
   */
  setRetryConfig(config: Partial<RetryConfig>): void {
    Object.assign(this.retryConfig, config);
    this.logger.log('Retry configuration updated', this.retryConfig);
  }

  /**
   * Testa contagem de tokens (método utilitário para debug)
   */
  testTokenCounting(
    text: string,
    model?: string,
  ): {
    precise: number;
    fallback: number;
    difference: number;
  } {
    const precise = this.countTokens(text, model);
    const fallback = this.countTokensFallback(text, model);

    return {
      precise,
      fallback,
      difference: Math.abs(precise - fallback),
    };
  }
}
