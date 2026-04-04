import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsEmail,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ListAccountsParamsDto {
  @ApiProperty({
    description: 'Filtrar por name',
    example: 'Exemplo',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Filtrar por email',
    example: 'exemplo@email.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Filtrar por active',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiProperty({
    description: 'Filtrar por plan_id',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsString()
  @IsOptional()
  plan_id?: string;
}

export class ListPaginatedAccountsParamsDto extends ListAccountsParamsDto {
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
