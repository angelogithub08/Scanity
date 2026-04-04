import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  NotEquals,
} from 'class-validator';

export class QuickMovementDto {
  @ApiProperty({
    description: 'Código de barras do produto (busca estrita)',
    example: '7891234567890',
    required: true,
  })
  @IsString()
  @NotEquals('', { message: 'Código de barras não pode ser vazio' })
  barcode: string;

  @ApiProperty({
    description: 'Tipo da movimentação',
    enum: ['ENTRADA', 'SAIDA'],
    example: 'ENTRADA',
    required: true,
  })
  @IsEnum(['ENTRADA', 'SAIDA'])
  type: 'ENTRADA' | 'SAIDA';

  @ApiPropertyOptional({
    description: 'ID da etapa de movimentação (opcional)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  movement_stage_id?: string;
}
