import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { CreateCreditCardDto } from '../dto/create-credit-card.dto';
import { CreateChargeDto } from '../dto/create-charge.dto';
import {
  AsaasCustomerResponse,
  AsaasChargeResponse,
  AsaasCreditCardResponse,
  AsaasRequestInvoiceResponse,
  AsaasCustomerFiscalInfoResponse,
  AsaasMunicipalServicesResponse,
  AsaasPixQrCodeResponse,
  AsaasStatusChargeResponse,
  AsaasPaymentsResponse,
} from './interfaces/asaas-responses.interface';
import {
  AsaasSubscriptionResponse,
  CreateSubscriptionDto,
} from '../dto/create-subscription.dto';
import { UpdateSubscriptionDto } from '../dto/update-subscription.dto';
import { RequestInvoiceDto } from '../dto/request-invoice.dto';
import { first } from 'lodash';

@Injectable()
export class AsaasService {
  private readonly logger = new Logger(AsaasService.name);
  private readonly asaasClient: ReturnType<typeof axios.create>;
  private readonly axiosConfig = {};

  constructor(private readonly configService: ConfigService) {
    const asaasToken = this.configService.get<string>(
      'ASAAS_API_KEY',
      'aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlN....',
    );
    this.logger.log(`ASAAS_API_KEY: ${asaasToken}`);

    Object.assign(this.axiosConfig, {
      baseURL: this.configService.get<string>(
        'ASAAS_URL',
        'https://api-sandbox.asaas.com',
      ),
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': this.configService.get<string>(
          'ASAAS_APP_NAME',
          'scanity',
        ),
        access_token: '$' + `${asaasToken}`,
      },
    });

    this.asaasClient = axios.create(this.axiosConfig);
  }

  /**
   * Método privado para tratar erros da API Asaas de forma padronizada
   * Extrai a mensagem de erro da resposta e lança uma BadRequestException
   */
  private handleAsaasError(error: any, context: string): never {
    console.log('config', JSON.stringify(this.axiosConfig));
    console.log(JSON.stringify(error?.response?.data));

    const errors = error.response?.data?.errors;
    const messages = errors?.map((error: any) => error?.description) as
      | string[]
      | undefined;
    const firstMessage = first(messages);

    if (firstMessage) {
      this.logger.error(`${context}: ${firstMessage}`);
      throw new BadRequestException(firstMessage);
    }

    this.logger.error(
      `${context}: ${(error as Error).message}`,
      error instanceof Error ? error.stack : undefined,
    );
    throw error;
  }

  async createCustomer(
    customer: CreateCustomerDto,
  ): Promise<AsaasCustomerResponse> {
    try {
      const response = await this.asaasClient.post<AsaasCustomerResponse>(
        '/v3/customers',
        customer,
      );
      return response.data;
    } catch (error) {
      this.handleAsaasError(error, 'Erro ao criar customer');
    }
  }

  async createCreditCard(
    creditCard: CreateCreditCardDto,
  ): Promise<AsaasCreditCardResponse> {
    try {
      const response = await this.asaasClient.post<AsaasCreditCardResponse>(
        '/v3/creditCard/tokenizeCreditCard',
        creditCard,
      );
      return response.data;
    } catch (error) {
      this.handleAsaasError(error, 'Erro ao criar credit card');
    }
  }

  async createCharge(charge: CreateChargeDto): Promise<AsaasChargeResponse> {
    try {
      const response = await this.asaasClient.post<AsaasChargeResponse>(
        '/v3/payments',
        charge,
      );
      return response.data;
    } catch (error) {
      this.handleAsaasError(error, 'Erro ao criar charge');
    }
  }

  async createSubscription(
    subscription: CreateSubscriptionDto,
  ): Promise<AsaasSubscriptionResponse> {
    try {
      const response = await this.asaasClient.post<AsaasSubscriptionResponse>(
        '/v3/subscriptions',
        subscription,
      );
      return response.data;
    } catch (error) {
      this.handleAsaasError(error, 'Erro ao criar subscription');
    }
  }

  async updateSubscription(
    subscriptionId: string,
    subscription: UpdateSubscriptionDto,
  ): Promise<AsaasSubscriptionResponse> {
    try {
      const response = await this.asaasClient.put<AsaasSubscriptionResponse>(
        `/v3/subscriptions/${subscriptionId}`,
        subscription,
      );
      return response.data;
    } catch (error) {
      this.handleAsaasError(error, 'Erro ao atualizar subscription');
    }
  }

  async cancelSubscription(
    subscriptionId: string,
  ): Promise<AsaasSubscriptionResponse> {
    try {
      const response = await this.asaasClient.delete<AsaasSubscriptionResponse>(
        `/v3/subscriptions/${subscriptionId}`,
      );
      return response.data;
    } catch (error) {
      this.handleAsaasError(error, 'Erro ao cancelar subscription');
    }
  }

  async getCharge(chargeId: string): Promise<AsaasChargeResponse> {
    try {
      const response = await this.asaasClient.get<AsaasChargeResponse>(
        `/v3/payments/${chargeId}`,
      );
      return response.data;
    } catch (error) {
      this.handleAsaasError(error, 'Erro ao buscar charge');
    }
  }

  async getStatusCharge(
    gatewayChargeId: string,
  ): Promise<AsaasStatusChargeResponse> {
    try {
      const response = await this.asaasClient.get<AsaasStatusChargeResponse>(
        `/v3/payments/${gatewayChargeId}/status`,
      );
      return response.data;
    } catch (error) {
      this.handleAsaasError(error, 'Erro ao buscar status da charge');
    }
  }

  async getFiscalInfo(): Promise<AsaasCustomerFiscalInfoResponse> {
    try {
      const response =
        await this.asaasClient.get<AsaasCustomerFiscalInfoResponse>(
          '/v3/fiscalInfo',
        );
      return response.data;
    } catch (error) {
      this.handleAsaasError(error, 'Erro ao buscar informações fiscais');
    }
  }

  async getMunicipalServices(
    description?: string,
  ): Promise<AsaasMunicipalServicesResponse> {
    try {
      const response =
        await this.asaasClient.get<AsaasMunicipalServicesResponse>(
          '/v3/fiscalInfo/services',
          { params: { description } },
        );
      return response.data;
    } catch (error) {
      this.handleAsaasError(error, 'Erro ao buscar serviços municipais');
    }
  }

  async requestInvoice(
    requestInvoiceDto: RequestInvoiceDto,
  ): Promise<AsaasRequestInvoiceResponse> {
    try {
      const response = await this.asaasClient.post<AsaasRequestInvoiceResponse>(
        `/v3/invoices`,
        requestInvoiceDto,
      );
      return response.data;
    } catch (error) {
      this.handleAsaasError(error, 'Erro ao solicitar Nota Fiscal');
    }
  }

  async getPixQrCode(gatewayChargeId: string): Promise<AsaasPixQrCodeResponse> {
    try {
      const response = await this.asaasClient.get<AsaasPixQrCodeResponse>(
        `/v3/payments/${gatewayChargeId}/pixQrCode`,
      );
      return response.data;
    } catch (error) {
      this.handleAsaasError(error, 'Erro ao buscar pix qr code');
    }
  }

  async listPayments(params?: any): Promise<AsaasPaymentsResponse> {
    try {
      const response = await this.asaasClient.get<AsaasPaymentsResponse>(
        `/v3/payments`,
        { params },
      );
      return response.data;
    } catch (error) {
      this.handleAsaasError(error, 'Erro ao buscar payments');
    }
  }
}
