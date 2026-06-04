/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StocksService } from './stocks.service';
import { StocksRepository } from './stocks.repository';
import { CreateStocksDto } from './dto/create-stocks.dto';
import {
  ListStocksParamsDto,
  ListPaginatedStocksParamsDto,
} from './dto/params-stocks.dto';
import { Stock } from './entities/stock.entity';
import { StockRecordsRepository } from '../stock-records/stock-records.repository';
import { StockRecordsService } from '../stock-records/stock-records.service';
import { ProductsService } from '../products/products.service';
import { S3Service } from 'src/infra/s3/s3.service';
import { QuickMovementDto } from './dto/quick-movement.dto';

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  last_page: number;
}

describe('StocksService', () => {
  let service: StocksService;
  let repository: StocksRepository;

  // Mock data para Stock
  const mockStock = {
    id: 1,
    product_id: 'Test product_id',
    current_quantity: 1,
    max_quantity: 1,
    product_thumbnail_path: 'products/image.jpg',
    created_at: new Date(),
    updated_at: new Date(),
  } as unknown as Stock;

  const mockPaginatedResult: PaginatedResult<Stock> = {
    data: [mockStock],
    total: 1,
    page: 1,
    last_page: 1,
  };

  // Mock para o DTO de criação
  const mockCreateDto: CreateStocksDto = {
    product_id: 'Test product_id',
    current_quantity: 1,
    min_quantity: 1,
  };

  // Mock para o DTO de atualização
  const mockUpdateDto: Partial<CreateStocksDto> = {
    product_id: 'Updated product_id',
    current_quantity: 2,
    min_quantity: 2,
  };

  // Mock para dados após atualização
  const mockUpdatedStock = {
    ...mockStock,
    ...mockUpdateDto,
  };

  const mockStockRecordsRepository = {
    create: jest.fn().mockResolvedValue({ id: 'record-1' }),
  };

  const mockStockRecordsService = {
    create: jest.fn().mockResolvedValue({ id: 'record-1' }),
  };

  const mockProductsService = {
    findOneByBarcode: jest
      .fn()
      .mockResolvedValue({ id: 'product-1', name: 'Test Product' }),
  };

  const mockS3Service = {
    generateSignedUri: jest
      .fn()
      .mockResolvedValue('https://signed-url.com/image.jpg'),
  };

  const mockQuickMovementDto: QuickMovementDto = {
    barcode: '7891234567890',
    quantity: 1,
    type: 'ENTRADA',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StocksService,
        {
          provide: StocksRepository,
          useValue: {
            create: jest.fn().mockResolvedValue(mockStock),
            findAll: jest.fn().mockResolvedValue(mockPaginatedResult),
            list: jest.fn().mockResolvedValue([mockStock]),
            findOne: jest.fn().mockResolvedValue(mockStock),
            update: jest.fn().mockResolvedValue(mockUpdatedStock),
            remove: jest.fn().mockResolvedValue(1),
          },
        },
        {
          provide: StockRecordsRepository,
          useValue: mockStockRecordsRepository,
        },
        {
          provide: StockRecordsService,
          useValue: mockStockRecordsService,
        },
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
        {
          provide: S3Service,
          useValue: mockS3Service,
        },
      ],
    }).compile();

    service = module.get<StocksService>(StocksService);
    repository = module.get<StocksRepository>(StocksRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a Stock successfully', async () => {
      const result = await service.create(mockCreateDto, 'mock-user-id');

      expect(repository.create).toHaveBeenCalledWith({
        ...mockCreateDto,
        current_quantity: 0,
      });
      expect(mockStockRecordsRepository.create).toHaveBeenCalledWith({
        stock_id: mockStock.id,
        quantity: mockCreateDto.current_quantity,
        type: 'ENTRADA',
        user_id: 'mock-user-id',
        observation: 'Primeira entrada do estoque',
      });
      expect(result).toEqual(mockStock);
    });

    it('should throw BadRequestException on create error', async () => {
      jest
        .spyOn(repository, 'create')
        .mockRejectedValueOnce(new Error('Database error'));

      try {
        await service.create(mockCreateDto, 'mock-user-id');
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain(
          'Erro ao criar Stock',
        );
      }
    });
  });

  describe('findAll', () => {
    it('should return paginated Stocks with product_image', async () => {
      const params: ListPaginatedStocksParamsDto = { page: 1, limit: 10 };
      const result = await service.findAll(params);

      expect(repository.findAll).toHaveBeenCalledWith(params);
      expect(mockS3Service.generateSignedUri).toHaveBeenCalledWith(
        mockStock.product_thumbnail_path,
      );
      expect(result.data[0] as any).toHaveProperty('product_image');
      expect((result.data[0] as any).product_image).toBe(
        'https://signed-url.com/image.jpg',
      );
      expect(result.total).toBe(mockPaginatedResult.total);
    });

    it('should throw BadRequestException on findAll error', async () => {
      const params: ListPaginatedStocksParamsDto = { page: 1, limit: 10 };

      jest.spyOn(repository, 'findAll').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      try {
        await service.findAll(params);
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain(
          'Erro ao buscar Stocks paginados',
        );
      }
    });
  });

  describe('list', () => {
    it('should return all Stocks', async () => {
      const params: ListStocksParamsDto = {};
      const result = await service.list(params);

      expect(repository.list).toHaveBeenCalledWith(params);
      expect(result).toEqual([mockStock]);
    });

    it('should throw BadRequestException on list error', async () => {
      const params: ListStocksParamsDto = {};

      jest.spyOn(repository, 'list').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      try {
        await service.list(params);
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain(
          'Erro ao listar Stocks',
        );
      }
    });
  });

  describe('findOne', () => {
    it('should return a Stock by id', async () => {
      const result = await service.findOne('mock-id');

      expect(repository.findOne).toHaveBeenCalledWith('mock-id');
      expect(result).toEqual(mockStock);
    });

    it('should rethrow NotFoundException from repository', async () => {
      jest
        .spyOn(repository, 'findOne')
        .mockRejectedValueOnce(new NotFoundException('Stock not found'));

      try {
        await service.findOne('not-found');
        fail('Expected NotFoundException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toContain(
          'Stock not found',
        );
      }
    });

    it('should rethrow BadRequestException from repository', async () => {
      jest
        .spyOn(repository, 'findOne')
        .mockRejectedValueOnce(new BadRequestException('Invalid ID'));

      try {
        await service.findOne('invalid-id');
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain('Invalid ID');
      }
    });

    it('should wrap other errors in BadRequestException', async () => {
      jest.spyOn(repository, 'findOne').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      try {
        await service.findOne('error-id');
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain(
          'Erro ao buscar Stock',
        );
      }
    });
  });

  describe('update', () => {
    it('should update a Stock', async () => {
      const result = await service.update('mock-id', mockUpdateDto);

      expect(repository.update).toHaveBeenCalledWith('mock-id', mockUpdateDto);
      expect(result).toEqual(mockUpdatedStock);
    });

    it('should rethrow NotFoundException from repository', async () => {
      jest
        .spyOn(repository, 'update')
        .mockRejectedValueOnce(new NotFoundException('Stock not found'));

      try {
        await service.update('not-found', mockUpdateDto);
        fail('Expected NotFoundException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toContain(
          'Stock not found',
        );
      }
    });

    it('should wrap other errors in BadRequestException', async () => {
      jest.spyOn(repository, 'update').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      try {
        await service.update('error-id', mockUpdateDto);
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain(
          'Erro ao atualizar Stock',
        );
      }
    });
  });

  describe('remove', () => {
    it('should remove a Stock', async () => {
      const result = await service.remove('mock-id');

      expect(repository.remove).toHaveBeenCalledWith('mock-id');
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message');
    });

    it('should rethrow NotFoundException from repository', async () => {
      jest
        .spyOn(repository, 'remove')
        .mockRejectedValueOnce(new NotFoundException('Stock not found'));

      try {
        await service.remove('not-found');
        fail('Expected NotFoundException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toContain(
          'Stock not found',
        );
      }
    });

    it('should wrap other errors in BadRequestException', async () => {
      jest.spyOn(repository, 'remove').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      try {
        await service.remove('error-id');
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain(
          'Erro ao remover Stock',
        );
      }
    });
  });

  describe('quickMovement', () => {
    const userId = 'user-123';
    const accountId = 'account-456';

    beforeEach(() => {
      jest.clearAllMocks();
      repository.list = jest.fn().mockResolvedValue([mockStock]);
      mockProductsService.findOneByBarcode.mockResolvedValue({
        id: 'product-1',
        name: 'Test Product',
      });
    });

    it('should register a quick movement successfully', async () => {
      const result = await service.quickMovement(
        mockQuickMovementDto,
        userId,
        accountId,
      );

      expect(mockProductsService.findOneByBarcode).toHaveBeenCalledWith(
        accountId,
        mockQuickMovementDto.barcode,
      );
      expect(repository.list).toHaveBeenCalledWith({
        product_id: 'product-1',
        account_id: accountId,
      });
      expect(mockStockRecordsService.create).toHaveBeenCalledWith({
        stock_id: mockStock.id,
        quantity: mockQuickMovementDto.quantity,
        type: mockQuickMovementDto.type,
        user_id: userId,
        observation: 'Movimentação rápida',
      });
      expect(result).toEqual({
        message: 'Movimentação registrada com sucesso',
      });
    });

    it('should throw BadRequestException when barcode is empty', async () => {
      const emptyDto: QuickMovementDto = {
        barcode: '',
        quantity: 1,
        type: 'ENTRADA',
      };

      await expect(
        service.quickMovement(emptyDto, userId, accountId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.quickMovement(emptyDto, userId, accountId),
      ).rejects.toThrow('Código de barras é obrigatório.');
    });

    it('should propagate error when product is not found', async () => {
      mockProductsService.findOneByBarcode.mockRejectedValueOnce(
        new NotFoundException('Produto não encontrado'),
      );

      await expect(
        service.quickMovement(mockQuickMovementDto, userId, accountId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when stock is not found', async () => {
      repository.list = jest.fn().mockResolvedValue([]);

      await expect(
        service.quickMovement(mockQuickMovementDto, userId, accountId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.quickMovement(mockQuickMovementDto, userId, accountId),
      ).rejects.toThrow('Estoque não encontrado para este produto.');
    });

    it('should pass movement_stage_id when provided', async () => {
      const dtoWithStage: QuickMovementDto = {
        ...mockQuickMovementDto,
        movement_stage_id: 'stage-uuid-1',
      };

      await service.quickMovement(dtoWithStage, userId, accountId);

      expect(mockStockRecordsService.create).toHaveBeenCalledWith({
        stock_id: mockStock.id,
        quantity: dtoWithStage.quantity,
        type: dtoWithStage.type,
        user_id: userId,
        observation: 'Movimentação rápida',
        movement_stage_id: 'stage-uuid-1',
      });
    });
  });
});
