/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { SupliersController } from './supliers.controller';
import { SupliersService } from './supliers.service';
import { CreateSupliersDto } from './dto/create-supliers.dto';
import { UpdateSupliersDto } from './dto/update-supliers.dto';
import {
  ListSupliersParamsDto,
  ListPaginatedSupliersParamsDto,
} from './dto/params-supliers.dto';

describe('SupliersController', () => {
  let controller: SupliersController;
  let service: SupliersService;

  // Mock data para Suplier
  const mockData = {
    id: 'mock-id',
    name: 'Test name',
    phone: 'Test phone',
    email: 'Test email',
    responsible_name: 'Test responsible_name',
    observations: 'Test observations',
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
  const mockCreateDto: CreateSupliersDto = {
    name: 'Test name',
    phone: 'Test phone',
    email: 'Test email',
    responsible_name: 'Test responsible_name',
    observations: 'Test observations',
    account_id: 'Test account_id',
  };

  // Mock para o DTO de atualização
  const mockUpdateDto: Partial<CreateSupliersDto> = {
    name: 'Updated name',
    phone: 'Updated phone',
    email: 'Updated email',
    responsible_name: 'Updated responsible_name',
    observations: 'Updated observations',
  };

  // Mock para dados após atualização
  const mockUpdatedData = {
    ...mockData,
    ...mockUpdateDto,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SupliersController],
      providers: [
        {
          provide: SupliersService,
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

    controller = module.get<SupliersController>(SupliersController);
    service = module.get<SupliersService>(SupliersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  it('should create a new Suplier', async () => {
    const result = await controller.create(mockCreateDto);

    expect(service.create).toHaveBeenCalledWith(mockCreateDto);
    expect(result).toEqual(mockData);
    expect(result.name).toBeDefined();
    expect(result.phone).toBeDefined();
    expect(result.email).toBeDefined();
    expect(result.responsible_name).toBeDefined();
    expect(result.observations).toBeDefined();
  });

  it('should return paginated Suplier list', async () => {
    const params = { page: 1, limit: 10 } as ListPaginatedSupliersParamsDto;
    const result = await controller.findAll(params);

    expect(service.findAll).toHaveBeenCalledWith(params);
    expect(result).toEqual(mockPaginatedResult);
    expect(result.data).toHaveLength(1);
  });

  it('should return all Suplier records', async () => {
    const params = {} as ListSupliersParamsDto;
    const result = await controller.list(params);

    expect(service.list).toHaveBeenCalledWith(params);
    expect(result).toEqual([mockData]);
    expect(result).toHaveLength(1);
  });

  it('should return a Suplier by id', async () => {
    const id = 'mock-id';
    const result = await controller.findOne(id);

    expect(service.findOne).toHaveBeenCalledWith(id);
    expect(result).toEqual(mockData);
    expect(result.id).toBe(id);
  });

  it('should update a Suplier', async () => {
    const id = 'mock-id';
    const result = await controller.update(
      id,
      mockUpdateDto as UpdateSupliersDto,
    );

    expect(service.update).toHaveBeenCalledWith(id, mockUpdateDto);
    expect(result).toEqual(mockUpdatedData);
    expect(result.name).toBeDefined();
    expect(result.phone).toBeDefined();
    expect(result.email).toBeDefined();
    expect(result.responsible_name).toBeDefined();
    expect(result.observations).toBeDefined();
  });

  it('should remove a Suplier', async () => {
    const id = 'mock-id';
    const result = await controller.remove(id);

    expect(service.remove).toHaveBeenCalledWith(id);
    expect(result).toEqual({ deleted: true });
  });
});
