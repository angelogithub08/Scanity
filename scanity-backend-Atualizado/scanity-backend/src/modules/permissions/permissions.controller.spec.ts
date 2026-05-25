/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { CreatePermissionsDto } from './dto/create-permissions.dto';
import { UpdatePermissionsDto } from './dto/update-permissions.dto';
import {
  ListPermissionsParamsDto,
  ListPaginatedPermissionsParamsDto,
} from './dto/params-permissions.dto';
import { User } from '../users/entities/user.entity';

describe('PermissionsController', () => {
  let controller: PermissionsController;
  let service: PermissionsService;
  let user: User;
  // Mock data para Permission
  const mockData = {
    id: 'mock-id',
    name: 'Test name',
    key_group: 'Test key_group',
    key: 'Test key',
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
  const mockCreateDto: CreatePermissionsDto = {
    name: 'Test name',
    key_group: 'Test key_group',
    key: 'Test key',
  };

  // Mock para o DTO de atualização
  const mockUpdateDto: Partial<CreatePermissionsDto> = {
    name: 'Updated name',
    key_group: 'Updated key_group',
    key: 'Updated key',
  };

  // Mock para dados após atualização
  const mockUpdatedData = {
    ...mockData,
    ...mockUpdateDto,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PermissionsController],
      providers: [
        {
          provide: PermissionsService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockData),
            findAll: jest.fn().mockResolvedValue(mockPaginatedResult),
            list: jest.fn().mockResolvedValue([mockData]),
            findOne: jest.fn().mockResolvedValue(mockData),
            update: jest.fn().mockResolvedValue(mockUpdatedData),
            remove: jest.fn().mockResolvedValue({ deleted: true }),
            findByProfileId: jest.fn().mockResolvedValue([mockData]),
          },
        },
      ],
    }).compile();

    controller = module.get<PermissionsController>(PermissionsController);
    service = module.get<PermissionsService>(PermissionsService);
    user = {
      id: 'mock-user-id',
      account_id: 'mock-account-id',
    } as User;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  it('should create a new Permission', async () => {
    const result = await controller.create(mockCreateDto, user);

    expect(service.create).toHaveBeenCalledWith(mockCreateDto, user);
    expect(result).toEqual(mockData);
    expect(result.name).toBeDefined();
    expect(result.key_group).toBeDefined();
    expect(result.key).toBeDefined();
  });

  it('should return paginated Permission list', async () => {
    const params = { page: 1, limit: 10 } as ListPaginatedPermissionsParamsDto;
    const result = await controller.findAll(params);

    expect(service.findAll).toHaveBeenCalledWith(params);
    expect(result).toEqual(mockPaginatedResult);
    expect(result.data).toHaveLength(1);
  });

  it('should return all Permission records', async () => {
    const params = {} as ListPermissionsParamsDto;
    const result = await controller.list(params);

    expect(service.list).toHaveBeenCalledWith(params);
    expect(result).toEqual([mockData]);
    expect(result).toHaveLength(1);
  });

  it('should return a Permission by id', async () => {
    const id = 'mock-id';
    const result = await controller.findOne(id);

    expect(service.findOne).toHaveBeenCalledWith(id);
    expect(result).toEqual(mockData);
    expect(result.id).toBe(id);
  });

  it('should update a Permission', async () => {
    const id = 'mock-id';
    const result = await controller.update(
      id,
      mockUpdateDto as UpdatePermissionsDto,
      user,
    );

    expect(service.update).toHaveBeenCalledWith(id, mockUpdateDto, user);
    expect(result).toEqual(mockUpdatedData);
    expect(result.name).toBeDefined();
    expect(result.key_group).toBeDefined();
    expect(result.key).toBeDefined();
  });

  it('should return permissions for a specific profile', async () => {
    const profileId = 'profile-uuid-123';
    const result = await controller.findByProfileId(profileId);

    expect(service.findByProfileId).toHaveBeenCalledWith(profileId);
    expect(result).toEqual([mockData]);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBeDefined();
    expect(result[0].key_group).toBeDefined();
    expect(result[0].key).toBeDefined();
  });

  it('should remove a Permission', async () => {
    const id = 'mock-id';
    const result = await controller.remove(id, user);

    expect(service.remove).toHaveBeenCalledWith(id, user);
    expect(result).toEqual({ deleted: true });
  });
});
