import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { CreateAccountsDto } from './dto/create-accounts.dto';
import { UpdateAccountsDto } from './dto/update-accounts.dto';
import { RegisterAccountDto } from './dto/register-account.dto';
import {
  ListAccountsParamsDto,
  ListPaginatedAccountsParamsDto,
} from './dto/params-accounts.dto';
import { Account, AccountType } from './entities/account.entity';
import { AccountsRepository, PaginatedResult } from './accounts.repository';
import { UsersService } from '../users/users.service';
import { EmailsService } from '../../infra/emails/emails.service';
import { TokensRepository } from '../tokens/tokens.repository';
import { TokenType } from '../tokens/entities/token.entity';
import { randomUUID } from 'crypto';
import { AsaasService } from 'src/infra/payments/asaas/asaas.service';
import { generateEmailHash } from 'src/utils/encrypt.util';
import { RequestDeleteAccountDto } from './dto/request-delete-account.dto';
import { User } from '../users/entities/user.entity';

const PROFILE_ADMIN_NAME = 'Administrador';
const PROFILE_ADMIN_KEY = 'ADMIN';
const PROFILE_USER_NAME = 'Usuario';
const PROFILE_USER_KEY = 'USER';
const EXCLUDED_KEY_GROUPS_FOR_USER_PROFILE = ['PROFILES', 'USERS'];
const EMAIL_HASH_REGEX = /^[a-f0-9]{64}$/;

@Injectable()
export class AccountsService {
  private readonly logger = new Logger(AccountsService.name);

  constructor(
    private readonly accountsRepository: AccountsRepository,
    private readonly usersService: UsersService,
    private readonly emailsService: EmailsService,
    private readonly tokensRepository: TokensRepository,
    private readonly asaasService: AsaasService,
  ) {}

  findAll(
    params: ListPaginatedAccountsParamsDto,
  ): Promise<PaginatedResult<Account>> {
    try {
      return this.accountsRepository.findAll(params);
    } catch (error) {
      this.logger.error(
        `Erro ao buscar usuários paginados: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao buscar Accounts paginados: ' + (error as Error).message,
      );
    }
  }

  list(params: ListAccountsParamsDto): Promise<Account[]> {
    try {
      return this.accountsRepository.list(params);
    } catch (error) {
      this.logger.error(
        `Erro ao listar usuários: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao listar Accounts: ' + (error as Error).message,
      );
    }
  }

  findOne(id: string): Promise<Account> {
    try {
      return this.accountsRepository.findOne(id);
    } catch (error) {
      this.logger.error(
        `Erro ao buscar Account: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        this.logger.warn(`Account não encontrado: ID ${id}`);
        throw error;
      }
      throw new BadRequestException(
        'Erro ao buscar Account: ' + (error as Error).message,
      );
    }
  }

  async register(registerDto: RegisterAccountDto): Promise<Account> {
    try {
      // Criar a conta
      const accountData: CreateAccountsDto = {
        name: registerDto.name,
        email: generateEmailHash(registerDto.email),
        type: AccountType.USER,
      };

      const account = await this.accountsRepository.create(accountData);
      this.logger.log(`Account criado com sucesso: ${account.id}`);

      // Criar o usuário inicial com perfil Administrador
      const userData = {
        name: registerDto.name,
        email: registerDto.email,
        password: registerDto.password,
        account_id: account.id,
      };

      await this.usersService.create(userData);
      this.logger.log(
        `Usuário inicial criado com sucesso para a conta: ${account.id}`,
      );

      // Gerar token de confirmação
      const confirmationToken = randomUUID();
      await this.tokensRepository.create({
        type: TokenType.ACCOUNT_CONFIRMATION_TOKEN,
        token: confirmationToken,
        account_id: account.id,
      });
      this.logger.log(
        `Token de confirmação gerado para a conta: ${account.id}`,
      );

      // Enviar email de confirmação
      await this.emailsService.sendAccountConfirmationMail(
        registerDto.email,
        confirmationToken,
        registerDto.name,
      );
      this.logger.log(
        `Email de confirmação enviado para: ${registerDto.email}`,
      );

      return account;
    } catch (error) {
      this.logger.error(
        `Erro ao registrar Account: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao registrar Account: ' + (error as Error).message,
      );
    }
  }

