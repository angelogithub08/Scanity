import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { EmailsService } from '../../infra/emails/emails.service';
import { UsersRepository } from '../users/users.repository';
import { UsersService } from '../users/users.service';
import { TokensRepository } from '../tokens/tokens.repository';
import { AccountsRepository } from '../accounts/accounts.repository';
import { AuthService } from './auth.service';
import { VerifyTwoFactorDto } from './dto/verify-two-factor.dto';
import {
  admin,
  loginDto,
  mockedToken,
  newPasswordDto,
  recoveryPasswordDto,
} from './mocks/auth.mocks';
import { Request } from 'express';

jest.mock('../../utils/encrypt.util', () => ({
  compare: jest.fn().mockResolvedValue(true),
  normalizeEmail: jest
    .fn()
    .mockImplementation((email) => email.toLowerCase().trim()),
  generateEmailHash: jest.fn().mockImplementation((email) => email),
}));

describe('AuthService', () => {
  let service: AuthService;

  const jwtServiceMock = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const usersServiceMock = {
    findOne: jest.fn(),
    findByEmail: jest.fn(),
    findByToken: jest.fn(),
    update: jest.fn(),
  };

  const emailsServiceMock = {
    sendRecoveryPasswordMail: jest.fn(),
    sendChangedPasswordMail: jest.fn(),
    sendTwoFactorCodeMail: jest.fn(),
    sendAccountConfirmationMail: jest.fn(),
  };

  const userServiceRepositoryMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findByToken: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const tokensRepositoryMock = {
    create: jest.fn(),
    findByToken: jest.fn(),
    remove: jest.fn(),
  };

  const accountsRepositoryMock = {
    findOne: jest.fn().mockResolvedValue({
      id: '440af012-a5ce-4c07-a1b9-1ecdbf8bbe4e',
      email: 'teste@teste.com',
      name: 'Test Account',
      confirmed_at: new Date(),
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        UsersService,
        JwtService,
        EmailsService,
        TokensRepository,
        AccountsRepository,
      ],
    })
      .overrideProvider(JwtService)
      .useValue(jwtServiceMock)
      .overrideProvider(UsersService)
      .useValue(usersServiceMock)
      .overrideProvider(EmailsService)
      .useValue(emailsServiceMock)
      .overrideProvider(UsersRepository)
      .useValue(userServiceRepositoryMock)
      .overrideProvider(TokensRepository)
      .useValue(tokensRepositoryMock)
      .overrideProvider(AccountsRepository)
      .useValue(accountsRepositoryMock)
      .compile();

    service = module.get<AuthService>(AuthService);

    usersServiceMock.findByEmail.mockResolvedValue(Promise.resolve(admin));
    jwtServiceMock.signAsync.mockResolvedValue(Promise.resolve(mockedToken));
    usersServiceMock.findByToken.mockResolvedValue(Promise.resolve(admin));
    tokensRepositoryMock.create.mockResolvedValue(
      Promise.resolve({ id: '1', token: 'refresh-token' }),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should return requires_two_factor on successful login', async () => {
      const result = await service.login(loginDto);

      expect(usersServiceMock.findByEmail).toHaveBeenCalled();
      expect(usersServiceMock.update).toHaveBeenCalled();
      expect(emailsServiceMock.sendTwoFactorCodeMail).toHaveBeenCalled();
      expect(result).toEqual({ requires_two_factor: true });
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      const inactiveUser = { ...admin, is_active: false };
      usersServiceMock.findByEmail.mockResolvedValue(inactiveUser);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Usuário inativo. Entre em contato com o administrador.',
      );
    });
  });

  describe('recoveryPassword', () => {
    it('should return a user', async () => {
      const result = await service.recoveryPassword(recoveryPasswordDto);

      expect(result).toEqual({
        message: 'Email de recuperação de senha enviado com sucesso',
      });
      expect(usersServiceMock.findByEmail).toHaveBeenCalled();
      expect(usersServiceMock.update).toHaveBeenCalled();
      expect(emailsServiceMock.sendRecoveryPasswordMail).toHaveBeenCalled();
    });
  });
  describe('newPassword', () => {
    it('should return a user', async () => {
      await service.newPassword(newPasswordDto);

      expect(usersServiceMock.findByToken).toHaveBeenCalled();
      expect(usersServiceMock.update).toHaveBeenCalled();
      expect(emailsServiceMock.sendChangedPasswordMail).toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    const refreshTokenDto = {
      refresh_token: 'valid-refresh-token',
      user_id: '440af012-a5ce-4c07-a1b9-1ecdbf8bbe4e',
    };

    beforeEach(() => {
      tokensRepositoryMock.findByToken.mockResolvedValue({
        id: '1',
        token: 'valid-refresh-token',
        account_id: '440af012-a5ce-4c07-a1b9-1ecdbf8bbe4e',
      });
      usersServiceMock.findOne = jest.fn().mockResolvedValue(admin);
      tokensRepositoryMock.remove.mockResolvedValue(1);
    });

    it('should refresh token successfully for active user', async () => {
      const result = await service.refreshToken(refreshTokenDto);

      expect(tokensRepositoryMock.findByToken).toHaveBeenCalledWith(
        'valid-refresh-token',
      );
      expect(usersServiceMock.findOne).toHaveBeenCalledWith(
        refreshTokenDto.user_id,
      );
      expect(tokensRepositoryMock.remove).toHaveBeenCalled();
      expect(tokensRepositoryMock.create).toHaveBeenCalled();
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result).toHaveProperty('user');
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      const inactiveUser = { ...admin, is_active: false };
      usersServiceMock.findOne = jest.fn().mockResolvedValue(inactiveUser);

      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(
        'Usuário inativo. Entre em contato com o administrador.',
      );
    });
  });

  describe('verifyTwoFactor', () => {
    const verifyTwoFactorDto: VerifyTwoFactorDto = {
      email: 'teste@teste.com',
      code: '123456',
    };

    beforeEach(() => {
      usersServiceMock.findByEmail.mockResolvedValue({
        ...admin,
        token: '123456',
      });
      jwtServiceMock.signAsync.mockResolvedValue(mockedToken);
      tokensRepositoryMock.create.mockResolvedValue({
        id: '1',
        token: 'refresh-token',
      });
    });

    it('should return access_token and refresh_token on valid code', async () => {
      const result = await service.verifyTwoFactor(verifyTwoFactorDto);

      expect(usersServiceMock.findByEmail).toHaveBeenCalledWith(
        'teste@teste.com',
        true,
      );
      expect(usersServiceMock.update).toHaveBeenCalledWith(admin.id, {
        token: null,
      });
      expect(jwtServiceMock.signAsync).toHaveBeenCalled();
      expect(tokensRepositoryMock.create).toHaveBeenCalled();
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      usersServiceMock.findByEmail.mockResolvedValue(null);

      await expect(service.verifyTwoFactor(verifyTwoFactorDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when user token is null', async () => {
      usersServiceMock.findByEmail.mockResolvedValue({
        ...admin,
        token: null,
      });

      await expect(service.verifyTwoFactor(verifyTwoFactorDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when code does not match', async () => {
      usersServiceMock.findByEmail.mockResolvedValue({
        ...admin,
        token: '654321',
      });

      await expect(service.verifyTwoFactor(verifyTwoFactorDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('login - additional scenarios', () => {
    it('should throw error when user is not found', async () => {
      usersServiceMock.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow();
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      const { compare } = require('../../utils/encrypt.util');
      compare.mockResolvedValueOnce(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException and send confirmation email when account is not confirmed', async () => {
      accountsRepositoryMock.findOne.mockResolvedValueOnce({
        id: '440af012-a5ce-4c07-a1b9-1ecdbf8bbe4e',
        email: 'teste@teste.com',
        name: 'Test Account',
        confirmed_at: null,
      });

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(emailsServiceMock.sendAccountConfirmationMail).toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException when 2FA email fails', async () => {
      emailsServiceMock.sendTwoFactorCodeMail.mockRejectedValueOnce(
        new Error('Email error'),
      );

      await expect(service.login(loginDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('me', () => {
    it('should return user data', async () => {
      const mockRequest = { user: { id: admin.id } } as any;
      usersServiceMock.findOne.mockResolvedValue(admin);

      const result = await service.me(mockRequest);

      expect(usersServiceMock.findOne).toHaveBeenCalledWith(admin.id);
      expect(result).toEqual(admin);
    });
  });

  describe('getUserData', () => {
    it('should return user object as-is', async () => {
      const result = await service.getUserData(admin as any);

      expect(result).toEqual(admin);
    });
  });

  describe('getPayloadFromToken', () => {
    it('should return payload with id from sub', async () => {
      jwtServiceMock.verifyAsync.mockResolvedValue({
        sub: 'user-id',
        email: 'test@test.com',
        name: 'Test',
      });

      const result = await service.getPayloadFromToken('valid-token');

      expect(result).toEqual({
        id: 'user-id',
        email: 'test@test.com',
        name: 'Test',
      });
    });

    it('should throw when token is invalid', async () => {
      jwtServiceMock.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(
        service.getPayloadFromToken('invalid-token'),
      ).rejects.toThrow();
    });
  });

  describe('recoveryPassword - additional scenarios', () => {
    it('should throw BadRequestException when user is not found', async () => {
      usersServiceMock.findByEmail.mockResolvedValue(null);

      await expect(
        service.recoveryPassword(recoveryPasswordDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.recoveryPassword(recoveryPasswordDto),
      ).rejects.toThrow('Usuário não identificado');
    });

    it('should throw InternalServerErrorException when update fails', async () => {
      usersServiceMock.update.mockRejectedValueOnce(new Error('Update error'));

      await expect(
        service.recoveryPassword(recoveryPasswordDto),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('newPassword - additional scenarios', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      usersServiceMock.findByToken.mockResolvedValue(admin);
      usersServiceMock.update.mockResolvedValue(undefined);
    });

    it('should throw BadRequestException when user is not found by token', async () => {
      usersServiceMock.findByToken.mockResolvedValue(null);

      await expect(service.newPassword(newPasswordDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.newPassword(newPasswordDto)).rejects.toThrow(
        'Usuário não identificado',
      );
    });

    it('should skip sending email when email matches EMAIL_HASH_REGEX', async () => {
      const hashUser = { ...admin, email: 'a'.repeat(64) };
      usersServiceMock.findByToken.mockResolvedValue(hashUser);

      const result = await service.newPassword(newPasswordDto);

      expect(
        emailsServiceMock.sendChangedPasswordMail,
      ).not.toHaveBeenCalled();
      expect(result).toEqual({ message: 'Senha alterada com sucesso' });
    });
  });
});
