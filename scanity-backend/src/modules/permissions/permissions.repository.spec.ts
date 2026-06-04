/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { KNEX_CONNECTION } from '../../infra/database/database.providers';
import { PermissionsRepository } from './permissions.repository';

describe('PermissionsRepository', () => {
  let repository: PermissionsRepository;
  let mockQueryBuilder: any;
  let mockKnex: any;

  function createMockKnex() {
    mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      whereNull: jest.fn().mockReturnThis(),
      whereNotNull: jest.fn().mockReturnThis(),
      whereIn: jest.fn().mockReturnThis(),
      whereNotIn: jest.fn().mockReturnThis(),
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
      clone: jest.fn().mockReturnThis(),
      modify: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue({ count: 1 }),
      then: jest.fn(),
    };

    mockKnex = jest.fn().mockReturnValue(mockQueryBuilder) as any;
    mockKnex.transaction = jest.fn().mockImplementation(async () => {
      const trx = jest.fn().mockReturnValue(mockQueryBuilder) as any;
      trx.commit = jest.fn().mockResolvedValue(undefined);
      trx.rollback = jest.fn().mockResolvedValue(undefined);
      return trx;
    });
    return mockKnex;
  }

  const mockRecord = {
    id: 'perm-1',
    name: 'Create User',
    key_group: 'users',
    key: 'users.create',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
  };

  const mockPaginatedData = {
    data: [mockRecord],
    total: 1,
    page: 1,
    last_page: 1,
    limit: 10,
  };

  beforeEach(async () => {
    const knexInstance = createMockKnex();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsRepository,
        { provide: KNEX_CONNECTION, useValue: knexInstance },
      ],
    }).compile();

    repository = module.get<PermissionsRepository>(PermissionsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      mockQueryBuilder.first = jest
        .fn()
        .mockResolvedValue({ count: 1 });
      mockQueryBuilder.then = jest
        .fn()
        .mockImplementation((resolve) => resolve([mockRecord]));

      const result = await repository.findAll({ page: 1, limit: 10 });

      expect(result).toEqual(mockPaginatedData);
      expect(mockKnex).toHaveBeenCalledWith('permissions');
      expect(mockQueryBuilder.clone).toHaveBeenCalledTimes(2);
      expect(mockQueryBuilder.count).toHaveBeenCalledWith('* as count');
      expect(mockQueryBuilder.first).toHaveBeenCalledTimes(1);
      expect(mockQueryBuilder.select).toHaveBeenCalled();
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.offset).toHaveBeenCalledWith(0);
    });

    it('should handle database errors', async () => {
      mockQueryBuilder.first = jest
        .fn()
        .mockRejectedValue(new Error('DB error'));

      await expect(
        repository.findAll({ page: 1, limit: 10 }),
      ).rejects.toThrow('DB error');
    });
  });

  describe('list', () => {
    it('should return permissions filtered by profile_id with inner join', async () => {
      mockQueryBuilder.then = jest
        .fn()
        .mockImplementation((resolve) => resolve([mockRecord]));

      const result = await repository.list({
        profile_id: 'profile-1',
      });

      expect(result).toEqual([mockRecord]);
      expect(mockKnex).toHaveBeenCalledWith('permissions');
      expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith(
        'profile_permissions',
        'permissions.id',
        'profile_permissions.permission_id',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'profile_permissions.profile_id',
        'profile-1',
      );
      expect(mockQueryBuilder.select).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      mockQueryBuilder.then = jest.fn().mockImplementation(() => {
        throw new Error('DB error');
      });

      await expect(
        repository.list({ profile_id: 'profile-1' }),
      ).rejects.toThrow('DB error');
    });
  });

  describe('listAll', () => {
    it('should list all permissions ordered by name', async () => {
      mockQueryBuilder.then = jest
        .fn()
        .mockImplementation((resolve) => resolve([mockRecord]));

      const result = await repository.listAll();

      expect(result).toEqual([mockRecord]);
      expect(mockKnex).toHaveBeenCalledWith('permissions');
      expect(mockQueryBuilder.whereNull).toHaveBeenCalledWith(
        'permissions.deleted_at',
      );
      expect(mockQueryBuilder.select).toHaveBeenCalled();
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'permissions.name',
        'asc',
      );
    });

    it('should filter out key groups when key_group_not_in is provided', async () => {
      mockQueryBuilder.then = jest
        .fn()
        .mockImplementation((resolve) => resolve([mockRecord]));

      const result = await repository.listAll({
        key_group_not_in: ['admin', 'superadmin'],
      });

      expect(result).toEqual([mockRecord]);
      expect(mockQueryBuilder.whereNotIn).toHaveBeenCalledWith(
        'permissions.key_group',
        ['admin', 'superadmin'],
      );
    });

    it('should handle database errors', async () => {
      mockQueryBuilder.then = jest.fn().mockImplementation(() => {
        throw new Error('DB error');
      });

      await expect(repository.listAll()).rejects.toThrow('DB error');
    });
  });

  describe('findOne', () => {
    it('should return a record by id', async () => {
      mockQueryBuilder.first = jest
        .fn()
        .mockResolvedValue(mockRecord);

      const result = await repository.findOne('perm-1');

      expect(result).toEqual(mockRecord);
      expect(mockKnex).toHaveBeenCalledWith('permissions');
      expect(mockQueryBuilder.select).toHaveBeenCalled();
      expect(mockQueryBuilder.first).toHaveBeenCalled();
    });

    it('should throw NotFoundException when not found', async () => {
      mockQueryBuilder.first = jest.fn().mockResolvedValue(undefined);

      await expect(repository.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle database errors', async () => {
      mockQueryBuilder.first = jest
        .fn()
        .mockRejectedValue(new Error('DB error'));

      await expect(repository.findOne('error-id')).rejects.toThrow(
        'DB error',
      );
    });
  });

  describe('create', () => {
    const createDto = {
      name: 'Create User',
      key_group: 'users',
      key: 'users.create',
    };

    it('should create a record', async () => {
      mockQueryBuilder.then = jest
        .fn()
        .mockImplementation((resolve) => resolve([mockRecord]));

      const result = await repository.create(createDto);

      expect(result).toEqual(mockRecord);
      expect(mockKnex).toHaveBeenCalledWith('permissions');
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(createDto);
      expect(mockQueryBuilder.returning).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      mockQueryBuilder.then = jest.fn().mockImplementation(() => {
        throw new Error('DB error');
      });

      await expect(repository.create(createDto)).rejects.toThrow(
        'DB error',
      );
    });
  });

  describe('update', () => {
    const updateDto = { name: 'Updated Permission' };

    it('should update and return the record', async () => {
      mockQueryBuilder.then = jest
        .fn()
        .mockImplementation((resolve) => resolve(1));
      mockQueryBuilder.first = jest
        .fn()
        .mockResolvedValue({ ...mockRecord, name: 'Updated Permission' });

      const result = await repository.update('perm-1', updateDto);

      expect(result.name).toBe('Updated Permission');
      expect(mockKnex).toHaveBeenCalledWith('permissions');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith({
        id: 'perm-1',
      });
      expect(mockQueryBuilder.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when record not found', async () => {
      mockQueryBuilder.then = jest
        .fn()
        .mockImplementation((resolve) => resolve(0));

      await expect(
        repository.update('nonexistent', updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle database errors', async () => {
      mockQueryBuilder.then = jest.fn().mockImplementation(() => {
        throw new Error('DB error');
      });

      await expect(
        repository.update('error-id', updateDto),
      ).rejects.toThrow('DB error');
    });
  });

  describe('remove', () => {
    it('should soft delete a record', async () => {
      mockQueryBuilder.then = jest
        .fn()
        .mockImplementation((resolve) => resolve(1));

      const result = await repository.remove('perm-1');

      expect(result).toBe(1);
      expect(mockKnex).toHaveBeenCalledWith('permissions');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith({
        id: 'perm-1',
      });
      expect(mockQueryBuilder.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when record not found', async () => {
      mockQueryBuilder.then = jest
        .fn()
        .mockImplementation((resolve) => resolve(0));

      await expect(repository.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle database errors', async () => {
      mockQueryBuilder.then = jest.fn().mockImplementation(() => {
        throw new Error('DB error');
      });

      await expect(repository.remove('error-id')).rejects.toThrow(
        'DB error',
      );
    });
  });

  describe('findByProfileId', () => {
    it('should return permissions for a profile with left join', async () => {
      mockQueryBuilder.then = jest
        .fn()
        .mockImplementation((resolve) => resolve([mockRecord]));

      const result = await repository.findByProfileId('profile-1');

      expect(result).toEqual([mockRecord]);
      expect(mockKnex).toHaveBeenCalledWith('permissions');
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
        'profile_permissions',
        'permissions.id',
        'profile_permissions.permission_id',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'profile_permissions.profile_id',
        'profile-1',
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'permissions.name',
        'asc',
      );
      expect(mockQueryBuilder.select).toHaveBeenCalled();
    });

    it('should return empty array when no permissions assigned', async () => {
      mockQueryBuilder.then = jest
        .fn()
        .mockImplementation((resolve) => resolve([]));

      const result = await repository.findByProfileId('profile-empty');

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      mockQueryBuilder.then = jest.fn().mockImplementation(() => {
        throw new Error('DB error');
      });

      await expect(
        repository.findByProfileId('profile-1'),
      ).rejects.toThrow('DB error');
    });
  });
});
