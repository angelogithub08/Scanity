import { Controller, Get, Delete, Query, HttpCode } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ChatHistoryService } from './chat-history.service';
import { ListPaginatedChatHistoryParamsDto } from './dto/params-chat-history.dto';

interface RequestUser {
  id: string;
  account_id: string;
}

@ApiTags('ChatHistory')
@ApiBearerAuth('defaultBearerAuth')
@Controller('chat/history')
export class ChatHistoryController {
  constructor(private readonly chatHistoryService: ChatHistoryService) {}

  @Get()
  @ApiOperation({ summary: 'Listar histórico de conversas do usuário logado' })
  @ApiQuery({
    name: 'page',
    type: Number,
    description: 'Número da página',
    required: false,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    description: 'Limite de registros por página',
    required: false,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Histórico retornado com sucesso.',
  })
  getHistory(
    @Query() params: ListPaginatedChatHistoryParamsDto,
    @CurrentUser() user: RequestUser,
  ) {
    const { page = 1, limit = 10 } = params;
    return this.chatHistoryService.getHistoryPaginated(user.id, page, limit);
  }

  @Delete()
  @HttpCode(200)
  @ApiOperation({ summary: 'Limpar todo o histórico de conversas do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Histórico limpo com sucesso.',
  })
  clearHistory(@CurrentUser() user: RequestUser) {
    return this.chatHistoryService.clearByUserId(user.id);
  }
}
