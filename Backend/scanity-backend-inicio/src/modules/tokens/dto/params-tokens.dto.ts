import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TokenType } from '../entities/token.entity';

export class ListTokensParamsDto {
  @ApiProperty({
    description: 'Filtrar por tipo de token',
    example: TokenType.REFRESH_TOKEN,
    enum: TokenType,
    required: false,
  })
  @IsEnum(TokenType)
  @IsOptional()
  type?: TokenType;

  @ApiProperty({
    description: 'Filtrar por token',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  token?: string;

  @ApiProperty({
    description: 'Filtrar por account_id',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString()
  @IsOptional()
  account_id?: string;

  @ApiProperty({
    description: 'Filtrar por user_id',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  user_id?: string;

  @ApiProperty({
    description: 'Filtrar por revoked_at',
    example: '2024-01-01T00:00:00.000Z',
    required: false,
  })
  @IsString()
  @IsOptional()
  revoked_at?: string;
}

export class ListPaginatedTokensParamsDto extends ListTokensParamsDto {
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
    maximum: 100,
    default: 10,
    required: false,
  })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  limit?: number;
}
