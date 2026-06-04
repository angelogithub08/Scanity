/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { KNEX_CONNECTION } from '../../infra/database/database.providers';
import { ProductsRepository } from './products.repository';

describe('ProductsRepository', () => {
  let repository: ProductsRepository;
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
    id: 'prod-1',
    name: 'Test Product',
    value: 100,
    description: 'A test product',
    barcode: '123456789',
    category_id: 'cat-1',
    account_id: 'acc-1',
    thumbnail_path: 'products/test.jpg',
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
        ProductsRepository,
        { provide: KNEX_CONNECTION, useValue: knexInstance },
      ],
    }).compile();

    repository = module.get<ProductsRepository>(ProductsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated results with categories join', async () => {
      mockQueryBuilder.first = jest
        .fn()
        .mockResolvedValue({ count: 1 });
      mockQueryBuilder.then = jest
        .fn()
        .mockImplementation((resolve) => resolve([mockRecord]));

      const result = await repository.findAll({ page: 1, limit: 10 });

      expect(result).toEqual(mockPaginatedData);
      expect(mockKnex).toHaveBeenCalledWith('products');
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
        'categories',
        'products.category_id',
        'categories.id',
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('name', 'asc');
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
    it('should return all records', async () => {
      mockQueryBuilder.then = jest
        .fn()
        .mockImplementation((resolve) => resolve([mockRecord]));

      const result = await repository.list({});

      expect(result).toEqual([mockRecord]);
      expect(mockKnex).toHaveBeenCalledWith('products');
      expect(mockQueryBuilder.select).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      mockQueryBuilder.then = jest.fn().mockImplementation(() => {
        throw new Error('DB error');
      });

      await expect(repository.list({})).rejects.toThrow('DB error');
    });
  });

  describe('findOneByBarcode', () => {
    it('should return a product when found', async () => {
      mockQueryBuilder.first = jest
        .fn()
        .mockResolvedValue(mockRecord);

      const result = await repository.findOneByBarcode(
        'acc-1',
        '123456789',
      );

      expect(result).toEqual(mockRecord);
      expect(mockKnex).toHaveBeenCalledWith('products');
      expect(mockQueryBuilder.whereNull).toHaveBeenCalledWith('deleted_at');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith({
        account_id: 'acc-1',
        barcode: '123456789',
      });
      expect(mockQueryBuilder.select).toHaveBeenCalled();
      expect(mockQueryBuilder.first).toHaveBeenCalled();
    });

    it('should return null when product not found', async () => {
      mockQueryBuilder.first = jest.fn().mockResolvedValue(undefined);

      const result = await repository.findOneByBarcode(
        'acc-1',
        '999999999',
      );

      expect(result).toBeNull();
    });

    it('should trim the barcode before lookup', async () => {
      mockQueryBuilder.first = jest
        .fn()
        .mockResolvedValue(mockRecord);

      await repository.findOneByBarcode('acc-1', '  123456789  ');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith({
        account_id: 'acc-1',
        barcode: '123456789',
      });
    });

    it('should handle database errors', async () => {
      mockQueryBuilder.first = jest
        .fn()
        .mockRejectedValue(new Error('DB error'));

      await expect(
        repository.findOneByBarcode('acc-1', '123456789'),
      ).rejects.toThrow('DB error');
    });
  });

  describe('findOne', () => {
    it('should return a record by id', async () => {
      mockQueryBuilder.first = jest
        .fn()
        .mockResolvedValue(mockRecord);

      const result = await repository.findOne('prod-1');

      expect(result).toEqual(mockRecord);
      expect(mockKnex).toHaveBeenCalledWith('products');
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
      name: 'Test Product',
      value: 100,
      description: 'A test product',
      barcode: '123456789',
      category_id: 'cat-1',
      account_id: 'acc-1',
    };

    it('should create a record', async () => {
      mockQueryBuilder.then = jest
        .fn()
        .mockImplementation((resolve) => resolve([mockRecord]));

      const result = await repository.create(createDto);

      expect(result).toEqual(mockRecord);
      expect(mockKnex).toHaveBeenCalledWith('products');
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
    const updateDto = { name: 'Updated Product' };

    it('should update and return the record', async () => {
      mockQueryBuilder.then = jest
        .fn()
        .mockImplementation((resolve) => resolve(1));
      mockQueryBuilder.first = jest
        .fn()
        .mockResolvedValue({ ...mockRecord, name: 'Updated Product' });

      const result = await repository.update('prod-1', updateDto);

      expect(result.name).toBe('Updated Product');
      expect(mockKnex).toHaveBeenCalledWith('products');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith({ id: 'prod-1' });
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

      const result = await repository.remove('prod-1');

      expect(result).toBe(1);
      expect(mockKnex).toHaveBeenCalledWith('products');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith({ id: 'prod-1' });
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

  describe('removeByAccountId', () => {
    it('should remove records by account id', async () => {
      mockQueryBuilder.then = jest
        .fn()
        .mockImplementation((resolve) => resolve(3));

      const result = await repository.removeByAccountId('account-123');

      expect(result).toBe(3);
      expect(mockKnex).toHaveBeenCalledWith('products');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith({
        account_id: 'account-123',
      });
      expect(mockQueryBuilder.whereNull).toHaveBeenCalledWith('deleted_at');
      expect(mockQueryBuilder.update).toHaveBeenCalled();
    });

    it('should accept optional transaction', async () => {
      mockQueryBuilder.then = jest
        .fn()
        .mockImplementation((resolve) => resolve(2));
      const trx = await mockKnex.transaction();

      const result = await repository.removeByAccountId(
        'account-123',
        trx,
      );

      expect(result).toBe(2);
      expect(trx).toHaveBeenCalledWith('products');
    });

    it('should handle database errors', async () => {
      mockQueryBuilder.then = jest.fn().mockImplementation(() => {
        throw new Error('DB error');
      });

      await expect(
        repository.removeByAccountId('account-123'),
      ).rejects.toThrow('DB error');
    });
  });
});
