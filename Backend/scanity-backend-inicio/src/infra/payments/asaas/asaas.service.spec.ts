/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AsaasService } from './asaas.service';
import {
  AsaasChargeResponse,
  AsaasCreditCardResponse,
  AsaasCustomerResponse,
} from './interfaces/asaas-responses.interface';

describe('AsaasService', () => {
  let service: AsaasService;

  const configServiceMock = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const config: Record<string, string> = {
        ASAAS_URL: 'https://api-sandbox.asaas.com',
        ASAAS_APP_NAME: 'partilhar-test',
        ASAAS_API_KEY: 'test-api-key',
      };
      return config[key] || defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AsaasService,
          useValue: {
            createCustomer: jest.fn(),
            createCreditCard: jest.fn(),
            createCharge: jest.fn(),
            getCharge: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    service = module.get<AsaasService>(AsaasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCustomer', () => {
    it('should create a customer successfully', async () => {
      const mockCustomerDto = {
        name: 'João Silva',
        cpfCnpj: '12345678901',
        email: 'joao@test.com',
      };

      const mockResponse = {
        id: 'cus_123456789',
        name: 'João Silva',
        cpfCnpj: '12345678901',
      } as AsaasCustomerResponse;

      jest.spyOn(service, 'createCustomer').mockResolvedValue(mockResponse);

      const result = await service.createCustomer(mockCustomerDto);

      expect(service.createCustomer).toHaveBeenCalledWith(mockCustomerDto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('createCreditCard', () => {
    it('should create a credit card token successfully', async () => {
      const mockCreditCardDto = {
        customer: 'cus_123456789',
        creditCard: {
          holderName: 'João Silva',
          number: '1234567890123456',
          expiryMonth: '12',
          expiryYear: '2025',
          ccv: '123',
        },
        creditCardHolderInfo: {
          name: 'João Silva',
          email: 'joao@test.com',
          cpfCnpj: '12345678901',
          postalCode: '12345678',
          addressNumber: '123',
          phone: '11987654321',
        },
        remoteIp: '192.168.1.1',
      };

      const mockResponse = {
        id: 'card_123456789',
        creditCardNumber: '1234',
        creditCardBrand: 'VISA',
      } as AsaasCreditCardResponse;

      jest.spyOn(service, 'createCreditCard').mockResolvedValue(mockResponse);

      const result = await service.createCreditCard(mockCreditCardDto);

      expect(service.createCreditCard).toHaveBeenCalledWith(mockCreditCardDto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('createCharge', () => {
    it('should create a charge successfully', async () => {
      const mockChargeDto = {
        customer: 'cus_123456789',
        billingType: 'CREDIT_CARD' as any,
        value: 100.0,
        dueDate: '2024-12-31',
      };

      const mockResponse = {
        id: 'pay_123456789',
        status: 'PENDING',
        value: 100.0,
        billingType: 'CREDIT_CARD',
      } as AsaasChargeResponse;

      jest.spyOn(service, 'createCharge').mockResolvedValue(mockResponse);

      const result = await service.createCharge(mockChargeDto);

      expect(service.createCharge).toHaveBeenCalledWith(mockChargeDto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getCharge', () => {
    it('should get a charge successfully', async () => {
      const chargeId = 'pay_123456789';
      const mockResponse = {
        id: 'pay_123456789',
        status: 'PENDING',
        value: 100.0,
        billingType: 'CREDIT_CARD',
      } as AsaasChargeResponse;

      jest.spyOn(service, 'getCharge').mockResolvedValue(mockResponse);

      const result = await service.getCharge(chargeId);

      expect(service.getCharge).toHaveBeenCalledWith(chargeId);
      expect(result).toEqual(mockResponse);
    });
  });
});
