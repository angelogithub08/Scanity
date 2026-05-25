/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { InventoryCountsController } from './inventory-counts.controller';
import { InventoryCountsService } from './inventory-counts.service';
import { CreateInventoryCountsDto } from './dto/create-inventory-counts.dto';
import { UpdateInventoryCountsDto } from './dto/update-inventory-counts.dto';
import {
  ListInventoryCountsParamsDto,
  ListPaginatedInventoryCountsParamsDto,
} from './dto/params-inventory-counts.dto';

describe('InventoryCountsController', () => {
  let controller: InventoryCountsController;
  let service: InventoryCountsService;

  // Mock data para InventoryCount
  const mockData = {
    id: 'mock-id',
    product_id: 'Test product_id',
    counted_quantity: 1,
    stock_quantity: 1,
    status: 'Test status',
    observation: 'Test observation',
    user_id: 'Test user_id',
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
  const mockCreateDto: CreateInventoryCountsDto = {
    product_id: 'Test product_id',
    counted_quantity: 1,
    stock_quantity: 1,
    status: 'Test status',
    observation: 'Test observation',
    user_id: 'Test user_id',
  };

  // Mock para o DTO de atualização
  const mockUpdateDto: Partial<CreateInventoryCountsDto> = {
    product_id: 'Updated product_id',
    counted_quantity: 2,
    stock_quantity: 2,
    status: 'Updated status',
    observation: 'Updated observation',
    user_id: 'Updated user_id',
  };

  // Mock para dados após atualização
  const mockUpdatedData = {
    ...mockData,
    ...mockUpdateDto,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryCountsController],
      providers: [
        {
          provide: InventoryCountsService,
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

    controller = module.get<InventoryCountsController>(
      InventoryCountsController,
    );
    service = module.get<InventoryCountsService>(InventoryCountsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  it('should create a new InventoryCount', async () => {
    const result = await controller.create(mockCreateDto);

    expect(service.create).toHaveBeenCalledWith(mockCreateDto);
    expect(result).toEqual(mockData);
    expect(result.product_id).toBeDefined();
    expect(result.counted_quantity).toBeDefined();
    expect(result.stock_quantity).toBeDefined();
    expect(result.status).toBeDefined();
    expect(result.observation).toBeDefined();
    expect(result.user_id).toBeDefined();
  });

  it('should return paginated InventoryCount list', async () => {
    const params = {
      page: 1,
      limit: 10,
    } as ListPaginatedInventoryCountsParamsDto;
    const result = await controller.findAll(params);

    expect(service.findAll).toHaveBeenCalledWith(params);
    expect(result).toEqual(mockPaginatedResult);
    expect(result.data).toHaveLength(1);
  });

  it('should return all InventoryCount records', async () => {
    const params = {} as ListInventoryCountsParamsDto;
    const result = await controller.list(params);

    expect(service.list).toHaveBeenCalledWith(params);
    expect(result).toEqual([mockData]);
    expect(result).toHaveLength(1);
  });

  it('should return a InventoryCount by id', async () => {
    const id = 'mock-id';
    const result = await controller.findOne(id);

    expect(service.findOne).toHaveBeenCalledWith(id);
    expect(result).toEqual(mockData);
    expect(result.id).toBe(id);
  });

  it('should update a InventoryCount', async () => {
    const id = 'mock-id';
    const result = await controller.update(
      id,
      mockUpdateDto as UpdateInventoryCountsDto,
    );

    expect(service.update).toHaveBeenCalledWith(id, mockUpdateDto);
    expect(result).toEqual(mockUpdatedData);
    expect(result.product_id).toBeDefined();
    expect(result.counted_quantity).toBeDefined();
    expect(result.stock_quantity).toBeDefined();
    expect(result.status).toBeDefined();
    expect(result.observation).toBeDefined();
    expect(result.user_id).toBeDefined();
  });

  it('should remove a InventoryCount', async () => {
    const id = 'mock-id';
    const result = await controller.remove(id);

    expect(service.remove).toHaveBeenCalledWith(id);
    expect(result).toEqual({ deleted: true });
  });
});
