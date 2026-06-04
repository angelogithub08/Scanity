import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class ListChatHistoryParamsDto {
  @ApiProperty({
    description: 'Filtrar por user_id',
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  user_id?: string;
}

export class ListPaginatedChatHistoryParamsDto extends ListChatHistoryParamsDto {
  @ApiProperty({
    description: 'Número da página',
    example: 1,
    minimum: 1,
    default: 1,
    required: false,
  })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  page?: number;

  @ApiProperty({
    description: 'Limite de registros por página',
    example: 10,
    minimum: 1,
    maximum: 50,
    default: 10,
    required: false,
  })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  limit?: number;
}
