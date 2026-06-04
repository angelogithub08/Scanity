/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AccountsRepository } from './accounts.repository';
import { CreateAccountsDto } from './dto/create-accounts.dto';
import {
  ListAccountsParamsDto,
  ListPaginatedAccountsParamsDto,
} from './dto/params-accounts.dto';
import { Account, AccountType } from './entities/account.entity';
import { UsersService } from '../users/users.service';
import { EmailsService } from 'src/infra/emails/emails.service';
import { TokensRepository } from '../tokens/tokens.repository';
import { AsaasService } from 'src/infra/payments/asaas/asaas.service';
import { ProfilesRepository } from '../profiles/profiles.repository';
import { PermissionsRepository } from '../permissions/permissions.repository';
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
import { TokenType } from '../tokens/entities/token.entity';
import { User } from '../users/entities/user.entity';
import { RegisterAccountDto } from './dto/register-account.dto';

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  last_page: number;
}

describe('AccountsService', () => {
  let service: AccountsService;
  let repository: AccountsRepository;
  let module: TestingModule;

  // Mock data para Account
  const mockAccount = {
    id: '1',
    name: 'Test name',
    email: 'test@email.com',
    type: 'USER',
    phone: '(11) 98765-4321',
    document: '123.456.789-00',
    zipcode: '01234-567',
    address_number: '123',
    ia_token: 'sk-1234567890abcdef',
    created_at: new Date(),
    updated_at: new Date(),
  } as unknown as Account;

  const mockPaginatedResult: PaginatedResult<Account> = {
    data: [mockAccount],
    total: 1,
    page: 1,
    last_page: 1,
  };

  // Mock para o DTO de criação
  const mockCreateDto: CreateAccountsDto = {
    name: 'Test name',
    email: 'test@email.com',
    type: AccountType.USER,
    phone: '(11) 98765-4321',
    document: '123.456.789-00',
    zipcode: '01234-567',
    address_number: '123',
    ia_token: 'sk-1234567890abcdef',
  };

  // Mock para o DTO de atualização
  const mockUpdateDto: Partial<CreateAccountsDto> = {
    name: 'Updated name',
    email: 'Updated email',
  };

  // Mock para dados após atualização
  const mockUpdatedAccount = {
    ...mockAccount,
    ...mockUpdateDto,
  };

  const mockRegisterDto: RegisterAccountDto = {
    name: 'New User',
    email: 'newuser@email.com',
    password: 'Str0ng!Pass',
    confirmPassword: 'Str0ng!Pass',
  };

  const mockRegisterDtoPasswordsMismatch: RegisterAccountDto = {
    name: 'New User',
    email: 'newuser@email.com',
    password: 'Str0ng!Pass',
    confirmPassword: 'DifferentPass',
  };

  const mockUserService = {
    deactivateByAccountId: jest.fn().mockResolvedValue(1),
    create: jest.fn().mockResolvedValue({ id: 'user-1' }),
    findByEmail: jest
      .fn()
      .mockResolvedValue({ id: 'user-1', account_id: 'account-1' }),
  };

  const mockEmailsService = {
    sendEmail: jest.fn().mockResolvedValue(true),
    sendAccountConfirmationMail: jest.fn().mockResolvedValue(undefined),
    sendAccountConfirmedMail: jest.fn().mockResolvedValue(undefined),
    sendAccountDeletionConfirmationMail: jest.fn().mockResolvedValue(undefined),
  };

  const mockKnex = {
    transaction: jest.fn().mockResolvedValue(createTrxMock()),
  };

  const mockTokensRepository = {
    findByToken: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({ id: 'token-1' }),
    revoke: jest.fn().mockResolvedValue(undefined),
    revokeByAccountId: jest.fn().mockResolvedValue(0),
    revokeAndRemoveByAccountId: jest
      .fn()
      .mockResolvedValue({ revoked: 0, deleted: 0 }),
  };

  const mockAsaasService = {
    createCustomer: jest.fn().mockResolvedValue({ id: 'cus_123456789' }),
  };

  const mockProfilesRepository = {
    create: jest.fn().mockResolvedValue({ id: 'profile-1' }),
    syncProfilePermissions: jest
      .fn()
      .mockResolvedValue({ inserted: 0, deleted: 0 }),
    removeByAccountId: jest.fn().mockResolvedValue(0),
  };

  const mockPermissionsRepository = {
    listAll: jest.fn().mockResolvedValue([]),
  };

  const mockEmptyRepo = {
    removeByAccountId: jest.fn().mockResolvedValue(0),
  };

  /** Helper to create a callable Knex transaction mock.
   *  The real Knex transaction is a callable function (like knex itself)
   *  that returns a query builder when called with a table name.
   *  This mock replicates that behavior.
   */
  function createTrxMock(): any {
    const queryBuilder = {
      where: jest.fn().mockReturnThis(),
      forUpdate: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue({ id: 'test-account' }),
      update: jest.fn().mockResolvedValue(1),
      whereNull: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      clone: jest.fn().mockReturnThis(),
      insert: jest.fn().mockResolvedValue([{ id: 'test' }]),
      delete: jest.fn().mockResolvedValue(1),
      returning: jest.fn().mockResolvedValue([{ id: 'test' }]),
      modify: jest.fn().mockReturnThis(),
      count: jest.fn().mockReturnThis(),
    };
    const trx = jest.fn().mockReturnValue(queryBuilder) as any;
    trx.commit = jest.fn().mockResolvedValue(undefined);
    trx.rollback = jest.fn().mockResolvedValue(undefined);
    return trx;
  }

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        AccountsService,
        {
          provide: KNEX_CONNECTION,
          useValue: mockKnex,
        },
        {
          provide: UsersService,
          useValue: mockUserService,
        },
        {
          provide: EmailsService,
          useValue: mockEmailsService,
        },
        {
          provide: TokensRepository,
          useValue: mockTokensRepository,
        },
        {
          provide: AsaasService,
          useValue: mockAsaasService,
        },
        {
          provide: ProfilesRepository,
          useValue: mockProfilesRepository,
        },
        {
          provide: PermissionsRepository,
          useValue: mockPermissionsRepository,
        },
        {
          provide: AccountsRepository,
          useValue: {
            create: jest.fn().mockResolvedValue(mockAccount),
            findAll: jest.fn().mockResolvedValue(mockPaginatedResult),
            list: jest.fn().mockResolvedValue([mockAccount]),
            findOne: jest.fn().mockResolvedValue(mockAccount),
            update: jest.fn().mockResolvedValue(mockUpdatedAccount),
            remove: jest.fn().mockResolvedValue(1),
            findByEmailHash: jest.fn().mockResolvedValue(null),
          },
        },
        {
          provide: ProductsRepository,
          useValue: { ...mockEmptyRepo },
        },
        {
          provide: CategoriesRepository,
          useValue: { ...mockEmptyRepo },
        },
        {
          provide: CustomersRepository,
          useValue: { ...mockEmptyRepo },
        },
        {
          provide: SupliersRepository,
          useValue: { ...mockEmptyRepo },
        },
        {
          provide: MovementStagesRepository,
          useValue: { ...mockEmptyRepo },
        },
        {
          provide: ProfilePermissionsRepository,
          useValue: { ...mockEmptyRepo },
        },
        {
          provide: StockRecordsRepository,
          useValue: { ...mockEmptyRepo },
        },
        {
          provide: StocksRepository,
          useValue: { ...mockEmptyRepo },
        },
        {
          provide: InventoryCountsRepository,
          useValue: { ...mockEmptyRepo },
        },
        {
          provide: NotificationsRepository,
          useValue: { ...mockEmptyRepo },
        },
        {
          provide: ChatHistoryRepository,
          useValue: { ...mockEmptyRepo },
        },
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
    repository = module.get<AccountsRepository>(AccountsRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a Account successfully', async () => {
      const result = await service.create(mockCreateDto);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: mockCreateDto.name,
          type: mockCreateDto.type,
        }),
      );
      expect(result).toEqual(mockAccount);
    });

    it('should throw BadRequestException on create error', async () => {
      jest
        .spyOn(repository, 'create')
        .mockRejectedValueOnce(new Error('Database error'));

      try {
        await service.create(mockCreateDto);
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain(
          'Erro ao criar Account',
        );
      }
    });
  });

  describe('findAll', () => {
    it('should return paginated Accounts', async () => {
      const params: ListPaginatedAccountsParamsDto = { page: 1, limit: 10 };
      const result = await service.findAll(params);

      expect(repository.findAll).toHaveBeenCalledWith(params);
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should throw BadRequestException on findAll error', async () => {
      const params: ListPaginatedAccountsParamsDto = { page: 1, limit: 10 };

      jest.spyOn(repository, 'findAll').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      try {
        await service.findAll(params);
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain(
          'Erro ao buscar Accounts paginados',
        );
      }
    });
  });

  describe('list', () => {
    it('should return all Accounts', async () => {
      const params: ListAccountsParamsDto = {};
      const result = await service.list(params);

      expect(repository.list).toHaveBeenCalledWith(params);
      expect(result).toEqual([mockAccount]);
    });

    it('should throw BadRequestException on list error', async () => {
      const params: ListAccountsParamsDto = {};

      jest.spyOn(repository, 'list').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      try {
        await service.list(params);
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain(
          'Erro ao listar Accounts',
        );
      }
    });
  });

  describe('findOne', () => {
    it('should return a Account by id', async () => {
      const result = await service.findOne('mock-id');

      expect(repository.findOne).toHaveBeenCalledWith('mock-id');
      expect(result).toEqual(mockAccount);
    });

    it('should rethrow NotFoundException from repository', async () => {
      jest
        .spyOn(repository, 'findOne')
        .mockRejectedValueOnce(new NotFoundException('Account not found'));

      try {
        await service.findOne('not-found');
        fail('Expected NotFoundException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toContain(
          'Account not found',
        );
      }
    });

    it('should rethrow BadRequestException from repository', async () => {
      jest
        .spyOn(repository, 'findOne')
        .mockRejectedValueOnce(new BadRequestException('Invalid ID'));

      try {
        await service.findOne('invalid-id');
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain('Invalid ID');
      }
    });

    it('should wrap other errors in BadRequestException', async () => {
      jest.spyOn(repository, 'findOne').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      try {
        await service.findOne('error-id');
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain(
          'Erro ao buscar Account',
        );
      }
    });
  });

  describe('update', () => {
    it('should update a Account', async () => {
      const result = await service.update('mock-id', mockUpdateDto);

      expect(repository.update).toHaveBeenCalledWith(
        'mock-id',
        expect.objectContaining({
          name: mockUpdateDto.name,
        }),
      );
      expect(result).toEqual(mockUpdatedAccount);
    });

    it('should rethrow NotFoundException from repository', async () => {
      jest
        .spyOn(repository, 'update')
        .mockRejectedValueOnce(new NotFoundException('Account not found'));

      try {
        await service.update('not-found', mockUpdateDto);
        fail('Expected NotFoundException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toContain(
          'Account not found',
        );
      }
    });

    it('should wrap other errors in BadRequestException', async () => {
      jest.spyOn(repository, 'update').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      try {
        await service.update('error-id', mockUpdateDto);
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain(
          'Erro ao atualizar Account',
        );
      }
    });
  });

  describe('remove', () => {
    it('should remove a Account', async () => {
      const result = await service.remove('mock-id');

      expect(repository.remove).toHaveBeenCalledWith('mock-id');
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message');
    });

    it('should rethrow NotFoundException from repository', async () => {
      jest
        .spyOn(repository, 'remove')
        .mockRejectedValueOnce(new NotFoundException('Account not found'));

      try {
        await service.remove('not-found');
        fail('Expected NotFoundException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toContain(
          'Account not found',
        );
      }
    });

    it('should wrap other errors in BadRequestException', async () => {
      jest.spyOn(repository, 'remove').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      try {
        await service.remove('error-id');
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain(
          'Erro ao remover Account',
        );
      }
    });
  });

  describe('requestDeleteAccount', () => {
    const mockCurrentUser = {
      id: 'user-1',
      account_id: 'account-1',
      name: 'Test User',
      email: 'current@email.com',
    } as User;

    const mockRequestDto = { email: 'current@email.com' };

    beforeEach(() => {
      jest.clearAllMocks();
      mockUserService.findByEmail.mockResolvedValue({
        id: 'user-1',
        account_id: 'account-1',
        email: 'current@email.com',
        name: 'Test User',
      });
    });

    it('should send deletion confirmation email and return success', async () => {
      const result = await service.requestDeleteAccount(
        mockCurrentUser,
        mockRequestDto,
      );

      expect(mockUserService.findByEmail).toHaveBeenCalledWith(
        'current@email.com',
      );
      expect(mockTokensRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: TokenType.ACCOUNT_DELETION_TOKEN,
          account_id: 'account-1',
          user_id: 'user-1',
        }),
      );
      expect(
        mockEmailsService.sendAccountDeletionConfirmationMail,
      ).toHaveBeenCalledWith(
        'current@email.com',
        expect.any(String),
        'Test User',
      );
      expect(result.success).toBe(true);
      expect(result.message).toBe(
        'E-mail de confirmação de exclusão enviado com sucesso',
      );
    });

    it('should throw BadRequestException when email does not match current user id', async () => {
      mockUserService.findByEmail.mockResolvedValue({
        id: 'other-user',
        account_id: 'account-1',
      });

      await expect(
        service.requestDeleteAccount(mockCurrentUser, mockRequestDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when user account_id mismatches', async () => {
      mockUserService.findByEmail.mockResolvedValue({
        id: 'user-1',
        account_id: 'other-account',
      });

      await expect(
        service.requestDeleteAccount(mockCurrentUser, mockRequestDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should propagate BadRequestException from findByEmail', async () => {
      mockUserService.findByEmail.mockRejectedValue(
        new BadRequestException('User not found'),
      );

      await expect(
        service.requestDeleteAccount(mockCurrentUser, mockRequestDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('confirmDeleteAccount', () => {
    const mockToken = 'deletion-token-123';
    const mockAccountId = 'account-1';
    const mockTokenRecord = {
      id: 'token-1',
      token: mockToken,
      type: TokenType.ACCOUNT_DELETION_TOKEN,
      account_id: mockAccountId,
      user_id: 'user-1',
    };

    beforeEach(() => {
      jest.clearAllMocks();
      mockTokensRepository.findByToken.mockResolvedValue(mockTokenRecord);
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockAccount);
    });

    it('should throw NotFoundException when token is not found', async () => {
      mockTokensRepository.findByToken.mockResolvedValue(null);

      await expect(
        service.confirmDeleteAccount('invalid-token'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when token type is invalid', async () => {
      mockTokensRepository.findByToken.mockResolvedValue({
        ...mockTokenRecord,
        type: TokenType.ACCOUNT_CONFIRMATION_TOKEN,
      });

      await expect(service.confirmDeleteAccount(mockToken)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when account does not exist', async () => {
      jest
        .spyOn(repository, 'findOne')
        .mockRejectedValueOnce(new NotFoundException('Account não encontrado'));

      await expect(service.confirmDeleteAccount(mockToken)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should successfully delete account with cascading soft-deletes', async () => {
      const trxMock = createTrxMock();
      mockKnex.transaction.mockResolvedValue(trxMock);

      const result = await service.confirmDeleteAccount(mockToken);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Conta excluída com sucesso');
      expect(result.summary).toBeDefined();
      expect(result.summary?.accounts).toBe(1);
    });

    it('should call all removeByAccountId with the correct accountId from token', async () => {
      const trxMock = createTrxMock();
      mockKnex.transaction.mockResolvedValue(trxMock);

      await service.confirmDeleteAccount(mockToken);

      // All sub-repositories should receive the accountId from the token
      const profilePermRepo = module.get<ProfilePermissionsRepository>(
        ProfilePermissionsRepository,
      );
      const stockRecordsRepo = module.get<StockRecordsRepository>(
        StockRecordsRepository,
      );
      const inventoryCountsRepo = module.get<InventoryCountsRepository>(
        InventoryCountsRepository,
      );
      const stocksRepo = module.get<StocksRepository>(StocksRepository);
      const profilesRepo = module.get<ProfilesRepository>(ProfilesRepository);
      const productsRepo = module.get<ProductsRepository>(ProductsRepository);
      const categoriesRepo =
        module.get<CategoriesRepository>(CategoriesRepository);
      const customersRepo =
        module.get<CustomersRepository>(CustomersRepository);
      const supliersRepo = module.get<SupliersRepository>(SupliersRepository);
      const movementStagesRepo = module.get<MovementStagesRepository>(
        MovementStagesRepository,
      );
      const notificationsRepo = module.get<NotificationsRepository>(
        NotificationsRepository,
      );
      const chatHistoryRepo = module.get<ChatHistoryRepository>(
        ChatHistoryRepository,
      );

      expect(profilePermRepo.removeByAccountId).toHaveBeenCalledWith(
        mockAccountId,
        trxMock,
      );
      expect(stockRecordsRepo.removeByAccountId).toHaveBeenCalledWith(
        mockAccountId,
        trxMock,
      );
      expect(inventoryCountsRepo.removeByAccountId).toHaveBeenCalledWith(
        mockAccountId,
        trxMock,
      );
      expect(stocksRepo.removeByAccountId).toHaveBeenCalledWith(
        mockAccountId,
        trxMock,
      );
      expect(profilesRepo.removeByAccountId).toHaveBeenCalledWith(
        mockAccountId,
        trxMock,
      );
      expect(productsRepo.removeByAccountId).toHaveBeenCalledWith(
        mockAccountId,
        trxMock,
      );
      expect(categoriesRepo.removeByAccountId).toHaveBeenCalledWith(
        mockAccountId,
        trxMock,
      );
      expect(customersRepo.removeByAccountId).toHaveBeenCalledWith(
        mockAccountId,
        trxMock,
      );
      expect(supliersRepo.removeByAccountId).toHaveBeenCalledWith(
        mockAccountId,
        trxMock,
      );
      expect(movementStagesRepo.removeByAccountId).toHaveBeenCalledWith(
        mockAccountId,
        trxMock,
      );
      expect(notificationsRepo.removeByAccountId).toHaveBeenCalledWith(
        mockAccountId,
        trxMock,
      );
      expect(chatHistoryRepo.removeByAccountId).toHaveBeenCalledWith(
        mockAccountId,
        trxMock,
      );

      // Users/tokens/accounts are also called with the same accountId
      expect(mockUserService.deactivateByAccountId).toHaveBeenCalledWith(
        mockAccountId,
        trxMock,
      );
      expect(
        mockTokensRepository.revokeAndRemoveByAccountId,
      ).toHaveBeenCalledWith(mockAccountId, trxMock);
      expect(repository.remove).toHaveBeenCalledWith(mockAccountId, trxMock);
    });

    it('should call commit and NOT call rollback on successful deletion', async () => {
      const trxMock = createTrxMock();
      mockKnex.transaction.mockResolvedValue(trxMock);

      await service.confirmDeleteAccount(mockToken);

      expect(trxMock.commit).toHaveBeenCalledTimes(1);
      expect(trxMock.rollback).not.toHaveBeenCalled();
    });

    it('should rollback transaction and throw on error', async () => {
      const trxMock = createTrxMock();
      mockKnex.transaction.mockResolvedValue(trxMock);

      // Make one of the removeByAccountId calls throw
      const productsRepo = module.get<ProductsRepository>(ProductsRepository);
      jest
        .spyOn(productsRepo, 'removeByAccountId')
        .mockRejectedValueOnce(new Error('Database error in transaction'));

      await expect(service.confirmDeleteAccount(mockToken)).rejects.toThrow(
        BadRequestException,
      );

      expect(trxMock.rollback).toHaveBeenCalledTimes(1);
      expect(trxMock.commit).not.toHaveBeenCalled();
    });

    it('should succeed when no related records exist (all removeByAccountId return 0)', async () => {
      const trxMock = createTrxMock();
      mockKnex.transaction.mockResolvedValue(trxMock);

      // Make accountsRepository.remove also return 0
      jest.spyOn(repository, 'remove').mockResolvedValue(0);

      const result = await service.confirmDeleteAccount(mockToken);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Conta excluída com sucesso');
      expect(result.summary).toEqual({
        profile_permissions: 0,
        stock_records: 0,
        inventory_counts: 0,
        stocks: 0,
        profiles: 0,
        products: 0,
        categories: 0,
        customers: 0,
        supliers: 0,
        movement_stages: 0,
        notifications: 0,
        chat_history: 0,
        users: 1,
        tokens_revoked: 0,
        tokens_deleted: 0,
        accounts: 0,
      });
    });
  });

  describe('register', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockPermissionsRepository.listAll = jest
        .fn()
        .mockResolvedValue([{ id: 'perm-1' }, { id: 'perm-2' }]);
      mockUserService.create.mockResolvedValue({ id: 'user-1' });
    });

    it('should create account, profiles, user, and send confirmation email', async () => {
      const result = await service.register(mockRegisterDto);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: mockRegisterDto.name,
          type: AccountType.USER,
        }),
      );
      expect(mockProfilesRepository.create).toHaveBeenCalledTimes(2);
      expect(mockPermissionsRepository.listAll).toHaveBeenCalled();
      expect(
        mockProfilesRepository.syncProfilePermissions,
      ).toHaveBeenCalledTimes(2);
      expect(mockUserService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: mockRegisterDto.name,
          email: mockRegisterDto.email,
          password: mockRegisterDto.password,
        }),
      );
      expect(mockTokensRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: TokenType.ACCOUNT_CONFIRMATION_TOKEN,
        }),
      );
      expect(
        mockEmailsService.sendAccountConfirmationMail,
      ).toHaveBeenCalledWith(
        mockRegisterDto.email,
        expect.any(String),
        mockRegisterDto.name,
      );
      expect(result).toEqual(mockAccount);
    });

    it('should throw BadRequestException when passwords do not match', async () => {
      await expect(
        service.register(mockRegisterDtoPasswordsMismatch),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.register(mockRegisterDtoPasswordsMismatch),
      ).rejects.toThrow('As senhas não coincidem');
    });

    it('should throw BadRequestException when email already exists', async () => {
      jest
        .spyOn(repository, 'findByEmailHash')
        .mockResolvedValue(mockAccount);

      await expect(service.register(mockRegisterDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.register(mockRegisterDto)).rejects.toThrow(
        'Já existe uma conta com este e-mail',
      );
    });
  });

  describe('confirmAccount', () => {
    const confirmationToken = 'confirmation-token-123';
    const mockTokenRecord = {
      id: 'token-1',
      token: confirmationToken,
      type: TokenType.ACCOUNT_CONFIRMATION_TOKEN,
      account_id: '1',
    };

    beforeEach(() => {
      jest.clearAllMocks();
      mockTokensRepository.findByToken.mockResolvedValue(mockTokenRecord);
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockAccount);
    });

    it('should confirm account successfully and send confirmed email', async () => {
      const result = await service.confirmAccount(confirmationToken);

      expect(mockTokensRepository.findByToken).toHaveBeenCalledWith(
        confirmationToken,
      );
      expect(repository.findOne).toHaveBeenCalledWith('1');
      expect(result.success).toBe(true);
      expect(result.message).toBe('Conta confirmada com sucesso');
      expect(mockEmailsService.sendAccountConfirmedMail).toHaveBeenCalledWith(
        mockAccount.email,
        mockAccount.name,
      );
    });

    it('should throw NotFoundException when token is not found', async () => {
      mockTokensRepository.findByToken.mockResolvedValue(null);

      await expect(service.confirmAccount('invalid-token')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when token type is wrong', async () => {
      mockTokensRepository.findByToken.mockResolvedValue({
        ...mockTokenRecord,
        type: TokenType.ACCOUNT_DELETION_TOKEN,
      });

      await expect(service.confirmAccount(confirmationToken)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when account is already confirmed', async () => {
      const confirmedAccount = { ...mockAccount, confirmed_at: new Date() };
      jest.spyOn(repository, 'findOne').mockResolvedValue(confirmedAccount);

      await expect(service.confirmAccount(confirmationToken)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.confirmAccount(confirmationToken)).rejects.toThrow(
        'Esta conta já foi confirmada',
      );
    });

    it('should rollback transaction and throw BadRequestException on failure', async () => {
      const trxMock = createTrxMock();
      trxMock.mockReturnValueOnce({
        where: jest.fn().mockReturnThis(),
        forUpdate: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ id: 'test-account' }),
        update: jest.fn().mockRejectedValue(new Error('DB error')),
        whereNull: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        clone: jest.fn().mockReturnThis(),
        insert: jest.fn().mockResolvedValue([{ id: 'test' }]),
        delete: jest.fn().mockResolvedValue(1),
        returning: jest.fn().mockResolvedValue([{ id: 'test' }]),
        modify: jest.fn().mockReturnThis(),
        count: jest.fn().mockReturnThis(),
      });
      mockKnex.transaction.mockResolvedValue(trxMock);

      await expect(service.confirmAccount(confirmationToken)).rejects.toThrow(
        BadRequestException,
      );
      expect(trxMock.rollback).toHaveBeenCalled();
    });

    it('should skip sending confirmed email when email is a hash', async () => {
      const hashAccount = {
        ...mockAccount,
        email: 'a'.repeat(64),
      };
      jest.spyOn(repository, 'findOne').mockResolvedValue(hashAccount);
      mockTokensRepository.findByToken.mockResolvedValue({
        ...mockTokenRecord,
        account_id: hashAccount.id,
      });

      const result = await service.confirmAccount(confirmationToken);

      expect(result.success).toBe(true);
      expect(mockEmailsService.sendAccountConfirmedMail).not.toHaveBeenCalled();
    });
  });

  describe('update - Asaas gateway_customer_id', () => {
    it('should call asaasService.createCustomer when gateway_customer_id is missing', async () => {
      const accountWithoutGateway = {
        ...mockAccount,
      } as Account;
      delete (accountWithoutGateway as any).gateway_customer_id;
      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(accountWithoutGateway);

      const updateWithCustomerFields = {
        document: '123.456.789-00',
        phone: '(11) 98765-4321',
        zipcode: '01234-567',
      };

      await service.update('mock-id', updateWithCustomerFields);

      expect(mockAsaasService.createCustomer).toHaveBeenCalledWith(
        expect.objectContaining({
          name: mockAccount.name,
          cpfCnpj: updateWithCustomerFields.document,
        }),
      );
      expect(repository.update).toHaveBeenCalledWith(
        'mock-id',
        expect.objectContaining({
          gateway_customer_id: 'cus_123456789',
        }),
      );
    });
  });
});
