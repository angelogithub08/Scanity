import { SetMetadata } from '@nestjs/common';

export const IS_ASAAS_WEBHOOK_KEY = 'isAsaasWebhook';
export const AsaasWebhook = () => SetMetadata(IS_ASAAS_WEBHOOK_KEY, true);
