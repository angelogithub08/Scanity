import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { DatabaseModule } from '../../infra/database/database.module';
import { ChatHistoryModule } from '../chat-history/chat-history.module';

@Module({
  imports: [DatabaseModule, ConfigModule, ChatHistoryModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
