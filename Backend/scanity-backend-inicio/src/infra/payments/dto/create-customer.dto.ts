import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsEmail } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({
    description: 'Nome do cliente',
    example: 'João Silva',
    required: true,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'CPF ou CNPJ do cliente',
    example: '24971563792',
    required: true,
  })
  @IsString()
  cpfCnpj: string;

  @ApiProperty({
    description: 'Email do cliente',
    example: 'joao.silva@email.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Telefone fixo',
    example: '4738010919',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'Telefone celular',
    example: '47999376637',
    required: false,
  })
  @IsOptional()
  @IsString()
  mobilePhone?: string;

  @ApiProperty({
    description: 'Logradouro',
    example: 'Av. Paulista',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: 'Número do endereço',
    example: '150',
    required: false,
  })
  @IsOptional()
  @IsString()
  addressNumber?: string;

  @ApiProperty({
    description: 'Complemento do endereço (máx. 255 caracteres)',
    example: 'Sala 201',
    required: false,
  })
  @IsOptional()
  @IsString()
  complement?: string;

  @ApiProperty({
    description: 'Bairro',
    example: 'Centro',
    required: false,
  })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiProperty({
    description: 'CEP do endereço',
    example: '01310-000',
    required: false,
  })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiProperty({
    description: 'Identificador do cliente no seu sistema',
    example: '12987382',
    required: false,
  })
  @IsOptional()
  @IsString()
  externalReference?: string;

  @ApiProperty({
    description: 'Desabilitar o envio de notificações de cobrança',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  notificationDisabled?: boolean;

  @ApiProperty({
    description:
      'Emails adicionais para envio de notificações de cobrança separados por ";"',
    example: 'joao.silva@email.com;contato@empresa.com',
    required: false,
  })
  @IsOptional()
  @IsString()
  additionalEmails?: string;

  @ApiProperty({
    description: 'Inscrição municipal do cliente',
    example: '46683695908',
    required: false,
  })
  @IsOptional()
  @IsString()
  municipalInscription?: string;

  @ApiProperty({
    description: 'Inscrição estadual do cliente',
    example: '646681195275',
    required: false,
  })
  @IsOptional()
  @IsString()
  stateInscription?: string;

  @ApiProperty({
    description: 'Observações adicionais',
    example: 'Cliente preferencial, pagador em dia',
    required: false,
  })
  @IsOptional()
  @IsString()
  observations?: string;

  @ApiProperty({
    description: 'Nome do grupo ao qual o cliente pertence',
    example: 'Grupo Empresarial ABC',
    required: false,
  })
  @IsOptional()
  @IsString()
  groupName?: string;

  @ApiProperty({
    description: 'Nome da empresa',
    example: 'Empresa LTDA',
    required: false,
  })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiProperty({
    description: 'Informe true caso seja pagador estrangeiro',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  foreignCustomer?: boolean;
}
