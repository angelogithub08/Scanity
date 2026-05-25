import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';

export class ListSupliersParamsDto {
  @ApiProperty({
    description: 'Filtrar por name',
    example: 'Exemplo',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Filtrar por phone',
    example: 'Exemplo',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'Filtrar por email',
    example: 'exemplo@email.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Filtrar por responsible_name',
    example: 'Exemplo',
    required: false,
  })
  @IsString()
  @IsOptional()
  responsible_name?: string;

  @ApiProperty({
    description: 'Filtrar por observations',
    example: 'Exemplo',
    required: false,
  })
  @IsString()
  @IsOptional()
  observations?: string;

  @ApiProperty({
    description: 'Filtrar por account_id',
    example: 'Exemplo',
    required: false,
  })
  @IsString()
  @IsOptional()
  account_id?: string;
}

export class ListPaginatedSupliersParamsDto extends ListSupliersParamsDto {
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
