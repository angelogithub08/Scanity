/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { ChatService } from './chat.service';
import { ChatHistoryService } from '../chat-history/chat-history.service';
import { KNEX_CONNECTION } from '../../infra/database/database.providers';

describe('ChatService', () => {
  let service: ChatService;
  let mockOpenaiCreate: jest.Mock;

  const mockConfigService = { get: jest.fn() };
  const mockKnex = jest.fn() as any;
  const mockChatHistoryService = {
    getHistoryForContext: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue(undefined),
  };

  const defaultConfig: Record<string, any> = {
    OPENAI_API_KEY: 'sk-test-key',
    OPENAI_REQUEST_TIMEOUT: 30000,
    OPENAI_DEFAULT_CHAT_MODEL: 'gpt-4o-mini',
  };

  const buildService = async (configOverrides?: Record<string, any>) => {
    const config = { ...defaultConfig, ...configOverrides };
    mockConfigService.get.mockImplementation(
      (key: string, defaultValue?: any) => config[key] ?? defaultValue,
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: KNEX_CONNECTION, useValue: mockKnex },
        { provide: ChatHistoryService, useValue: mockChatHistoryService },
      ],
    }).compile();

    return module.get<ChatService>(ChatService);
  };

  const createQueryBuilder = (resolveValue: any[]) => ({
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    whereNot: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    then: (resolve: Function) => resolve(resolveValue),
  });

  beforeEach(async () => {
    jest.restoreAllMocks();
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

    mockKnex.mockReset();
    mockKnex.raw = jest.fn().mockResolvedValue({ rows: [] });
    mockChatHistoryService.getHistoryForContext
      .mockReset()
      .mockResolvedValue([]);
    mockChatHistoryService.create.mockReset().mockResolvedValue(undefined);

    service = await buildService();

    mockOpenaiCreate = jest.fn();
    (service as any).openai = {
      chat: {
        completions: {
          create: mockOpenaiCreate,
        },
      },
    };
  });

  describe('constructor / isChatModel', () => {
    it('should log the correct model name when a valid chat model is configured', () => {
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        'Chat model: gpt-4o-mini',
      );
      expect((service as any).chatModel).toBe('gpt-4o-mini');
    });

    it('should fall back to gpt-4o-mini when configured model is not a chat model', async () => {
      (Logger.prototype.log as jest.Mock).mockClear();
      (Logger.prototype.warn as jest.Mock).mockClear();

      const svc = await buildService({
        OPENAI_DEFAULT_CHAT_MODEL: 'text-embedding-3-small',
      });

      expect(Logger.prototype.warn).toHaveBeenCalledWith(
        expect.stringContaining('não é compatível'),
      );
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        'Chat model: gpt-4o-mini',
      );
      expect((svc as any).chatModel).toBe('gpt-4o-mini');
    });
  });

  describe('streamChat', () => {
    const userId = 'user-1';
    const accountId = 'account-1';
    const onChunk = jest.fn();

    beforeEach(() => {
      onChunk.mockReset();
      (service as any).getSchemaContext = jest
        .fn()
        .mockResolvedValue('schema context');
      (service as any).saveHistory = jest.fn().mockResolvedValue(undefined);
      (service as any).streamOpenAIResponse = jest
        .fn()
        .mockResolvedValue('Streamed response');
    });

    it('should stream response directly when no tool calls are made', async () => {
      mockOpenaiCreate.mockResolvedValueOnce({
        choices: [{ message: { tool_calls: null, content: null } }],
      });

      await service.streamChat('Hello', userId, accountId, onChunk);

      expect((service as any).streamOpenAIResponse).toHaveBeenCalled();
      expect((service as any).saveHistory).toHaveBeenCalledWith(
        userId,
        accountId,
        'Hello',
        'Streamed response',
      );
    });

    it('should execute query and stream response when tool calls are present', async () => {
      (service as any).executeSecureQuery = jest
        .fn()
        .mockResolvedValue([{ id: 1, name: 'Product' }]);

      mockOpenaiCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              tool_calls: [
                {
                  id: 'call_1',
                  function: {
                    name: 'query_database',
                    arguments: JSON.stringify({
                      query:
                        'SELECT * FROM products p WHERE p.account_id = :accountId AND p.deleted_at IS NULL',
                    }),
                  },
                },
              ],
              content: null,
            },
          },
        ],
      });

      await service.streamChat('List products', userId, accountId, onChunk);

      expect((service as any).executeSecureQuery).toHaveBeenCalled();
      expect((service as any).saveHistory).toHaveBeenCalled();
    });

    it('should retry when executeSecureQuery throws MISSING_ACCOUNT_ID', async () => {
      (service as any).executeSecureQuery = jest
        .fn()
        .mockRejectedValueOnce(new Error('MISSING_ACCOUNT_ID'))
        .mockResolvedValueOnce([{ id: 1, name: 'Retried product' }]);

      mockOpenaiCreate
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                tool_calls: [
                  {
                    id: 'call_1',
                    function: {
                      name: 'query_database',
                      arguments: JSON.stringify({
                        query:
                          'SELECT * FROM products p WHERE p.deleted_at IS NULL',
                      }),
                    },
                  },
                ],
                content: null,
              },
            },
          ],
        })
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                tool_calls: [
                  {
                    id: 'call_2',
                    function: {
                      name: 'query_database',
                      arguments: JSON.stringify({
                        query:
                          'SELECT * FROM products p WHERE p.account_id = :accountId AND p.deleted_at IS NULL',
                      }),
                    },
                  },
                ],
                content: null,
              },
            },
          ],
        });

      await service.streamChat('List products', userId, accountId, onChunk);

      expect(mockOpenaiCreate).toHaveBeenCalledTimes(2);
      expect((service as any).executeSecureQuery).toHaveBeenCalledTimes(2);
      expect((service as any).saveHistory).toHaveBeenCalled();
    });

    it('should throw mapped error when OpenAI API call fails', async () => {
      mockOpenaiCreate.mockRejectedValueOnce(
        new OpenAI.APIError(
          401,
          { message: 'Unauthorized' },
          'Unauthorized',
          {},
        ),
      );

      await expect(
        service.streamChat('Hello', userId, accountId, onChunk),
      ).rejects.toThrow('Erro de autenticação');
    });
  });

  describe('executeSecureQuery', () => {
    it('should throw for dangerous keywords', async () => {
      await expect(
        (service as any).executeSecureQuery(
          'INSERT INTO products VALUES (1)',
          'account-1',
        ),
      ).rejects.toThrow('comandos não permitidos');
    });

    it('should throw for non-SELECT query', async () => {
      await expect(
        (service as any).executeSecureQuery('SHOW TABLES', 'account-1'),
      ).rejects.toThrow('Apenas consultas SELECT');
    });

    it('should throw MISSING_ACCOUNT_ID when :accountId placeholder is missing', async () => {
      await expect(
        (service as any).executeSecureQuery(
          'SELECT * FROM products WHERE id = 1',
          'account-1',
        ),
      ).rejects.toThrow('MISSING_ACCOUNT_ID');
    });

    it('should wrap query execution error', async () => {
      mockKnex.raw.mockRejectedValueOnce(
        new Error('relation "products" does not exist'),
      );

      await expect(
        (service as any).executeSecureQuery(
          'SELECT * FROM products p WHERE p.account_id = :accountId AND p.deleted_at IS NULL',
          'account-1',
        ),
      ).rejects.toThrow('Erro ao executar consulta');
    });
  });

  describe('mapOpenAIError', () => {
    it('should return authentication error for status 401', () => {
      const error = new OpenAI.APIError(
        401,
        { message: 'Unauthorized' },
        'Unauthorized',
        {},
      );
      const result = (service as any).mapOpenAIError(error);
      expect(result.message).toBe(
        'Erro de autenticação com a API OpenAI. Verifique a chave OPENAI_API_KEY.',
      );
    });

    it('should return authentication error for status 403', () => {
      const error = new OpenAI.APIError(
        403,
        { message: 'Forbidden' },
        'Forbidden',
        {},
      );
      const result = (service as any).mapOpenAIError(error);
      expect(result.message).toBe(
        'Erro de autenticação com a API OpenAI. Verifique a chave OPENAI_API_KEY.',
      );
    });

    it('should return model incompatibility for 404 with "not a chat model"', () => {
      const error = new OpenAI.APIError(
        404,
        {
          message: 'The model `text-embedding-3-small` is not a chat model',
        },
        'Not found',
        {},
      );
      const result = (service as any).mapOpenAIError(error);
      expect(result.message).toContain('não é compatível com chat');
    });

    it('should return model not found for generic 404', () => {
      const error = new OpenAI.APIError(
        404,
        { message: 'Model not found' },
        'Not found',
        {},
      );
      const result = (service as any).mapOpenAIError(error);
      expect(result.message).toContain('não encontrado');
    });

    it('should return rate limit error for status 429', () => {
      const error = new OpenAI.APIError(
        429,
        { message: 'Rate limit' },
        'Rate limit',
        {},
      );
      const result = (service as any).mapOpenAIError(error);
      expect(result.message).toContain('Limite de requisições');
    });

    it('should return service unavailable for status 500', () => {
      const error = new OpenAI.APIError(
        500,
        { message: 'Server error' },
        'Server error',
        {},
      );
      const result = (service as any).mapOpenAIError(error);
      expect(result.message).toContain('indisponível');
    });

    it('should return service unavailable for status 502', () => {
      const error = new OpenAI.APIError(
        502,
        { message: 'Bad gateway' },
        'Bad gateway',
        {},
      );
      const result = (service as any).mapOpenAIError(error);
      expect(result.message).toContain('indisponível');
    });

    it('should return service unavailable for status 503', () => {
      const error = new OpenAI.APIError(
        503,
        { message: 'Service unavailable' },
        'Service unavailable',
        {},
      );
      const result = (service as any).mapOpenAIError(error);
      expect(result.message).toContain('indisponível');
    });

    it('should return generic error for non-API errors', () => {
      const error = new Error('Network error');
      const result = (service as any).mapOpenAIError(error);
      expect(result.message).toBe('Erro ao comunicar com a IA: Network error');
    });
  });

  describe('getSchemaContext', () => {
    beforeEach(() => {
      (service as any).schemaCache = null;
      (service as any).schemaCacheTime = 0;
    });

    it('should load schema from information_schema on first call', async () => {
      mockKnex.mockImplementation((tableName: string) => {
        if (tableName === 'information_schema.tables') {
          return createQueryBuilder([{ table_name: 'products' }]);
        }
        if (tableName === 'information_schema.columns') {
          return createQueryBuilder([
            {
              column_name: 'id',
              data_type: 'integer',
              is_nullable: 'NO',
            },
            {
              column_name: 'name',
              data_type: 'text',
              is_nullable: 'YES',
            },
          ]);
        }
        return createQueryBuilder([]);
      });

      const result = await (service as any).getSchemaContext();

      expect(result).toContain('TABELA products');
      expect(result).toContain('id:integer');
      expect(result).toContain('name:text?');
    });

    it('should return cached value on second call within TTL', async () => {
      let knexCalls = 0;
      mockKnex.mockImplementation((tableName: string) => {
        knexCalls++;
        if (tableName === 'information_schema.tables') {
          return createQueryBuilder([{ table_name: 'products' }]);
        }
        return createQueryBuilder([
          { column_name: 'id', data_type: 'integer', is_nullable: 'NO' },
        ]);
      });

      const result1 = await (service as any).getSchemaContext();
      const callsAfterFirst = knexCalls;
      const result2 = await (service as any).getSchemaContext();

      expect(result1).toBe(result2);
      expect(knexCalls).toBe(callsAfterFirst);
    });
  });
});
