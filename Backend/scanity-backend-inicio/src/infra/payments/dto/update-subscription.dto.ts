import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsString,
  IsOptional,
  ValidateNested,
  IsBoolean,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CreditCardDto,
  CreditCardHolderInfoDto,
} from './create-credit-card.dto';

export class DiscountDto {
  @ApiProperty({
    description: 'Valor do desconto',
    example: 10.0,
    required: true,
  })
  @IsNumber()
  value: number;

  @ApiProperty({
    description:
      'Dias antes do vencimento para aplicar desconto (opcional - default 0)',
    example: 3,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  dueDateLimitDays?: number;

  @ApiProperty({
    description: 'Tipo do desconto (FIXED ou PERCENTAGE)',
    example: 'PERCENTAGE',
    required: false,
  })
  @IsOptional()
  @IsEnum(['FIXED', 'PERCENTAGE'])
  type?: 'FIXED' | 'PERCENTAGE';
}

export class InterestDto {
  @ApiProperty({
    description: 'Percentual de juros ao mês sobre o valor da cobrança',
    example: 2.0,
    required: true,
  })
  @IsNumber()
  value: number;
}

export class FineDto {
  @ApiProperty({
    description: 'Valor da multa',
    example: 5.0,
    required: true,
  })
  @IsNumber()
  value: number;

  @ApiProperty({
    description: 'Tipo da multa (FIXED ou PERCENTAGE)',
    example: 'PERCENTAGE',
    required: false,
  })
  @IsOptional()
  @IsEnum(['FIXED', 'PERCENTAGE'])
  type?: 'FIXED' | 'PERCENTAGE';
}

export class UpdateSubscriptionDto {
  @ApiProperty({
    description: 'Tipo de pagamento (CREDIT_CARD, BOLETO, PIX)',
    example: 'CREDIT_CARD',
    required: false,
  })
  @IsOptional()
  @IsEnum(['CREDIT_CARD', 'BOLETO', 'PIX'])
  billingType?: 'CREDIT_CARD' | 'BOLETO' | 'PIX';

  @ApiProperty({
    description: 'Valor da assinatura',
    example: 150.0,
    required: false,
  })
  @IsOptional()
  @Min(1, { message: 'O valor não pode ser menor que 1' })
  @IsNumber()
  value?: number;

  @ApiProperty({
    description:
      'Data de vencimento da próxima cobrança A SER GERADA (não afeta cobranças já existentes)',
    example: '2025-02-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  nextDueDate?: string;

  @ApiProperty({
    description: 'Configuração de desconto',
    type: DiscountDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DiscountDto)
  discount?: DiscountDto;

  @ApiProperty({
    description: 'Configuração de juros por atraso',
    type: InterestDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => InterestDto)
  interest?: InterestDto;

  @ApiProperty({
    description: 'Configuração de multa por atraso',
    type: FineDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FineDto)
  fine?: FineDto;

  @ApiProperty({
    description: 'Ciclo da assinatura (MONTHLY, WEEKLY, BIWEEKLY, YEARLY)',
    example: 'MONTHLY',
    required: false,
  })
  @IsOptional()
  @IsEnum(['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'YEARLY'])
  cycle?: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'YEARLY';

  @ApiProperty({
    description: 'Descrição da assinatura',
    example: 'Assinatura Premium - Upgrade',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description:
      'Se true, atualiza as cobranças pendentes com o novo valor e/ou forma de pagamento',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  updatePendingPayments?: boolean;

  @ApiProperty({
    description: 'Referência externa',
    example: 'subscription-uuid-123',
    required: false,
  })
  @IsOptional()
  @IsString()
  externalReference?: string;

  @ApiProperty({
    description:
      'Status da assinatura (ACTIVE para ativar, INACTIVE para suspender)',
    example: 'ACTIVE',
    required: false,
  })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE'])
  status?: 'ACTIVE' | 'INACTIVE';

  @ApiProperty({
    description: 'Informações do cartão de crédito (para atualizar cartão)',
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

  @ApiProperty({
    description: 'IP remoto (obrigatório ao atualizar cartão de crédito)',
    example: '127.0.0.1',
    required: false,
  })
  @IsOptional()
  @IsString()
  remoteIp?: string;

  @ApiProperty({
    description: 'URL de callback para notificações',
    example: 'https://example.com/webhook',
    required: false,
  })
  @IsOptional()
  @IsString()
  callback?: string;
}
