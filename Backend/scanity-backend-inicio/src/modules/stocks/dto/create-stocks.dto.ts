import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsInt } from 'class-validator';

export class CreateStocksDto {
  @ApiProperty({
    description: 'Propriedade product_id',
    example: 'Exemplo',
    required: true,
  })
  @IsString()
  product_id: string;

  @ApiProperty({
    description: 'Propriedade current_quantity',
    example: 0,
    required: true,
  })
  @IsInt()
  current_quantity: number;

  @ApiProperty({
    description: 'Propriedade min_quantity',
    example: 0,
    required: true,
  })
  @IsInt()
  min_quantity: number;
}
