import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { Knex } from 'knex';
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
import { ProfilesRepository } from '../profiles/profiles.repository';
import { PermissionsRepository } from '../permissions/permissions.repository';
import { generateEmailHash } from 'src/utils/encrypt.util';
import { RequestDeleteAccountDto } from './dto/request-delete-account.dto';
import { User } from '../users/entities/user.entity';
import { KNEX_CONNECTION } from '../../infra/database/database.providers';
import { ProductsRepository } from '../products/products.repository';
import { CategoriesRepository } from '../categories/categories.repository';
import { CustomersRepository } from '../customers/customers.repository';
import { SupliersRepository } from '../supliers/supliers.repository';
import { MovementStagesRepository } from '../movement-stages/movement-stages.repository';
import { ProfilePermissionsRepository } from '../profile-permissions/profile-permissions.repository';
import { StockRecordsRepository } from '../stock-records/stock-records.repository';
import { StocksRepository } from '../stocks/stocks.repository';
import { InventoryCountsRepository } from '../inventory-counts/inventory-counts.repository';
import { NotificationsRepository } from '../notifications/notifications.repository';
import { ChatHistoryRepository } from '../chat-history/chat-history.repository';

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
    @Inject(KNEX_CONNECTION) private readonly knex: Knex,
    private readonly accountsRepository: AccountsRepository,
    private readonly usersService: UsersService,
    private readonly emailsService: EmailsService,
    private readonly tokensRepository: TokensRepository,
    private readonly asaasService: AsaasService,
    private readonly profilesRepository: ProfilesRepository,
    private readonly permissionsRepository: PermissionsRepository,
    private readonly productsRepository: ProductsRepository,
    private readonly categoriesRepository: CategoriesRepository,
    private readonly customersRepository: CustomersRepository,
    private readonly supliersRepository: SupliersRepository,
    private readonly movementStagesRepository: MovementStagesRepository,
    private readonly profilePermissionsRepository: ProfilePermissionsRepository,
    private readonly stockRecordsRepository: StockRecordsRepository,
    private readonly stocksRepository: StocksRepository,
    private readonly inventoryCountsRepository: InventoryCountsRepository,
    private readonly notificationsRepository: NotificationsRepository,
    private readonly chatHistoryRepository: ChatHistoryRepository,
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
      // Validar se as senhas coincidem
      if (registerDto.password !== registerDto.confirmPassword) {
        throw new BadRequestException('As senhas não coincidem');
      }

      // Criar a conta
      const accountData: CreateAccountsDto = {
        name: registerDto.name,
        email: generateEmailHash(registerDto.email),
        type: AccountType.USER,
      };

      const existingAccount =
        await this.accountsRepository.findByEmailHash(accountData.email);
      if (existingAccount) {
        throw new BadRequestException('Já existe uma conta com este e-mail');
      }

      const account = await this.accountsRepository.create(accountData);
      this.logger.log(`Account criado com sucesso: ${account.id}`);

      // Criar perfis padrão da conta (Administrador e Usuario)
      const adminProfile = await this.profilesRepository.create({
        name: PROFILE_ADMIN_NAME,
        key: PROFILE_ADMIN_KEY,
        account_id: account.id,
      });
      const userProfile = await this.profilesRepository.create({
        name: PROFILE_USER_NAME,
        key: PROFILE_USER_KEY,
        account_id: account.id,
      });
      this.logger.log(
        `Perfis Administrador e Usuario criados para a conta: ${account.id}`,
      );

      // Vincular todas as permissões ao perfil Administrador
      const allPermissions = await this.permissionsRepository.listAll();
      const allPermissionIds = allPermissions.map((p) => p.id);
      if (allPermissionIds.length > 0) {
        await this.profilesRepository.syncProfilePermissions(
          adminProfile.id,
          allPermissionIds,
        );
        this.logger.log(
          `${allPermissionIds.length} permissões vinculadas ao perfil Administrador`,
        );
      }

      // Vincular permissões ao perfil Usuario (exceto key_group PROFILES e USERS)
      const usuarioPermissions = await this.permissionsRepository.listAll({
        key_group_not_in: EXCLUDED_KEY_GROUPS_FOR_USER_PROFILE,
      });
      const userPermissionIds = usuarioPermissions.map((p) => p.id);
      if (userPermissionIds.length > 0) {
        await this.profilesRepository.syncProfilePermissions(
          userProfile.id,
          userPermissionIds,
        );
        this.logger.log(
          `${userPermissionIds.length} permissões vinculadas ao perfil Usuario`,
        );
      }

      // Criar o usuário inicial com perfil Administrador
      const userData = {
        name: registerDto.name,
        email: registerDto.email,
        profile_id: adminProfile.id,
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
        `Erro ao registrar conta: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao registrar conta: ' + (error as Error).message,
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

      // Atualizar o confirmed_at da conta + revogar o token em transação
      const confirmTrx = await this.knex.transaction();
      try {
        await confirmTrx('accounts').where({ id: account.id }).update({
          confirmed_at: new Date().toISOString(),
          updated_at: new Date(),
        });

        await confirmTrx('tokens')
          .where({ token })
          .whereNull('revoked_at')
          .update({ revoked_at: new Date() });

        await confirmTrx.commit();
        this.logger.log(`Conta confirmada com sucesso: ${account.id}`);
      } catch (confirmError) {
        await confirmTrx.rollback();
        this.logger.error(
          `Erro na transação de confirmação da conta: ${(confirmError as Error).message}`,
        );
        throw new BadRequestException(
          'Erro ao confirmar conta: ' + (confirmError as Error).message,
        );
      }

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
    summary?: Record<string, number>;
  }> {
    try {
      // 1. Validar token (fora da transação)
      const tokenRecord = await this.tokensRepository.findByToken(token);

      if (!tokenRecord) {
        throw new NotFoundException(
          'Token de exclusão de conta não encontrado ou já foi utilizado',
        );
      }

      if (tokenRecord.type !== TokenType.ACCOUNT_DELETION_TOKEN) {
        throw new BadRequestException('Token inválido para exclusão de conta');
      }

      // 2. Verificar se a conta existe (fora da transação)
      const accountId = tokenRecord.account_id;
      await this.accountsRepository.findOne(accountId);

      // 3. Iniciar transação
      const trx = await this.knex.transaction();
      const summary: Record<string, number> = {};

      try {
        // 4. Lock da conta para evitar concorrência (FOR UPDATE)
        const lockedAccount = await trx('accounts')
          .where({ id: accountId })
          .forUpdate()
          .first();

        if (!lockedAccount) {
          throw new NotFoundException(
            `Conta com ID ${accountId} não encontrada`,
          );
        }

        // 5. Executar soft-deletes em cascata na ordem definida
        summary.profile_permissions =
          await this.profilePermissionsRepository.removeByAccountId(
            accountId,
            trx,
          );
        this.logger.log(
          `profile_permissions removidos: ${summary.profile_permissions}`,
        );

        summary.stock_records =
          await this.stockRecordsRepository.removeByAccountId(accountId, trx);
        this.logger.log(`stock_records removidos: ${summary.stock_records}`);

        summary.inventory_counts =
          await this.inventoryCountsRepository.removeByAccountId(
            accountId,
            trx,
          );
        this.logger.log(
          `inventory_counts removidos: ${summary.inventory_counts}`,
        );

        summary.stocks = await this.stocksRepository.removeByAccountId(
          accountId,
          trx,
        );
        this.logger.log(`stocks removidos: ${summary.stocks}`);

        summary.profiles = await this.profilesRepository.removeByAccountId(
          accountId,
          trx,
        );
        this.logger.log(`profiles removidos: ${summary.profiles}`);

        summary.products = await this.productsRepository.removeByAccountId(
          accountId,
          trx,
        );
        this.logger.log(`products removidos: ${summary.products}`);

        summary.categories = await this.categoriesRepository.removeByAccountId(
          accountId,
          trx,
        );
        this.logger.log(`categories removidos: ${summary.categories}`);

        summary.customers = await this.customersRepository.removeByAccountId(
          accountId,
          trx,
        );
        this.logger.log(`customers removidos: ${summary.customers}`);

        summary.supliers = await this.supliersRepository.removeByAccountId(
          accountId,
          trx,
        );
        this.logger.log(`supliers removidos: ${summary.supliers}`);

        summary.movement_stages =
          await this.movementStagesRepository.removeByAccountId(accountId, trx);
        this.logger.log(
          `movement_stages removidos: ${summary.movement_stages}`,
        );

        summary.notifications =
          await this.notificationsRepository.removeByAccountId(accountId, trx);
        this.logger.log(`notifications removidos: ${summary.notifications}`);

        summary.chat_history =
          await this.chatHistoryRepository.removeByAccountId(accountId, trx);
        this.logger.log(`chat_history removidos: ${summary.chat_history}`);

        // 6. Desativar usuários
        summary.users = await this.usersService.deactivateByAccountId(
          accountId,
          trx,
        );
        this.logger.log(`usuários desativados: ${summary.users}`);

        // 7. Revogar e remover tokens
        const tokenResult =
          await this.tokensRepository.revokeAndRemoveByAccountId(
            accountId,
            trx,
          );
        summary.tokens_revoked = tokenResult.revoked;
        summary.tokens_deleted = tokenResult.deleted;
        this.logger.log(
          `tokens: ${tokenResult.revoked} revogados, ${tokenResult.deleted} removidos`,
        );

        // 8. Remover a conta (último passo)
        summary.accounts = await this.accountsRepository.remove(accountId, trx);
        this.logger.log(`conta removida: ${summary.accounts}`);

        // 9. Confirmar a transação
        await trx.commit();
        this.logger.log(
          `Conta ${accountId} excluída com sucesso via transação`,
        );

        return {
          success: true,
          message: 'Conta excluída com sucesso',
          summary,
        };
      } catch (trxError) {
        await trx.rollback();
        this.logger.error(
          `Erro na transação de exclusão da conta ${accountId}: ${(trxError as Error).message}`,
          trxError instanceof Error ? trxError.stack : undefined,
        );
        throw new BadRequestException(
          'Erro ao excluir conta: ' + (trxError as Error).message,
        );
      }
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
