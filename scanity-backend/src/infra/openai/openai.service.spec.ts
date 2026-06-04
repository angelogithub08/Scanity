import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OpenAIService } from './openai.service';
import {
  OpenAIRateLimitException,
  OpenAIValidationException,
} from './exceptions/openai.exceptions';
import { OpenAIExceptionFactory } from './exceptions/openai.exceptions';

const mockChatCompletionCreate = jest.fn();
const mockEmbeddingCreate = jest.fn();
const mockModerationCreate = jest.fn();
const mockModelsList = jest.fn();
const mockResponsesCreate = jest.fn();

jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    chat: { completions: { create: mockChatCompletionCreate } },
    embeddings: { create: mockEmbeddingCreate },
    moderations: { create: mockModerationCreate },
    models: { list: mockModelsList },
    responses: { create: mockResponsesCreate },
  })),
}));

const mockEncode = jest.fn();
const mockFree = jest.fn();
jest.mock('tiktoken', () => ({
  encoding_for_model: jest
    .fn()
    .mockImplementation(() => ({ encode: mockEncode, free: mockFree })),
  get_encoding: jest
    .fn()
    .mockImplementation(() => ({ encode: mockEncode, free: mockFree })),
}));

const mockConfigService = {
  get: jest.fn((key: string, defaultValue?: any) => {
    const config: Record<string, any> = {
      OPENAI_API_KEY: 'sk-test-key',
      OPENAI_ORGANIZATION_ID: undefined,
      OPENAI_PROJECT_ID: undefined,
      OPENAI_DEFAULT_CHAT_MODEL: 'gpt-4o-mini',
      OPENAI_DEFAULT_EMBEDDING_MODEL: 'text-embedding-3-small',
      OPENAI_DEFAULT_TEMPERATURE: 0.7,
      OPENAI_DEFAULT_MAX_TOKENS: 1000,
      OPENAI_DEFAULT_TOP_P: 1.0,
      OPENAI_REQUEST_TIMEOUT: 30000,
      OPENAI_RETRY_ATTEMPTS: 1,
      OPENAI_RETRY_DELAY: 100,
      OPENAI_MAX_REQUESTS_PER_MINUTE: 60,
      OPENAI_MAX_TOKENS_PER_MINUTE: 150000,
      OPENAI_LOG_REQUESTS: false,
      OPENAI_LOG_RESPONSES: false,
      OPENAI_LOG_ERRORS: false,
    };
    return config[key] ?? defaultValue;
  }),
};

