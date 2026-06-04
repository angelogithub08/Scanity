import { Injectable, Logger } from '@nestjs/common';
import { CreateChatHistoryDto } from './dto/create-chat-history.dto';
import { ChatHistory } from './entities/chat-history.entity';
import { ChatHistoryRepository } from './chat-history.repository';

@Injectable()
export class ChatHistoryService {
  private readonly logger = new Logger(ChatHistoryService.name);

  constructor(private readonly chatHistoryRepository: ChatHistoryRepository) {}

  async create(dto: CreateChatHistoryDto): Promise<ChatHistory> {
    return this.chatHistoryRepository.create(dto);
  }

  async getHistoryForContext(
    userId: string,
    limit = 10,
  ): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
    const messages = await this.chatHistoryRepository.findByUserIdAsc(
      userId,
      limit,
    );

    return messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
  }

  async getHistoryPaginated(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{
    data: ChatHistory[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> {
    const result = await this.chatHistoryRepository.findByUserId(
      userId,
      page,
      limit,
    );

    return {
      ...result,
      hasMore: page * limit < result.total,
    };
  }

  async clearByUserId(userId: string): Promise<{ deleted: number }> {
    const deleted = await this.chatHistoryRepository.clearByUserId(userId);
    this.logger.log(
      `Chat history cleared for user ${userId}: ${deleted} messages`,
    );
    return { deleted };
  }
}
