/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { Logger, NotFoundException } from '@nestjs/common';
import { KNEX_CONNECTION } from '../../infra/database/database.providers';
import { ProfilesRepository } from './profiles.repository';
import type { Profile } from './entities/profile.entity';

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

describe('ProfilesRepository', () => {
  let repository: ProfilesRepository;
  let mockKnex: ReturnType<typeof createMockKnex>;
  let queryBuilder: any;

  beforeEach(async () => {
    mockKnex = createMockKnex();
    queryBuilder = mockKnex();
    mockKnex.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfilesRepository,
        { provide: KNEX_CONNECTION, useValue: mockKnex },
      ],
    }).compile();

    repository = module.get<ProfilesRepository>(ProfilesRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockProfile: Profile = {
    id: 'profile-1',
    name: 'Admin',
    key: 'admin',
    account_id: 'account-1',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
  };

  describe('findAll', () => {
    it('should return paginated profiles', async () => {
      queryBuilder.first.mockResolvedValueOnce({ count: '5' });
      queryBuilder.then.mockImplementationOnce((resolve: (v: unknown) => void) =>
        resolve([mockProfile]),
      );

      const result = await repository.findAll({ page: 1, limit: 10 });

      expect(result.total).toBe(5);
      expect(result.data).toEqual([mockProfile]);
      expect(result.page).toBe(1);
      expect(result.last_page).toBe(1);
    });

    it('should throw and log error on failure', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'error');
      queryBuilder.first.mockRejectedValueOnce(new Error('DB error'));

      await expect(repository.findAll({})).rejects.toThrow('DB error');
      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('should return profiles matching filters', async () => {
      queryBuilder.then.mockImplementationOnce((resolve: (v: unknown) => void) =>
        resolve([mockProfile]),
      );

      const result = await repository.list({ account_id: 'account-1' });

      expect(result).toEqual([mockProfile]);
    });

    it('should throw and log error on failure', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'error');
      queryBuilder.then.mockImplementationOnce((resolve, reject) => reject(new Error('DB error')));

      await expect(repository.list({})).rejects.toThrow('DB error');
      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return profile when found', async () => {
      queryBuilder.first.mockResolvedValueOnce(mockProfile);

      const result = await repository.findOne('profile-1');

      expect(result).toEqual(mockProfile);
    });

    it('should throw NotFoundException when not found', async () => {
      queryBuilder.first.mockResolvedValueOnce(undefined);

      await expect(repository.findOne('profile-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw and log error on failure', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'error');
      queryBuilder.first.mockRejectedValueOnce(new Error('DB error'));

      await expect(repository.findOne('profile-1')).rejects.toThrow('DB error');
      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should insert and return the profile', async () => {
      queryBuilder.then.mockImplementationOnce((resolve: (v: unknown) => void) =>
        resolve([mockProfile]),
      );

      const result = await repository.create({
        name: 'Admin',
        key: 'admin',
        account_id: 'account-1',
      });

      expect(mockKnex).toHaveBeenCalledWith('profiles');
      expect(queryBuilder.insert).toHaveBeenCalled();
      expect(queryBuilder.returning).toHaveBeenCalled();
      expect(result).toEqual(mockProfile);
    });

    it('should throw and log error on failure', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'error');
      queryBuilder.then.mockImplementationOnce((resolve, reject) => reject(new Error('DB error')));

      await expect(
        repository.create({
          name: 'Admin',
          key: 'admin',
          account_id: 'account-1',
        }),
      ).rejects.toThrow('DB error');
      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update and return the profile', async () => {
      queryBuilder.update.mockResolvedValueOnce(1);
      queryBuilder.first.mockResolvedValueOnce(mockProfile);

      const result = await repository.update('profile-1', { name: 'Updated' });

      expect(result).toEqual(mockProfile);
    });

    it('should throw NotFoundException when no rows updated', async () => {
      queryBuilder.update.mockResolvedValueOnce(0);

      await expect(
        repository.update('profile-1', { name: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft-delete and return count', async () => {
      queryBuilder.update.mockResolvedValueOnce(1);

      const result = await repository.remove('profile-1');

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

      await expect(repository.remove('profile-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeByAccountId', () => {
    it('should soft-delete profiles for account', async () => {
      queryBuilder.update.mockResolvedValueOnce(3);

      const result = await repository.removeByAccountId('account-1');

      expect(result).toBe(3);
    });

    it('should use transaction when provided', async () => {
      const trx = jest.fn().mockReturnValue(queryBuilder) as any;
      trx.commit = jest.fn().mockResolvedValue(undefined);
      trx.rollback = jest.fn().mockResolvedValue(undefined);
      queryBuilder.update.mockResolvedValueOnce(2);

      const result = await repository.removeByAccountId('account-1', trx);

      expect(result).toBe(2);
    });
  });

  describe('syncProfilePermissions', () => {
    const profileId = 'profile-1';
    const permissionIds = ['perm-1', 'perm-2', 'perm-3'];

    it('should delete old permissions and insert new ones, then commit', async () => {
      queryBuilder.first.mockResolvedValueOnce(mockProfile);
      queryBuilder.delete.mockResolvedValueOnce(5);
      queryBuilder.then.mockImplementationOnce((resolve: (v: unknown) => void) =>
        resolve(undefined),
      );

      const result = await repository.syncProfilePermissions(
        profileId,
        permissionIds,
      );

      expect(result).toEqual({ inserted: 3, deleted: 5 });
      expect(mockKnex.transaction).toHaveBeenCalled();
      expect(queryBuilder.delete).toHaveBeenCalledWith();
      expect(queryBuilder.insert).toHaveBeenCalledWith([
        { profile_id: profileId, permission_id: 'perm-1' },
        { profile_id: profileId, permission_id: 'perm-2' },
        { profile_id: profileId, permission_id: 'perm-3' },
      ]);
    });

    it('should handle empty permission list', async () => {
      queryBuilder.first.mockResolvedValueOnce(mockProfile);
      queryBuilder.delete.mockResolvedValueOnce(2);

      const result = await repository.syncProfilePermissions(profileId, []);

      expect(result).toEqual({ inserted: 0, deleted: 2 });
      expect(queryBuilder.insert).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when profile does not exist', async () => {
      queryBuilder.first.mockResolvedValueOnce(undefined);

      await expect(
        repository.syncProfilePermissions(profileId, permissionIds),
      ).rejects.toThrow(NotFoundException);
    });

    it('should rollback and re-throw when delete fails', async () => {
      const trx = await mockKnex.transaction();
      queryBuilder.first.mockResolvedValueOnce(mockProfile);
      queryBuilder.delete.mockRejectedValueOnce(new Error('Delete failed'));

      await expect(
        repository.syncProfilePermissions(profileId, permissionIds),
      ).rejects.toThrow('Delete failed');
      expect(trx.rollback).toHaveBeenCalled();
      expect(trx.commit).not.toHaveBeenCalled();
    });

    it('should rollback and re-throw when insert fails', async () => {
      const trx = await mockKnex.transaction();
      queryBuilder.first.mockResolvedValueOnce(mockProfile);
      queryBuilder.delete.mockResolvedValueOnce(3);
      queryBuilder.then.mockImplementationOnce((resolve, reject) => reject(new Error('Insert failed')));

      await expect(
        repository.syncProfilePermissions(profileId, permissionIds),
      ).rejects.toThrow('Insert failed');
      expect(trx.rollback).toHaveBeenCalled();
      expect(trx.commit).not.toHaveBeenCalled();
    });

    it('should verify trx has commit and rollback methods', async () => {
      queryBuilder.first.mockResolvedValueOnce(mockProfile);
      queryBuilder.delete.mockResolvedValueOnce(0);
      queryBuilder.then.mockImplementationOnce((resolve: (v: unknown) => void) =>
        resolve(undefined),
      );

      const result = await repository.syncProfilePermissions(profileId, []);

      expect(result).toEqual({ inserted: 0, deleted: 0 });
    });
  });
});
