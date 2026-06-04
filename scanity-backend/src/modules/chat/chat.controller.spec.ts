/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

describe('ChatController', () => {
  let controller: ChatController;
  let chatService: ChatService;

  const mockCurrentUser = { id: 'user-1', account_id: 'account-1' };

  const mockSendMessageDto: SendMessageDto = {
    message: 'Hello, how are you?',
  };

  const mockResponse = {
    setHeader: jest.fn(),
    write: jest.fn(),
    end: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        {
          provide: ChatService,
          useValue: {
            streamChat: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ChatController>(ChatController);
    chatService = module.get<ChatService>(ChatService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('chat', () => {
    it('should set SSE headers and call chatService.streamChat with correct params', async () => {
      (chatService.streamChat as jest.Mock).mockImplementation(
        (_message, _userId, _accountId, _onChunk) => Promise.resolve(),
      );

      await controller.chat(
        mockSendMessageDto,
        mockCurrentUser,
        mockResponse as any,
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/event-stream',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Cache-Control',
        'no-cache',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Connection',
        'keep-alive',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-Accel-Buffering',
        'no',
      );
      expect(chatService.streamChat).toHaveBeenCalledWith(
        mockSendMessageDto.message,
        mockCurrentUser.id,
        mockCurrentUser.account_id,
        expect.any(Function),
      );
    });

    it('should stream chunks via response.write and send data: [DONE] on success', async () => {
      const onChunkCallback = jest.fn();

      (chatService.streamChat as jest.Mock).mockImplementation(
        (_message, _userId, _accountId, onChunk) => {
          onChunk('Hello');
          onChunk(' world');
          return Promise.resolve();
        },
      );

      await controller.chat(
        mockSendMessageDto,
        mockCurrentUser,
        mockResponse as any,
      );

      expect(mockResponse.write).toHaveBeenCalledWith(
        `data: ${JSON.stringify({ content: 'Hello' })}\n\n`,
      );
      expect(mockResponse.write).toHaveBeenCalledWith(
        `data: ${JSON.stringify({ content: ' world' })}\n\n`,
      );
      expect(mockResponse.write).toHaveBeenCalledWith('data: [DONE]\n\n');
      expect(mockResponse.end).toHaveBeenCalled();
    });

    it('should handle errors by sending error SSE message and [DONE]', async () => {
      (chatService.streamChat as jest.Mock).mockRejectedValue(
        new Error('API Error'),
      );

      await controller.chat(
        mockSendMessageDto,
        mockCurrentUser,
        mockResponse as any,
      );

      expect(mockResponse.write).toHaveBeenCalledWith(
        `data: ${JSON.stringify({ content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.' })}\n\n`,
      );
      expect(mockResponse.write).toHaveBeenCalledWith('data: [DONE]\n\n');
      expect(mockResponse.end).toHaveBeenCalled();
    });
  });
});
