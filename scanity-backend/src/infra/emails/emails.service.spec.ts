const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'mock-id' });

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({ sendMail: mockSendMail }),
}));

jest.mock('handlebars', () => ({
  compile: jest
    .fn()
    .mockReturnValue(jest.fn().mockReturnValue('<html>compiled</html>')),
}));

const mockExistsSync = jest.fn().mockReturnValue(true);
const mockReadFileSync = jest.fn().mockReturnValue('template-content');

jest.mock('fs', () => ({
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync,
}));

import { EmailsService } from './emails.service';
import {
  PaymentSuccessTemplateData,
  PaymentFailureTemplateData,
  SubscriptionCreatedTemplateData,
} from './interfaces/email-template.interface';

describe('EmailsService', () => {
  let service: EmailsService;

  beforeAll(() => {
    process.env.MAIL_HOST = 'smtp.test.com';
    process.env.MAIL_PORT = '587';
    process.env.MAIL_USER = 'test@test.com';
    process.env.MAIL_PASS = 'test-pass';
    process.env.MAIL_SENDER = 'Test <test@test.com>';
    process.env.PLATFORM_NAME = 'Test Platform';
    process.env.FRONTEND_URI = 'http://test.com';
    process.env.API_URI = 'http://api.test.com';
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue('template-content');
    service = new EmailsService();
  });

  describe('sendTwoFactorCodeMail', () => {
    it('should send a two-factor code email', async () => {
      await service.sendTwoFactorCodeMail('user@test.com', '123456');

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          subject: expect.stringContaining('Código de verificação'),
        }),
      );
    });
  });

  describe('sendRecoveryPasswordMail', () => {
    it('should send a recovery password email', async () => {
      await service.sendRecoveryPasswordMail('user@test.com', 'reset-token');

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          subject: expect.stringContaining('Recuperação de Senha'),
        }),
      );
    });
  });

  describe('sendChangedPasswordMail', () => {
    it('should send a changed password email', async () => {
      await service.sendChangedPasswordMail('user@test.com');

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          subject: expect.stringContaining('Senha Alterada'),
        }),
      );
    });
  });

  describe('sendAccountConfirmationMail', () => {
    it('should send an account confirmation email', async () => {
      await service.sendAccountConfirmationMail(
        'user@test.com',
        'conf-token',
        'John',
      );

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          subject: expect.stringContaining('Confirme sua Conta'),
        }),
      );
    });
  });

  describe('sendAccountConfirmedMail', () => {
    it('should send an account confirmed email', async () => {
      await service.sendAccountConfirmedMail('user@test.com', 'John');

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          subject: expect.stringContaining('Conta Confirmada'),
        }),
      );
    });
  });

  describe('sendAccountDeletionConfirmationMail', () => {
    it('should send an account deletion confirmation email', async () => {
      await service.sendAccountDeletionConfirmationMail(
        'user@test.com',
        'del-token',
        'John',
      );

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          subject: expect.stringContaining('Confirmar exclusão'),
        }),
      );
    });
  });

  describe('sendMail', () => {
    it('should send a plain text email via transporter.sendMail', async () => {
      const result = await service.sendMail(
        'user@test.com',
        'Subject',
        'Text body',
      );

      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'Test <test@test.com>',
        to: 'user@test.com',
        subject: 'Subject',
        text: 'Text body',
      });
      expect(result).toEqual({ messageId: 'mock-id' });
    });

    it('should bubble up error when transporter.sendMail rejects', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('SMTP error'));

      await expect(
        service.sendMail('user@test.com', 'Subject', 'Text'),
      ).rejects.toThrow('SMTP error');
    });
  });

  describe('sendPaymentSuccessMail', () => {
    it('should send a payment success email', async () => {
      const templateData: PaymentSuccessTemplateData = {
        userName: 'John',
        amount: 'R$ 100,00',
        paymentDate: '2024-01-01',
        paymentMethod: 'credit_card',
      };

      await service.sendPaymentSuccessMail(
        'user@test.com',
        'subject',
        templateData,
      );

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          subject: expect.stringContaining('Pagamento Processado'),
        }),
      );
    });
  });

  describe('sendPaymentFailureMail', () => {
    it('should send a payment failure email', async () => {
      const templateData: PaymentFailureTemplateData = {
        userName: 'John',
        amount: 'R$ 100,00',
        attemptDate: '2024-01-01',
        paymentMethod: 'credit_card',
      };

      await service.sendPaymentFailureMail(
        'user@test.com',
        'subject',
        templateData,
      );

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          subject: expect.stringContaining('Falha no Processamento'),
        }),
      );
    });
  });

  describe('sendSubscriptionCreatedMail', () => {
    it('should send a subscription created email', async () => {
      const templateData: SubscriptionCreatedTemplateData = {
        userName: 'John',
        planName: 'Pro',
        amount: 'R$ 50,00',
        recurrence: 'monthly',
        paymentMethod: 'credit_card',
      };

      await service.sendSubscriptionCreatedMail('user@test.com', templateData);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          subject: expect.stringContaining('Assinatura Realizada'),
        }),
      );
    });
  });

  describe('resolveTemplatesPath', () => {
    it('should return a valid path when templates directory exists', () => {
      mockExistsSync.mockReturnValue(true);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const path = (service as any).resolveTemplatesPath();
      expect(path).toBeDefined();
      expect(typeof path).toBe('string');
    });

    it('should throw Error when no templates directory is found', () => {
      mockExistsSync.mockReturnValue(false);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      expect(() => (service as any).resolveTemplatesPath()).toThrow(
        'Templates directory not found',
      );
    });
  });

  describe('compileTemplate', () => {
    it('should throw Error when readFileSync throws', () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      expect(() =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        (service as any).compileTemplate('two-factor-code', {
          code: '123',
          platformName: 'Test',
        }),
      ).toThrow('Falha ao compilar template de email');
    });
  });
});
