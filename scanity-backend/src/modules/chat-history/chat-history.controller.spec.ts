/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ChatHistoryController } from './chat-history.controller';
import { ChatHistoryService } from './chat-history.service';
import { ListPaginatedChatHistoryParamsDto } from './dto/params-chat-history.dto';

describe('ChatHistoryController', () => {
  let controller: ChatHistoryController;
  let chatHistoryService: ChatHistoryService;

  const mockCurrentUser = { id: 'user-1', account_id: 'account-1' };

  const mockPaginatedResult = {
    data: [
      {
        id: '1',
        user_id: 'user-1',
        role: 'user',
        content: 'Hello',
        created_at: new Date(),
      },
      {
        id: '2',
        user_id: 'user-1',
        role: 'assistant',
        content: 'Hi there!',
        created_at: new Date(),
      },
    ],
    total: 2,
    page: 1,
    limit: 10,
    hasMore: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatHistoryController],
      providers: [
        {
          provide: ChatHistoryService,
          useValue: {
            getHistoryPaginated: jest.fn().mockResolvedValue(mockPaginatedResult),
            clearByUserId: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ChatHistoryController>(ChatHistoryController);
    chatHistoryService = module.get<ChatHistoryService>(ChatHistoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /chat/history', () => {
    it('should call chatHistoryService.getHistoryPaginated with page=1, limit=10 defaults', async () => {
      const params: ListPaginatedChatHistoryParamsDto = {};

      const result = await controller.getHistory(params, mockCurrentUser);

      expect(chatHistoryService.getHistoryPaginated).toHaveBeenCalledWith(
        mockCurrentUser.id,
        1,
        10,
      );
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should use custom page/limit from query params', async () => {
      const params: ListPaginatedChatHistoryParamsDto = {
        page: 2,
        limit: 5,
      };

      const result = await controller.getHistory(params, mockCurrentUser);

      expect(chatHistoryService.getHistoryPaginated).toHaveBeenCalledWith(
        mockCurrentUser.id,
        2,
        5,
      );
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should return paginated result from service', async () => {
      const params: ListPaginatedChatHistoryParamsDto = {};

      const result = await controller.getHistory(params, mockCurrentUser);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total', 2);
      expect(result).toHaveProperty('page', 1);
      expect(result).toHaveProperty('limit', 10);
      expect(result).toHaveProperty('hasMore', false);
    });
  });

  describe('DELETE /chat/history', () => {
    it('should call chatHistoryService.clearByUserId with current user id', async () => {
      (chatHistoryService.clearByUserId as jest.Mock).mockResolvedValue({
        deleted: 5,
      });

      const result = await controller.clearHistory(mockCurrentUser);

      expect(chatHistoryService.clearByUserId).toHaveBeenCalledWith(
        mockCurrentUser.id,
      );
      expect(result).toEqual({ deleted: 5 });
    });

    it('should return { deleted: N } result', async () => {
      (chatHistoryService.clearByUserId as jest.Mock).mockResolvedValue({
        deleted: 0,
      });

      const result = await controller.clearHistory(mockCurrentUser);

      expect(result).toEqual({ deleted: 0 });
    });
  });
});
