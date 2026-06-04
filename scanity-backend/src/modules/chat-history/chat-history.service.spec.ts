import { Test, TestingModule } from '@nestjs/testing';
import { ChatHistoryService } from './chat-history.service';
import { ChatHistoryRepository } from './chat-history.repository';
import { CreateChatHistoryDto } from './dto/create-chat-history.dto';
import { ChatHistory } from './entities/chat-history.entity';

describe('ChatHistoryService', () => {
  let service: ChatHistoryService;
  let repository: ChatHistoryRepository;

  const mockChatHistory: ChatHistory = {
    id: '1',
    user_id: '550e8400-e29b-41d4-a716-446655440001',
    role: 'user',
    content: 'Quais produtos estão com estoque crítico?',
    account_id: '550e8400-e29b-41d4-a716-446655440000',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockPaginatedResult = {
    data: [mockChatHistory],
    total: 1,
    page: 1,
    limit: 10,
  };

  const mockCreateDto: CreateChatHistoryDto = {
    user_id: '550e8400-e29b-41d4-a716-446655440001',
    role: 'user' as any,
    content: 'Quais produtos estão com estoque crítico?',
    account_id: '550e8400-e29b-41d4-a716-446655440000',
  };

  const mockRepository = {
    create: jest.fn(),
    findByUserIdAsc: jest.fn(),
    findByUserId: jest.fn(),
    clearByUserId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatHistoryService,
        { provide: ChatHistoryRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<ChatHistoryService>(ChatHistoryService);
    repository = module.get<ChatHistoryRepository>(ChatHistoryRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create and return ChatHistory', async () => {
      mockRepository.create.mockResolvedValueOnce(mockChatHistory);

      const result = await service.create(mockCreateDto);

      expect(mockRepository.create).toHaveBeenCalledWith(mockCreateDto);
      expect(result).toEqual(mockChatHistory);
    });

    it('should propagate error when repository throws', async () => {
      const error = new Error('Database error');
      mockRepository.create.mockRejectedValueOnce(error);

      await expect(service.create(mockCreateDto)).rejects.toThrow(error);
    });
  });

  describe('getHistoryForContext', () => {
    it('should return mapped array of {role, content}', async () => {
      mockRepository.findByUserIdAsc.mockResolvedValueOnce([mockChatHistory]);

      const result = await service.getHistoryForContext('user-id');

      expect(mockRepository.findByUserIdAsc).toHaveBeenCalledWith(
        'user-id',
        10,
      );
      expect(result).toEqual([
        { role: mockChatHistory.role, content: mockChatHistory.content },
      ]);
    });

    it('should use default limit=10 when not provided', async () => {
      mockRepository.findByUserIdAsc.mockResolvedValueOnce([]);

      await service.getHistoryForContext('user-id');

      expect(mockRepository.findByUserIdAsc).toHaveBeenCalledWith(
        'user-id',
        10,
      );
    });

    it('should propagate error when repository throws', async () => {
      const error = new Error('Database error');
      mockRepository.findByUserIdAsc.mockRejectedValueOnce(error);

      await expect(service.getHistoryForContext('user-id')).rejects.toThrow(
        error,
      );
    });
  });

  describe('getHistoryPaginated', () => {
    it('should return result with hasMore=true when page * limit < total', async () => {
      const resultWithMore = {
        data: [mockChatHistory],
        total: 15,
        page: 1,
        limit: 10,
      };
      mockRepository.findByUserId.mockResolvedValueOnce(resultWithMore);

      const result = await service.getHistoryPaginated('user-id', 1, 10);

      expect(mockRepository.findByUserId).toHaveBeenCalledWith(
        'user-id',
        1,
        10,
      );
      expect(result).toEqual({ ...resultWithMore, hasMore: true });
    });

    it('should return result with hasMore=false when page * limit >= total', async () => {
      const resultWithNoMore = {
        data: [mockChatHistory],
        total: 1,
        page: 1,
        limit: 1,
      };
      mockRepository.findByUserId.mockResolvedValueOnce(resultWithNoMore);

      const result = await service.getHistoryPaginated('user-id', 1, 1);

      expect(result).toEqual({ ...resultWithNoMore, hasMore: false });
    });

    it('should propagate error when repository throws', async () => {
      const error = new Error('Database error');
      mockRepository.findByUserId.mockRejectedValueOnce(error);

      await expect(
        service.getHistoryPaginated('user-id', 1, 10),
      ).rejects.toThrow(error);
    });
  });

  describe('clearByUserId', () => {
    it('should return {deleted: N}', async () => {
      mockRepository.clearByUserId.mockResolvedValueOnce(5);

      const result = await service.clearByUserId('user-id');

      expect(mockRepository.clearByUserId).toHaveBeenCalledWith('user-id');
      expect(result).toEqual({ deleted: 5 });
    });

    it('should propagate error when repository throws', async () => {
      const error = new Error('Database error');
      mockRepository.clearByUserId.mockRejectedValueOnce(error);

      await expect(service.clearByUserId('user-id')).rejects.toThrow(error);
    });
  });
});
