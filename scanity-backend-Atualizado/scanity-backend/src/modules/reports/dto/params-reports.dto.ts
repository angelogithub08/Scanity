import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ReportParamsBase {
  @ApiProperty({
    description: 'ID da conta (filtro por conta)',
    required: false,
  })
  @IsString()
  @IsOptional()
  account_id?: string;

  @ApiProperty({
    description: 'Filtrar por nome ou código de barras do produto',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: 'Filtrar por ID do produto',
    required: false,
  })
  @IsString()
  @IsOptional()
  product_id?: string;

  @ApiProperty({
    description: 'Filtrar por ID da categoria',
    required: false,
  })
  @IsString()
  @IsOptional()
  category_id?: string;
}

export class StockMovementsReportParamsDto {
  @ApiProperty({ description: 'ID da conta', required: false })
  @IsString()
  @IsOptional()
  account_id?: string;

  @ApiProperty({ description: 'Filtrar por código de barras', required: false })
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiProperty({ description: 'Filtrar por ID do produto', required: false })
  @IsString()
  @IsOptional()
  product_id?: string;

  @ApiProperty({
    description: 'Filtrar por tipo de movimentação',
    required: false,
  })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({ description: 'Filtrar por ID do usuário', required: false })
  @IsString()
  @IsOptional()
  user_id?: string;
}

export class MostMovedProductsReportParamsDto extends ReportParamsBase {
  @ApiProperty({
    description: 'Filtrar por tipo de movimentação (ENTRADA/SAIDA)',
    required: false,
  })
  @IsString()
  @IsOptional()
  type?: string;
}
