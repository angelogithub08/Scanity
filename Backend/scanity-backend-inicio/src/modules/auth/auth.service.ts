import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EmailsService } from '../../infra/emails/emails.service';
import { UsersService } from '../users/users.service';
import { TokensRepository } from '../tokens/tokens.repository';
import { AccountsRepository } from '../accounts/accounts.repository';
import { TokenType } from '../tokens/entities/token.entity';
import { RequestUser } from './auth.interfaces';
import { LoginDto } from './dto/login.dto';
import { NewPasswordDto } from './dto/new-password.dto';
import { RecoveryPasswordDto } from './dto/recovery-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { VerifyTwoFactorDto } from './dto/verify-two-factor.dto';
import { compare, normalizeEmail } from '../../utils/encrypt.util';
import { randomUUID } from 'crypto';
import { User } from '../users/entities/user.entity';

const EMAIL_HASH_REGEX = /^[a-f0-9]{64}$/;

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private readonly emailsService: EmailsService,
    private readonly tokensRepository: TokensRepository,
    private readonly accountsRepository: AccountsRepository,
  ) {}

  async login(
    loginDto: LoginDto,
  ): Promise<
    | { access_token: string; refresh_token: string }
    | { requires_two_factor: true }
  > {
    try {
      const showPassword = true;
      const user = await this.usersService.findByEmail(
        loginDto.email,
        showPassword,
      );
      if (!user) {
        throw new UnauthorizedException();
      }

      const isValid = await compare(loginDto.password, user?.password);
      if (!isValid) {
        throw new UnauthorizedException();
      }

      // Verificar se o usuário está ativo
      if (user.is_active === false) {
        throw new UnauthorizedException(
          'Usuário inativo. Entre em contato com o administrador.',
        );
      }

      // Verificar se a conta está confirmada
      const account = await this.accountsRepository.findOne(user.account_id);
      if (!account.confirmed_at) {
        // Gerar novo token de confirmação
        const confirmationToken = randomUUID();
        await this.tokensRepository.create({
          type: TokenType.ACCOUNT_CONFIRMATION_TOKEN,
          token: confirmationToken,
          account_id: account.id,
        });

        // Enviar email de confirmação
        try {
          await this.emailsService.sendAccountConfirmationMail(
            normalizeEmail(loginDto.email),
            confirmationToken,
            account.name,
          );
        } catch (emailError) {
          console.error('Erro ao enviar email de confirmação:', emailError);
        }

        throw new UnauthorizedException(
          'Conta não confirmada. Um novo email de confirmação foi enviado.',
        );
      }

      // Autenticação em duas etapas: gerar código de 6 dígitos e enviar por email
      const twoFactorCode = String(Math.floor(100000 + Math.random() * 900000));
      await this.usersService.update(user.id, { token: twoFactorCode });
      try {
        await this.emailsService.sendTwoFactorCodeMail(
          normalizeEmail(loginDto.email),
          twoFactorCode,
        );
      } catch (emailError) {
        console.error('Erro ao enviar código 2FA:', emailError);
        throw new InternalServerErrorException(
          'Não foi possível enviar o código de verificação. Tente novamente.',
        );
      }

      return { requires_two_factor: true };
    } catch (error) {
      console.log(error);
      throw error instanceof UnauthorizedException
        ? error
        : new UnauthorizedException();
    }
  }

  async getUserData(user: User) {
    return {
      ...user,
    };
  }

  async me(request: Request) {
    try {
      const { user } = request as any;
      const record = await this.usersService.findOne(user.id as string);

      const userData = await this.getUserData(record);

      return userData;
    } catch (error) {
      console.log(error);
      /**
       * @todo implementar tratamento de errors
       */
    }
  }

  async getPayloadFromToken(token: string): Promise<RequestUser> {
    const { sub, ...payload } = await this.jwtService.verifyAsync(token, {
      secret: process.env.JWT_SECRET,
    });

    return { id: sub, ...payload };
  }

  async recoveryPassword(recoveryPasswordDto: RecoveryPasswordDto) {
    const user = await this.usersService.findByEmail(
      recoveryPasswordDto.email,
      true,
    );
    if (!user) {
      throw new BadRequestException('Usuário não identificado');
    }
    try {
      const randomNumber = Math.floor(100000 + Math.random() * 900000);
      const token = `${randomNumber}`;
      const email = `${recoveryPasswordDto.email}`;
      await this.usersService.update(user.id, {
        token,
      });
      await this.emailsService.sendRecoveryPasswordMail(
        normalizeEmail(email),
        token,
      );
      return {
        message: 'Email de recuperação de senha enviado com sucesso',
      };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Erro interno');
    }
  }

  async newPassword(newPasswordDto: NewPasswordDto) {
    const { token, password } = newPasswordDto;
    const user = await this.usersService.findByToken(token, true);

    if (!user) {
      throw new BadRequestException('Usuário não identificado');
    }

    try {
      await this.usersService.update(user.id, {
        token: null,
        password,
      });
      if (!EMAIL_HASH_REGEX.test(user.email)) {
        return await this.emailsService.sendChangedPasswordMail(user.email);
      }
      return {
        message: 'Senha alterada com sucesso',
      };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Erro interno');
    }
  }

  async verifyTwoFactor(
    verifyDto: VerifyTwoFactorDto,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const user = await this.usersService.findByEmail(verifyDto.email, true);
    if (!user || !user.token || user.token !== verifyDto.code) {
      throw new UnauthorizedException('Código inválido ou expirado.');
    }
    await this.usersService.update(user.id, { token: null });

    const payload = {
      sub: user.id,
      email: normalizeEmail(verifyDto.email),
      name: user.name,
      account_id: user.account_id,
      admin: false,
    };
    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = randomUUID();
    await this.tokensRepository.create({
      type: TokenType.REFRESH_TOKEN,
      token: refreshToken,
      account_id: user.account_id,
    });
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<{ user: User; access_token: string; refresh_token: string }> {
    try {
      const { refresh_token } = refreshTokenDto;

      // Busca o token no banco
      const tokenRecord =
        await this.tokensRepository.findByToken(refresh_token);

      if (!tokenRecord) {
        throw new UnauthorizedException('Refresh token inválido ou revogado');
      }

      // Busca o usuário pela account_id do token
      const user = await this.usersService.findOne(refreshTokenDto.user_id);

      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      // Verificar se o usuário está ativo
      if (user.is_active === false) {
        throw new UnauthorizedException(
          'Usuário inativo. Entre em contato com o administrador.',
        );
      }

      // Revoga o token atual
      await this.tokensRepository.remove(tokenRecord.id);

      // Gera novo access token
      const payload = {
        sub: user.id,
        email: user.email,
        name: user.name,
        account_id: user.account_id,
        admin: false,
      };

      const accessToken = await this.jwtService.signAsync(payload);

      // Gera e armazena novo refresh token
      const newRefreshToken = randomUUID();
      await this.tokensRepository.create({
        type: TokenType.REFRESH_TOKEN,
        token: newRefreshToken,
        account_id: user.account_id,
      });

      const userData = await this.getUserData(user);

      return {
        user: userData as User,
        access_token: accessToken,
        refresh_token: newRefreshToken,
      };
    } catch (error) {
      console.log(error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Erro ao renovar token');
    }
  }
}
