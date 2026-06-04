import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from './auth.guard';
import { UsersService } from '../users/users.service';

const mockJwtService = {
  verifyAsync: jest.fn(),
};

const mockReflector = {
  getAllAndOverride: jest.fn(),
};

const mockUsersService = {
  findOne: jest.fn(),
};

const createMockExecutionContext = (
  headers: Record<string, string> = {},
): ExecutionContext => {
  const request = { headers };
  return {
    getHandler: jest.fn().mockReturnValue({}),
    getClass: jest.fn().mockReturnValue({}),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue(request),
    }),
  } as unknown as ExecutionContext;
};

describe('AuthGuard', () => {
  let guard: AuthGuard;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        { provide: JwtService, useValue: mockJwtService },
        { provide: Reflector, useValue: mockReflector },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('public route bypass', () => {
    it('should return true when @Public() decorator is present', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(true);

      const context = createMockExecutionContext();
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalled();
      expect(mockJwtService.verifyAsync).not.toHaveBeenCalled();
    });
  });

  describe('valid token', () => {
    it('should return true and attach user to request when token is valid', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(undefined);
      mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-1' });
      mockUsersService.findOne.mockResolvedValue({ id: 'user-1', name: 'John' });

      const request = { headers: { authorization: 'Bearer valid-token' } };
      const context = {
        getHandler: jest.fn().mockReturnValue({}),
        getClass: jest.fn().mockReturnValue({}),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(request),
        }),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('valid-token', {
        secret: process.env.JWT_SECRET,
      });
      expect(mockUsersService.findOne).toHaveBeenCalledWith('user-1');
      expect((request as any).user).toEqual({ id: 'user-1', name: 'John' });
    });
  });

  describe('missing Authorization header', () => {
    it('should throw UnauthorizedException', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(undefined);

      const context = createMockExecutionContext({});

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      expect(mockJwtService.verifyAsync).not.toHaveBeenCalled();
    });
  });

  describe('invalid token format', () => {
    it('should throw UnauthorizedException when token is not Bearer', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(undefined);

      const context = createMockExecutionContext({
        authorization: 'Basic base64token',
      });

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      expect(mockJwtService.verifyAsync).not.toHaveBeenCalled();
    });
  });

  describe('token verification fails', () => {
    it('should throw UnauthorizedException when jwtService.verifyAsync rejects', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(undefined);
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Token expired'));

      const context = createMockExecutionContext({
        authorization: 'Bearer expired-token',
      });

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      expect(mockUsersService.findOne).not.toHaveBeenCalled();
    });
  });

  describe('user not found', () => {
    it('should throw UnauthorizedException when usersService.findOne rejects', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(undefined);
      mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-1' });
      mockUsersService.findOne.mockRejectedValue(new Error('User not found'));

      const context = createMockExecutionContext({
        authorization: 'Bearer valid-token',
      });

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });
  });
});
