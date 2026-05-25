import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, MinLength, IsOptional } from 'class-validator';

export class RegisterAccountDto {
  @ApiProperty({
    description: 'Nome da conta/empresa',
    example: 'Minha Empresa LTDA',
    required: true,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Email do usuário administrador',
    example: 'admin@minhaempresa.com',
    required: true,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Senha do usuário administrador',
    example: 'SenhaSegura123!',
    required: true,
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  password: string;

  @ApiProperty({
    description: 'Telefone da conta',
    example: '(11) 98765-4321',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'Documento (CPF/CNPJ) da conta',
    example: '123.456.789-00',
    required: false,
  })
  @IsOptional()
  @IsString()
  document?: string;

  @ApiProperty({
    description: 'CEP do endereço',
    example: '01234-567',
    required: false,
  })
  @IsOptional()
  @IsString()
  zipcode?: string;

  @ApiProperty({
    description: 'Número do endereço',
    example: '123',
    required: false,
  })
  @IsOptional()
  @IsString()
  address_number?: string;
}
