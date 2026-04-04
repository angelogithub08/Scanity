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

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  last_page: number;
}

describe('AccountsService', () => {
  let service: AccountsService;
  let repository: AccountsRepository;

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

  const mockUserService = {};

  const mockEmailsService = {
    sendEmail: jest.fn().mockResolvedValue(true),
  };

  const mockTokensRepository = {};

  const mockAsaasService = {
    createCustomer: jest.fn().mockResolvedValue({ id: 'cus_123456789' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
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
          provide: AccountsRepository,
          useValue: {
            create: jest.fn().mockResolvedValue(mockAccount),
            findAll: jest.fn().mockResolvedValue(mockPaginatedResult),
            list: jest.fn().mockResolvedValue([mockAccount]),
            findOne: jest.fn().mockResolvedValue(mockAccount),
            update: jest.fn().mockResolvedValue(mockUpdatedAccount),
            remove: jest.fn().mockResolvedValue(1),
          },
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

      expect(repository.create).toHaveBeenCalledWith(mockCreateDto);
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

      expect(repository.update).toHaveBeenCalledWith('mock-id', mockUpdateDto);
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
});
