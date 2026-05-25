import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { EmailsService } from '../../infra/emails/emails.service';
import { UsersRepository } from '../users/users.repository';
import { UsersService } from '../users/users.service';
import { TokensRepository } from '../tokens/tokens.repository';
import { AccountsRepository } from '../accounts/accounts.repository';
import { AuthService } from './auth.service';
import {
  admin,
  loginDto,
  mockedToken,
  newPasswordDto,
  recoveryPasswordDto,
} from './mocks/auth.mocks';

describe('AuthService', () => {
  let service: AuthService;

  const jwtServiceMock = {
    signAsync: jest.fn(),
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
    it('should return a token', async () => {
      const result = await service.login(loginDto);

      expect(usersServiceMock.findByEmail).toHaveBeenCalled();
      expect(jwtServiceMock.signAsync).toHaveBeenCalled();
      expect(tokensRepositoryMock.create).toHaveBeenCalled();
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
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
});
