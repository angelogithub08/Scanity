/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProfilePermissionsService } from './profile-permissions.service';
import { ProfilePermissionsRepository } from './profile-permissions.repository';
import { CreateProfilePermissionsDto } from './dto/create-profile-permissions.dto';
import {
  ListProfilePermissionsParamsDto,
  ListPaginatedProfilePermissionsParamsDto,
} from './dto/params-profile-permissions.dto';
import { ProfilePermission } from './entities/profile-permission.entity';
import { User } from '../users/entities/user.entity';
import { LogsService } from '../logs/logs.service';
import { LogsRepository } from '../logs/logs.repository';

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  last_page: number;
}

describe('ProfilePermissionsService', () => {
  let service: ProfilePermissionsService;
  let repository: ProfilePermissionsRepository;
  let logsService: LogsService;
  let logsRepository: LogsRepository;
  let user: User;
  // Mock data para ProfilePermission
  const mockProfilePermission = {
    id: 1,
    profile_id: 'Test profile_id',
    permission_id: 'Test permission_id',
    created_at: new Date(),
    updated_at: new Date(),
  } as unknown as ProfilePermission;

  const mockPaginatedResult: PaginatedResult<ProfilePermission> = {
    data: [mockProfilePermission],
    total: 1,
    page: 1,
    last_page: 1,
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
  const mockUpdatedProfilePermission = {
    ...mockProfilePermission,
    ...mockUpdateDto,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfilePermissionsService,
        {
          provide: ProfilePermissionsRepository,
          useValue: {
            create: jest.fn().mockResolvedValue(mockProfilePermission),
            findAll: jest.fn().mockResolvedValue(mockPaginatedResult),
            list: jest.fn().mockResolvedValue([mockProfilePermission]),
            findOne: jest.fn().mockResolvedValue(mockProfilePermission),
            update: jest.fn().mockResolvedValue(mockUpdatedProfilePermission),
            remove: jest.fn().mockResolvedValue(1),
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

    service = module.get<ProfilePermissionsService>(ProfilePermissionsService);
    repository = module.get<ProfilePermissionsRepository>(
      ProfilePermissionsRepository,
    );
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
    it('should create a ProfilePermission successfully', async () => {
      const result = await service.create(mockCreateDto, user);

      expect(repository.create).toHaveBeenCalledWith(mockCreateDto);
      expect(result).toEqual(mockProfilePermission);
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
          'Erro ao criar ProfilePermission',
        );
      }
    });
  });

  describe('findAll', () => {
    it('should return paginated ProfilePermissions', async () => {
      const params: ListPaginatedProfilePermissionsParamsDto = {
        page: 1,
        limit: 10,
      };
      const result = await service.findAll(params);

      expect(repository.findAll).toHaveBeenCalledWith(params);
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should throw BadRequestException on findAll error', async () => {
      const params: ListPaginatedProfilePermissionsParamsDto = {
        page: 1,
        limit: 10,
      };

      jest.spyOn(repository, 'findAll').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      try {
        await service.findAll(params);
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain(
          'Erro ao buscar ProfilePermissions paginados',
        );
      }
    });
  });

  describe('list', () => {
    it('should return all ProfilePermissions', async () => {
      const params: ListProfilePermissionsParamsDto = {};
      const result = await service.list(params);

      expect(repository.list).toHaveBeenCalledWith(params);
      expect(result).toEqual([mockProfilePermission]);
    });

    it('should throw BadRequestException on list error', async () => {
      const params: ListProfilePermissionsParamsDto = {};

      jest.spyOn(repository, 'list').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      try {
        await service.list(params);
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain(
          'Erro ao listar ProfilePermissions',
        );
      }
    });
  });

  describe('findOne', () => {
    it('should return a ProfilePermission by id', async () => {
      const result = await service.findOne('mock-id');

      expect(repository.findOne).toHaveBeenCalledWith('mock-id');
      expect(result).toEqual(mockProfilePermission);
    });

    it('should rethrow NotFoundException from repository', async () => {
      jest
        .spyOn(repository, 'findOne')
        .mockRejectedValueOnce(
          new NotFoundException('ProfilePermission not found'),
        );

      try {
        await service.findOne('not-found');
        fail('Expected NotFoundException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toContain(
          'ProfilePermission not found',
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
          'Erro ao buscar ProfilePermission',
        );
      }
    });
  });

  describe('update', () => {
    it('should update a ProfilePermission', async () => {
      const result = await service.update('mock-id', mockUpdateDto, user);

      expect(repository.update).toHaveBeenCalledWith('mock-id', mockUpdateDto);
      expect(result).toEqual(mockUpdatedProfilePermission);
    });

    it('should rethrow NotFoundException from repository', async () => {
      jest
        .spyOn(repository, 'update')
        .mockRejectedValueOnce(
          new NotFoundException('ProfilePermission not found'),
        );

      try {
        await service.update('not-found', mockUpdateDto, user);
        fail('Expected NotFoundException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toContain(
          'ProfilePermission not found',
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
          'Erro ao atualizar ProfilePermission',
        );
      }
    });
  });

  describe('remove', () => {
    it('should remove a ProfilePermission', async () => {
      const result = await service.remove('mock-id', user);

      expect(repository.remove).toHaveBeenCalledWith('mock-id');
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message');
    });

    it('should rethrow NotFoundException from repository', async () => {
      jest
        .spyOn(repository, 'remove')
        .mockRejectedValueOnce(
          new NotFoundException('ProfilePermission not found'),
        );

      try {
        await service.remove('not-found', user);
        fail('Expected NotFoundException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toContain(
          'ProfilePermission not found',
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
          'Erro ao remover ProfilePermission',
        );
      }
    });
  });
});
