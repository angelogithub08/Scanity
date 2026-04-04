import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';

export class TaxesDto {
  @ApiProperty({
    description: 'Tomador da nota fiscal deve reter ISS ou não',
    example: true,
    required: true,
  })
  @IsNotEmpty()
  @IsBoolean()
  retainIss: boolean;

  @ApiProperty({
    description: 'Alíquota COFINS',
    example: 1,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  cofins: number;

  @ApiProperty({
    description: 'Alíquota CSLL',
    example: 1,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  csll: number;

  @ApiProperty({
    description: 'Alíquota INSS',
    example: 1,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  inss: number;

  @ApiProperty({
    description: 'Alíquota IR',
    example: 1,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  ir: number;

  @ApiProperty({
    description: 'Alíquota PIS',
    example: 1,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  pis: number;

  @ApiProperty({
    description: 'Alíquota ISS',
    example: 1,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  iss: number;
}

export class RequestInvoiceDto {
  @ApiProperty({
    description: 'Identificador único da cobrança no Asaas',
    example: 'pay_63795911019',
    required: false,
  })
  @IsOptional()
  @IsString()
  payment?: string;

  @ApiProperty({
    description: 'Identificador único do parcelamento no Asaas',
    example: 'inst_123456',
    required: false,
  })
  @IsOptional()
  @IsString()
  installment?: string;

  @ApiProperty({
    description: 'Identificador único do cliente no Asaas',
    example: 'cus_000000002750',
    required: false,
  })
  @IsOptional()
  @IsString()
  customer?: string;

  @ApiProperty({
    description: 'Descrição dos serviços da nota fiscal',
    example: 'Desenvolvimento de software',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  serviceDescription: string;

  @ApiProperty({
    description: 'Observações adicionais',
    example: 'Mensal referente a agosto/2024',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  observations: string;

  @ApiProperty({
    description: 'Identificador da nota fiscal no seu sistema',
    example: 'NF-001-2024',
    required: false,
  })
  @IsOptional()
  @IsString()
  externalReference?: string;

  @ApiProperty({
    description: 'Valor total',
    example: 300,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  value: number;

  @ApiProperty({
    description:
      'Deduções. As deduções não alteram o valor total da nota fiscal, mas alteram a base de cálculo do ISS',
    example: 10,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  deductions: number;

  @ApiProperty({
    description: 'Data de emissão da nota fiscal',
    example: '2024-08-20',
    required: true,
  })
  @IsNotEmpty()
  @IsDateString()
  effectiveDate: string;

  @ApiProperty({
    description: 'Identificador único do serviço municipal',
    example: 'svc_123456',
    required: false,
  })
  @IsOptional()
  @IsString()
  municipalServiceId?: string;

  @ApiProperty({
    description: 'Código de serviço municipal',
    example: '1.01',
    required: false,
  })
  @IsOptional()
  @IsString()
  municipalServiceCode?: string;

  @ApiProperty({
    description:
      'Nome do serviço municipal. Se não for informado, será utilizado o atributo municipalServiceCode como nome para identificação.',
    example: 'Análise e desenvolvimento de sistemas',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  municipalServiceName: string;

  @ApiProperty({
    description:
      'Atualizar o valor da cobrança com os impostos da nota já descontados.',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  updatePayment?: boolean;

  @ApiProperty({
    description: 'Impostos da nota fiscal',
    type: TaxesDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TaxesDto)
  taxes: TaxesDto;
}
