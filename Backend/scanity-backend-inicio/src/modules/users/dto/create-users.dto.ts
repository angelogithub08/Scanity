import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsBoolean,
} from 'class-validator';

export class CreateUsersDto {
  @ApiProperty({
    description: 'Nome completo do usuário',
    required: true,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Propriedade email',
    example: 'exemplo@email.com',
    required: true,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Senha do usuário',
    required: false,
  })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({
    description: 'Token de acesso',
    required: false,
  })
  @IsOptional()
  @IsString()
  token?: string | null;

  @ApiProperty({
    description: 'UUID da conta (obtido automaticamente do usuário logado)',
    required: true,
  })
  @IsString()
  account_id: string;

  @ApiProperty({
    description: 'Define se o usuário está ativo no sistema',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
