export interface BaseTemplateData {
  subject: string;
  platformName: string;
  content: string;
}

export interface RecoveryPasswordTemplateData {
  token: string;
  frontendUrl: string;
}

export interface TwoFactorCodeTemplateData {
  code: string;
  platformName: string;
}

export interface ChangedPasswordTemplateData {
  timestamp: string;
}

export interface AccountConfirmationTemplateData {
  token: string;
  frontendUrl: string;
  apiUrl: string;
  userName?: string;
}

export interface AccountConfirmedTemplateData {
  userName?: string;
  frontendUrl: string;
  platformFeatures?: string[];
}

export interface AccountDeletionConfirmationTemplateData {
  userName?: string;
  apiUrl: string;
  token: string;
}

export interface GenericTemplateData {
  greeting: string;
  message?: string;
  content?: string;
  actionUrl?: string;
  actionText?: string;
  note?: string;
}

export interface PaymentSuccessTemplateData {
  userName: string;
  amount: string;
  paymentDate: string;
  paymentMethod: string;
  transactionId?: string;
  planName?: string;
  nextChargeDate?: string;
  accessUrl?: string;
}

export interface PaymentFailureTemplateData {
  userName: string;
  amount: string;
  attemptDate: string;
  paymentMethod: string;
  errorReason?: string;
  nextRetryDate?: string;
  gracePeriodEnd?: string;
  paymentUrl?: string;
  supportUrl?: string;
}

export interface SubscriptionFreePlanTemplateData {
  userName: string;
  planName: string;
  expiresAt: string;
  trialDays: number;
  planFeatures?: string[];
  accessUrl?: string;
}

export interface SubscriptionUpgradeTemplateData {
  userName: string;
  newPlanName: string;
  oldPlanName?: string;
  amount: string;
  recurrence: string;
  nextChargeDate?: string;
  newFeatures?: string[];
  accessUrl?: string;
}

export interface SubscriptionDowngradeTemplateData {
  userName: string;
  newPlanName: string;
  oldPlanName?: string;
  amount: string;
  recurrence: string;
  nextChargeDate?: string;
  remainingFeatures?: string[];
  supportUrl?: string;
}

export interface SubscriptionCreatedTemplateData {
  userName: string;
  planName: string;
  amount: string;
  recurrence: string;
  paymentMethod: string;
  nextChargeDate?: string;
  planFeatures?: string[];
  accessUrl?: string;
}

export type EmailTemplateType =
  | 'recovery-password'
  | 'two-factor-code'
  | 'changed-password'
  | 'account-confirmation'
  | 'account-confirmed'
  | 'account-deletion-confirmation'
  | 'generic'
  | 'payment-success'
  | 'payment-failure'
  | 'subscription-free-plan'
  | 'subscription-upgrade'
  | 'subscription-downgrade'
  | 'subscription-created';

export interface EmailTemplate {
  type: EmailTemplateType;
  subject: string;
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
    | SubscriptionCreatedTemplateData;
}
