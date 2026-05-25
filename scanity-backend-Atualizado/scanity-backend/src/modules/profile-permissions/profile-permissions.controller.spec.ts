/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ProfilePermissionsController } from './profile-permissions.controller';
import { ProfilePermissionsService } from './profile-permissions.service';
import { CreateProfilePermissionsDto } from './dto/create-profile-permissions.dto';
import { UpdateProfilePermissionsDto } from './dto/update-profile-permissions.dto';
import {
  ListProfilePermissionsParamsDto,
  ListPaginatedProfilePermissionsParamsDto,
} from './dto/params-profile-permissions.dto';
import { User } from '../users/entities/user.entity';

describe('ProfilePermissionsController', () => {
  let controller: ProfilePermissionsController;
  let service: ProfilePermissionsService;
  let user: User;
  // Mock data para ProfilePermission
  const mockData = {
    id: 'mock-id',
    profile_id: 'Test profile_id',
    permission_id: 'Test permission_id',
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
  const mockCreateDto: CreateProfilePermissionsDto = {
    profile_id: 'Test profile_id',
    permission_id: 'Test permission_id',
  };

  // Mock para o DTO de atualização
  const mockUpdateDto: Partial<CreateProfilePermissionsDto> = {
    profile_id: 'Updated profile_id',
    permission_id: 'Updated permission_id',
  };

  // Mock para dados após atualização
  const mockUpdatedData = {
    ...mockData,
    ...mockUpdateDto,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfilePermissionsController],
      providers: [
        {
          provide: ProfilePermissionsService,
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

    controller = module.get<ProfilePermissionsController>(
      ProfilePermissionsController,
    );
    service = module.get<ProfilePermissionsService>(ProfilePermissionsService);
    user = {
      id: 'mock-user-id',
      account_id: 'mock-account-id',
    } as User;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  it('should create a new ProfilePermission', async () => {
    const result = await controller.create(mockCreateDto, user);

    expect(service.create).toHaveBeenCalledWith(mockCreateDto, user);
    expect(result).toEqual(mockData);
    expect(result.profile_id).toBeDefined();
    expect(result.permission_id).toBeDefined();
  });

  it('should return paginated ProfilePermission list', async () => {
    const params = {
      page: 1,
      limit: 10,
    } as ListPaginatedProfilePermissionsParamsDto;
    const result = await controller.findAll(params);

    expect(service.findAll).toHaveBeenCalledWith(params);
    expect(result).toEqual(mockPaginatedResult);
    expect(result.data).toHaveLength(1);
  });

  it('should return all ProfilePermission records', async () => {
    const params = {} as ListProfilePermissionsParamsDto;
    const result = await controller.list(params);

    expect(service.list).toHaveBeenCalledWith(params);
    expect(result).toEqual([mockData]);
    expect(result).toHaveLength(1);
  });

  it('should return a ProfilePermission by id', async () => {
    const id = 'mock-id';
    const result = await controller.findOne(id);

    expect(service.findOne).toHaveBeenCalledWith(id);
    expect(result).toEqual(mockData);
    expect(result.id).toBe(id);
  });

  it('should update a ProfilePermission', async () => {
    const id = 'mock-id';
    const result = await controller.update(
      id,
      mockUpdateDto as UpdateProfilePermissionsDto,
      user,
    );

    expect(service.update).toHaveBeenCalledWith(id, mockUpdateDto, user);
    expect(result).toEqual(mockUpdatedData);
    expect(result.profile_id).toBeDefined();
    expect(result.permission_id).toBeDefined();
  });

  it('should remove a ProfilePermission', async () => {
    const id = 'mock-id';
    const result = await controller.remove(id, user);

    expect(service.remove).toHaveBeenCalledWith(id, user);
    expect(result).toEqual({ deleted: true });
  });
});
