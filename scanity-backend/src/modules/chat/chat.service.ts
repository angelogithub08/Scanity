import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../../infra/database/database.providers';
import { ChatHistoryService } from '../chat-history/chat-history.service';
import { ChatHistoryRole } from '../chat-history/dto/create-chat-history.dto';

const QUERY_DATABASE_TOOL = {
  type: 'function' as const,
  function: {
    name: 'query_database',
    description:
      'Executa uma consulta SQL SELECT no banco PostgreSQL. ' +
      'Use para perguntas sobre produtos, estoque, clientes, fornecedores, ' +
      'categorias, movimentações, inventários ou qualquer dado do sistema.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'Query SQL SELECT. REGRAS OBRIGATÓRIAS: ' +
            '1) SEMPRE use alias curto para TODA tabela (ex: products p, stocks s). ' +
            '2) SEMPRE inclua alias.account_id = :accountId no WHERE ' +
            '(use o alias da PRIMEIRA tabela do FROM). ' +
            '3) SEMPRE filtre deleted_at IS NULL. ' +
            '4) Use o alias em todas as colunas (p.name, s.quantity).',
        },
      },
      required: ['query'],
    },
  },
};

const DANGEROUS_KEYWORDS =
  /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|EXEC|EXECUTE|GRANT|REVOKE|COPY)\b/i;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly openai: OpenAI;
  private readonly chatModel: string;
  private schemaCache: string | null = null;
  private schemaCacheTime = 0;
  private readonly SCHEMA_CACHE_TTL = 5 * 60 * 1000;

  private readonly CHAT_MODEL_PATTERNS = [
    /^gpt-4/,
    /^gpt-3\.5/,
    /^o1/,
    /^o3/,
    /^chatgpt/,
  ];

  private readonly FALLBACK_CHAT_MODEL = 'gpt-4o-mini';

  constructor(
    private readonly configService: ConfigService,
    @Inject(KNEX_CONNECTION) private readonly knex: Knex,
    private readonly chatHistoryService: ChatHistoryService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY', ''),
      timeout: this.configService.get<number>('OPENAI_REQUEST_TIMEOUT', 30000),
    });

    const configuredModel = this.configService.get<string>(
      'OPENAI_DEFAULT_CHAT_MODEL',
      this.FALLBACK_CHAT_MODEL,
    );

    this.chatModel = this.isChatModel(configuredModel)
      ? configuredModel
      : this.FALLBACK_CHAT_MODEL;

    if (this.chatModel !== configuredModel) {
      this.logger.warn(
        `Modelo "${configuredModel}" não é compatível com chat/completions. ` +
          `Usando fallback "${this.FALLBACK_CHAT_MODEL}". ` +
          `Configure um modelo de chat (ex: gpt-4o-mini, gpt-4o) em OPENAI_DEFAULT_CHAT_MODEL.`,
      );
    }

    this.logger.log(`Chat model: ${this.chatModel}`);
  }

  private isChatModel(model: string): boolean {
    return this.CHAT_MODEL_PATTERNS.some((pattern) => pattern.test(model));
  }

  async streamChat(
    message: string,
    userId: string,
    accountId: string,
    onChunk: (chunk: string) => void,
  ): Promise<void> {
    const schema = await this.getSchemaContext();

    const systemPrompt = this.buildSystemPrompt(schema);

    const history = await this.chatHistoryService.getHistoryForContext(
      userId,
      10,
    );

    const initialMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
      [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: message },
      ];

    this.logger.log(
      `Processing chat from user ${userId}: "${message.substring(0, 100)}" (context: ${history.length} history msgs)`,
    );

    let firstResponse: OpenAI.Chat.Completions.ChatCompletion;

    try {
      firstResponse = await this.openai.chat.completions.create({
        model: this.chatModel,
        messages: initialMessages,
        tools: [QUERY_DATABASE_TOOL],
        tool_choice: 'auto',
        temperature: 0.3,
        max_tokens: 500,
      });
    } catch (error) {
      throw this.mapOpenAIError(error);
    }

    const choice = firstResponse.choices[0];
    const toolCalls = choice?.message?.tool_calls;

    if (toolCalls && toolCalls.length > 0) {
      const toolCall = toolCalls[0];
      const args = JSON.parse(toolCall.function.arguments);
      let sqlQuery = args.query as string;

      this.logger.log(`AI generated SQL: ${sqlQuery}`);

      let queryResult: Record<string, unknown>[];
      let completedToolCalls = toolCalls;

      try {
        queryResult = await this.executeSecureQuery(sqlQuery, accountId);
      } catch (error) {
        const errMsg =
          error instanceof Error ? error.message : 'Erro desconhecido';

        if (errMsg === 'MISSING_ACCOUNT_ID') {
          this.logger.warn(
            'Model forgot :accountId, retrying with correction prompt',
          );

          const retryMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
            [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: message },
              {
                role: 'assistant',
                content: null,
                tool_calls: toolCalls,
              },
              {
                role: 'tool',
                tool_call_id: toolCall.id,
                content:
                  'ERRO: a query não contém :accountId no WHERE. ' +
                  'Inclua obrigatoriamente alias.account_id = :accountId no WHERE. ' +
                  'Ex: WHERE p.deleted_at IS NULL AND p.account_id = :accountId',
              },
            ];

          const retryResponse = await this.openai.chat.completions.create({
            model: this.chatModel,
            messages: retryMessages,
            tools: [QUERY_DATABASE_TOOL],
            tool_choice: 'auto',
            temperature: 0.3,
            max_tokens: 500,
          });

          const retryChoice = retryResponse.choices[0];
          const retryToolCalls = retryChoice?.message?.tool_calls;

          if (retryToolCalls && retryToolCalls.length > 0) {
            const retryArgs = JSON.parse(retryToolCalls[0].function.arguments);
            sqlQuery = retryArgs.query as string;
            completedToolCalls = retryToolCalls;
            this.logger.log(`Retry SQL: ${sqlQuery}`);
            queryResult = await this.executeSecureQuery(sqlQuery, accountId);
          } else {
            queryResult = [];
          }
        } else {
          throw error;
        }
      }

      const resultMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
          {
            role: 'assistant',
            content: null,
            tool_calls: completedToolCalls,
          },
          {
            role: 'tool',
            tool_call_id: completedToolCalls[0].id,
            content: JSON.stringify(queryResult),
          },
        ];

      const fullResponse = await this.streamOpenAIResponse(
        resultMessages,
        onChunk,
      );
      await this.saveHistory(userId, accountId, message, fullResponse);
    } else {
      const fullResponse = await this.streamOpenAIResponse(
        initialMessages,
        onChunk,
      );
      await this.saveHistory(userId, accountId, message, fullResponse);
    }
  }

  private async saveHistory(
    userId: string,
    accountId: string,
    userMessage: string,
    assistantResponse: string,
  ): Promise<void> {
    try {
      await this.chatHistoryService.create({
        user_id: userId,
        role: ChatHistoryRole.USER,
        content: userMessage,
        account_id: accountId,
      });

      await this.chatHistoryService.create({
        user_id: userId,
        role: ChatHistoryRole.ASSISTANT,
        content: assistantResponse,
        account_id: accountId,
      });
    } catch (error) {
      this.logger.error(
        `Failed to save chat history: ${(error as Error).message}`,
      );
    }
  }

  private async streamOpenAIResponse(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    onChunk: (chunk: string) => void,
  ): Promise<string> {
    let fullResponse = '';

    try {
      const stream = await this.openai.chat.completions.create({
        model: this.chatModel,
        messages,
        temperature: 0.7,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          fullResponse += content;
          onChunk(content);
        }
      }
    } catch (error) {
      throw this.mapOpenAIError(error);
    }

    return fullResponse;
  }

  private mapOpenAIError(error: unknown): Error {
    if (error instanceof OpenAI.APIError) {
      const status = error.status;
      const body = error.error as Record<string, unknown> | undefined;
      const message = (body?.message as string) || error.message;

      this.logger.error(`OpenAI API error ${status}: ${message}`);

      if (status === 401 || status === 403) {
        return new Error(
          'Erro de autenticação com a API OpenAI. Verifique a chave OPENAI_API_KEY.',
        );
      }

      if (status === 404 && message.includes('not a chat model')) {
        return new Error(
          `O modelo configurado não é compatível com chat. Use um modelo como gpt-4o-mini ou gpt-4o em OPENAI_DEFAULT_CHAT_MODEL.`,
        );
      }

      if (status === 404) {
        return new Error(
          `Modelo "${this.chatModel}" não encontrado. Verifique o nome do modelo em OPENAI_DEFAULT_CHAT_MODEL.`,
        );
      }

      if (status === 429) {
        return new Error(
          'Limite de requisições da API OpenAI excedido. Aguarde um momento e tente novamente.',
        );
      }

      if (status === 500 || status === 502 || status === 503) {
        return new Error(
          'Serviço OpenAI indisponível no momento. Tente novamente em instantes.',
        );
      }
    }

    const err = error as Error;
    return new Error(`Erro ao comunicar com a IA: ${err.message}`);
  }

  private async executeSecureQuery(
    sql: string,
    accountId: string,
  ): Promise<Record<string, unknown>[]> {
    const cleaned = sql.trim().replace(/;+$/, '').replace(/\s+/g, ' ');

    if (DANGEROUS_KEYWORDS.test(cleaned)) {
      throw new Error(
        'A consulta contém comandos não permitidos. Apenas SELECT é aceito.',
      );
    }

    if (!/^\s*SELECT\b/i.test(cleaned)) {
      throw new Error('Apenas consultas SELECT são permitidas.');
    }

    if (!/:accountId\b/.test(cleaned)) {
      throw new Error('MISSING_ACCOUNT_ID');
    }

    this.logger.log(`Executing query for account ${accountId}`);

    try {
      const { rows } = await this.knex.raw(cleaned, { accountId });
      return rows as Record<string, unknown>[];
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`Query execution failed: ${message} | SQL: ${cleaned}`);
      throw new Error(
        `Erro ao executar consulta no banco de dados: ${message}`,
      );
    }
  }

  private async getSchemaContext(): Promise<string> {
    const now = Date.now();

    if (
      this.schemaCache &&
      now - this.schemaCacheTime < this.SCHEMA_CACHE_TTL
    ) {
      return this.schemaCache;
    }

    const tables = await this.knex('information_schema.tables')
      .select('table_name')
      .where('table_schema', 'public')
      .where('table_type', 'BASE TABLE')
      .whereNot('table_name', 'like', 'knex_%')
      .orderBy('table_name');

    const lines: string[] = [];

    for (const { table_name } of tables) {
      const columns = await this.knex('information_schema.columns')
        .select('column_name', 'data_type', 'is_nullable')
        .where('table_schema', 'public')
        .where('table_name', table_name)
        .orderBy('ordinal_position');

      const colDescs = columns.map((col) => {
        const nullable = col.is_nullable === 'YES' ? '?' : '';
        return `${col.column_name}:${col.data_type}${nullable}`;
      });

      lines.push(`TABELA ${table_name} (${colDescs.join(', ')})`);
    }

    this.schemaCache = lines.join('\n');
    this.schemaCacheTime = now;
    this.logger.log('Database schema loaded from information_schema');

    return this.schemaCache;
  }

  private buildSystemPrompt(schema: string): string {
    return `Você é um assistente de banco de dados para um sistema de gestão de estoque.
Você responde perguntas em português do Brasil, de forma concisa e direta.

ESQUEMA DO BANCO DE DADOS:
${schema}

REGRAS PARA CONSULTAS SQL (use a função query_database):
1. Use APENAS SELECT. NUNCA use INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE.
2. SEMPRE filtre "deleted_at IS NULL" para ignorar registros excluídos.
3. SEMPRE inclua "alias.account_id = :accountId" no WHERE — use o alias da PRIMEIRA tabela do FROM.
   O sistema substitui :accountId automaticamente pelo valor correto.
4. SEMPRE defina alias curto para TODA tabela no FROM e JOIN (ex: products p, stocks s).
5. Use os alias em TODAS as colunas (SELECT, JOIN, WHERE, ORDER BY).
6. Use JOINs para incluir dados de tabelas relacionadas.
7. Use ILIKE para buscas de texto (case insensitive).
8. Se a pergunta não precisar de dados do banco, responda diretamente sem usar query_database.
9. Relação entre movement_stages e stocks acontece via stock_records
10. Sempre consultar account_id para stocks via left join com product_id, estrutura de stocks não possui account_id

EXEMPLOS:
- "Quais produtos estão com estoque crítico?"
  → SELECT p.name, s.quantity, s.min_quantity FROM stocks s JOIN products p ON p.id = s.product_id WHERE s.quantity <= s.min_quantity AND s.deleted_at IS NULL AND p.deleted_at IS NULL AND p.account_id = :accountId

- "Liste todos os fornecedores"
  → SELECT s.name, s.phone, s.email, s.responsible_name FROM supliers s WHERE s.deleted_at IS NULL AND s.account_id = :accountId

- "Me ajude a encontrar o produto X"
  → SELECT p.name, p.description, p.value, p.barcode FROM products p WHERE p.name ILIKE '%X%' AND p.deleted_at IS NULL AND p.account_id = :accountId

- "Quantos produtos estão cadastrados?"
  → SELECT COUNT(*) AS total FROM products p WHERE p.deleted_at IS NULL AND p.account_id = :accountId

- "Quantos itens no estoque estão abaixo do mínimo?"
  → SELECT COUNT(*) AS total FROM stocks s WHERE s.quantity <= s.min_quantity AND s.deleted_at IS NULL AND p.account_id = :accountId

- "Liste os clientes com telefone"
  → SELECT c.name, c.phone, c.email FROM customers c WHERE c.deleted_at IS NULL AND c.account_id = :accountId

- "Quais categorias têm produtos?"
  → SELECT c.name, COUNT(p.id) AS total FROM categories c LEFT JOIN products p ON p.category_id = c.id AND p.deleted_at IS NULL WHERE c.deleted_at IS NULL AND p.account_id = :accountId GROUP BY c.id, c.name`;
  }
}
