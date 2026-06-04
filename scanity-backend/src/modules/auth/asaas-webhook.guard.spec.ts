import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AsaasWebhookGuard } from './asaas-webhook.guard';
import { IS_ASAAS_WEBHOOK_KEY } from './decorators/asaas-webhook.decorator';

describe('AsaasWebhookGuard', () => {
  let guard: AsaasWebhookGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new AsaasWebhookGuard(reflector);
  });

  const createMockExecutionContext = (
    headers: Record<string, string> = {},
    isAsaasWebhook = false,
  ): ExecutionContext => {
    const mockRequest = {
      headers,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  };

  describe('canActivate', () => {
    it('should return true if route is not marked with @AsaasWebhook()', () => {
      const context = createMockExecutionContext();
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should throw UnauthorizedException if asaas-access-token header is missing', () => {
      const context = createMockExecutionContext({}, true);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow(
        'Missing asaas-access-token header',
      );
    });

    it('should throw UnauthorizedException if ASAAS_WEBHOOK_TOKEN is not configured', () => {
      const originalToken = process.env.ASAAS_WEBHOOK_TOKEN;
      delete process.env.ASAAS_WEBHOOK_TOKEN;

      const context = createMockExecutionContext(
        { 'asaas-access-token': 'some-token' },
        true,
      );
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow(
        'ASAAS_WEBHOOK_TOKEN not configured',
      );

      process.env.ASAAS_WEBHOOK_TOKEN = originalToken;
    });

    it('should throw UnauthorizedException if token does not match', () => {
      process.env.ASAAS_WEBHOOK_TOKEN = 'correct-token';

      const context = createMockExecutionContext(
        { 'asaas-access-token': 'wrong-token' },
        true,
      );
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow(
        'Invalid asaas-access-token',
      );
    });

    it('should return true if token matches', () => {
      process.env.ASAAS_WEBHOOK_TOKEN = 'correct-token';

      const context = createMockExecutionContext(
        { 'asaas-access-token': 'correct-token' },
        true,
      );
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should read metadata from both handler and class', () => {
      const context = createMockExecutionContext();
      const spy = jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(false);

      guard.canActivate(context);

      expect(spy).toHaveBeenCalledWith(IS_ASAAS_WEBHOOK_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });
  });
});
