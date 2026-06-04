/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { KNEX_CONNECTION } from '../../infra/database/database.providers';
import { StocksRepository } from './stocks.repository';

describe('StocksRepository', () => {
  let repository: StocksRepository;
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
    id: 'stock-1',
    product_id: 'prod-1',
    current_quantity: 10,
    min_quantity: 2,
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
        StocksRepository,
        { provide: KNEX_CONNECTION, useValue: knexInstance },
      ],
    }).compile();

    repository = module.get<StocksRepository>(StocksRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findAll', () => {
    const params = { account_id: 'acc-1', page: 1, limit: 10 };

    it('should return paginated results with products join', async () => {
      mockQueryBuilder.first = jest
        .fn()
        .mockResolvedValue({ count: 5 });
      mockQueryBuilder.then = jest
        .fn()
        .mockImplementation((resolve) => resolve([mockRecord]));

      const result = await repository.findAll(params);

      expect(result.data).toEqual([mockRecord]);
      expect(result.total).toBe(5);
      expect(mockKnex).toHaveBeenCalledWith('stocks');
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
        'products',
        'stocks.product_id',
        'products.id',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'products.account_id',
        'acc-1',
      );
      expect(mockQueryBuilder.select).toHaveBeenCalled();
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.offset).toHaveBeenCalledWith(0);
    });

    it('should handle database errors', async () => {
      mockQueryBuilder.first = jest
        .fn()
        .mockRejectedValue(new Error('DB error'));

      await expect(repository.findAll(params)).rejects.toThrow('DB error');
    });
  });

  describe('list', () => {
    const params = { account_id: 'acc-1' };

    it('should return all records with products join', async () => {
      mockQueryBuilder.then = jest
        .fn()
        .mockImplementation((resolve) => resolve([mockRecord]));

      const result = await repository.list(params);

      expect(result).toEqual([mockRecord]);
      expect(mockKnex).toHaveBeenCalledWith('stocks');
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
        'products',
        'stocks.product_id',
        'products.id',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'products.account_id',
        'acc-1',
      );
      expect(mockQueryBuilder.select).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      mockQueryBuilder.then = jest.fn().mockImplementation(() => {
        throw new Error('DB error');
      });

      await expect(repository.list(params)).rejects.toThrow('DB error');
    });
  });

  describe('findOne', () => {
    it('should return a record with products join', async () => {
      mockQueryBuilder.first = jest
        .fn()
        .mockResolvedValue(mockRecord);

      const result = await repository.findOne('stock-1');

      expect(result).toEqual(mockRecord);
      expect(mockKnex).toHaveBeenCalledWith('stocks');
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
        'products',
        'stocks.product_id',
        'products.id',
      );
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
      product_id: 'prod-1',
      current_quantity: 10,
      min_quantity: 2,
    };

    it('should create a record', async () => {
      mockQueryBuilder.then = jest
        .fn()
        .mockImplementation((resolve) => resolve([mockRecord]));

      const result = await repository.create(createDto);

      expect(result).toEqual(mockRecord);
      expect(mockKnex).toHaveBeenCalledWith('stocks');
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
    const updateDto = { current_quantity: 15 };

    it('should update and return the record', async () => {
      mockQueryBuilder.then = jest
        .fn()
        .mockImplementation((resolve) => resolve(1));
      mockQueryBuilder.first = jest
        .fn()
        .mockResolvedValue({
          ...mockRecord,
          current_quantity: 15,
        });

      const result = await repository.update('stock-1', updateDto);

      expect(result.current_quantity).toBe(15);
      expect(mockKnex).toHaveBeenCalledWith('stocks');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith({ id: 'stock-1' });
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

      const result = await repository.remove('stock-1');

      expect(result).toBe(1);
      expect(mockKnex).toHaveBeenCalledWith('stocks');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith({ id: 'stock-1' });
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
    it('should remove records by account id with products subquery', async () => {
      mockQueryBuilder.then = jest
        .fn()
        .mockImplementation((resolve) => resolve(3));

      const result = await repository.removeByAccountId('account-123');

      expect(result).toBe(3);
      expect(mockKnex).toHaveBeenCalledWith('stocks');
      expect(mockQueryBuilder.whereIn).toHaveBeenCalledWith(
        'product_id',
        expect.any(Function),
      );
      expect(mockQueryBuilder.whereNull).toHaveBeenCalledWith('deleted_at');
      expect(mockQueryBuilder.update).toHaveBeenCalled();

      const whereInCallback = (
        mockQueryBuilder.whereIn as jest.Mock
      ).mock.calls[0][1];
      const subqueryMock = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
      };
      whereInCallback.call(subqueryMock);
      expect(subqueryMock.select).toHaveBeenCalledWith('id');
      expect(subqueryMock.from).toHaveBeenCalledWith('products');
      expect(subqueryMock.where).toHaveBeenCalledWith({
        account_id: 'account-123',
      });
    });

    it('should accept optional transaction', async () => {
      mockQueryBuilder.then = jest
        .fn()
        .mockImplementation((resolve) => resolve(2));
      const trx = await mockKnex.transaction();

      const result = await repository.removeByAccountId('account-123', trx);

      expect(result).toBe(2);
      expect(trx).toHaveBeenCalledWith('stocks');
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
