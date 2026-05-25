import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';

export class ListStocksParamsDto {
  @ApiProperty({
    description: 'Filtrar por product_id',
    example: 'Exemplo',
    required: false,
  })
  @IsString()
  @IsOptional()
  product_id?: string;

  @ApiProperty({
    description: 'Filtrar por account_id',
    example: 'Exemplo',
    required: false,
  })
  @IsString()
  @IsOptional()
  account_id?: string;
}

export class ListPaginatedStocksParamsDto extends ListStocksParamsDto {
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
