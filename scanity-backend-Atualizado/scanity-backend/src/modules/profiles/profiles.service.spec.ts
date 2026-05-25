/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { ProfilesRepository } from './profiles.repository';
import { CreateProfilesDto } from './dto/create-profiles.dto';
import {
  ListProfilesParamsDto,
  ListPaginatedProfilesParamsDto,
} from './dto/params-profiles.dto';
import { SyncProfilePermissionsDto } from './dto/sync-profile-permissions.dto';
import { Profile } from './entities/profile.entity';
import { User } from '../users/entities/user.entity';
import { LogsService } from '../logs/logs.service';
import { LogsRepository } from '../logs/logs.repository';

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  last_page: number;
}

describe('ProfilesService', () => {
  let service: ProfilesService;
  let repository: ProfilesRepository;
  let logsService: LogsService;
  let logsRepository: LogsRepository;
  let user: User;
  // Mock data para Profile
  const mockProfile = {
    id: 1,
    name: 'Test name',
    account_id: 'Test account_id',
    created_at: new Date(),
    updated_at: new Date(),
  } as unknown as Profile;

  const mockPaginatedResult: PaginatedResult<Profile> = {
    data: [mockProfile],
    total: 1,
    page: 1,
    last_page: 1,
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
  const mockUpdatedProfile = {
    ...mockProfile,
    ...mockUpdateDto,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfilesService,
        {
          provide: ProfilesRepository,
          useValue: {
            create: jest.fn().mockResolvedValue(mockProfile),
            findAll: jest.fn().mockResolvedValue(mockPaginatedResult),
            list: jest.fn().mockResolvedValue([mockProfile]),
            findOne: jest.fn().mockResolvedValue(mockProfile),
            update: jest.fn().mockResolvedValue(mockUpdatedProfile),
            remove: jest.fn().mockResolvedValue(1),
            syncProfilePermissions: jest
              .fn()
              .mockResolvedValue({ inserted: 2, deleted: 1 }),
          },
        },
        {
          provide: LogsService,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: LogsRepository,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProfilesService>(ProfilesService);
    repository = module.get<ProfilesRepository>(ProfilesRepository);
    logsService = module.get<LogsService>(LogsService);
    logsRepository = module.get<LogsRepository>(LogsRepository);
    user = {
      id: 'mock-user-id',
      account_id: 'mock-account-id',
    } as User;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(repository).toBeDefined();
    expect(logsService).toBeDefined();
    expect(logsRepository).toBeDefined();
  });

  describe('create', () => {
    it('should create a Profile successfully', async () => {
      const result = await service.create(mockCreateDto, user);

      expect(repository.create).toHaveBeenCalledWith(mockCreateDto);
      expect(result).toEqual(mockProfile);
    });

    it('should throw BadRequestException on create error', async () => {
      jest
        .spyOn(repository, 'create')
        .mockRejectedValueOnce(new Error('Database error'));

      try {
        await service.create(mockCreateDto, user);
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain(
          'Erro ao criar Profile',
        );
      }
    });
  });

  describe('findAll', () => {
    it('should return paginated Profiles', async () => {
      const params: ListPaginatedProfilesParamsDto = { page: 1, limit: 10 };
      const result = await service.findAll(params);

      expect(repository.findAll).toHaveBeenCalledWith(params);
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should throw BadRequestException on findAll error', async () => {
      const params: ListPaginatedProfilesParamsDto = { page: 1, limit: 10 };

      jest.spyOn(repository, 'findAll').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      try {
        await service.findAll(params);
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain(
          'Erro ao buscar Profiles paginados',
        );
      }
    });
  });

  describe('list', () => {
    it('should return all Profiles', async () => {
      const params: ListProfilesParamsDto = {};
      const result = await service.list(params);

      expect(repository.list).toHaveBeenCalledWith(params);
      expect(result).toEqual([mockProfile]);
    });

    it('should throw BadRequestException on list error', async () => {
      const params: ListProfilesParamsDto = {};

      jest.spyOn(repository, 'list').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      try {
        await service.list(params);
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain(
          'Erro ao listar Profiles',
        );
      }
    });
  });

  describe('findOne', () => {
    it('should return a Profile by id', async () => {
      const result = await service.findOne('mock-id');

      expect(repository.findOne).toHaveBeenCalledWith('mock-id');
      expect(result).toEqual(mockProfile);
    });

    it('should rethrow NotFoundException from repository', async () => {
      jest
        .spyOn(repository, 'findOne')
        .mockRejectedValueOnce(new NotFoundException('Profile not found'));

      try {
        await service.findOne('not-found');
        fail('Expected NotFoundException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toContain(
          'Profile not found',
        );
      }
    });

    it('should rethrow BadRequestException from repository', async () => {
      jest
        .spyOn(repository, 'findOne')
        .mockRejectedValueOnce(new BadRequestException('Invalid ID'));

      try {
        await service.findOne('invalid-id');
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain('Invalid ID');
      }
    });

    it('should wrap other errors in BadRequestException', async () => {
      jest.spyOn(repository, 'findOne').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      try {
        await service.findOne('error-id');
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain(
          'Erro ao buscar Profile',
        );
      }
    });
  });

  describe('update', () => {
    it('should update a Profile', async () => {
      const result = await service.update('mock-id', mockUpdateDto, user);

      expect(repository.update).toHaveBeenCalledWith('mock-id', mockUpdateDto);
      expect(result).toEqual(mockUpdatedProfile);
    });

    it('should rethrow NotFoundException from repository', async () => {
      jest
        .spyOn(repository, 'update')
        .mockRejectedValueOnce(new NotFoundException('Profile not found'));

      try {
        await service.update('not-found', mockUpdateDto, user);
        fail('Expected NotFoundException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toContain(
          'Profile not found',
        );
      }
    });

    it('should wrap other errors in BadRequestException', async () => {
      jest.spyOn(repository, 'update').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      try {
        await service.update('error-id', mockUpdateDto, user);
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain(
          'Erro ao atualizar Profile',
        );
      }
    });
  });

  describe('remove', () => {
    it('should remove a Profile', async () => {
      const result = await service.remove('mock-id', user);

      expect(repository.remove).toHaveBeenCalledWith('mock-id');
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message');
    });

    it('should rethrow NotFoundException from repository', async () => {
      jest
        .spyOn(repository, 'remove')
        .mockRejectedValueOnce(new NotFoundException('Profile not found'));

      try {
        await service.remove('not-found', user);
        fail('Expected NotFoundException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toContain(
          'Profile not found',
        );
      }
    });

    it('should wrap other errors in BadRequestException', async () => {
      jest.spyOn(repository, 'remove').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      try {
        await service.remove('error-id', user);
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain(
          'Erro ao remover Profile',
        );
      }
    });
  });

  describe('syncProfilePermissions', () => {
    const mockSyncDto: SyncProfilePermissionsDto = {
      permission_ids: [
        '123e4567-e89b-12d3-a456-426614174000',
        '123e4567-e89b-12d3-a456-426614174001',
      ],
    };

    it('should sync profile permissions successfully', async () => {
      const profileId = 'profile-uuid-123';
      const result = await service.syncProfilePermissions(
        profileId,
        mockSyncDto,
      );

      expect(repository.syncProfilePermissions).toHaveBeenCalledWith(
        profileId,
        mockSyncDto.permission_ids,
      );
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('inserted', 2);
      expect(result).toHaveProperty('deleted', 1);
    });

    it('should rethrow NotFoundException from repository', async () => {
      const profileId = 'profile-not-found';
      jest
        .spyOn(repository, 'syncProfilePermissions')
        .mockRejectedValueOnce(new NotFoundException('Profile not found'));

      try {
        await service.syncProfilePermissions(profileId, mockSyncDto);
        fail('Expected NotFoundException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toContain(
          'Profile not found',
        );
      }
    });

    it('should rethrow BadRequestException from repository', async () => {
      const profileId = 'profile-uuid-invalid';
      jest
        .spyOn(repository, 'syncProfilePermissions')
        .mockRejectedValueOnce(new BadRequestException('Invalid permissions'));

      try {
        await service.syncProfilePermissions(profileId, mockSyncDto);
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain(
          'Invalid permissions',
        );
      }
    });

    it('should wrap other errors in BadRequestException', async () => {
      const profileId = 'profile-uuid-error';
      jest
        .spyOn(repository, 'syncProfilePermissions')
        .mockRejectedValueOnce(new Error('Database error'));

      try {
        await service.syncProfilePermissions(profileId, mockSyncDto);
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain(
          'Erro ao sincronizar permissões do profile',
        );
      }
    });

    it('should handle empty permission list', async () => {
      const profileId = 'profile-uuid-123';
      const emptyDto: SyncProfilePermissionsDto = { permission_ids: [] };

      jest
        .spyOn(repository, 'syncProfilePermissions')
        .mockResolvedValueOnce({ inserted: 0, deleted: 3 });

      const result = await service.syncProfilePermissions(profileId, emptyDto);

      expect(repository.syncProfilePermissions).toHaveBeenCalledWith(
        profileId,
        [],
      );
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('inserted', 0);
      expect(result).toHaveProperty('deleted', 3);
    });
  });
});
