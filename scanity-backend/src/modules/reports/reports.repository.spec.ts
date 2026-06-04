/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { KNEX_CONNECTION } from '../../infra/database/database.providers';
import { ReportsRepository } from './reports.repository';
import type { StockProductsReportItem } from './dto/response-reports.dto';
import type { StockBelowMinimumReportItem } from './dto/response-reports.dto';
import type { StockMovementsReportItem } from './dto/response-reports.dto';
import type { MostMovedProductsReportItem } from './dto/response-reports.dto';

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

describe('ReportsRepository', () => {
  let repository: ReportsRepository;
  let mockKnex: ReturnType<typeof createMockKnex>;
  let queryBuilder: any;

  beforeEach(async () => {
    mockKnex = createMockKnex();
    queryBuilder = mockKnex();
    mockKnex.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsRepository,
        { provide: KNEX_CONNECTION, useValue: mockKnex },
      ],
    }).compile();

    repository = module.get<ReportsRepository>(ReportsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const accountId = 'account-1';

  const mockStockProduct: StockProductsReportItem = {
    product_id: 'prod-1',
    product_name: 'Produto Teste',
    current_quantity: 50,
    min_quantity: 10,
    category_name: 'Categoria Teste',
    barcode: '123456789',
  };

  const mockStockBelowMin: StockBelowMinimumReportItem = {
    product_id: 'prod-2',
    product_name: 'Produto Baixo',
    current_quantity: 3,
    min_quantity: 10,
    category_name: 'Categoria Teste',
    barcode: '987654321',
  };

  const mockMovement: StockMovementsReportItem = {
    barcode: '123456789',
    product_name: 'Produto Teste',
    type: 'ENTRADA',
    quantity: 10,
    user_name: 'João',
  };

  const mockMostMoved: MostMovedProductsReportItem = {
    product_id: 'prod-1',
    product_name: 'Produto Teste',
    category_name: 'Categoria Teste',
    barcode: '123456789',
    entries_quantity: 100,
    exits_quantity: 30,
    total_quantity: 70,
    movements_count: 15,
  };

  describe('getStockProductsData', () => {
    it('should call knex with correct query and return data', async () => {
      queryBuilder.then.mockImplementationOnce((resolve: (v: unknown) => void) =>
        resolve([mockStockProduct]),
      );

      const result = await repository.getStockProductsData({
        account_id: accountId,
      });

      expect(mockKnex).toHaveBeenCalledWith('stocks');
      expect(queryBuilder.innerJoin).toHaveBeenCalledWith(
        'products',
        'stocks.product_id',
        'products.id',
      );
      expect(queryBuilder.leftJoin).toHaveBeenCalledWith(
        'categories',
        'products.category_id',
        'categories.id',
      );
      expect(queryBuilder.whereNull).toHaveBeenCalledWith('products.deleted_at');
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'products.account_id',
        accountId,
      );
      expect(result).toEqual([mockStockProduct]);
    });

    it('should apply optional filters (search, product_id, category_id)', async () => {
      queryBuilder.then.mockImplementationOnce((resolve: (v: unknown) => void) =>
        resolve([mockStockProduct]),
      );

      await repository.getStockProductsData({
        account_id: accountId,
        search: 'teste',
        product_id: 'prod-1',
        category_id: 'cat-1',
      });

      expect(queryBuilder.where).toHaveBeenCalledWith(
        'products.account_id',
        accountId,
      );
      expect(queryBuilder.where).toHaveBeenCalledWith(
        expect.any(Function),
      );
    });

    it('should throw on failure (no try/catch in repository)', async () => {
      queryBuilder.then.mockImplementationOnce((resolve, reject) =>
        reject(new Error('DB error')),
      );

      await expect(
        repository.getStockProductsData({ account_id: accountId }),
      ).rejects.toThrow('DB error');
    });
  });

  describe('getStockBelowMinimumData', () => {
    it('should call knex with correct query including whereRaw', async () => {
      queryBuilder.then.mockImplementationOnce((resolve: (v: unknown) => void) =>
        resolve([mockStockBelowMin]),
      );

      const result = await repository.getStockBelowMinimumData({
        account_id: accountId,
      });

      expect(mockKnex).toHaveBeenCalledWith('stocks');
      expect(queryBuilder.whereRaw).toHaveBeenCalledWith(
        'stocks.current_quantity < stocks.min_quantity',
      );
      expect(result).toEqual([mockStockBelowMin]);
    });

    it('should throw on failure (no try/catch in repository)', async () => {
      queryBuilder.then.mockImplementationOnce((resolve, reject) =>
        reject(new Error('DB error')),
      );

      await expect(
        repository.getStockBelowMinimumData({ account_id: accountId }),
      ).rejects.toThrow('DB error');
    });
  });

  describe('getStockMovementsData', () => {
    it('should call knex with correct query and knex.raw for ABS', async () => {
      queryBuilder.then.mockImplementationOnce((resolve: (v: unknown) => void) =>
        resolve([mockMovement]),
      );

      const result = await repository.getStockMovementsData({
        account_id: accountId,
      });

      expect(mockKnex).toHaveBeenCalledWith('stock_records');
      expect(mockKnex.raw).toHaveBeenCalledWith(
        'ABS(stock_records.quantity) as quantity',
      );
      expect(result).toEqual([mockMovement]);
    });

    it('should apply optional barcode filter', async () => {
      queryBuilder.then.mockImplementationOnce((resolve: (v: unknown) => void) =>
        resolve([mockMovement]),
      );

      await repository.getStockMovementsData({
        account_id: accountId,
        barcode: '123',
      });

      expect(queryBuilder.where).toHaveBeenCalledWith(
        'products.barcode',
        'ilike',
        '%123%',
      );
    });

    it('should throw on failure (no try/catch in repository)', async () => {
      queryBuilder.then.mockImplementationOnce((resolve, reject) =>
        reject(new Error('DB error')),
      );

      await expect(
        repository.getStockMovementsData({ account_id: accountId }),
      ).rejects.toThrow('DB error');
    });
  });

  describe('getMostMovedProductsData', () => {
    it('should call knex with correct query and raw aggregations', async () => {
      queryBuilder.then.mockImplementationOnce((resolve: (v: unknown) => void) =>
        resolve([mockMostMoved]),
      );

      const result = await repository.getMostMovedProductsData({
        account_id: accountId,
      });

      expect(mockKnex).toHaveBeenCalledWith('stock_records');
      expect(mockKnex.raw).toHaveBeenCalledWith(
        "COALESCE(SUM(CASE WHEN stock_records.type = 'ENTRADA' THEN ABS(stock_records.quantity) ELSE 0 END), 0) as entries_quantity",
      );
      expect(mockKnex.raw).toHaveBeenCalledWith(
        "COALESCE(SUM(CASE WHEN stock_records.type = 'SAIDA' THEN ABS(stock_records.quantity) ELSE 0 END), 0) as exits_quantity",
      );
      expect(mockKnex.raw).toHaveBeenCalledWith(
        'COALESCE(SUM(ABS(stock_records.quantity)), 0) as total_quantity',
      );
      expect(mockKnex.raw).toHaveBeenCalledWith(
        'COUNT(stock_records.id) as movements_count',
      );
      expect(queryBuilder.groupBy).toHaveBeenCalled();
      expect(result).toEqual([mockMostMoved]);
    });

    it('should throw on failure (no try/catch in repository)', async () => {
      queryBuilder.then.mockImplementationOnce((resolve, reject) =>
        reject(new Error('DB error')),
      );

      await expect(
        repository.getMostMovedProductsData({ account_id: accountId }),
      ).rejects.toThrow('DB error');
    });
  });
});
