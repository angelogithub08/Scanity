/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { Logger, NotFoundException } from '@nestjs/common';
import { KNEX_CONNECTION } from '../../infra/database/database.providers';
import { TokensRepository } from './tokens.repository';
import type { Token, TokenType } from './entities/token.entity';

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

describe('TokensRepository', () => {
  let repository: TokensRepository;
  let mockKnex: ReturnType<typeof createMockKnex>;
  let queryBuilder: any;

  beforeEach(async () => {
    mockKnex = createMockKnex();
    queryBuilder = mockKnex();
    mockKnex.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokensRepository,
        { provide: KNEX_CONNECTION, useValue: mockKnex },
      ],
    }).compile();

    repository = module.get<TokensRepository>(TokensRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockToken: Token = {
    id: 'token-1',
    type: 'REFRESH_TOKEN' as TokenType,
    token: 'eyJhbGciOiJIUzI1NiIs...',
    account_id: 'account-1',
    user_id: 'user-1',
    revoked_at: null as any,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
  };

  describe('findAll', () => {
    it('should return paginated tokens with user joins', async () => {
      queryBuilder.first.mockResolvedValueOnce({ count: '3' });
      queryBuilder.then.mockImplementationOnce((resolve: (v: unknown) => void) =>
        resolve([mockToken]),
      );

      const result = await repository.findAll({ page: 1, limit: 10 });

      expect(result.total).toBe(3);
      expect(result.data).toEqual([mockToken]);
      expect(queryBuilder.leftJoin).toHaveBeenCalledWith(
        'users',
        'tokens.user_id',
        'users.id',
      );
    });

    it('should throw and log error on failure', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'error');
      queryBuilder.first.mockRejectedValueOnce(new Error('DB error'));

      await expect(repository.findAll({})).rejects.toThrow('DB error');
      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('should return tokens matching filters', async () => {
      queryBuilder.then.mockImplementationOnce((resolve: (v: unknown) => void) =>
        resolve([mockToken]),
      );

      const result = await repository.list({ account_id: 'account-1' });

      expect(result).toEqual([mockToken]);
    });
  });

  describe('findOne', () => {
    it('should return token when found', async () => {
      queryBuilder.first.mockResolvedValueOnce(mockToken);

      const result = await repository.findOne('token-1');

      expect(result).toEqual(mockToken);
    });

    it('should throw NotFoundException when not found', async () => {
      queryBuilder.first.mockResolvedValueOnce(undefined);

      await expect(repository.findOne('token-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByToken', () => {
    it('should return token when found with deleted_at null', async () => {
      queryBuilder.first.mockResolvedValueOnce(mockToken);

      const result = await repository.findByToken('eyJhbGciOiJIUzI1NiIs...');

      expect(result).toEqual(mockToken);
      expect(queryBuilder.where).toHaveBeenCalledWith({
        token: 'eyJhbGciOiJIUzI1NiIs...',
      });
      expect(queryBuilder.whereNull).toHaveBeenCalledWith('revoked_at');
      expect(queryBuilder.whereNull).toHaveBeenCalledWith('deleted_at');
    });

    it('should return null when token not found', async () => {
      queryBuilder.first.mockResolvedValueOnce(undefined);

      const result = await repository.findByToken('nonexistent-token');

      expect(result).toBeNull();
    });

    it('should throw and log error on failure', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'error');
      queryBuilder.first.mockRejectedValueOnce(new Error('DB error'));

      await expect(
        repository.findByToken('some-token'),
      ).rejects.toThrow('DB error');
      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should insert and return the token', async () => {
      queryBuilder.then.mockImplementationOnce((resolve: (v: unknown) => void) =>
        resolve([mockToken]),
      );

      const result = await repository.create({
        type: 'REFRESH_TOKEN' as TokenType,
        token: 'eyJhbGciOiJIUzI1NiIs...',
        account_id: 'account-1',
        user_id: 'user-1',
      });

      expect(result).toEqual(mockToken);
    });
  });

  describe('update', () => {
    it('should update and return the token', async () => {
      queryBuilder.update.mockResolvedValueOnce(1);
      queryBuilder.first.mockResolvedValueOnce(mockToken);

      const result = await repository.update('token-1', {
        type: 'ACCESS_TOKEN' as TokenType,
      });

      expect(result).toEqual(mockToken);
    });

    it('should throw NotFoundException when no rows updated', async () => {
      queryBuilder.update.mockResolvedValueOnce(0);

      await expect(
        repository.update('token-1', { type: 'ACCESS_TOKEN' as TokenType }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should hard delete (call knex.delete())', async () => {
      queryBuilder.delete.mockResolvedValueOnce(1);

      const result = await repository.remove('token-1');

      expect(result).toBe(1);
      expect(queryBuilder.where).toHaveBeenCalledWith({ id: 'token-1' });
      expect(queryBuilder.delete).toHaveBeenCalled();
      expect(queryBuilder.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when id not found', async () => {
      queryBuilder.delete.mockResolvedValueOnce(0);

      await expect(repository.remove('token-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw and log error on failure', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'error');
      queryBuilder.delete.mockRejectedValueOnce(new Error('DB error'));

      await expect(repository.remove('token-1')).rejects.toThrow('DB error');
      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('revoke', () => {
    it('should update revoked_at when token found', async () => {
      queryBuilder.update.mockResolvedValueOnce(1);

      await repository.revoke('eyJhbGciOiJIUzI1NiIs...');

      expect(queryBuilder.where).toHaveBeenCalledWith({
        token: 'eyJhbGciOiJIUzI1NiIs...',
      });
      expect(queryBuilder.whereNull).toHaveBeenCalledWith('revoked_at');
      expect(queryBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          revoked_at: expect.any(Date),
        }),
      );
    });

    it('should not throw when token not found (count 0)', async () => {
      queryBuilder.update.mockResolvedValueOnce(0);

      await expect(
        repository.revoke('nonexistent-token'),
      ).resolves.toBeUndefined();
    });

    it('should throw and log error on failure', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'error');
      queryBuilder.update.mockRejectedValueOnce(new Error('DB error'));

      await expect(repository.revoke('some-token')).rejects.toThrow('DB error');
      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('revokeByAccountId', () => {
    it('should revoke all tokens for account and return count', async () => {
      queryBuilder.update.mockResolvedValueOnce(5);

      const result = await repository.revokeByAccountId('account-1');

      expect(result).toBe(5);
      expect(queryBuilder.where).toHaveBeenCalledWith({
        account_id: 'account-1',
      });
      expect(queryBuilder.whereNull).toHaveBeenCalledWith('revoked_at');
    });
  });

  describe('revokeAndRemoveByAccountId', () => {
    it('should call both update and delete, return counts', async () => {
      queryBuilder.update.mockResolvedValueOnce(3).mockResolvedValueOnce(2);

      const result = await repository.revokeAndRemoveByAccountId('account-1');

      expect(result).toEqual({ revoked: 3, deleted: 2 });
      expect(mockKnex).toHaveBeenCalledTimes(2);
      expect(queryBuilder.update).toHaveBeenCalledTimes(2);
      expect(queryBuilder.whereNull).toHaveBeenCalledWith('revoked_at');
      expect(queryBuilder.whereNull).toHaveBeenCalledWith('deleted_at');
    });

    it('should handle when account_id has no tokens to revoke', async () => {
      queryBuilder.update.mockResolvedValueOnce(0).mockResolvedValueOnce(0);

      const result = await repository.revokeAndRemoveByAccountId('empty-account');

      expect(result).toEqual({ revoked: 0, deleted: 0 });
    });

    it('should use provided transaction instead of knex', async () => {
      const trx = jest.fn().mockReturnValue(queryBuilder) as any;
      trx.commit = jest.fn().mockResolvedValue(undefined);
      trx.rollback = jest.fn().mockResolvedValue(undefined);
      queryBuilder.update.mockResolvedValueOnce(1).mockResolvedValueOnce(1);

      const result = await repository.revokeAndRemoveByAccountId(
        'account-1',
        trx,
      );

      expect(result).toEqual({ revoked: 1, deleted: 1 });
      expect(trx).toHaveBeenCalledTimes(2);
      expect(mockKnex).not.toHaveBeenCalled();
    });

    it('should throw and log error on failure', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'error');
      queryBuilder.update.mockRejectedValueOnce(new Error('DB error'));

      await expect(
        repository.revokeAndRemoveByAccountId('account-1'),
      ).rejects.toThrow('DB error');
      expect(loggerSpy).toHaveBeenCalled();
    });
  });
});
