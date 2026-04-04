import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class ListProductsParamsDto {
  @ApiProperty({
    description: 'Filtrar por name',
    example: 'Produto 1',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Filtrar por value',
    example: 1500.0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  value?: number;

  @ApiProperty({
    description: 'Filtrar por description',
    example: 'Descrição do produto 1',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Filtrar por barcode',
    example: '1234567890',
    required: false,
  })
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiProperty({
    description: 'Filtrar por category_id',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  category_id?: string;

  @ApiProperty({
    description: 'Filtrar por account_id',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  account_id?: string;
}

export class ListPaginatedProductsParamsDto extends ListProductsParamsDto {
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
