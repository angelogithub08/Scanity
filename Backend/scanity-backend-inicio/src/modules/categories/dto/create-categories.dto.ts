import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateCategoriesDto {
  @ApiProperty({
    description: 'Propriedade name',
    example: 'Categoria 1',
    required: true,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Propriedade description',
    example: 'Descrição da categoria 1',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Propriedade account_id',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: true,
  })
  @IsUUID()
  account_id: string;
}
