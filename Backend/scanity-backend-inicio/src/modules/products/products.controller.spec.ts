/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { CreateProductsDto } from './dto/create-products.dto';
import { UpdateProductsDto } from './dto/update-products.dto';
import {
  ListProductsParamsDto,
  ListPaginatedProductsParamsDto,
} from './dto/params-products.dto';
import { User } from '../users/entities/user.entity';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: ProductsService;

  // Mock data para Product
  const mockData = {
    id: 'mock-id',
    name: 'Test name',
    value: 1,
    account_id: 'Test account_id',
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
  const mockCreateDto: CreateProductsDto = {
    name: 'Test name',
    value: 1,
    account_id: 'Test account_id',
    description: 'Test description',
    barcode: '1234567890',
  };

  // Mock para o DTO de atualização
  const mockUpdateDto: Partial<CreateProductsDto> = {
    name: 'Updated name',
    value: 2,
    account_id: 'Updated account_id',
    description: 'Updated description',
    barcode: '1234567890',
  };

  // Mock para dados após atualização
  const mockUpdatedData = {
    ...mockData,
    ...mockUpdateDto,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
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

    controller = module.get<ProductsController>(ProductsController);
    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  it('should create a new Product', async () => {
    const result = await controller.create(mockCreateDto);

    expect(service.create).toHaveBeenCalledWith(mockCreateDto);
    expect(result).toEqual(mockData);
    expect(result.name).toBeDefined();
    expect(result.value).toBeDefined();
    expect(result.account_id).toBeDefined();
  });

  it('should return paginated Product list', async () => {
    const params = { page: 1, limit: 10 } as ListPaginatedProductsParamsDto;
    const user = { account_id: 'mock-account-id' } as User;
    const result = await controller.findAll(params, user);

    expect(service.findAll).toHaveBeenCalledWith(params);
    expect(result).toEqual(mockPaginatedResult);
    expect(result.data).toHaveLength(1);
  });

  it('should return all Product records', async () => {
    const params = {} as ListProductsParamsDto;
    const user = { account_id: 'mock-account-id' } as User;
    const result = await controller.list(params, user);

    expect(service.list).toHaveBeenCalledWith(params);
    expect(result).toEqual([mockData]);
    expect(result).toHaveLength(1);
  });

  it('should return a Product by id', async () => {
    const id = 'mock-id';
    const result = await controller.findOne(id);

    expect(service.findOne).toHaveBeenCalledWith(id);
    expect(result).toEqual(mockData);
    expect(result.id).toBe(id);
  });

  it('should update a Product', async () => {
    const id = 'mock-id';
    const result = await controller.update(
      id,
      mockUpdateDto as UpdateProductsDto,
    );

    expect(service.update).toHaveBeenCalledWith(id, mockUpdateDto);
    expect(result).toEqual(mockUpdatedData);
    expect(result.name).toBeDefined();
    expect(result.value).toBeDefined();
    expect(result.account_id).toBeDefined();
  });

  it('should remove a Product', async () => {
    const id = 'mock-id';
    const result = await controller.remove(id);

    expect(service.remove).toHaveBeenCalledWith(id);
    expect(result).toEqual({ deleted: true });
  });
});
