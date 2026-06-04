import { Module } from '@nestjs/common';
import { ChatHistoryController } from './chat-history.controller';
import { ChatHistoryService } from './chat-history.service';
import { DatabaseModule } from '../../infra/database/database.module';
import { ChatHistoryRepository } from './chat-history.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [ChatHistoryController],
  providers: [ChatHistoryService, ChatHistoryRepository],
  exports: [ChatHistoryService, ChatHistoryRepository],
})
export class ChatHistoryModule {}
