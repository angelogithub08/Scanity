import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';

export class ListCustomersParamsDto {
  @ApiProperty({
    description: 'Filtrar por name',
    example: 'Pedro Silva',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Filtrar por document',
    example: '98765432100',
    required: false,
  })
  @IsString()
  @IsOptional()
  document?: string;

  @ApiProperty({
    description: 'Filtrar por phone',
    example: '11912345678',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'Filtrar por email',
    example: 'pedro@email.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Filtrar por street',
    example: 'Avenida Paulista',
    required: false,
  })
  @IsString()
  @IsOptional()
  street?: string;

  @ApiProperty({
    description: 'Filtrar por number',
    example: '456',
    required: false,
  })
  @IsString()
  @IsOptional()
  number?: string;

  @ApiProperty({
    description: 'Filtrar por city',
    example: 'São Paulo',
    required: false,
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({
    description: 'Filtrar por state',
    example: 'SP',
    required: false,
  })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({
    description: 'Filtrar por neighborhood',
    example: 'Bela Vista',
    required: false,
  })
  @IsString()
  @IsOptional()
  neighborhood?: string;

  @ApiProperty({
    description: 'Filtrar por zipcode',
    example: '01310-100',
    required: false,
  })
  @IsString()
  @IsOptional()
  zipcode?: string;

  @ApiProperty({
    description: 'Filtrar por complement',
    example: 'Sala 202',
    required: false,
  })
  @IsString()
  @IsOptional()
  complement?: string;

  @ApiProperty({
    description: 'Filtrar por account_id',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsString()
  @IsOptional()
  account_id?: string;
}

export class ListPaginatedCustomersParamsDto extends ListCustomersParamsDto {
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
