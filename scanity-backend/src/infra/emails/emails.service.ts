import { createTransport, Transporter, TransportOptions } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

import { Injectable } from '@nestjs/common';

import {
  BaseTemplateData,
  RecoveryPasswordTemplateData,
  TwoFactorCodeTemplateData,
  ChangedPasswordTemplateData,
  AccountConfirmationTemplateData,
  AccountConfirmedTemplateData,
  AccountDeletionConfirmationTemplateData,
  GenericTemplateData,
  PaymentSuccessTemplateData,
  PaymentFailureTemplateData,
  SubscriptionFreePlanTemplateData,
  SubscriptionUpgradeTemplateData,
  SubscriptionDowngradeTemplateData,
  SubscriptionCreatedTemplateData,
  EmailTemplateType,
} from './interfaces/email-template.interface';

@Injectable()
export class EmailsService {
  private transporter: Transporter<SMTPTransport.SentMessageInfo>;
  private sender: string;
  private platformName: string;
  private templatesPath: string;

  constructor() {
    const options = {
      host: process.env.MAIL_HOST || 'sandbox.smtp.mailtrap.io',
      port: Number(process.env.MAIL_PORT) || 587,
      secure: process.env.MAIL_SECURE == 'true', // true for port 465, false for other ports
      auth: {
        user: process.env.MAIL_USER || 'user',
        pass: process.env.MAIL_PASS || 'pass',
      },
    };
    this.transporter = createTransport(options as TransportOptions);
    this.sender =
      process.env.MAIL_SENDER || 'Plataforma <naoresponda@plataforma.com.br>';
    this.platformName = process.env.PLATFORM_NAME || 'Plataforma';

    // Resolve template path for both development and production
    this.templatesPath = this.resolveTemplatesPath();
  }

  private resolveTemplatesPath(): string {
    // Try multiple possible paths for templates
    const possiblePaths = [
      // Development: /src/infra/emails/templates
      path.join(__dirname, 'templates'),
      // Production: /dist/infra/emails/templates (NestJS copies assets to dist structure)
      path.join(process.cwd(), 'dist', 'infra', 'emails', 'templates'),
      // Alternative production path: relative to current __dirname in dist
      path.join(__dirname, '..', '..', '..', 'infra', 'emails', 'templates'),
      // Fallback: source directory
      path.join(process.cwd(), 'src', 'infra', 'emails', 'templates'),
    ];

    for (const templatesPath of possiblePaths) {
      if (fs.existsSync(templatesPath)) {
        console.log(`Templates found at: ${templatesPath}`);
        return templatesPath;
      }
    }

    throw new Error(
      'Templates directory not found. Searched paths: ' +
        possiblePaths.join(', '),
    );
  }

  private compileTemplate(
    templateType: EmailTemplateType,
    data:
      | RecoveryPasswordTemplateData
      | TwoFactorCodeTemplateData
      | ChangedPasswordTemplateData
      | AccountConfirmationTemplateData
      | AccountConfirmedTemplateData
      | AccountDeletionConfirmationTemplateData
      | GenericTemplateData
      | PaymentSuccessTemplateData
      | PaymentFailureTemplateData
      | SubscriptionFreePlanTemplateData
      | SubscriptionUpgradeTemplateData
      | SubscriptionDowngradeTemplateData
      | SubscriptionCreatedTemplateData,
  ): string {
    try {
      // Compilar o template específico
      const templatePath = path.join(this.templatesPath, `${templateType}.hbs`);
      const templateSource = fs.readFileSync(templatePath, 'utf8');
      const template = handlebars.compile(templateSource);
      const contentHtml = template(data);

      // Compilar o template base
      const baseTemplatePath = path.join(this.templatesPath, 'base.hbs');
      const baseTemplateSource = fs.readFileSync(baseTemplatePath, 'utf8');
      const baseTemplate = handlebars.compile(baseTemplateSource);

      const baseData: BaseTemplateData = {
        subject: '',
        platformName: this.platformName,
        content: contentHtml,
      };

      return baseTemplate(baseData);
    } catch (error) {
      console.error('Erro ao compilar template de email:', error);
      throw new Error('Falha ao compilar template de email');
    }
  }

  private async sendTemplateEmail(
    to: string,
    subject: string,
    templateType: EmailTemplateType,
    templateData:
      | RecoveryPasswordTemplateData
      | TwoFactorCodeTemplateData
      | ChangedPasswordTemplateData
      | AccountConfirmationTemplateData
      | AccountConfirmedTemplateData
      | AccountDeletionConfirmationTemplateData
      | GenericTemplateData
      | PaymentSuccessTemplateData
      | PaymentFailureTemplateData
      | SubscriptionFreePlanTemplateData
      | SubscriptionUpgradeTemplateData
      | SubscriptionDowngradeTemplateData
      | SubscriptionCreatedTemplateData,
  ): Promise<SMTPTransport.SentMessageInfo> {
    const html = this.compileTemplate(templateType, templateData);

    const info = await this.transporter.sendMail({
      from: this.sender,
      to,
      subject,
      html,
    });

    console.log('Message sent: %s', info.messageId);
    return info;
  }

  async sendTwoFactorCodeMail(email: string, code: string): Promise<void> {
    const templateData: TwoFactorCodeTemplateData = {
      code,
      platformName: this.platformName,
    };

    await this.sendTemplateEmail(
      email,
      `${this.platformName} - Código de verificação`,
      'two-factor-code',
      templateData,
    );

    console.log({ email, code: '******' });
  }

