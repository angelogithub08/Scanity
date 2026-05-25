/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { CreateProfilesDto } from './dto/create-profiles.dto';
import { UpdateProfilesDto } from './dto/update-profiles.dto';
import {
  ListProfilesParamsDto,
  ListPaginatedProfilesParamsDto,
} from './dto/params-profiles.dto';
import { SyncProfilePermissionsDto } from './dto/sync-profile-permissions.dto';
import { User } from '../users/entities/user.entity';

describe('ProfilesController', () => {
  let controller: ProfilesController;
  let service: ProfilesService;
  let user: User;
  // Mock data para Profile
  const mockData = {
    id: 'mock-id',
    name: 'Test name',
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
  const mockCreateDto: CreateProfilesDto = {
    name: 'Test name',
    account_id: 'Test account_id',
  };

  // Mock para o DTO de atualização
  const mockUpdateDto: Partial<CreateProfilesDto> = {
    name: 'Updated name',
    account_id: 'Updated account_id',
  };

  // Mock para dados após atualização
  const mockUpdatedData = {
    ...mockData,
    ...mockUpdateDto,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfilesController],
      providers: [
        {
          provide: ProfilesService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockData),
            findAll: jest.fn().mockResolvedValue(mockPaginatedResult),
            list: jest.fn().mockResolvedValue([mockData]),
            findOne: jest.fn().mockResolvedValue(mockData),
            update: jest.fn().mockResolvedValue(mockUpdatedData),
            remove: jest.fn().mockResolvedValue({ deleted: true }),
            syncProfilePermissions: jest.fn().mockResolvedValue({
              success: true,
              message: 'Permissões sincronizadas: 1 removidas, 2 inseridas',
              inserted: 2,
              deleted: 1,
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<ProfilesController>(ProfilesController);
    service = module.get<ProfilesService>(ProfilesService);
    user = {
      id: 'mock-user-id',
      account_id: 'mock-account-id',
    } as User;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  it('should create a new Profile', async () => {
    const result = await controller.create(mockCreateDto, user);

    expect(service.create).toHaveBeenCalledWith(mockCreateDto, user);
    expect(result).toEqual(mockData);
    expect(result.name).toBeDefined();
    expect(result.account_id).toBeDefined();
  });

  it('should return paginated Profile list', async () => {
    const params = { page: 1, limit: 10 } as ListPaginatedProfilesParamsDto;
    const result = await controller.findAll(params);

    expect(service.findAll).toHaveBeenCalledWith(params);
    expect(result).toEqual(mockPaginatedResult);
    expect(result.data).toHaveLength(1);
  });

  it('should return all Profile records', async () => {
    const params = {} as ListProfilesParamsDto;
    const result = await controller.list(params);

    expect(service.list).toHaveBeenCalledWith(params);
    expect(result).toEqual([mockData]);
    expect(result).toHaveLength(1);
  });

  it('should return a Profile by id', async () => {
    const id = 'mock-id';
    const result = await controller.findOne(id);

    expect(service.findOne).toHaveBeenCalledWith(id);
    expect(result).toEqual(mockData);
    expect(result.id).toBe(id);
  });

  it('should update a Profile', async () => {
    const id = 'mock-id';
    const result = await controller.update(
      id,
      mockUpdateDto as UpdateProfilesDto,
      user,
    );

    expect(service.update).toHaveBeenCalledWith(id, mockUpdateDto, user);
    expect(result).toEqual(mockUpdatedData);
    expect(result.name).toBeDefined();
    expect(result.account_id).toBeDefined();
  });

  it('should sync profile permissions', async () => {
    const profileId = 'profile-uuid-123';
    const syncDto: SyncProfilePermissionsDto = {
      permission_ids: [
        '123e4567-e89b-12d3-a456-426614174000',
        '123e4567-e89b-12d3-a456-426614174001',
      ],
    };
    const result = await controller.syncPermissions(profileId, syncDto);

    expect(service.syncProfilePermissions).toHaveBeenCalledWith(
      profileId,
      syncDto,
    );
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('message');
    expect(result).toHaveProperty('inserted', 2);
    expect(result).toHaveProperty('deleted', 1);
  });

  it('should remove a Profile', async () => {
    const id = 'mock-id';
    const result = await controller.remove(id, user);

    expect(service.remove).toHaveBeenCalledWith(id, user);
    expect(result).toEqual({ deleted: true });
  });
});
