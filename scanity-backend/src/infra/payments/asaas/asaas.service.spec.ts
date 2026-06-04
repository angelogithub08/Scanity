/* eslint-disable @typescript-eslint/unbound-method */
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { AsaasService } from './asaas.service';

let mockAxiosClient: {
  post: jest.Mock;
  get: jest.Mock;
  put: jest.Mock;
  delete: jest.Mock;
};

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
  },
}));

jest.mock('lodash', () => ({
  first: jest.fn().mockImplementation((arr: unknown[]) => arr?.[0]),
}));

const mockConfigService = {
  get: jest.fn((key: string, defaultValue?: unknown) => {
    const config: Record<string, unknown> = {
      ASAAS_API_KEY: 'mock-asaas-api-key',
      ASAAS_URL: 'https://sandbox.asaas.com/api/v3',
      ASAAS_APP_NAME: 'Scanity',
    };
    return config[key] ?? defaultValue;
  }),
};

describe('AsaasService', () => {
  let service: AsaasService;

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(async () => {
    mockAxiosClient = {
      post: jest.fn().mockResolvedValue({ data: {} }),
      get: jest.fn().mockResolvedValue({ data: {} }),
      put: jest.fn().mockResolvedValue({ data: {} }),
      delete: jest.fn().mockResolvedValue({ data: {} }),
    };
    (axios.create as jest.Mock).mockReturnValue(mockAxiosClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AsaasService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AsaasService>(AsaasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCustomer', () => {
    it('should create a customer and return response data', async () => {
      const customerData = { name: 'John', cpfCnpj: '12345678901' };
      const expectedResponse = { id: 'cus_mock', name: 'John' };
      mockAxiosClient.post.mockResolvedValue({ data: expectedResponse });

      const result = await service.createCustomer(customerData as any);

      expect(result).toEqual(expectedResponse);
      expect(mockAxiosClient.post).toHaveBeenCalledWith('/v3/customers', customerData);
    });
  });

  describe('createCreditCard', () => {
    it('should create a credit card and return response data', async () => {
      const creditCardData = { customer: 'cus_mock', creditCard: { holderName: 'John' } };
      const expectedResponse = { id: 'card_mock', creditCardNumber: '1234' };
      mockAxiosClient.post.mockResolvedValue({ data: expectedResponse });

      const result = await service.createCreditCard(creditCardData as any);

      expect(result).toEqual(expectedResponse);
      expect(mockAxiosClient.post).toHaveBeenCalledWith(
        '/v3/creditCard/tokenizeCreditCard',
        creditCardData,
      );
    });
  });

  describe('createCharge', () => {
    it('should create a charge and return response data', async () => {
      const chargeData = { customer: 'cus_mock', value: 100, billingType: 'BOLETO' };
      const expectedResponse = { id: 'pay_mock', status: 'PENDING' };
      mockAxiosClient.post.mockResolvedValue({ data: expectedResponse });

      const result = await service.createCharge(chargeData as any);

      expect(result).toEqual(expectedResponse);
      expect(mockAxiosClient.post).toHaveBeenCalledWith('/v3/payments', chargeData);
    });
  });

  describe('createSubscription', () => {
    it('should create a subscription and return response data', async () => {
      const subscriptionData = { customer: 'cus_mock', value: 50, billingType: 'CREDIT_CARD' };
      const expectedResponse = { id: 'sub_mock', status: 'ACTIVE' };
      mockAxiosClient.post.mockResolvedValue({ data: expectedResponse });

      const result = await service.createSubscription(subscriptionData as any);

      expect(result).toEqual(expectedResponse);
      expect(mockAxiosClient.post).toHaveBeenCalledWith('/v3/subscriptions', subscriptionData);
    });
  });

  describe('updateSubscription', () => {
    it('should update a subscription and return response data', async () => {
      const subscriptionId = 'sub_mock';
      const updateData = { value: 75 };
      const expectedResponse = { id: 'sub_mock', value: 75, status: 'ACTIVE' };
      mockAxiosClient.put.mockResolvedValue({ data: expectedResponse });

      const result = await service.updateSubscription(subscriptionId, updateData as any);

      expect(result).toEqual(expectedResponse);
      expect(mockAxiosClient.put).toHaveBeenCalledWith(
        `/v3/subscriptions/${subscriptionId}`,
        updateData,
      );
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel a subscription and return response data', async () => {
      const subscriptionId = 'sub_mock';
      const expectedResponse = { id: 'sub_mock', status: 'CANCELED' };
      mockAxiosClient.delete.mockResolvedValue({ data: expectedResponse });

      const result = await service.cancelSubscription(subscriptionId);

      expect(result).toEqual(expectedResponse);
      expect(mockAxiosClient.delete).toHaveBeenCalledWith(
        `/v3/subscriptions/${subscriptionId}`,
      );
    });
  });

  describe('getCharge', () => {
    it('should retrieve a charge by id and return response data', async () => {
      const chargeId = 'pay_mock';
      const expectedResponse = { id: 'pay_mock', status: 'CONFIRMED' };
      mockAxiosClient.get.mockResolvedValue({ data: expectedResponse });

      const result = await service.getCharge(chargeId);

      expect(result).toEqual(expectedResponse);
      expect(mockAxiosClient.get).toHaveBeenCalledWith(`/v3/payments/${chargeId}`);
    });
  });

  describe('getPixQrCode', () => {
    it('should retrieve PIX QR code for a charge', async () => {
      const chargeId = 'pay_mock';
      const expectedResponse = {
        encodedImage: 'base64-image',
        payload: 'pix-payload',
        expirationDate: '2025-01-01',
      };
      mockAxiosClient.get.mockResolvedValue({ data: expectedResponse });

      const result = await service.getPixQrCode(chargeId);

      expect(result).toEqual(expectedResponse);
      expect(mockAxiosClient.get).toHaveBeenCalledWith(`/v3/payments/${chargeId}/pixQrCode`);
    });
  });

  describe('listPayments', () => {
    it('should list payments with optional params', async () => {
      const params = { limit: 10, offset: 0 };
      const expectedResponse = {
        object: 'list',
        hasMore: false,
        totalCount: 1,
        data: [{ id: 'pay_mock' }],
      };
      mockAxiosClient.get.mockResolvedValue({ data: expectedResponse });

      const result = await service.listPayments(params);

      expect(result).toEqual(expectedResponse);
      expect(mockAxiosClient.get).toHaveBeenCalledWith('/v3/payments', { params });
    });

    it('should list payments without params', async () => {
      const expectedResponse = { object: 'list', hasMore: false, totalCount: 0, data: [] };
      mockAxiosClient.get.mockResolvedValue({ data: expectedResponse });

      const result = await service.listPayments();

      expect(result).toEqual(expectedResponse);
      expect(mockAxiosClient.get).toHaveBeenCalledWith('/v3/payments', { params: undefined });
    });
  });

  describe('error handling', () => {
    it('should throw BadRequestException when API returns structured error', async () => {
      const apiError = {
        response: {
          data: {
            errors: [{ description: 'Customer already exists' }],
          },
        },
      };
      mockAxiosClient.post.mockRejectedValue(apiError);

      await expect(
        service.createCustomer({ name: 'John' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException with first error description', async () => {
      const apiError = {
        response: {
          data: {
            errors: [
              { description: 'First error' },
              { description: 'Second error' },
            ],
          },
        },
      };
      mockAxiosClient.post.mockRejectedValue(apiError);

      await expect(
        service.createCustomer({ name: 'John' } as any),
      ).rejects.toThrow(new BadRequestException('First error'));
    });

    it('should re-throw error when no structured error data exists', async () => {
      const genericError = new Error('Network failure');
      mockAxiosClient.post.mockRejectedValue(genericError);

      await expect(
        service.createCustomer({ name: 'John' } as any),
      ).rejects.toThrow('Network failure');
    });
  });
});
