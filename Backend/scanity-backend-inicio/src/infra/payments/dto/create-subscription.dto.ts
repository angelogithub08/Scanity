import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsNumber,
  IsString,
  Min,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CreditCardDto,
  CreditCardHolderInfoDto,
} from './create-credit-card.dto';

export class CreateSubscriptionDto {
  @ApiProperty({
    description: 'Identificador único do cliente no Asaas',
    example: 'cus_G7Dvo4IphtUl',
    required: true,
  })
  @IsString()
  customer: string;

  @ApiProperty({
    description: 'Token do cartão de crédito',
    example: '757899f0-576f-4f8d-b275-466fbeec6b2b',
    required: false,
  })
  @IsOptional()
  @IsString()
  creditCardToken?: string;

  @ApiProperty({
    description: 'Descrição da assinatura',
    example: 'Assinatura do plano 1',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Tipo de pagamento',
    example: 'CREDIT_CARD',
    required: true,
  })
  @IsEnum(['CREDIT_CARD', 'BOLETO', 'PIX'])
  billingType: 'CREDIT_CARD' | 'BOLETO' | 'PIX';

  @ApiProperty({
    description: 'Valor da assinatura',
    example: 100.0,
    required: true,
  })
  @Min(1, { message: 'O valor não pode ser menor que 1' })
  @IsNumber()
  value: number;

  @ApiProperty({
    description: 'Data de vencimento da próxima cobrança',
    example: '2025-01-01',
    required: true,
  })
  @IsDateString()
  nextDueDate: string;

  @ApiProperty({
    description: 'Ciclo da assinatura',
    example: 'MONTHLY',
    required: true,
  })
  @IsIn(['MONTHLY', 'YEARLY'])
  @IsString()
  cycle: 'MONTHLY' | 'YEARLY';

  @ApiProperty({
    description: 'IP remoto',
    example: '127.0.0.1',
    required: true,
  })
  @IsString()
  remoteIp?: string;

  @ApiProperty({
    description: 'Referência externa',
    example: '1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  externalReference?: string;

  @ApiProperty({
    description: 'Informações do cartão de crédito',
    type: CreditCardDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreditCardDto)
  creditCard?: CreditCardDto;

  @ApiProperty({
    description: 'Informações do titular do cartão de crédito',
    type: CreditCardHolderInfoDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreditCardHolderInfoDto)
  creditCardHolderInfo?: CreditCardHolderInfoDto;
}

export class AsaasSubscriptionResponse {}
