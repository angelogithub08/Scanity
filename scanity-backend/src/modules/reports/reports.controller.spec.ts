/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { StreamableFile } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import {
  ReportParamsBase,
  StockMovementsReportParamsDto,
  MostMovedProductsReportParamsDto,
} from './dto/params-reports.dto';
import { AccountType } from '../accounts/entities/account.entity';
import { User } from '../users/entities/user.entity';

const adminUser = {
  id: 'admin-1',
  account_id: 'admin-account-id',
  account_type: AccountType.ADMIN,
} as User;

const regularUser = {
  id: 'user-1',
  account_id: 'user-account-id',
  account_type: AccountType.USER,
} as User;

const mockStockProductsResponse = {
  data: [
    {
      product_id: 'p1',
      product_name: 'Product A',
      current_quantity: 10,
      min_quantity: 5,
      category_name: 'Category 1',
      barcode: '123456789',
    },
  ],
};

const mockStockBelowMinimumResponse = {
  data: [
    {
      product_id: 'p2',
      product_name: 'Product B',
      current_quantity: 2,
      min_quantity: 5,
      category_name: 'Category 2',
      barcode: '987654321',
    },
  ],
};

const mockStockMovementsResponse = {
  data: [
    {
      barcode: '123456789',
      product_name: 'Product A',
      type: 'ENTRADA',
      quantity: 10,
      user_name: 'User 1',
    },
  ],
};

const mockMostMovedProductsResponse = {
  data: [
    {
      product_id: 'p1',
      product_name: 'Product A',
      category_name: 'Category 1',
      barcode: '123456789',
      entries_quantity: 50,
      exits_quantity: 20,
      total_quantity: 30,
      movements_count: 5,
    },
  ],
};

const mockBuffer = Buffer.from('mock-excel-data');

describe('ReportsController', () => {
  let controller: ReportsController;
  let reportsService: ReportsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        {
          provide: ReportsService,
          useValue: {
            getStockProducts: jest.fn().mockResolvedValue(mockStockProductsResponse),
            getStockProductsExcel: jest.fn().mockResolvedValue(mockBuffer),
            getStockBelowMinimum: jest
              .fn()
              .mockResolvedValue(mockStockBelowMinimumResponse),
            getStockBelowMinimumExcel: jest.fn().mockResolvedValue(mockBuffer),
            getStockMovements: jest
              .fn()
              .mockResolvedValue(mockStockMovementsResponse),
            getStockMovementsExcel: jest.fn().mockResolvedValue(mockBuffer),
            getMostMovedProducts: jest
              .fn()
              .mockResolvedValue(mockMostMovedProductsResponse),
            getMostMovedProductsExcel: jest.fn().mockResolvedValue(mockBuffer),
          },
        },
      ],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
    reportsService = module.get<ReportsService>(ReportsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /reports/stock-products (JSON)', () => {
    it('non-admin user should use own account_id', async () => {
      const params: ReportParamsBase = {};

      await controller.getStockProducts(params, regularUser);

      expect(reportsService.getStockProducts).toHaveBeenCalledWith({
        account_id: 'user-account-id',
      });
    });

    it('admin user with account_id param should use param account_id', async () => {
      const params: ReportParamsBase = { account_id: 'override-account-id' };

      await controller.getStockProducts(params, adminUser);

      expect(reportsService.getStockProducts).toHaveBeenCalledWith({
        account_id: 'override-account-id',
      });
    });

    it('admin user without account_id param should use own account_id', async () => {
      const params: ReportParamsBase = {};

      await controller.getStockProducts(params, adminUser);

      expect(reportsService.getStockProducts).toHaveBeenCalledWith({
        account_id: 'admin-account-id',
      });
    });
  });

  describe('GET /reports/stock-products/export (Excel)', () => {
    it('should return StreamableFile with correct headers', async () => {
      const params: ReportParamsBase = {};
      (reportsService.getStockProductsExcel as jest.Mock).mockResolvedValue(
        mockBuffer,
      );

      const result = await controller.getStockProductsExport(
        params,
        regularUser,
      );

      expect(reportsService.getStockProductsExcel).toHaveBeenCalledWith({
        account_id: 'user-account-id',
      });
      expect(result).toBeInstanceOf(StreamableFile);
    });
  });

  describe('GET /reports/stock-below-minimum (JSON)', () => {
    it('should delegate to service and return result', async () => {
      const params: ReportParamsBase = {};

      const result = await controller.getStockBelowMinimum(params, regularUser);

      expect(reportsService.getStockBelowMinimum).toHaveBeenCalledWith({
        account_id: 'user-account-id',
      });
      expect(result).toEqual(mockStockBelowMinimumResponse);
    });
  });

  describe('GET /reports/stock-movements (JSON)', () => {
    it('should delegate to service and return result', async () => {
      const params: StockMovementsReportParamsDto = {};

      const result = await controller.getStockMovements(params, regularUser);

      expect(reportsService.getStockMovements).toHaveBeenCalledWith({
        account_id: 'user-account-id',
      });
      expect(result).toEqual(mockStockMovementsResponse);
    });
  });

  describe('GET /reports/most-moved-products (JSON)', () => {
    it('should delegate to service and return result', async () => {
      const params: MostMovedProductsReportParamsDto = {};

      const result = await controller.getMostMovedProducts(
        params,
        regularUser,
      );

      expect(reportsService.getMostMovedProducts).toHaveBeenCalledWith({
        account_id: 'user-account-id',
      });
      expect(result).toEqual(mockMostMovedProductsResponse);
    });
  });
});
