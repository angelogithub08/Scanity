import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsDateString,
  IsArray,
  ValidateNested,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum BillingType {
  UNDEFINED = 'UNDEFINED',
  BOLETO = 'BOLETO',
  CREDIT_CARD = 'CREDIT_CARD',
  PIX = 'PIX',
}

export class DiscountDto {
  @ApiProperty({
    description: 'Valor do desconto',
    example: 10.0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  value?: number;

  @ApiProperty({
    description: 'Limite de dias para aplicação do desconto',
    example: 5,
    required: false,
  })
  @IsOptional()
  @IsInt()
  dueDateLimitDays?: number;

  @ApiProperty({
    description: 'Tipo do desconto',
    example: 'FIXED',
    required: false,
  })
  @IsOptional()
  @IsString()
  type?: string;
}

export class InterestDto {
  @ApiProperty({
    description: 'Valor dos juros',
    example: 2.0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  value?: number;

  @ApiProperty({
    description: 'Tipo dos juros',
    example: 'PERCENTAGE',
    required: false,
  })
  @IsOptional()
  @IsString()
  type?: string;
}

export class FineDto {
  @ApiProperty({
    description: 'Valor da multa',
    example: 5.0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  value?: number;

  @ApiProperty({
    description: 'Tipo da multa',
    example: 'FIXED',
    required: false,
  })
  @IsOptional()
  @IsString()
  type?: string;
}

export class SplitDto {
  @ApiProperty({
    description: 'ID da conta que receberá o split',
    example: 'acc_123456789',
    required: true,
  })
  @IsString()
  walletId: string;

  @ApiProperty({
    description: 'Valor fixo do split',
    example: 50.0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  fixedValue?: number;

  @ApiProperty({
    description: 'Percentual do split',
    example: 25.5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  percentualValue?: number;
}

export class CallbackDto {
  @ApiProperty({
    description: 'URL de sucesso do callback',
    example: 'https://www.asaas.com/success',
    required: false,
  })
  @IsOptional()
  @IsString()
  successUrl?: string;

  @ApiProperty({
    description: 'URL de falha do callback',
    example: 'https://www.asaas.com/error',
    required: false,
  })
  @IsOptional()
  @IsString()
  autoRedirect?: string;
}

export class CreateChargeDto {
  @ApiProperty({
    description: 'Identificador único do cliente no Asaas',
    example: 'cus_G7Dvo4IphtUl',
    required: true,
  })
  @IsString()
  customer: string;

  @ApiProperty({
    description: 'Forma de pagamento',
    enum: BillingType,
    example: BillingType.CREDIT_CARD,
    required: true,
  })
  @IsEnum(BillingType)
  billingType: BillingType;

  @ApiProperty({
    description: 'Valor da cobrança',
    example: 129.9,
    required: true,
  })
  @IsNumber()
  value: number;

  @ApiProperty({
    description: 'Data de vencimento da cobrança',
    example: '2017-06-10',
    required: true,
  })
  @IsDateString()
  dueDate: string;

  @ApiProperty({
    description: 'Descrição da cobrança (máx. 500 caracteres)',
    example: 'Pedido 056984',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description:
      'Dias após o vencimento para cancelamento do registro (apenas para boleto)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  daysAfterDueDateToRegistrationCancellation?: number;

  @ApiProperty({
    description: 'Referência externa livre',
    example: '056984',
    required: false,
  })
  @IsOptional()
  @IsString()
  externalReference?: string;

  @ApiProperty({
    description: 'Número de parcelas (apenas para parcelamento)',
    example: 3,
    required: false,
  })
  @IsOptional()
  @IsInt()
  installmentCount?: number;

  @ApiProperty({
    description:
      'Valor total da cobrança que será paga em parcelas (apenas para parcelamento)',
    example: 389.7,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  totalValue?: number;

  @ApiProperty({
    description:
      'Valor de cada parcela (apenas para parcelamento). Envie este campo se quiser definir o valor de cada parcela.',
    example: 129.9,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  installmentValue?: number;

  @ApiProperty({
    description: 'Informações de desconto',
    type: DiscountDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DiscountDto)
  discount?: DiscountDto;

  @ApiProperty({
    description: 'Informações de juros para pagamento após o vencimento',
    type: InterestDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => InterestDto)
  interest?: InterestDto;

  @ApiProperty({
    description: 'Informações de multa para pagamento após o vencimento',
    type: FineDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FineDto)
  fine?: FineDto;

  @ApiProperty({
    description: 'Define se a cobrança será enviada via correios',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  postalService?: boolean;

  @ApiProperty({
    description: 'Configurações de split',
    type: [SplitDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SplitDto)
  split?: SplitDto[];

  @ApiProperty({
    description: 'Informações de redirecionamento automático após o pagamento',
    type: CallbackDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CallbackDto)
  callback?: CallbackDto;

  @ApiProperty({
    description: 'Token do cartão de crédito',
    example: 'tok_1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  creditCardToken?: string;

  @ApiProperty({
    description: 'IP de onde o cliente está fazendo a compra',
    example: '192.168.1.1',
    required: false,
  })
  @IsOptional()
  @IsString()
  remoteIp?: string;
}
