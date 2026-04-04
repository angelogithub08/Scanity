/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { CreateCustomersDto } from './dto/create-customers.dto';
import { UpdateCustomersDto } from './dto/update-customers.dto';
import {
  ListCustomersParamsDto,
  ListPaginatedCustomersParamsDto,
} from './dto/params-customers.dto';
import { User } from '../users/entities/user.entity';

describe('CustomersController', () => {
  let controller: CustomersController;
  let service: CustomersService;

  // Mock data para Customer
  const mockData = {
    id: 'mock-id',
    name: 'Test name',
    document: 'Test document',
    phone: 'Test phone',
    email: 'Test email',
    street: 'Test street',
    number: 'Test number',
    city: 'Test city',
    state: 'Test state',
    neighborhood: 'Test neighborhood',
    zipcode: 'Test zipcode',
    complement: 'Test complement',
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
  const mockCreateDto: CreateCustomersDto = {
    name: 'Test name',
    document: 'Test document',
    phone: 'Test phone',
    email: 'Test email',
    street: 'Test street',
    number: 'Test number',
    city: 'Test city',
    state: 'Test state',
    neighborhood: 'Test neighborhood',
    zipcode: 'Test zipcode',
    complement: 'Test complement',
    account_id: 'Test account_id',
  };

  // Mock para o DTO de atualização
  const mockUpdateDto: Partial<CreateCustomersDto> = {
    name: 'Updated name',
    document: 'Updated document',
    phone: 'Updated phone',
    email: 'Updated email',
    street: 'Updated street',
    number: 'Updated number',
    city: 'Updated city',
    state: 'Updated state',
    neighborhood: 'Updated neighborhood',
    zipcode: 'Updated zipcode',
    complement: 'Updated complement',
    account_id: 'Updated account_id',
  };

  // Mock para dados após atualização
  const mockUpdatedData = {
    ...mockData,
    ...mockUpdateDto,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomersController],
      providers: [
        {
          provide: CustomersService,
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

    controller = module.get<CustomersController>(CustomersController);
    service = module.get<CustomersService>(CustomersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  it('should create a new Customer', async () => {
    const result = await controller.create(mockCreateDto);

    expect(service.create).toHaveBeenCalledWith(mockCreateDto);
    expect(result).toEqual(mockData);
    expect(result.name).toBeDefined();
    expect(result.document).toBeDefined();
    expect(result.phone).toBeDefined();
    expect(result.email).toBeDefined();
    expect(result.street).toBeDefined();
    expect(result.number).toBeDefined();
    expect(result.city).toBeDefined();
    expect(result.state).toBeDefined();
    expect(result.neighborhood).toBeDefined();
    expect(result.zipcode).toBeDefined();
    expect(result.complement).toBeDefined();
    expect(result.account_id).toBeDefined();
  });

  it('should return paginated Customer list', async () => {
    const params = { page: 1, limit: 10 } as ListPaginatedCustomersParamsDto;
    const user = { account_id: 'mock-account-id' } as User;
    const result = await controller.findAll(params, user);

    expect(service.findAll).toHaveBeenCalledWith(params);
    expect(result).toEqual(mockPaginatedResult);
    expect(result.data).toHaveLength(1);
  });

  it('should return all Customer records', async () => {
    const params = {} as ListCustomersParamsDto;
    const user = { account_id: 'mock-account-id' } as User;
    const result = await controller.list(params, user);

    expect(service.list).toHaveBeenCalledWith(params);
    expect(result).toEqual([mockData]);
    expect(result).toHaveLength(1);
  });

  it('should return a Customer by id', async () => {
    const id = 'mock-id';
    const result = await controller.findOne(id);

    expect(service.findOne).toHaveBeenCalledWith(id);
    expect(result).toEqual(mockData);
    expect(result.id).toBe(id);
  });

  it('should update a Customer', async () => {
    const id = 'mock-id';
    const result = await controller.update(
      id,
      mockUpdateDto as UpdateCustomersDto,
    );

    expect(service.update).toHaveBeenCalledWith(id, mockUpdateDto);
    expect(result).toEqual(mockUpdatedData);
    expect(result.name).toBeDefined();
    expect(result.document).toBeDefined();
    expect(result.phone).toBeDefined();
    expect(result.email).toBeDefined();
    expect(result.street).toBeDefined();
    expect(result.number).toBeDefined();
    expect(result.city).toBeDefined();
    expect(result.state).toBeDefined();
    expect(result.neighborhood).toBeDefined();
    expect(result.zipcode).toBeDefined();
    expect(result.complement).toBeDefined();
    expect(result.account_id).toBeDefined();
  });

  it('should remove a Customer', async () => {
    const id = 'mock-id';
    const result = await controller.remove(id);

    expect(service.remove).toHaveBeenCalledWith(id);
    expect(result).toEqual({ deleted: true });
  });
});