  async sendRecoveryPasswordMail(email: string, token: string): Promise<void> {
    const templateData: RecoveryPasswordTemplateData = {
      token,
      frontendUrl: process.env.FRONTEND_URI || 'http://localhost:3000',
    };

    await this.sendTemplateEmail(
      email,
      `${this.platformName} - Recuperação de Senha`,
      'recovery-password',
      templateData,
    );

    console.log({ email, token });
  }

  async sendChangedPasswordMail(email: string): Promise<void> {
    const templateData: ChangedPasswordTemplateData = {
      timestamp: new Date().toLocaleString('pt-BR'),
    };

    await this.sendTemplateEmail(
      email,
      `${this.platformName} - Senha Alterada`,
      'changed-password',
      templateData,
    );

    console.log({ email });
  }

  async sendAccountConfirmationMail(
    email: string,
    token: string,
    userName?: string,
  ): Promise<void> {
    const templateData: AccountConfirmationTemplateData = {
      token,
      apiUrl: process.env.API_URI || 'http://localhost:3000',
      frontendUrl: process.env.FRONTEND_URI || 'http://localhost:9000',
      userName,
    };

    await this.sendTemplateEmail(
      email,
      `${this.platformName} - Confirme sua Conta`,
      'account-confirmation',
      templateData,
    );

    console.log({ email, token, userName });
  }

  async sendAccountConfirmedMail(
    email: string,
    userName?: string,
    platformFeatures?: string[],
  ): Promise<void> {
    const templateData: AccountConfirmedTemplateData = {
      userName,
      frontendUrl: process.env.FRONTEND_URI || 'http://localhost:9000',
      platformFeatures,
    };

    await this.sendTemplateEmail(
      email,
      `${this.platformName} - Conta Confirmada com Sucesso!`,
      'account-confirmed',
      templateData,
    );

    console.log({ email, userName, platformFeatures });
  }

  async sendAccountDeletionConfirmationMail(
    email: string,
    token: string,
    userName?: string,
  ): Promise<void> {
    const templateData: AccountDeletionConfirmationTemplateData = {
      userName,
      token,
      apiUrl: process.env.API_URI || 'http://localhost:3000',
    };

    await this.sendTemplateEmail(
      email,
      `${this.platformName} - Confirmar exclusão da conta`,
      'account-deletion-confirmation',
      templateData,
    );

    console.log({ email, token, userName });
  }

  async sendMail(
    to: string,
    subject: string,
    text: string,
  ): Promise<SMTPTransport.SentMessageInfo> {
    const info = await this.transporter.sendMail({
      from: this.sender,
      to,
      subject,
      text,
    });
    console.log('Message sent: %s', info.messageId);
    return info;
  }

  async sendGenericTemplateEmail(
    to: string,
    subject: string,
    templateData: GenericTemplateData,
  ): Promise<SMTPTransport.SentMessageInfo> {
    return await this.sendTemplateEmail(to, subject, 'generic', templateData);
  }

  async sendPaymentSuccessMail(
    email: string,
    _subject: string,
    templateData: PaymentSuccessTemplateData,
  ): Promise<void> {
    await this.sendTemplateEmail(
      email,
      `${this.platformName} - Pagamento Processado com Sucesso!`,
      'payment-success',
      templateData,
    );

    console.log({
      email,
      amount: templateData.amount,
      transactionId: templateData.transactionId,
    });
  }

  async sendPaymentFailureMail(
    email: string,
    _subject: string,
    templateData: PaymentFailureTemplateData,
  ): Promise<void> {
    await this.sendTemplateEmail(
      email,
      `${this.platformName} - Falha no Processamento do Pagamento`,
      'payment-failure',
      templateData,
    );

    console.log({
      email,
      amount: templateData.amount,
      errorReason: templateData.errorReason,
    });
  }

  async sendSubscriptionFreePlanMail(
    email: string,
    templateData: SubscriptionFreePlanTemplateData,
  ): Promise<void> {
    await this.sendTemplateEmail(
      email,
      `${this.platformName} - Bem-vindo ao Plano Gratuito!`,
      'subscription-free-plan',
      templateData,
    );

    console.log({
      email,
      planName: templateData.planName,
      expiresAt: templateData.expiresAt,
    });
  }

  async sendSubscriptionUpgradeMail(
    email: string,
    templateData: SubscriptionUpgradeTemplateData,
  ): Promise<void> {
    await this.sendTemplateEmail(
      email,
      `${this.platformName} - Parabéns pelo Upgrade!`,
      'subscription-upgrade',
      templateData,
    );

    console.log({
      email,
      newPlanName: templateData.newPlanName,
      amount: templateData.amount,
    });
  }

  async sendSubscriptionDowngradeMail(
    email: string,
    templateData: SubscriptionDowngradeTemplateData,
  ): Promise<void> {
    await this.sendTemplateEmail(
      email,
      `${this.platformName} - Alteração de Plano Confirmada`,
      'subscription-downgrade',
      templateData,
    );

    console.log({
      email,
      newPlanName: templateData.newPlanName,
      amount: templateData.amount,
    });
  }

  async sendSubscriptionCreatedMail(
    email: string,
    templateData: SubscriptionCreatedTemplateData,
  ): Promise<void> {
    await this.sendTemplateEmail(
      email,
      `${this.platformName} - Assinatura Realizada com Sucesso!`,
      'subscription-created',
      templateData,
    );

    console.log({
      email,
      planName: templateData.planName,
      amount: templateData.amount,
    });
  }
}
