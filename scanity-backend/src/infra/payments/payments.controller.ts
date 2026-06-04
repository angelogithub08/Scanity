import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { AsaasService } from './asaas/asaas.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CreateCreditCardDto } from './dto/create-credit-card.dto';
import { CreateChargeDto } from './dto/create-charge.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  getApiBodyOptions,
  getApiResponseOptions,
} from '../../utils/swagger.util';

@ApiTags('Payments')
@ApiBearerAuth('defaultBearerAuth')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly asaasService: AsaasService) {}

  @Post('customers')
  @ApiOperation({ summary: 'Criar um novo cliente no Asaas' })
  @ApiBody(
    getApiBodyOptions(CreateCustomerDto, 'Dados para criação do cliente'),
  )
  @ApiResponse(
    getApiResponseOptions(201, CreateCustomerDto, 'Cliente criado com sucesso'),
  )
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  createCustomer(@Body() createCustomerDto: CreateCustomerDto) {
    return this.asaasService.createCustomer(createCustomerDto);
  }

  @Post('credit-cards')
  @ApiOperation({ summary: 'Tokenizar um cartão de crédito no Asaas' })
  @ApiBody(
    getApiBodyOptions(
      CreateCreditCardDto,
      'Dados para tokenização do cartão de crédito',
    ),
  )
  @ApiResponse(
    getApiResponseOptions(
      201,
      CreateCreditCardDto,
      'Cartão tokenizado com sucesso',
    ),
  )
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  createCreditCard(@Body() createCreditCardDto: CreateCreditCardDto) {
    return this.asaasService.createCreditCard(createCreditCardDto);
  }

  @Post('charges')
  @ApiOperation({ summary: 'Criar uma nova cobrança no Asaas' })
  @ApiBody(getApiBodyOptions(CreateChargeDto, 'Dados para criação da cobrança'))
  @ApiResponse(
    getApiResponseOptions(201, CreateChargeDto, 'Cobrança criada com sucesso'),
  )
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  createCharge(@Body() createChargeDto: CreateChargeDto) {
    return this.asaasService.createCharge(createChargeDto);
  }

  @Get('charges/:id')
  @ApiOperation({ summary: 'Recuperar uma cobrança do Asaas pelo ID' })
  @ApiParam({ name: 'id', description: 'ID da cobrança no Asaas' })
  @ApiResponse({
    status: 200,
    description: 'Cobrança recuperada com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Cobrança não encontrada.' })
  @ApiResponse({ status: 400, description: 'ID inválido.' })
  getCharge(@Param('id') chargeId: string) {
    return this.asaasService.getCharge(chargeId);
  }
}
