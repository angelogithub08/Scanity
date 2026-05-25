import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_ASAAS_WEBHOOK_KEY } from './decorators/asaas-webhook.decorator';

@Injectable()
export class AsaasWebhookGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isAsaasWebhook = this.reflector.getAllAndOverride<boolean>(
      IS_ASAAS_WEBHOOK_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!isAsaasWebhook) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Missing asaas-access-token header');
    }

    const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;

    if (!expectedToken) {
      throw new UnauthorizedException('ASAAS_WEBHOOK_TOKEN not configured');
    }

    if (token !== expectedToken) {
      throw new UnauthorizedException('Invalid asaas-access-token');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    return request.headers['asaas-access-token'] as string | undefined;
  }
}
