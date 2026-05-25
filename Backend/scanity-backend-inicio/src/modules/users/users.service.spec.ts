/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { CreateUsersDto } from './dto/create-users.dto';
import {
  ListUsersParamsDto,
  ListPaginatedUsersParamsDto,
} from './dto/params-users.dto';
import { User } from './entities/user.entity';

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  last_page: number;
}

describe('UsersService', () => {
  let service: UsersService;
  let repository: UsersRepository;

  // Mock data para User
  const mockUser = {
    id: 1,
    name: 'Test name',
    email: 'Test email',
    password: 'Test password',
    token: 'Test token',
    account_id: 'Test account_id',
    department_id: 'Test department_id',
    collaborator_id: 'Test collaborator_id',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  } as unknown as User;

  const mockPaginatedResult: PaginatedResult<User> = {
    data: [mockUser],
    total: 1,
    page: 1,
    last_page: 1,
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
  const mockUpdatedUser = {
    ...mockUser,
    ...mockUpdateDto,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: {
            create: jest.fn().mockResolvedValue(mockUser),
            findAll: jest.fn().mockResolvedValue(mockPaginatedResult),
            list: jest.fn().mockResolvedValue([mockUser]),
            findOne: jest.fn().mockResolvedValue(mockUser),
            findByToken: jest.fn().mockResolvedValue(mockUser),
            findByEmail: jest.fn().mockResolvedValue(mockUser),
            update: jest.fn().mockResolvedValue(mockUpdatedUser),
            remove: jest.fn().mockResolvedValue(1),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<UsersRepository>(UsersRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a User successfully', async () => {
      const result = await service.create(mockCreateDto);

      expect(repository.create).toHaveBeenCalledWith(mockCreateDto);
      expect(result).toEqual(mockUser);
    });

    it('should throw BadRequestException on create error', async () => {
      jest
        .spyOn(repository, 'create')
        .mockRejectedValueOnce(new Error('Database error'));

      try {
        await service.create(mockCreateDto);
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain(
          'Erro ao criar Usuário',
        );
      }
    });
  });

  describe('findAll', () => {
    it('should return paginated Users', async () => {
      const params: ListPaginatedUsersParamsDto = { page: 1, limit: 10 };
      const result = await service.findAll(params);

      expect(repository.findAll).toHaveBeenCalledWith(params);
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should throw BadRequestException on findAll error', async () => {
      const params: ListPaginatedUsersParamsDto = { page: 1, limit: 10 };

      jest.spyOn(repository, 'findAll').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      try {
        await service.findAll(params);
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain(
          'Erro ao buscar Users paginados',
        );
      }
    });
  });

  describe('list', () => {
    it('should return all Users', async () => {
      const params: ListUsersParamsDto = {};
      const result = await service.list(params);

      expect(repository.list).toHaveBeenCalledWith(params);
      expect(result).toEqual([mockUser]);
    });

    it('should throw BadRequestException on list error', async () => {
      const params: ListUsersParamsDto = {};

      jest.spyOn(repository, 'list').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      try {
        await service.list(params);
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain(
          'Erro ao listar Users',
        );
      }
    });
  });

  describe('findOne', () => {
    it('should return a User by id', async () => {
      const result = await service.findOne('mock-id');

      expect(repository.findOne).toHaveBeenCalledWith('mock-id');
      expect(result).toEqual(mockUser);
    });

    it('should rethrow NotFoundException from repository', async () => {
      jest
        .spyOn(repository, 'findOne')
        .mockRejectedValueOnce(new NotFoundException('User not found'));

      try {
        await service.findOne('not-found');
        fail('Expected NotFoundException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toContain(
          'User not found',
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
          'Erro ao buscar User',
        );
      }
    });
  });

  describe('findByToken', () => {
    it('should return a User by token', async () => {
      const result = await service.findByToken('mock-token');

      expect(repository.findByToken).toHaveBeenCalledWith('mock-token', false);
      expect(result).toEqual(mockUser);
    });

    it('should rethrow NotFoundException from repository', async () => {
      jest
        .spyOn(repository, 'findByToken')
        .mockRejectedValueOnce(new NotFoundException('User not found'));

      try {
        await service.findByToken('not-found-token');
        fail('Expected NotFoundException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toContain(
          'User not found',
        );
      }
    });

    it('should rethrow BadRequestException from repository', async () => {
      jest
        .spyOn(repository, 'findByToken')
        .mockRejectedValueOnce(new BadRequestException('Invalid token'));

      try {
        await service.findByToken('invalid-token');
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain(
          'Invalid token',
        );
      }
    });

    it('should wrap other errors in BadRequestException', async () => {
      jest.spyOn(repository, 'findByToken').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      try {
        await service.findByToken('error-token');
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain(
          'Erro ao buscar User',
        );
      }
    });
  });

  describe('findByEmail', () => {
    it('should return a User by email', async () => {
      const result = await service.findByEmail('test@example.com');

      expect(repository.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
        false,
      );
      expect(result).toEqual(mockUser);
    });

    it('should rethrow NotFoundException from repository', async () => {
      jest
        .spyOn(repository, 'findByEmail')
        .mockRejectedValueOnce(new NotFoundException('User not found'));

      try {
        await service.findByEmail('notfound@example.com');
        fail('Expected NotFoundException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toContain(
          'User not found',
        );
      }
    });

    it('should rethrow BadRequestException from repository', async () => {
      jest
        .spyOn(repository, 'findByEmail')
        .mockRejectedValueOnce(new BadRequestException('Invalid email'));

      try {
        await service.findByEmail('invalid-email');
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain(
          'Invalid email',
        );
      }
    });

    it('should wrap other errors in BadRequestException', async () => {
      jest.spyOn(repository, 'findByEmail').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      try {
        await service.findByEmail('error@example.com');
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain(
          'Erro ao buscar User',
        );
      }
    });
  });

  describe('update', () => {
    it('should update a User', async () => {
      const result = await service.update('mock-id', mockUpdateDto);

      // A senha deve ser hasheada no serviço antes de ir para o repository
      const expectedUpdateData = {
        ...mockUpdateDto,
        password: expect.any(String), // Verifica que é uma string mas não o valor exato
      };

      expect(repository.update).toHaveBeenCalledWith(
        'mock-id',
        expectedUpdateData,
      );
      expect(result).toEqual(mockUpdatedUser);
    });

    it('should rethrow NotFoundException from repository', async () => {
      jest
        .spyOn(repository, 'update')
        .mockRejectedValueOnce(new NotFoundException('User not found'));

      try {
        await service.update('not-found', mockUpdateDto);
        fail('Expected NotFoundException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toContain(
          'User not found',
        );
      }
    });

    it('should wrap other errors in BadRequestException', async () => {
      jest.spyOn(repository, 'update').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      try {
        await service.update('error-id', mockUpdateDto);
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain(
          'Erro ao atualizar User',
        );
      }
    });
  });

  describe('remove', () => {
    it('should remove a User', async () => {
      const result = await service.remove('mock-id');

      expect(repository.remove).toHaveBeenCalledWith('mock-id');
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message');
    });

    it('should rethrow NotFoundException from repository', async () => {
      jest
        .spyOn(repository, 'remove')
        .mockRejectedValueOnce(new NotFoundException('User not found'));

      try {
        await service.remove('not-found');
        fail('Expected NotFoundException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toContain(
          'User not found',
        );
      }
    });

    it('should wrap other errors in BadRequestException', async () => {
      jest.spyOn(repository, 'remove').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      try {
        await service.remove('error-id');
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain(
          'Erro ao remover User',
        );
      }
    });
  });
});
