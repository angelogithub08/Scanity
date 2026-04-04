import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';

export class ListUsersParamsDto {
  @ApiProperty({
    description: 'Filtrar por nome do usuário',
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
    description: 'Filtrar por senha',
    required: false,
  })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiProperty({
    description: 'Filtrar por token de acesso',
    required: false,
  })
  @IsString()
  @IsOptional()
  token?: string;

  @ApiProperty({
    description:
      'Filtrar por UUID da conta (formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)',
    required: false,
  })
  @IsString()
  @IsOptional()
  account_id?: string;

  @ApiProperty({
    description: 'Filtrar por UUID do departamento',
    required: false,
  })
  @IsString()
  @IsOptional()
  department_id?: string;
}

export class ListPaginatedUsersParamsDto extends ListUsersParamsDto {
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
