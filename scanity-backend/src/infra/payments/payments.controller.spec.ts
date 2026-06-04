import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { AsaasService } from './asaas/asaas.service';
import { BillingType } from './dto/create-charge.dto';

describe('PaymentsController', () => {
  let controller: PaymentsController;

  const asaasServiceMock = {
    createCustomer: jest.fn().mockResolvedValue({ id: 'cus_123456789' }),
    createCreditCard: jest.fn().mockResolvedValue({ id: 'card_123456789' }),
    createCharge: jest.fn().mockResolvedValue({ id: 'pay_123456789' }),
    getCharge: jest.fn().mockResolvedValue({
      id: 'pay_123456789',
      status: 'PENDING',
      value: 100.0,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: AsaasService,
          useValue: asaasServiceMock,
        },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createCustomer', () => {
    it('should create a customer', async () => {
      const createCustomerDto = {
        name: 'João Silva',
        cpfCnpj: '12345678901',
        email: 'joao@test.com',
      };

      const result = await controller.createCustomer(createCustomerDto);

      expect(asaasServiceMock.createCustomer).toHaveBeenCalledWith(
        createCustomerDto,
      );
      expect(result).toEqual({ id: 'cus_123456789' });
    });
  });

  describe('createCreditCard', () => {
    it('should create a credit card token', async () => {
      const createCreditCardDto = {
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

      const result = await controller.createCreditCard(createCreditCardDto);

      expect(asaasServiceMock.createCreditCard).toHaveBeenCalledWith(
        createCreditCardDto,
      );
      expect(result).toEqual({ id: 'card_123456789' });
    });
  });

  describe('createCharge', () => {
    it('should create a charge', async () => {
      const createChargeDto = {
        customer: 'cus_123456789',
        billingType: BillingType.CREDIT_CARD,
        value: 100.0,
        dueDate: '2024-12-31',
      };

      const result = await controller.createCharge(createChargeDto);

      expect(asaasServiceMock.createCharge).toHaveBeenCalledWith(
        createChargeDto,
      );
      expect(result).toEqual({ id: 'pay_123456789' });
    });
  });

  describe('getCharge', () => {
    it('should get a charge by id', async () => {
      const chargeId = 'pay_123456789';

      const result = await controller.getCharge(chargeId);

      expect(asaasServiceMock.getCharge).toHaveBeenCalledWith(chargeId);
      expect(result).toEqual({
        id: 'pay_123456789',
        status: 'PENDING',
        value: 100.0,
      });
    });
  });
});
