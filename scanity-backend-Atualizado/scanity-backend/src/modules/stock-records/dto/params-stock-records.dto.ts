import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';

export class ListStockRecordsParamsDto {
  @ApiProperty({
    description: 'Filtrar por stock_id',
    example: 'Exemplo',
    required: false,
  })
  @IsString()
  @IsOptional()
  stock_id?: string;

  @ApiProperty({
    description: 'Filtrar por quantity',
    example: 0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @ApiProperty({
    description: 'Filtrar por type',
    example: 'Exemplo',
    required: false,
  })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({
    description: 'Filtrar por observation',
    example: 'Exemplo',
    required: false,
  })
  @IsString()
  @IsOptional()
  observation?: string;

  @ApiProperty({
    description: 'Filtrar por user_id',
    example: 'Exemplo',
    required: false,
  })
  @IsString()
  @IsOptional()
  user_id?: string;

  @ApiProperty({
    description: 'Filtrar por etapa de movimento',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsString()
  @IsOptional()
  movement_stage_id?: string;
}

export class ListPaginatedStockRecordsParamsDto extends ListStockRecordsParamsDto {
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
