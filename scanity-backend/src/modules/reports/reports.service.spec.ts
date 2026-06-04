/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { ReportsService } from './reports.service';
import { ReportsRepository } from './reports.repository';
import type { StockProductsReportItem } from './dto/response-reports.dto';
import type { StockBelowMinimumReportItem } from './dto/response-reports.dto';
import type { StockMovementsReportItem } from './dto/response-reports.dto';
import type { MostMovedProductsReportItem } from './dto/response-reports.dto';

jest.mock('xlsx', () => ({
  utils: {
    aoa_to_sheet: jest.fn().mockReturnValue({}),
    book_new: jest.fn().mockReturnValue({}),
    book_append_sheet: jest.fn(),
  },
  write: jest.fn().mockReturnValue(Buffer.from('mock-excel-buffer')),
}));

describe('ReportsService', () => {
  let service: ReportsService;
  let repository: ReportsRepository;

  const mockParams = { account_id: 'account-1' };

  const mockStockProductsItem: StockProductsReportItem = {
    product_id: 'prod-1',
    product_name: 'Produto Teste',
    current_quantity: 50,
    min_quantity: 10,
    category_name: 'Categoria Teste',
    barcode: '123456789',
  };

  const mockStockBelowMinimumItem: StockBelowMinimumReportItem = {
    product_id: 'prod-2',
    product_name: 'Produto Baixo',
    current_quantity: 3,
    min_quantity: 10,
    category_name: 'Categoria Teste',
    barcode: '987654321',
  };

  const mockStockMovementsItem: StockMovementsReportItem = {
    barcode: '123456789',
    product_name: 'Produto Teste',
    type: 'entry',
    quantity: 10,
    user_name: 'João',
  };

  const mockMostMovedProductsItem: MostMovedProductsReportItem = {
    product_id: 'prod-1',
    product_name: 'Produto Teste',
    category_name: 'Categoria Teste',
    barcode: '123456789',
    entries_quantity: 100,
    exits_quantity: 30,
    total_quantity: 70,
    movements_count: 15,
  };

  const mockRepository = {
    getStockProductsData: jest.fn().mockResolvedValue([mockStockProductsItem]),
    getStockBelowMinimumData: jest
      .fn()
      .mockResolvedValue([mockStockBelowMinimumItem]),
    getStockMovementsData: jest
      .fn()
      .mockResolvedValue([mockStockMovementsItem]),
    getMostMovedProductsData: jest
      .fn()
      .mockResolvedValue([mockMostMovedProductsItem]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: ReportsRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    repository = module.get<ReportsRepository>(ReportsRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(repository).toBeDefined();
  });

  describe('getStockProducts', () => {
    it('should return stock products report data', async () => {
      const result = await service.getStockProducts(mockParams);

      expect(repository.getStockProductsData).toHaveBeenCalledWith(mockParams);
      expect(result).toEqual({ data: [mockStockProductsItem] });
    });

    it('should wrap repository error in BadRequestException', async () => {
      jest
        .spyOn(repository, 'getStockProductsData')
        .mockRejectedValueOnce(new Error('Database error'));

      await expect(service.getStockProducts(mockParams)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getStockProductsExcel', () => {
    it('should return an Excel buffer with stock products', async () => {
      const result = await service.getStockProductsExcel(mockParams);

      expect(repository.getStockProductsData).toHaveBeenCalledWith(mockParams);
      expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith([
        [
          'Produto',
          'Quantidade atual',
          'Quantidade mínima',
          'Categoria',
          'Código de barras',
        ],
        ['Produto Teste', 50, 10, 'Categoria Teste', '123456789'],
      ]);
      expect(XLSX.utils.book_new).toHaveBeenCalled();
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(
        {},
        {},
        'Produtos em estoque',
      );
      expect(XLSX.write).toHaveBeenCalledWith(
        {},
        { type: 'buffer', bookType: 'xlsx' },
      );
      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toBe('mock-excel-buffer');
    });

    it('should wrap repository error in BadRequestException', async () => {
      jest
        .spyOn(repository, 'getStockProductsData')
        .mockRejectedValueOnce(new Error('Export error'));

      await expect(service.getStockProductsExcel(mockParams)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getStockBelowMinimum', () => {
    it('should return stock below minimum report data', async () => {
      const result = await service.getStockBelowMinimum(mockParams);

      expect(repository.getStockBelowMinimumData).toHaveBeenCalledWith(
        mockParams,
      );
      expect(result).toEqual({ data: [mockStockBelowMinimumItem] });
    });

    it('should wrap repository error in BadRequestException', async () => {
      jest
        .spyOn(repository, 'getStockBelowMinimumData')
        .mockRejectedValueOnce(new Error('Database error'));

      await expect(service.getStockBelowMinimum(mockParams)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getStockBelowMinimumExcel', () => {
    it('should return an Excel buffer with stock below minimum', async () => {
      const result = await service.getStockBelowMinimumExcel(mockParams);

      expect(repository.getStockBelowMinimumData).toHaveBeenCalledWith(
        mockParams,
      );
      expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith([
        [
          'Produto',
          'Quantidade atual',
          'Quantidade mínima',
          'Categoria',
          'Código de barras',
        ],
        ['Produto Baixo', 3, 10, 'Categoria Teste', '987654321'],
      ]);
      expect(XLSX.utils.book_new).toHaveBeenCalled();
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(
        {},
        {},
        'Produtos abaixo do mínimo',
      );
      expect(XLSX.write).toHaveBeenCalledWith(
        {},
        { type: 'buffer', bookType: 'xlsx' },
      );
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should wrap repository error in BadRequestException', async () => {
      jest
        .spyOn(repository, 'getStockBelowMinimumData')
        .mockRejectedValueOnce(new Error('Export error'));

      await expect(
        service.getStockBelowMinimumExcel(mockParams),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getStockMovements', () => {
    it('should return stock movements report data', async () => {
      const result = await service.getStockMovements(mockParams);

      expect(repository.getStockMovementsData).toHaveBeenCalledWith(mockParams);
      expect(result).toEqual({ data: [mockStockMovementsItem] });
    });

    it('should wrap repository error in BadRequestException', async () => {
      jest
        .spyOn(repository, 'getStockMovementsData')
        .mockRejectedValueOnce(new Error('Database error'));

      await expect(service.getStockMovements(mockParams)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getStockMovementsExcel', () => {
    it('should return an Excel buffer with stock movements', async () => {
      const result = await service.getStockMovementsExcel(mockParams);

      expect(repository.getStockMovementsData).toHaveBeenCalledWith(mockParams);
      expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith([
        [
          'Código de barras',
          'Produto',
          'Tipo de movimentação',
          'Quantidade',
          'Usuário',
        ],
        ['123456789', 'Produto Teste', 'entry', 10, 'João'],
      ]);
      expect(XLSX.utils.book_new).toHaveBeenCalled();
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(
        {},
        {},
        'Movimentações de estoque',
      );
      expect(XLSX.write).toHaveBeenCalledWith(
        {},
        { type: 'buffer', bookType: 'xlsx' },
      );
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should wrap repository error in BadRequestException', async () => {
      jest
        .spyOn(repository, 'getStockMovementsData')
        .mockRejectedValueOnce(new Error('Export error'));

      await expect(service.getStockMovementsExcel(mockParams)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getMostMovedProducts', () => {
    it('should return most moved products report data', async () => {
      const result = await service.getMostMovedProducts(mockParams);

      expect(repository.getMostMovedProductsData).toHaveBeenCalledWith(
        mockParams,
      );
      expect(result).toEqual({ data: [mockMostMovedProductsItem] });
    });

    it('should wrap repository error in BadRequestException', async () => {
      jest
        .spyOn(repository, 'getMostMovedProductsData')
        .mockRejectedValueOnce(new Error('Database error'));

      await expect(service.getMostMovedProducts(mockParams)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getMostMovedProductsExcel', () => {
    it('should return an Excel buffer with most moved products', async () => {
      const result = await service.getMostMovedProductsExcel(mockParams);

      expect(repository.getMostMovedProductsData).toHaveBeenCalledWith(
        mockParams,
      );
      expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith([
        [
          'Produto',
          'Categoria',
          'Código de barras',
          'Total de entradas',
          'Total de saídas',
          'Total movimentado',
          'Total de movimentações',
        ],
        ['Produto Teste', 'Categoria Teste', '123456789', 100, 30, 70, 15],
      ]);
      expect(XLSX.utils.book_new).toHaveBeenCalled();
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(
        {},
        {},
        'Produtos mais movimentados',
      );
      expect(XLSX.write).toHaveBeenCalledWith(
        {},
        { type: 'buffer', bookType: 'xlsx' },
      );
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should wrap repository error in BadRequestException', async () => {
      jest
        .spyOn(repository, 'getMostMovedProductsData')
        .mockRejectedValueOnce(new Error('Export error'));

      await expect(
        service.getMostMovedProductsExcel(mockParams),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
