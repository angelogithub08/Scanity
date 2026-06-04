import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsUUID } from 'class-validator';

export enum ChatHistoryRole {
  USER = 'user',
  ASSISTANT = 'assistant',
}

export class CreateChatHistoryDto {
  @ApiProperty({
    description: 'ID do usuário',
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: true,
  })
  @IsUUID()
  user_id: string;

  @ApiProperty({
    description: 'Papel da mensagem',
    example: 'user',
    enum: ChatHistoryRole,
    required: true,
  })
  @IsEnum(ChatHistoryRole)
  role: ChatHistoryRole;

  @ApiProperty({
    description: 'Conteúdo da mensagem',
    example: 'Quais produtos estão com estoque crítico?',
    required: true,
  })
  @IsString()
  content: string;

  @ApiProperty({
    description: 'ID da conta',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: true,
  })
  @IsUUID()
  account_id: string;
}
