import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class ListInventoryCountsParamsDto {
  @ApiProperty({
    description: 'Filtrar por product_id',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsString()
  @IsOptional()
  product_id?: string;

  @ApiProperty({
    description: 'Filtrar por counted_quantity',
    example: 0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  counted_quantity?: number;

  @ApiProperty({
    description: 'Filtrar por stock_quantity',
    example: 0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  stock_quantity?: number;

  @ApiProperty({
    description: 'Filtrar por status',
    example: 'CONFORME',
    required: false,
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({
    description: 'Filtrar por observation',
    example: 'null',
    required: false,
  })
  @IsString()
  @IsOptional()
  observation?: string;

  @ApiProperty({
    description: 'Filtrar por user_id',
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: false,
  })
  @IsString()
  @IsOptional()
  user_id?: string;
}

export class ListPaginatedInventoryCountsParamsDto extends ListInventoryCountsParamsDto {
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