describe('OpenAIService', () => {
  let service: OpenAIService;
  let module: TestingModule;

  const mockChatRequest = {
    messages: [{ role: 'user' as const, content: 'Hello' }],
  };

  const mockChatResponse = {
    id: 'chat-123',
    object: 'chat.completion',
    created: 1234567890,
    model: 'gpt-4o-mini',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant' as const,
          content: 'Hi there!',
        },
        finish_reason: 'stop',
      },
    ],
    usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
  };

  const mockEmbeddingResponse = {
    object: 'list',
    data: [
      {
        object: 'embedding',
        embedding: [0.1, 0.2, 0.3],
        index: 0,
      },
    ],
    model: 'text-embedding-3-small',
    usage: { prompt_tokens: 5, total_tokens: 5 },
  };

  const mockSafeModerationResponse = {
    id: 'mod-123',
    model: 'text-moderation-latest',
    results: [
      {
        flagged: false,
        categories: {
          sexual: false,
          hate: false,
          harassment: false,
          'self-harm': false,
          'sexual/minors': false,
          'hate/threatening': false,
          'violence/graphic': false,
          'self-harm/intent': false,
          'self-harm/instructions': false,
          'harassment/threatening': false,
          violence: false,
        },
        category_scores: {
          sexual: 0.01,
          hate: 0.01,
          harassment: 0.01,
          'self-harm': 0.01,
          'sexual/minors': 0.01,
          'hate/threatening': 0.01,
          'violence/graphic': 0.01,
          'self-harm/intent': 0.01,
          'self-harm/instructions': 0.01,
          'harassment/threatening': 0.01,
          violence: 0.01,
        },
      },
    ],
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockEncode.mockReturnValue({ length: 10 });
    mockFree.mockReturnValue(undefined);
    mockModelsList.mockResolvedValue({ data: [{ id: 'gpt-4' }] });

    module = await Test.createTestingModule({
      providers: [
        OpenAIService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<OpenAIService>(OpenAIService);
  });

  describe('constructor', () => {
    it('should throw Error when OPENAI_API_KEY is empty', async () => {
      const badConfig = {
        get: jest.fn((key: string, defaultValue?: any) => {
          if (key === 'OPENAI_API_KEY') return '';
          return mockConfigService.get(key, defaultValue);
        }),
      };

      await expect(
        Test.createTestingModule({
          providers: [
            OpenAIService,
            { provide: ConfigService, useValue: badConfig },
          ],
        }).compile(),
      ).rejects.toThrow('OPENAI_API_KEY environment variable is required');
    });

    it('should successfully create service when API key is provided', () => {
      expect(service).toBeDefined();
    });
  });

  describe('createChatCompletion', () => {
    it('should return ChatCompletionResponse after validation and API call', async () => {
      mockChatCompletionCreate.mockResolvedValue(mockChatResponse);

      const result = await service.createChatCompletion(mockChatRequest);

      expect(result).toEqual(mockChatResponse);
      expect(mockChatCompletionCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o-mini',
          messages: mockChatRequest.messages,
          temperature: 0.7,
        }),
      );
    });

    it('should respect defaultTemperature and defaultMaxTokens from config', async () => {
      mockChatCompletionCreate.mockResolvedValue(mockChatResponse);

      await service.createChatCompletion(mockChatRequest);

      expect(mockChatCompletionCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.7,
          max_tokens: 1000,
        }),
      );
    });

    it('should throw OpenAIValidationException when validation fails', async () => {
      const invalidRequest = { messages: [] };

      await expect(
        service.createChatCompletion(invalidRequest as any),
      ).rejects.toThrow(OpenAIValidationException);
    });

    it('should throw OpenAIRateLimitException when rate limited', async () => {
      jest.useFakeTimers();

      (service as any).config.maxRequestsPerMinute = 2;
      mockChatCompletionCreate.mockResolvedValue(mockChatResponse);

      await service.createChatCompletion(mockChatRequest);
      await service.createChatCompletion(mockChatRequest);

      await expect(
        service.createChatCompletion(mockChatRequest),
      ).rejects.toThrow(OpenAIRateLimitException);

      jest.useRealTimers();
    });
  });

  describe('createEmbedding', () => {
    it('should return embedding for single string input (cache miss)', async () => {
      mockEmbeddingCreate.mockResolvedValue(mockEmbeddingResponse);

      const result = await service.createEmbedding({ input: 'test text' });

      expect(result).toEqual(mockEmbeddingResponse);
      expect(mockEmbeddingCreate).toHaveBeenCalledTimes(1);
    });

    it('should return cached embedding for repeated input (cache hit)', async () => {
      mockEmbeddingCreate.mockResolvedValue(mockEmbeddingResponse);

      await service.createEmbedding({ input: 'test text' });
      mockEmbeddingCreate.mockClear();

      const result = await service.createEmbedding({ input: 'test text' });

      expect(mockEmbeddingCreate).not.toHaveBeenCalled();
      expect(result.data[0].embedding).toEqual([0.1, 0.2, 0.3]);
    });

    it('should return embedding for array input', async () => {
      mockEmbeddingCreate.mockResolvedValue({
        ...mockEmbeddingResponse,
        data: [
          { object: 'embedding', embedding: [0.1, 0.2, 0.3], index: 0 },
          { object: 'embedding', embedding: [0.4, 0.5, 0.6], index: 1 },
        ],
      });

      const result = await service.createEmbedding({
        input: ['text1', 'text2'],
      });

      expect(mockEmbeddingCreate).toHaveBeenCalledTimes(1);
      expect(result.data).toHaveLength(2);
    });

    it('should throw OpenAIValidationException on validation failure', async () => {
      await expect(service.createEmbedding({ input: '' })).rejects.toThrow(
        OpenAIValidationException,
      );
    });
  });

  describe('createEmbeddingBatch', () => {
    it('should return embeddings for batch of strings', async () => {
      mockEmbeddingCreate.mockResolvedValue({
        ...mockEmbeddingResponse,
        data: [
          { object: 'embedding', embedding: [0.1, 0.2, 0.3], index: 0 },
          { object: 'embedding', embedding: [0.4, 0.5, 0.6], index: 1 },
        ],
      });

      const result = await service.createEmbeddingBatch(['text1', 'text2']);

      expect(mockEmbeddingCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'text-embedding-3-small',
          input: ['text1', 'text2'],
        }),
      );
      expect(result.data).toHaveLength(2);
    });

    it('should throw OpenAIValidationException on validation failure', async () => {
      jest
        .spyOn(service as any, 'validateDto')
        .mockRejectedValue(
          OpenAIExceptionFactory.createValidationException(
            'Validation failed',
            ['Invalid input'],
          ),
        );

      mockEmbeddingCreate.mockResolvedValue(mockEmbeddingResponse);

      await expect(service.createEmbeddingBatch(['test'])).rejects.toThrow(
        OpenAIValidationException,
      );
    });
  });

  describe('moderateContent', () => {
    it('should return ModerationResponse', async () => {
      mockModerationCreate.mockResolvedValue(mockSafeModerationResponse);

      const result = await service.moderateContent({ input: 'safe content' });

      expect(result).toEqual(mockSafeModerationResponse);
      expect(mockModerationCreate).toHaveBeenCalledWith({
        input: 'safe content',
      });
    });

    it('should throw OpenAIValidationException on validation failure', async () => {
      await expect(service.moderateContent({ input: '' })).rejects.toThrow(
        OpenAIValidationException,
      );
    });
  });

  describe('moderateContentWithAnalysis', () => {
    it('should return isSafe=true for safe content', async () => {
      mockModerationCreate.mockResolvedValue(mockSafeModerationResponse);

      const result = await service.moderateContentWithAnalysis('safe content');

      expect(result.moderation).toEqual(mockSafeModerationResponse);
      expect(result.analysis.isSafe).toBe(true);
      expect(result.analysis.recommendation).toBe('allow');
    });

    it('should return recommendation=block for flagged content', async () => {
      mockModerationCreate.mockResolvedValue({
        ...mockSafeModerationResponse,
        results: [
          {
            ...mockSafeModerationResponse.results[0],
            flagged: true,
            categories: {
              ...mockSafeModerationResponse.results[0].categories,
              hate: true,
            },
            category_scores: {
              ...mockSafeModerationResponse.results[0].category_scores,
              hate: 0.95,
            },
          },
        ],
      });

      const result =
        await service.moderateContentWithAnalysis('hateful content');

      expect(result.analysis.isSafe).toBe(false);
      expect(result.analysis.recommendation).toBe('block');
      expect(result.analysis.violatedCategories).toContain('hate');
    });

    it('should return recommendation=review for medium risk content', async () => {
      mockModerationCreate.mockResolvedValue({
        ...mockSafeModerationResponse,
        results: [
          {
            ...mockSafeModerationResponse.results[0],
            flagged: false,
            category_scores: {
              ...mockSafeModerationResponse.results[0].category_scores,
              harassment: 0.7,
            },
          },
        ],
      });

      const result = await service.moderateContentWithAnalysis(
        'questionable content',
      );

      expect(result.analysis.isSafe).toBe(false);
      expect(result.analysis.recommendation).toBe('review');
      expect(result.analysis.riskScore).toBe(0.7);
    });
  });

  describe('isContentSafe', () => {
    it('should return true for safe content', async () => {
      mockModerationCreate.mockResolvedValue(mockSafeModerationResponse);

      const result = await service.isContentSafe('safe content');

      expect(result).toBe(true);
    });

    it('should return false for unsafe content', async () => {
      mockModerationCreate.mockResolvedValue({
        ...mockSafeModerationResponse,
        results: [
          {
            ...mockSafeModerationResponse.results[0],
            flagged: true,
            categories: {
              ...mockSafeModerationResponse.results[0].categories,
              violence: true,
            },
            category_scores: {
              ...mockSafeModerationResponse.results[0].category_scores,
              violence: 0.95,
            },
          },
        ],
      });

      const result = await service.isContentSafe('violent content');

      expect(result).toBe(false);
    });

    it('should return false on API error (fail closed)', async () => {
      mockModerationCreate.mockRejectedValue(new Error('API error'));

      const result = await service.isContentSafe('content');

      expect(result).toBe(false);
    });
  });

  describe('healthCheck', () => {
    it('should return true when API is healthy', async () => {
      const result = await service.healthCheck();

      expect(result).toBe(true);
      expect(mockModelsList).toHaveBeenCalled();
    });

    it('should return false when API call fails', async () => {
      mockModelsList.mockRejectedValue(new Error('API error'));

      const result = await service.healthCheck();

      expect(result).toBe(false);
    });
  });

  describe('countTokens', () => {
    it('should return precise count with tiktoken', () => {
      const result = service.countTokens('some text');

      expect(result).toBe(10);
      expect(mockEncode).toHaveBeenCalledWith('some text');
      expect(mockFree).toHaveBeenCalled();
    });

    it('should return 0 for empty string', () => {
      const result = service.countTokens('');

      expect(result).toBe(0);
      expect(mockEncode).not.toHaveBeenCalled();
    });

    it('should use fallback estimation when tiktoken fails', () => {
      mockEncode.mockImplementation(() => {
        throw new Error('tiktoken error');
      });

      const result = service.countTokens('hello world', 'gpt-4o');

      expect(result).toBeGreaterThan(0);
    });
  });

  describe('getEmbeddingCacheStats / clearEmbeddingCache', () => {
    it('should return correct cache stats', async () => {
      mockEmbeddingCreate.mockResolvedValue(mockEmbeddingResponse);

      const statsBefore = service.getEmbeddingCacheStats();
      expect(statsBefore.size).toBe(0);
      expect(statsBefore.maxSize).toBe(1000);

      await service.createEmbedding({ input: 'cache me' });

      const statsAfter = service.getEmbeddingCacheStats();
      expect(statsAfter.size).toBe(1);
    });

    it('should clear embedding cache', async () => {
      mockEmbeddingCreate.mockResolvedValue(mockEmbeddingResponse);

      await service.createEmbedding({ input: 'cache me' });
      expect(service.getEmbeddingCacheStats().size).toBe(1);

      service.clearEmbeddingCache();
      expect(service.getEmbeddingCacheStats().size).toBe(0);
    });
  });

  describe('getRateLimitStats', () => {
    it('should return current rate limit state', async () => {
      mockChatCompletionCreate.mockResolvedValue(mockChatResponse);

      const statsBefore = service.getRateLimitStats();
      expect(statsBefore.requests).toBe(0);
      expect(statsBefore.tokens).toBe(0);
      expect(statsBefore.maxRequests).toBe(60);
      expect(statsBefore.maxTokens).toBe(150000);

      await service.createChatCompletion(mockChatRequest);

      const statsAfter = service.getRateLimitStats();
      expect(statsAfter.requests).toBe(1);
      expect(statsAfter.tokens).toBeGreaterThan(0);
    });
  });

  describe('setRiskThresholds', () => {
    it('should update risk thresholds', () => {
      (service as any).riskThresholds.high = 0.9;
      (service as any).riskThresholds.medium = 0.6;

      service.setRiskThresholds({ high: 0.85, medium: 0.55 });

      expect((service as any).riskThresholds.high).toBe(0.85);
      expect((service as any).riskThresholds.medium).toBe(0.55);
    });
  });

  describe('testTokenCounting', () => {
    it('should return precise, fallback, and difference values', () => {
      const result = service.testTokenCounting('test text', 'gpt-4o');

      expect(result).toHaveProperty('precise');
      expect(result).toHaveProperty('fallback');
      expect(result).toHaveProperty('difference');
      expect(result.difference).toBe(
        Math.abs(result.precise - result.fallback),
      );
    });
  });

  describe('getRetryStats / setRetryConfig', () => {
    it('should return current retry config', () => {
      const result = service.getRetryStats();

      expect(result).toHaveProperty('maxAttempts');
      expect(result).toHaveProperty('baseDelay');
      expect(result).toHaveProperty('maxDelay');
      expect(result.maxAttempts).toBe(1);
    });

    it('should update retry config', () => {
      service.setRetryConfig({ maxAttempts: 5, baseDelay: 2000 });

      const result = service.getRetryStats();
      expect(result.maxAttempts).toBe(5);
      expect(result.baseDelay).toBe(2000);
    });
  });

  describe('executeWithRetry (indirect)', () => {
    it('should retry on retryable error and succeed', async () => {
      (service as any).retryConfig.maxAttempts = 2;
      (service as any).retryConfig.baseDelay = 5;

      mockChatCompletionCreate
        .mockRejectedValueOnce({ status: 500, message: 'Server error' })
        .mockResolvedValueOnce(mockChatResponse);

      const result = await service.createChatCompletion(mockChatRequest);

      expect(result).toEqual(mockChatResponse);
      expect(mockChatCompletionCreate).toHaveBeenCalledTimes(2);
    }, 10000);
  });

  describe('checkRateLimit (indirect)', () => {
    it('should throw rate limit exception when exceeding request limit', async () => {
      jest.useFakeTimers();

      (service as any).config.maxRequestsPerMinute = 2;
      mockChatCompletionCreate.mockResolvedValue(mockChatResponse);

      await service.createChatCompletion(mockChatRequest);
      await service.createChatCompletion(mockChatRequest);

      await expect(
        service.createChatCompletion(mockChatRequest),
      ).rejects.toThrow(OpenAIRateLimitException);

      jest.advanceTimersByTime(60000);

      await service.createChatCompletion(mockChatRequest);
      expect(mockChatCompletionCreate).toHaveBeenCalledTimes(3);

      jest.useRealTimers();
    });
  });
});
