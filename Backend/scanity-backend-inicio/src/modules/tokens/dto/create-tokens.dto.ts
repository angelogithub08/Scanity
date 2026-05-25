import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { TokenType } from '../entities/token.entity';

export class CreateTokensDto {
  @ApiProperty({
    description: 'Tipo do token',
    example: TokenType.REFRESH_TOKEN,
    enum: TokenType,
    required: true,
  })
  @IsEnum(TokenType)
  type: TokenType;

  @ApiProperty({
    description: 'Token gerado (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  token?: string;

  @ApiProperty({
    description: 'ID da conta associada ao token',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  @IsString()
  account_id: string;

  @ApiProperty({
    description: 'ID do usuário associado ao token',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  user_id?: string;

  @ApiProperty({
    description: 'Data de revogação do token',
    example: '2024-01-01T00:00:00.000Z',
    required: false,
  })
  @IsString()
  @IsOptional()
  revoked_at?: string;
}
