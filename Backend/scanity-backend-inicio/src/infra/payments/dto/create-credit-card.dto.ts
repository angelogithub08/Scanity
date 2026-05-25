import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEmail, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreditCardDto {
  @ApiProperty({
    description: 'Nome impresso no cartão',
    example: 'John Doe',
    required: true,
  })
  @IsString()
  holderName: string;

  @ApiProperty({
    description: 'Número do cartão',
    example: '1234567890123456',
    required: true,
  })
  @IsString()
  number: string;

  @ApiProperty({
    description: 'Mês de expiração com 2 dígitos',
    example: '09',
    required: true,
  })
  @IsString()
  expiryMonth: string;

  @ApiProperty({
    description: 'Ano de expiração com 4 dígitos',
    example: '2025',
    required: true,
  })
  @IsString()
  expiryYear: string;

  @ApiProperty({
    description: 'Código de segurança',
    example: '123',
    required: true,
  })
  @IsString()
  ccv: string;
}

export class CreditCardHolderInfoDto {
  @ApiProperty({
    description: 'Nome do titular do cartão',
    example: 'John Doe',
    required: true,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Email do titular do cartão',
    example: 'john.doe@email.com',
    required: true,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'CPF ou CNPJ do titular do cartão',
    example: '12345678901',
    required: true,
  })
  @IsString()
  cpfCnpj: string;

  @ApiProperty({
    description: 'CEP do titular do cartão',
    example: '12345678',
    required: true,
  })
  @IsString()
  postalCode: string;

  @ApiProperty({
    description: 'Número do endereço do titular do cartão',
    example: '123',
    required: true,
  })
  @IsString()
  addressNumber: string;

  @ApiProperty({
    description: 'Complemento do endereço do titular do cartão',
    example: 'Apto 101',
    required: false,
  })
  @IsOptional()
  @IsString()
  addressComplement?: string;

  @ApiProperty({
    description: 'Telefone com DDD do titular do cartão',
    example: '11987654321',
    required: true,
  })
  @IsString()
  phone: string;

  @ApiProperty({
    description: 'Celular do titular do cartão',
    example: '11987654321',
    required: false,
  })
  @IsOptional()
  @IsString()
  mobilePhone?: string;
}

export class CreateCreditCardDto {
  @ApiProperty({
    description: 'Identificador único do cliente no Asaas',
    example: 'cus_G7Dvo4IphtUl',
    required: true,
  })
  @IsString()
  customer: string;

  @ApiProperty({
    description: 'Informações do cartão de crédito',
    type: CreditCardDto,
    required: true,
  })
  @ValidateNested()
  @Type(() => CreditCardDto)
  creditCard: CreditCardDto;

  @ApiProperty({
    description: 'Informações do titular do cartão de crédito',
    type: CreditCardHolderInfoDto,
    required: true,
  })
  @ValidateNested()
  @Type(() => CreditCardHolderInfoDto)
  creditCardHolderInfo: CreditCardHolderInfoDto;

  @ApiProperty({
    description:
      'IP de onde o cliente está fazendo a compra. Não deve ser informado o IP do seu servidor.',
    example: '116.213.42.532',
    required: true,
  })
  @IsString()
  remoteIp: string;
}
