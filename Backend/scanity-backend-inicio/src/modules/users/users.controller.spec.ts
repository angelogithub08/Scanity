/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUsersDto } from './dto/create-users.dto';
import { UpdateUsersDto } from './dto/update-users.dto';
import {
  ListUsersParamsDto,
  ListPaginatedUsersParamsDto,
} from './dto/params-users.dto';
import { User } from './entities/user.entity';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  // Mock data para User
  const mockData = {
    id: 'mock-id',
    name: 'Test name',
    email: 'Test email',
    password: 'Test password',
    token: 'Test token',
    account_id: 'Test account_id',
    department_id: 'Test department_id',
    collaborator_id: 'Test collaborator_id',
    is_active: true,
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
  const mockCreateDto: CreateUsersDto = {
    name: 'Test name',
    email: 'Test email',
    password: 'Test password',
    token: 'Test token',
    account_id: 'Test account_id',
  };

  // Mock para o DTO de atualização
  const mockUpdateDto: Partial<CreateUsersDto> = {
    name: 'Updated name',
    email: 'Updated email',
    password: 'Updated password',
    token: 'Updated token',
    account_id: 'Updated account_id',
  };

  // Mock para dados após atualização
  const mockUpdatedData = {
    ...mockData,
    ...mockUpdateDto,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
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

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  it('should create a new User', async () => {
    const result = await controller.create(mockCreateDto);

    expect(service.create).toHaveBeenCalledWith(mockCreateDto);
    expect(result).toEqual(mockData);
    expect(result.name).toBeDefined();
    expect(result.email).toBeDefined();
    expect(result.password).toBeDefined();
    expect(result.token).toBeDefined();
    expect(result.account_id).toBeDefined();
  });

  it('should return paginated User list', async () => {
    const params = { page: 1, limit: 10 } as ListPaginatedUsersParamsDto;
    const user = { account_id: 'mock-account-id' } as User;
    const result = await controller.findAll(params, user);

    expect(service.findAll).toHaveBeenCalledWith(params);
    expect(result).toEqual(mockPaginatedResult);
    expect(result.data).toHaveLength(1);
  });

  it('should return all User records', async () => {
    const params = {} as ListUsersParamsDto;
    const user = { account_id: 'mock-account-id' } as User;
    const result = await controller.list(params, user);

    expect(service.list).toHaveBeenCalledWith(params);
    expect(result).toEqual([mockData]);
    expect(result).toHaveLength(1);
  });

  it('should return a User by id', async () => {
    const id = 'mock-id';
    const result = await controller.findOne(id);

    expect(service.findOne).toHaveBeenCalledWith(id);
    expect(result).toEqual(mockData);
    expect(result.id).toBe(id);
  });

  it('should update a User', async () => {
    const id = 'mock-id';
    const result = await controller.update(id, mockUpdateDto as UpdateUsersDto);

    expect(service.update).toHaveBeenCalledWith(id, mockUpdateDto);
    expect(result).toEqual(mockUpdatedData);
    expect(result.name).toBeDefined();
    expect(result.email).toBeDefined();
    expect(result.password).toBeDefined();
    expect(result.token).toBeDefined();
    expect(result.account_id).toBeDefined();
  });

  it('should remove a User', async () => {
    const id = 'mock-id';
    const result = await controller.remove(id);

    expect(service.remove).toHaveBeenCalledWith(id);
    expect(result).toEqual({ deleted: true });
  });
});
