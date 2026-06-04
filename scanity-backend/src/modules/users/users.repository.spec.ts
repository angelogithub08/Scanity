/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { KNEX_CONNECTION } from '../../infra/database/database.providers';
import { UsersRepository } from './users.repository';
import type { User } from './entities/user.entity';

function createMockKnex() {
  const queryBuilder = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    whereNull: jest.fn().mockReturnThis(),
    whereNotNull: jest.fn().mockReturnThis(),
    whereIn: jest.fn().mockReturnThis(),
    whereRaw: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    join: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    count: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    modify: jest.fn().mockReturnThis(),
    clone: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockResolvedValue(1),
    delete: jest.fn().mockResolvedValue(1),
    first: jest.fn().mockResolvedValue({}),
    then: jest.fn((resolve: (v: unknown) => void) => resolve(undefined)),
  };

  const knex = jest.fn().mockReturnValue(queryBuilder) as any;
  knex.raw = jest.fn().mockReturnValue({});
  const trx = jest.fn().mockReturnValue(queryBuilder) as any;
  trx.commit = jest.fn().mockResolvedValue(undefined);
  trx.rollback = jest.fn().mockResolvedValue(undefined);
  knex.transaction = jest.fn().mockResolvedValue(trx);
  return knex;
}

describe('UsersRepository', () => {
  let repository: UsersRepository;
  let mockKnex: ReturnType<typeof createMockKnex>;
  let queryBuilder: any;

  beforeEach(async () => {
    mockKnex = createMockKnex();
    queryBuilder = mockKnex();
    mockKnex.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository,
        { provide: KNEX_CONNECTION, useValue: mockKnex },
      ],
    }).compile();

    repository = module.get<UsersRepository>(UsersRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const baseUser: User = {
    id: 'user-1',
    name: 'João Silva',
    email: 'joao@email.com',
    password: 'hashed-password',
    token: 'some-token',
    account_id: 'account-1',
    profile_id: 'profile-1',
    is_active: true,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    account_name: 'Minha Empresa',
    account_type: 'business',
  };

  describe('findAll', () => {
    it('should return paginated users with account and profile joins', async () => {
      queryBuilder.first.mockResolvedValueOnce({ count: '10' });
      queryBuilder.then.mockImplementationOnce((resolve: (v: unknown) => void) =>
        resolve([baseUser]),
      );

      const result = await repository.findAll({ page: 1, limit: 10 });

      expect(result.total).toBe(10);
      expect(result.data).toEqual([baseUser]);
      expect(queryBuilder.leftJoin).toHaveBeenCalledWith(
        'accounts',
        'users.account_id',
        'accounts.id',
      );
      expect(queryBuilder.leftJoin).toHaveBeenCalledWith(
        'profiles',
        'users.profile_id',
        'profiles.id',
      );
    });
  });

  describe('list', () => {
    it('should return users with account join', async () => {
      queryBuilder.then.mockImplementationOnce((resolve: (v: unknown) => void) =>
        resolve([baseUser]),
      );

      const result = await repository.list({ account_id: 'account-1' });

      expect(result).toEqual([baseUser]);
      expect(queryBuilder.leftJoin).toHaveBeenCalledWith(
        'accounts',
        'users.account_id',
        'accounts.id',
      );
    });
  });

  describe('findOne', () => {
    it('should return user when found', async () => {
      queryBuilder.first.mockResolvedValueOnce(baseUser);

      const result = await repository.findOne('user-1');

      expect(result).toEqual(baseUser);
      expect(queryBuilder.leftJoin).toHaveBeenCalledWith(
        'accounts',
        'users.account_id',
        'accounts.id',
      );
      expect(queryBuilder.leftJoin).toHaveBeenCalledWith(
        'profiles',
        'users.profile_id',
        'profiles.id',
      );
    });

    it('should throw NotFoundException when not found', async () => {
      queryBuilder.first.mockResolvedValueOnce(undefined);

      await expect(repository.findOne('user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByToken', () => {
    it('should include password when showPassword is true', async () => {
      queryBuilder.first.mockResolvedValueOnce(baseUser);

      const result = await repository.findByToken('some-token', true);

      expect(result).toEqual(baseUser);
      expect(queryBuilder.select).toHaveBeenCalledWith(
        expect.arrayContaining(['users.password']),
      );
    });

    it('should exclude password when showPassword is false', async () => {
      queryBuilder.first.mockResolvedValueOnce(baseUser);

      const result = await repository.findByToken('some-token', false);

      expect(result).toEqual(baseUser);
      const selectCallArgs = queryBuilder.select.mock.calls[0][0];
      expect(selectCallArgs).not.toContain('users.password');
    });

    it('should throw NotFoundException when user not found', async () => {
      queryBuilder.first.mockResolvedValueOnce(undefined);

      await expect(
        repository.findByToken('nonexistent-token'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should include password when showPassword is true', async () => {
      queryBuilder.first.mockResolvedValueOnce(baseUser);

      const result = await repository.findByEmail('joao@email.com', true);

      expect(result).toEqual(baseUser);
      expect(queryBuilder.select).toHaveBeenCalledWith(
        expect.arrayContaining(['users.password']),
      );
    });

    it('should exclude password when showPassword is false', async () => {
      queryBuilder.first.mockResolvedValueOnce(baseUser);

      const result = await repository.findByEmail('joao@email.com', false);

      expect(result).toEqual(baseUser);
      const selectCallArgs = queryBuilder.select.mock.calls[0][0];
      expect(selectCallArgs).not.toContain('users.password');
    });

    it('should return undefined when user not found (no exception)', async () => {
      queryBuilder.first.mockResolvedValueOnce(undefined);

      const result = await repository.findByEmail('notfound@email.com');

      expect(result).toBeUndefined();
    });
  });

  describe('create', () => {
    const createDto = {
      name: 'Novo Usuário',
      email: 'novo@email.com',
      password: 'senha123',
      token: 'token-novo',
      account_id: 'account-1',
      profile_id: 'profile-1',
    };

    it('should insert and return the user', async () => {
      queryBuilder.then.mockImplementationOnce((resolve: (v: unknown) => void) =>
        resolve([baseUser]),
      );

      const result = await repository.create(createDto);

      expect(result).toEqual(baseUser);
      expect(queryBuilder.insert).toHaveBeenCalledWith(createDto);
      expect(queryBuilder.returning).toHaveBeenCalled();
    });

    it('should throw BadRequestException on unique violation (email)', async () => {
      const uniqueError = {
        code: '23505',
        constraint: 'users_email_unique',
        detail: 'Key (email)=(novo@email.com) already exists.',
      };
      queryBuilder.then.mockImplementationOnce((resolve, reject) => reject(uniqueError));

      await expect(repository.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should re-throw non-unique errors', async () => {
      queryBuilder.then.mockImplementationOnce((resolve, reject) => reject(new Error('Generic DB error')));

      await expect(repository.create(createDto)).rejects.toThrow(
        'Generic DB error',
      );
    });
  });

  describe('update', () => {
    it('should update and return the user', async () => {
      queryBuilder.update.mockResolvedValueOnce(1);
      queryBuilder.first.mockResolvedValueOnce(baseUser);

      const result = await repository.update('user-1', { name: 'Updated' });

      expect(result).toEqual(baseUser);
    });

    it('should throw NotFoundException when no rows updated', async () => {
      queryBuilder.update.mockResolvedValueOnce(0);

      await expect(
        repository.update('user-1', { name: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException on unique violation', async () => {
      const uniqueError = {
        code: '23505',
        constraint: 'users_email_unique',
      };
      queryBuilder.update.mockRejectedValueOnce(uniqueError);

      await expect(
        repository.update('user-1', { name: 'Updated' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should soft-delete and return count', async () => {
      queryBuilder.update.mockResolvedValueOnce(1);

      const result = await repository.remove('user-1');

      expect(result).toBe(1);
      expect(queryBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          deleted_at: expect.any(Date),
          updated_at: expect.any(Date),
        }),
      );
    });

    it('should throw NotFoundException when id not found', async () => {
      queryBuilder.update.mockResolvedValueOnce(0);

      await expect(repository.remove('user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deactivateByAccountId', () => {
    it('should update is_active, token, deleted_at for account', async () => {
      queryBuilder.update.mockResolvedValueOnce(3);

      const result = await repository.deactivateByAccountId('account-1');

      expect(result).toBe(3);
      expect(queryBuilder.where).toHaveBeenCalledWith({
        account_id: 'account-1',
      });
      expect(queryBuilder.whereNull).toHaveBeenCalledWith('deleted_at');
      expect(queryBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          is_active: false,
          token: null,
          deleted_at: expect.any(Date),
          updated_at: expect.any(Date),
        }),
      );
    });

    it('should return 0 when no active users found for account', async () => {
      queryBuilder.update.mockResolvedValueOnce(0);

      const result = await repository.deactivateByAccountId('empty-account');

      expect(result).toBe(0);
    });

    it('should use provided transaction instead of knex', async () => {
      const trx = jest.fn().mockReturnValue(queryBuilder) as any;
      trx.commit = jest.fn().mockResolvedValue(undefined);
      trx.rollback = jest.fn().mockResolvedValue(undefined);
      queryBuilder.update.mockResolvedValueOnce(2);

      const result = await repository.deactivateByAccountId('account-1', trx);

      expect(result).toBe(2);
      expect(trx).toHaveBeenCalled();
      expect(mockKnex).not.toHaveBeenCalled();
    });

    it('should throw and log error on failure', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'error');
      queryBuilder.update.mockRejectedValueOnce(new Error('DB error'));

      await expect(
        repository.deactivateByAccountId('account-1'),
      ).rejects.toThrow('DB error');
      expect(loggerSpy).toHaveBeenCalled();
    });
  });
});