  async confirmAccount(token: string): Promise<{
    success: boolean;
    message: string;
    account?: Account;
  }> {
    try {
      // Buscar o token
      const tokenRecord = await this.tokensRepository.findByToken(token);

      if (!tokenRecord) {
        this.logger.warn(`Token de confirmação não encontrado: ${token}`);
        throw new NotFoundException(
          'Token de confirmação não encontrado ou já foi utilizado',
        );
      }

      // Verificar se é um token de confirmação de conta
      if (tokenRecord.type !== TokenType.ACCOUNT_CONFIRMATION_TOKEN) {
        this.logger.warn(
          `Token com tipo inválido: ${tokenRecord.type} (esperado: ACCOUNT_CONFIRMATION_TOKEN)`,
        );
        throw new BadRequestException(
          'Token inválido para confirmação de conta',
        );
      }

      // Buscar a conta
      const account = await this.accountsRepository.findOne(
        tokenRecord.account_id,
      );

      // Verificar se a conta já foi confirmada
      if (account.confirmed_at) {
        this.logger.warn(`Conta já confirmada: ${account.id}`);
        throw new BadRequestException('Esta conta já foi confirmada');
      }

      // Atualizar o confirmed_at da conta
      await this.accountsRepository.update(account.id, {
        confirmed_at: new Date().toISOString(),
      });
      this.logger.log(`Conta confirmada com sucesso: ${account.id}`);

      // Revogar o token
      await this.tokensRepository.revoke(token);
      this.logger.log(`Token de confirmação revogado: ${token}`);

      // Buscar a conta atualizada
      const confirmedAccount = await this.accountsRepository.findOne(
        account.id,
      );

      // Enviar email de confirmação bem-sucedida
      try {
        if (!EMAIL_HASH_REGEX.test(account.email)) {
          await this.emailsService.sendAccountConfirmedMail(
            account.email,
            account.name,
          );
          this.logger.log(
            `Email de confirmação bem-sucedida enviado para: ${account.email}`,
          );
        }
      } catch (emailError) {
        this.logger.error(
          `Erro ao enviar email de confirmação: ${(emailError as Error).message}`,
          emailError instanceof Error ? emailError.stack : undefined,
        );
        // Não falhar a confirmação se o email falhar
      }

      return {
        success: true,
        message: 'Conta confirmada com sucesso',
        account: confirmedAccount,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao confirmar Account: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        'Erro ao confirmar Account: ' + (error as Error).message,
      );
    }
  }

  async requestDeleteAccount(
    currentUser: User,
    requestDto: RequestDeleteAccountDto,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.usersService.findByEmail(requestDto.email);
      if (
        user.id !== currentUser.id ||
        user.account_id !== currentUser.account_id
      ) {
        throw new BadRequestException('E-mail inválido para confirmação');
      }

      const deletionToken = randomUUID();
      await this.tokensRepository.create({
        type: TokenType.ACCOUNT_DELETION_TOKEN,
        token: deletionToken,
        account_id: currentUser.account_id,
        user_id: currentUser.id,
      });

      await this.emailsService.sendAccountDeletionConfirmationMail(
        requestDto.email,
        deletionToken,
        currentUser.name,
      );

      return {
        success: true,
        message: 'E-mail de confirmação de exclusão enviado com sucesso',
      };
    } catch (error) {
      this.logger.error(
        `Erro ao solicitar exclusão da conta: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        'Erro ao solicitar exclusão da conta: ' + (error as Error).message,
      );
    }
  }

  async confirmDeleteAccount(token: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const tokenRecord = await this.tokensRepository.findByToken(token);

      if (!tokenRecord) {
        throw new NotFoundException(
          'Token de exclusão de conta não encontrado ou já foi utilizado',
        );
      }

      if (tokenRecord.type !== TokenType.ACCOUNT_DELETION_TOKEN) {
        throw new BadRequestException('Token inválido para exclusão de conta');
      }

      await this.accountsRepository.findOne(tokenRecord.account_id);

      await this.tokensRepository.revoke(token);
      await this.tokensRepository.revokeByAccountId(tokenRecord.account_id);
      await this.usersService.deactivateByAccountId(tokenRecord.account_id);
      await this.accountsRepository.remove(tokenRecord.account_id);

      return {
        success: true,
        message: 'Conta excluída com sucesso',
      };
    } catch (error) {
      this.logger.error(
        `Erro ao confirmar exclusão da conta: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        'Erro ao confirmar exclusão da conta: ' + (error as Error).message,
      );
    }
  }

  async create(createDto: CreateAccountsDto): Promise<Account> {
    try {
      const accountData = Object.assign({}, createDto, {
        email: generateEmailHash(createDto.email),
      });
      const result = await this.accountsRepository.create(accountData);
      this.logger.log(`Account criado com sucesso: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Erro ao criar Account: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao criar Account: ' + (error as Error).message,
      );
    }
  }

  async update(id: string, updateDto: UpdateAccountsDto): Promise<Account> {
    try {
      const result = await this.accountsRepository.findOne(id);
      if (!result.gateway_customer_id) {
        const asaasAccount = await this.asaasService.createCustomer({
          name: result.name,
          email: result.email,
          cpfCnpj: `${updateDto.document}`,
          phone: `${updateDto.phone}`,
          postalCode: `${updateDto.zipcode}`,
          addressNumber: `${result.address_number}`,
        });
        Object.assign(updateDto, { gateway_customer_id: asaasAccount.id });
      }
      const accountData = Object.assign({}, updateDto);
      if (updateDto.email) {
        Object.assign(accountData, {
          email: generateEmailHash(updateDto.email),
        });
      }
      const updatedResult = await this.accountsRepository.update(
        id,
        accountData,
      );
      this.logger.log(`Account atualizado com sucesso: ${id}`);
      return updatedResult;
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar Account: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        this.logger.warn(`Account não encontrado: ID ${id}`);
        throw error;
      }
      throw new BadRequestException(
        'Erro ao atualizar Account: ' + (error as Error).message,
      );
    }
  }

  async remove(id: string) {
    try {
      const result = await this.accountsRepository.remove(id);
      this.logger.log(`Account removido com sucesso: ${id}`);
      return {
        success: true,
        message: `Registros removidos: ${result}`,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao remover Account: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        this.logger.warn(`Account não encontrado: ID ${id}`);
        throw error;
      }
      throw new BadRequestException(
        'Erro ao remover Account: ' + (error as Error).message,
      );
    }
  }
}
