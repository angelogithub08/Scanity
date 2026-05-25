/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { StocksController } from './stocks.controller';
import { StocksService } from './stocks.service';
import { CreateStocksDto } from './dto/create-stocks.dto';
import { UpdateStocksDto } from './dto/update-stocks.dto';
import {
  ListStocksParamsDto,
  ListPaginatedStocksParamsDto,
} from './dto/params-stocks.dto';
import { User } from '../users/entities/user.entity';

describe('StocksController', () => {
  let controller: StocksController;
  let service: StocksService;

  // Mock data para Stock
  const mockData = {
    id: 'mock-id',
    product_id: 'Test product_id',
    current_quantity: 1,
    max_quantity: 1,
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
  const mockUpdatedData = {
    ...mockData,
    ...mockUpdateDto,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StocksController],
      providers: [
        {
          provide: StocksService,
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

    controller = module.get<StocksController>(StocksController);
    service = module.get<StocksService>(StocksService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  it('should create a new Stock', async () => {
    const result = await controller.create(mockCreateDto, {
      id: 'mock-user-id',
    } as User);

    expect(service.create).toHaveBeenCalledWith(mockCreateDto, 'mock-user-id');
    expect(result).toEqual(mockData);
    expect(result.product_id).toBeDefined();
    expect(result.current_quantity).toBeDefined();
    expect(result.min_quantity).toBeDefined();
  });

  it('should return paginated Stock list', async () => {
    const params = { page: 1, limit: 10 } as ListPaginatedStocksParamsDto;
    const result = await controller.findAll(params);

    expect(service.findAll).toHaveBeenCalledWith(params);
    expect(result).toEqual(mockPaginatedResult);
    expect(result.data).toHaveLength(1);
  });

  it('should return all Stock records', async () => {
    const params = {} as ListStocksParamsDto;
    const result = await controller.list(params);

    expect(service.list).toHaveBeenCalledWith(params);
    expect(result).toEqual([mockData]);
    expect(result).toHaveLength(1);
  });

  it('should return a Stock by id', async () => {
    const id = 'mock-id';
    const result = await controller.findOne(id);

    expect(service.findOne).toHaveBeenCalledWith(id);
    expect(result).toEqual(mockData);
    expect(result.id).toBe(id);
  });

  it('should update a Stock', async () => {
    const id = 'mock-id';
    const result = await controller.update(
      id,
      mockUpdateDto as UpdateStocksDto,
    );

    expect(service.update).toHaveBeenCalledWith(id, mockUpdateDto);
    expect(result).toEqual(mockUpdatedData);
    expect(result.product_id).toBeDefined();
    expect(result.current_quantity).toBeDefined();
    expect(result.min_quantity).toBeDefined();
  });

  it('should remove a Stock', async () => {
    const id = 'mock-id';
    const result = await controller.remove(id);

    expect(service.remove).toHaveBeenCalledWith(id);
    expect(result).toEqual({ deleted: true });
  });
});
