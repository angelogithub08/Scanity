import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsUUID, IsOptional } from 'class-validator';

export class CreateProductsDto {
  @ApiProperty({
    description: 'Propriedade name',
    example: 'Produto 1',
    required: true,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Propriedade value',
    example: 1500.0,
    required: true,
  })
  @IsNumber()
  value: number;

  @ApiProperty({
    description: 'Propriedade description',
    example: 'Descrição do produto 1',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Propriedade barcode',
    example: '1234567890',
    required: false,
  })
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiProperty({
    description: 'Propriedade category_id',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  category_id?: string;

  @ApiProperty({
    description: 'Propriedade account_id',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: true,
  })
  @IsUUID()
  account_id: string;

  @ApiProperty({
    description: 'Caminho da thumbnail no S3',
    example: 'products/550e8400-e29b-41d4-a716-446655440000/thumbnail.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  thumbnail_path?: string;
}
