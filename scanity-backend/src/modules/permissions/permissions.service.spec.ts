/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PermissionsRepository } from './permissions.repository';
import { CreatePermissionsDto } from './dto/create-permissions.dto';
import {
  ListPermissionsParamsDto,
  ListPaginatedPermissionsParamsDto,
} from './dto/params-permissions.dto';
import { Permission } from './entities/permission.entity';
import { User } from '../users/entities/user.entity';

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  last_page: number;
}

describe('PermissionsService', () => {
  let service: PermissionsService;
  let repository: PermissionsRepository;
  let user: User;
  // Mock data para Permission
  const mockPermission = {
    id: 1,
    name: 'Test name',
    key_group: 'Test key_group',
    key: 'Test key',
    created_at: new Date(),
    updated_at: new Date(),
  } as unknown as Permission;

  const mockPaginatedResult: PaginatedResult<Permission> = {
    data: [mockPermission],
    total: 1,
    page: 1,
    last_page: 1,
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
  const mockUpdatedPermission = {
    ...mockPermission,
    ...mockUpdateDto,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        {
          provide: PermissionsRepository,
          useValue: {
            create: jest.fn().mockResolvedValue(mockPermission),
            findAll: jest.fn().mockResolvedValue(mockPaginatedResult),
            list: jest.fn().mockResolvedValue([mockPermission]),
            findOne: jest.fn().mockResolvedValue(mockPermission),
            update: jest.fn().mockResolvedValue(mockUpdatedPermission),
            remove: jest.fn().mockResolvedValue(1),
            findByProfileId: jest.fn().mockResolvedValue([mockPermission]),
          },
        },
      ],
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);
    repository = module.get<PermissionsRepository>(PermissionsRepository);
    user = {
      id: 'mock-user-id',
      account_id: 'mock-account-id',
    } as User;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(repository).toBeDefined();
    expect(user).toBeDefined();
  });

  describe('create', () => {
    it('should create a Permission successfully', async () => {
      const result = await service.create(mockCreateDto, user);

      expect(repository.create).toHaveBeenCalledWith(mockCreateDto);
      expect(result).toEqual(mockPermission);
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
          'Erro ao criar Permission',
        );
      }
    });
  });

  describe('findAll', () => {
    it('should return paginated Permissions', async () => {
      const params: ListPaginatedPermissionsParamsDto = { page: 1, limit: 10 };
      const result = await service.findAll(params);

      expect(repository.findAll).toHaveBeenCalledWith(params);
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should throw BadRequestException on findAll error', async () => {
      const params: ListPaginatedPermissionsParamsDto = { page: 1, limit: 10 };

      jest.spyOn(repository, 'findAll').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      try {
        await service.findAll(params);
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain(
          'Erro ao buscar Permissions paginados',
        );
      }
    });
  });

  describe('list', () => {
    it('should return all Permissions', async () => {
      const params: ListPermissionsParamsDto = {};
      const result = await service.list(params);

      expect(repository.list).toHaveBeenCalledWith(params);
      expect(result).toEqual([mockPermission]);
    });

    it('should throw BadRequestException on list error', async () => {
      const params: ListPermissionsParamsDto = {};

      jest.spyOn(repository, 'list').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      try {
        await service.list(params);
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain(
          'Erro ao listar Permissions',
        );
      }
    });
  });

  describe('findOne', () => {
    it('should return a Permission by id', async () => {
      const result = await service.findOne('mock-id');

      expect(repository.findOne).toHaveBeenCalledWith('mock-id');
      expect(result).toEqual(mockPermission);
    });

    it('should rethrow NotFoundException from repository', async () => {
      jest
        .spyOn(repository, 'findOne')
        .mockRejectedValueOnce(new NotFoundException('Permission not found'));

      try {
        await service.findOne('not-found');
        fail('Expected NotFoundException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toContain(
          'Permission not found',
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
          'Erro ao buscar Permission',
        );
      }
    });
  });

  describe('update', () => {
    it('should update a Permission', async () => {
      const result = await service.update('mock-id', mockUpdateDto, user);

      expect(repository.update).toHaveBeenCalledWith('mock-id', mockUpdateDto);
      expect(result).toEqual(mockUpdatedPermission);
    });

    it('should rethrow NotFoundException from repository', async () => {
      jest
        .spyOn(repository, 'update')
        .mockRejectedValueOnce(new NotFoundException('Permission not found'));

      try {
        await service.update('not-found', mockUpdateDto, user);
        fail('Expected NotFoundException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toContain(
          'Permission not found',
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
          'Erro ao atualizar Permission',
        );
      }
    });
  });

  describe('remove', () => {
    it('should remove a Permission', async () => {
      const result = await service.remove('mock-id', user);

      expect(repository.remove).toHaveBeenCalledWith('mock-id');
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message');
    });

    it('should rethrow NotFoundException from repository', async () => {
      jest
        .spyOn(repository, 'remove')
        .mockRejectedValueOnce(new NotFoundException('Permission not found'));

      try {
        await service.remove('not-found', user);
        fail('Expected NotFoundException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toContain(
          'Permission not found',
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
          'Erro ao remover Permission',
        );
      }
    });
  });

  describe('findByProfileId', () => {
    it('should return permissions for a specific profile', async () => {
      const profileId = 'profile-uuid-123';
      const result = await service.findByProfileId(profileId);

      expect(repository.findByProfileId).toHaveBeenCalledWith(profileId);
      expect(result).toEqual([mockPermission]);
    });

    it('should return empty array when no permissions found for profile', async () => {
      const profileId = 'profile-uuid-456';
      jest.spyOn(repository, 'findByProfileId').mockResolvedValueOnce([]);

      const result = await service.findByProfileId(profileId);

      expect(repository.findByProfileId).toHaveBeenCalledWith(profileId);
      expect(result).toEqual([]);
    });

    it('should throw BadRequestException on findByProfileId error', async () => {
      const profileId = 'profile-uuid-error';
      jest.spyOn(repository, 'findByProfileId').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      try {
        await service.findByProfileId(profileId);
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain(
          'Erro ao buscar permissions para profile',
        );
      }
    });
  });
});
