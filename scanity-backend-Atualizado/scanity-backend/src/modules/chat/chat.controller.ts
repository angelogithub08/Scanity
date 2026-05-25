import { Controller, Post, Body, Res, HttpCode, Logger } from '@nestjs/common';
import { Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

interface RequestUser {
  id: string;
  account_id: string;
  account_type?: string;
}

@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chatService: ChatService) {}

  @Post()
  @HttpCode(200)
  async chat(
    @Body() dto: SendMessageDto,
    @CurrentUser() user: RequestUser,
    @Res() res: Response,
  ): Promise<void> {
    const accountId = user.account_id;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    try {
      await this.chatService.streamChat(
        dto.message,
        user.id,
        accountId,
        (chunk: string) => {
          res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
        },
      );

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro interno do servidor';

      this.logger.error(`Chat error: ${message}`);

      res.write(
        `data: ${JSON.stringify({ content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.' })}\n\n`,
      );
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
}
