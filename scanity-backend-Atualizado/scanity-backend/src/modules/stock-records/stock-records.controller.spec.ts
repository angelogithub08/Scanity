/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { StockRecordsController } from './stock-records.controller';
import { StockRecordsService } from './stock-records.service';
import { CreateStockRecordsDto } from './dto/create-stock-records.dto';
import { UpdateStockRecordsDto } from './dto/update-stock-records.dto';
import {
  ListStockRecordsParamsDto,
  ListPaginatedStockRecordsParamsDto,
} from './dto/params-stock-records.dto';

describe('StockRecordsController', () => {
  let controller: StockRecordsController;
  let service: StockRecordsService;

  // Mock data para StockRecord
  const mockData = {
    id: 'mock-id',
    stock_id: 'Test stock_id',
    quantity: 1,
    type: 'Test type',
    observation: 'Test observation',
    user_id: 'Test user_id',
    movement_stage_id: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPaginatedResult = {
    data: [mockData],
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  // Mock para o DTO de criação
  const mockCreateDto: CreateStockRecordsDto = {
    stock_id: 'Test stock_id',
    quantity: 1,
    type: 'Test type',
    observation: 'Test observation',
    user_id: 'Test user_id',
    movement_stage_id: undefined,
  };

  // Mock para o DTO de atualização
  const mockUpdateDto: Partial<CreateStockRecordsDto> = {
    stock_id: 'Updated stock_id',
    quantity: 2,
    type: 'Updated type',
    observation: 'Updated observation',
    user_id: 'Updated user_id',
    movement_stage_id: '550e8400-e29b-41d4-a716-446655440000',
  };

  // Mock para dados após atualização
  const mockUpdatedData = {
    ...mockData,
    ...mockUpdateDto,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StockRecordsController],
      providers: [
        {
          provide: StockRecordsService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockData),
            findAll: jest.fn().mockResolvedValue(mockPaginatedResult),
            list: jest.fn().mockResolvedValue([mockData]),
            findOne: jest.fn().mockResolvedValue(mockData),
            update: jest.fn().mockResolvedValue(mockUpdatedData),
            remove: jest.fn().mockResolvedValue({ deleted: true }),
          },
        },
      ],
    }).compile();

    controller = module.get<StockRecordsController>(StockRecordsController);
    service = module.get<StockRecordsService>(StockRecordsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  it('should create a new StockRecord', async () => {
    const result = await controller.create(mockCreateDto);

    expect(service.create).toHaveBeenCalledWith(mockCreateDto);
    expect(result).toEqual(mockData);
    expect(result.stock_id).toBeDefined();
    expect(result.quantity).toBeDefined();
    expect(result.type).toBeDefined();
    expect(result.observation).toBeDefined();
    expect(result.user_id).toBeDefined();
  });

  it('should return paginated StockRecord list', async () => {
    const params = { page: 1, limit: 10 } as ListPaginatedStockRecordsParamsDto;
    const result = await controller.findAll(params);

    expect(service.findAll).toHaveBeenCalledWith(params);
    expect(result).toEqual(mockPaginatedResult);
    expect(result.data).toHaveLength(1);
  });

  it('should return all StockRecord records', async () => {
    const params = {} as ListStockRecordsParamsDto;
    const result = await controller.list(params);

    expect(service.list).toHaveBeenCalledWith(params);
    expect(result).toEqual([mockData]);
    expect(result).toHaveLength(1);
  });

  it('should return a StockRecord by id', async () => {
    const id = 'mock-id';
    const result = await controller.findOne(id);

    expect(service.findOne).toHaveBeenCalledWith(id);
    expect(result).toEqual(mockData);
    expect(result.id).toBe(id);
  });

  it('should update a StockRecord', async () => {
    const id = 'mock-id';
    const result = await controller.update(
      id,
      mockUpdateDto as UpdateStockRecordsDto,
    );

    expect(service.update).toHaveBeenCalledWith(id, mockUpdateDto);
    expect(result).toEqual(mockUpdatedData);
    expect(result.stock_id).toBeDefined();
    expect(result.quantity).toBeDefined();
    expect(result.type).toBeDefined();
    expect(result.observation).toBeDefined();
    expect(result.user_id).toBeDefined();
  });

  it('should remove a StockRecord', async () => {
    const id = 'mock-id';
    const result = await controller.remove(id);

    expect(service.remove).toHaveBeenCalledWith(id);
    expect(result).toEqual({ deleted: true });
  });
});
