import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';

export class CreateInventoryCountsDto {
  @ApiProperty({
    description: 'Propriedade product_id',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: true,
  })
  @IsString()
  product_id: string;

  @ApiProperty({
    description: 'Propriedade counted_quantity',
    example: 0,
    required: true,
  })
  @IsNumber()
  counted_quantity: number;

  @ApiProperty({
    description: 'Propriedade stock_quantity',
    example: 0,
    required: true,
  })
  @IsNumber()
  stock_quantity: number;

  @ApiProperty({
    description: 'Propriedade status',
    example: 'CONFORME',
    required: true,
  })
  @IsEnum(['DIVERGENTE', 'CONFORME'])
  status: string;

  @ApiProperty({
    description: 'Propriedade observation',
    example: 'null',
    required: false,
  })
  @IsString()
  @IsOptional()
  observation?: string;

  @ApiProperty({
    description: 'Propriedade user_id',
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: true,
  })
  @IsString()
  user_id: string;
}
