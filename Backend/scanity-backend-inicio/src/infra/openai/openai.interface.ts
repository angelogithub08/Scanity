import { ChatCompletionCreateParamsNonStreaming } from 'openai/resources/chat/completions';
import { EmbeddingCreateParams } from 'openai/resources/embeddings';
import { ModerationCreateParams } from 'openai/resources/moderations';

// DTOs de Request
export interface ChatCompletionRequest
  extends Omit<ChatCompletionCreateParamsNonStreaming, 'model'> {
  model?: string;
}

export interface EmbeddingRequest extends Omit<EmbeddingCreateParams, 'model'> {
  model?: string;
}

export type ModerationRequest = ModerationCreateParams;

// DTOs de Response
export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant' | 'user' | 'system';
      content: string | null;
    };
    finish_reason: string | null;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface EmbeddingResponse {
  object: string;
  data: Array<{
    object: string;
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface ModerationResponse {
  id: string;
  model: string;
  results: Array<{
    flagged: boolean;
    categories: {
      [key: string]: boolean;
    };
    category_scores: {
      [key: string]: number;
    };
  }>;
}

// Tipos utilitários
export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens?: number;
  total_tokens: number;
}

export interface OpenAIConfig {
  apiKey: string;
  organizationId?: string;
  projectId?: string;
  defaultChatModel: string;
  defaultEmbeddingModel: string;
  defaultTemperature: number;
  defaultMaxTokens: number;
  defaultTopP: number;
  requestTimeout: number;
  retryAttempts: number;
  retryDelay: number;
  maxRequestsPerMinute: number;
  maxTokensPerMinute: number;
  logRequests: boolean;
  logResponses: boolean;
  logErrors: boolean;
}

// Interface principal do serviço
export interface IOpenAIService {
  /**
   * Cria uma chat completion usando modelos GPT
   * @param request Parâmetros da requisição de chat
   * @returns Promise com a resposta do chat
   */
  createChatCompletion(
    request: ChatCompletionRequest,
  ): Promise<ChatCompletionResponse>;

  /**
   * Gera embeddings para textos
   * @param request Parâmetros da requisição de embedding
   * @returns Promise com os embeddings gerados
   */
  createEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse>;

  /**
   * Modera conteúdo para verificar se é apropriado
   * @param request Parâmetros da requisição de moderação
   * @returns Promise com o resultado da moderação
   */
  moderateContent(request: ModerationRequest): Promise<ModerationResponse>;

  /**
   * Conta tokens de um texto para estimativa de custos
   * @param text Texto para contar tokens
   * @param model Modelo para usar na contagem (opcional)
   * @returns Número estimado de tokens
   */
  countTokens(text: string, model?: string): number;

  /**
   * Verifica se o serviço está funcionando
   * @returns Promise<boolean> indicando se está saudável
   */
  healthCheck(): Promise<boolean>;
}
