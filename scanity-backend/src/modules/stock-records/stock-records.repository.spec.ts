/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { KNEX_CONNECTION } from '../../infra/database/database.providers';
import { StockRecordsRepository } from './stock-records.repository';

describe('StockRecordsRepository', () => {
  let repository: StockRecordsRepository;
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
    id: 'sr-1',
    stock_id: 'stock-1',
    quantity: 5,
    type: 'ENTRADA',
    observation: 'Test movement',
    user_id: 'user-1',
    movement_stage_id: 'stage-1',
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
        StockRecordsRepository,
        { provide: KNEX_CONNECTION, useValue: knexInstance },
      ],
    }).compile();

    repository = module.get<StockRecordsRepository>(StockRecordsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated results with joins', async () => {
      mockQueryBuilder.first = jest
        .fn()
        .mockResolvedValue({ count: 1 });
      mockQueryBuilder.then = jest
        .fn()
        .mockImplementation((resolve) => resolve([mockRecord]));

      const result = await repository.findAll({ page: 1, limit: 10 });

      expect(result).toEqual(mockPaginatedData);
      expect(mockKnex).toHaveBeenCalledWith('stock_records');
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
        'movement_stages',
        'movement_stages.id',
        'stock_records.movement_stage_id',
      );
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
        'users',
        'users.id',
        'stock_records.user_id',
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'stock_records.created_at',
        'desc',
      );
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
    it('should return all records with joins', async () => {
      mockQueryBuilder.then = jest
        .fn()
        .mockImplementation((resolve) => resolve([mockRecord]));

      const result = await repository.list({});

      expect(result).toEqual([mockRecord]);
      expect(mockKnex).toHaveBeenCalledWith('stock_records');
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
        'movement_stages',
        'movement_stages.id',
        'stock_records.movement_stage_id',
      );
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
        'users',
        'users.id',
        'stock_records.user_id',
      );
      expect(mockQueryBuilder.select).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      mockQueryBuilder.then = jest.fn().mockImplementation(() => {
        throw new Error('DB error');
      });

      await expect(repository.list({})).rejects.toThrow('DB error');
    });
  });

  describe('findOne', () => {
    it('should return a record by id with joins', async () => {
      mockQueryBuilder.first = jest
        .fn()
        .mockResolvedValue(mockRecord);

      const result = await repository.findOne('sr-1');

      expect(result).toEqual(mockRecord);
      expect(mockKnex).toHaveBeenCalledWith('stock_records');
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
        'movement_stages',
        'movement_stages.id',
        'stock_records.movement_stage_id',
      );
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
        'users',
        'users.id',
        'stock_records.user_id',
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
      stock_id: 'stock-1',
      quantity: 5,
      type: 'ENTRADA',
      observation: 'Test movement',
      user_id: 'user-1',
      movement_stage_id: 'stage-1',
    };

    it('should create a record', async () => {
      mockQueryBuilder.then = jest
        .fn()
        .mockImplementation((resolve) => resolve([mockRecord]));

      const result = await repository.create(createDto);

      expect(result).toEqual(mockRecord);
      expect(mockKnex).toHaveBeenCalledWith('stock_records');
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
    const updateDto = { quantity: 10 };

    it('should update and return the record', async () => {
      mockQueryBuilder.then = jest
        .fn()
        .mockImplementation((resolve) => resolve(1));
      mockQueryBuilder.first = jest
        .fn()
        .mockResolvedValue({ ...mockRecord, quantity: 10 });

      const result = await repository.update('sr-1', updateDto);

      expect(result.quantity).toBe(10);
      expect(mockKnex).toHaveBeenCalledWith('stock_records');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith({ id: 'sr-1' });
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

      const result = await repository.remove('sr-1');

      expect(result).toBe(1);
      expect(mockKnex).toHaveBeenCalledWith('stock_records');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith({ id: 'sr-1' });
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
    it('should remove records by account id with nested subquery', async () => {
      mockQueryBuilder.then = jest
        .fn()
        .mockImplementation((resolve) => resolve(3));

      const result = await repository.removeByAccountId('account-123');

      expect(result).toBe(3);
      expect(mockKnex).toHaveBeenCalledWith('stock_records');
      expect(mockQueryBuilder.whereIn).toHaveBeenCalledWith(
        'stock_id',
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
        join: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
      };
      whereInCallback.call(subqueryMock);
      expect(subqueryMock.select).toHaveBeenCalledWith('stocks.id');
      expect(subqueryMock.from).toHaveBeenCalledWith('stocks');
      expect(subqueryMock.join).toHaveBeenCalledWith(
        'products',
        'stocks.product_id',
        'products.id',
      );
      expect(subqueryMock.where).toHaveBeenCalledWith(
        'products.account_id',
        'account-123',
      );
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
      expect(trx).toHaveBeenCalledWith('stock_records');
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
