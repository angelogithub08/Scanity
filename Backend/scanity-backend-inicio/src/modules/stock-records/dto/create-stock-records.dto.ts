import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsInt, IsEnum } from 'class-validator';

export class CreateStockRecordsDto {
  @ApiProperty({
    description: 'Propriedade stock_id',
    example: 'Exemplo',
    required: true,
  })
  @IsString()
  stock_id: string;

  @ApiProperty({
    description: 'Propriedade quantity',
    example: 0,
    required: true,
  })
  @IsInt()
  quantity: number;

  @ApiProperty({
    description: 'Propriedade type',
    example: 'Exemplo',
    required: true,
  })
  @IsEnum(['ENTRADA', 'SAIDA'])
  type: string;

  @ApiProperty({
    description: 'Propriedade observation',
    example: 'Exemplo',
    required: false,
  })
  @IsString()
  @IsOptional()
  observation?: string;

  @ApiProperty({
    description: 'Propriedade user_id',
    example: 'Exemplo',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @ApiProperty({
    description: 'ID da etapa de movimento',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  movement_stage_id?: string;
}
