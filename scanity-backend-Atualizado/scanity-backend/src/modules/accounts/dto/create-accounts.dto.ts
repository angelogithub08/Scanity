import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsBoolean,
  IsDateString,
  IsOptional,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { AccountType } from '../entities/account.entity';

export class CreateAccountsDto {
  @ApiProperty({
    description: 'Propriedade name',
    example: 'Exemplo',
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
    description: 'Propriedade confirmed_at',
    example: '2024-01-01T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  confirmed_at?: string;

  @ApiProperty({
    description: 'Propriedade type',
    example: AccountType.ADMIN,
    enum: AccountType,
    required: true,
  })
  @IsEnum(AccountType)
  type: AccountType;

  @ApiProperty({
    description: 'Propriedade gateway_customer_id',
    example: 'cus_1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  gateway_customer_id?: string;

  @ApiProperty({
    description: 'Propriedade plan_id',
    example: 'plan_1234567890',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  plan_id?: string;

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

  @ApiProperty({
    description: 'AI token for account',
    example: 'sk-1234567890abcdef',
    required: false,
  })
  @IsOptional()
  @IsString()
  ia_token?: string;
}
