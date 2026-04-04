/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from './notifications.repository';
import { CreateNotificationsDto } from './dto/create-notifications.dto';
import {
  ListNotificationsParamsDto,
  ListPaginatedNotificationsParamsDto,
} from './dto/params-notifications.dto';
import { Notification } from './entities/notification.entity';

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  last_page: number;
}

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repository: NotificationsRepository;

  // Mock data para Notification
  const mockNotification = {
    id: 1,
    key: 'Test key',
    message: 'Test message',
    data: 'Test data',
    account_id: 'Test account_id',
    user_id: 'Test user_id',
    read_at: 'Test read_at',
    created_at: new Date(),
    updated_at: new Date(),
  } as unknown as Notification;

  const mockPaginatedResult: PaginatedResult<Notification> = {
    data: [mockNotification],
    total: 1,
    page: 1,
    last_page: 1,
  };

  // Mock para o DTO de criação
  const mockCreateDto: CreateNotificationsDto = {
    key: 'Test key',
    message: 'Test message',
    data: 'Test data',
    account_id: 'Test account_id',
    user_id: 'Test user_id',
    read_at: 'Test read_at',
  };

  // Mock para o DTO de atualização
  const mockUpdateDto: Partial<CreateNotificationsDto> = {
    key: 'Updated key',
    message: 'Updated message',
    data: 'Updated data',
    account_id: 'Updated account_id',
    user_id: 'Updated user_id',
    read_at: 'Updated read_at',
  };

  // Mock para dados após atualização
  const mockUpdatedNotification = {
    ...mockNotification,
    ...mockUpdateDto,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: NotificationsRepository,
          useValue: {
            create: jest.fn().mockResolvedValue(mockNotification),
            findAll: jest.fn().mockResolvedValue(mockPaginatedResult),
            list: jest.fn().mockResolvedValue([mockNotification]),
            findOne: jest.fn().mockResolvedValue(mockNotification),
            update: jest.fn().mockResolvedValue(mockUpdatedNotification),
            remove: jest.fn().mockResolvedValue(1),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    repository = module.get<NotificationsRepository>(NotificationsRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a Notification successfully', async () => {
      const result = await service.create(mockCreateDto);

      expect(repository.create).toHaveBeenCalledWith(mockCreateDto);
      expect(result).toEqual(mockNotification);
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
          'Erro ao criar Notification',
        );
      }
    });
  });

  describe('findAll', () => {
    it('should return paginated Notifications', async () => {
      const params: ListPaginatedNotificationsParamsDto = {
        page: 1,
        limit: 10,
      };
      const result = await service.findAll(params);

      expect(repository.findAll).toHaveBeenCalledWith(params);
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should throw BadRequestException on findAll error', async () => {
      const params: ListPaginatedNotificationsParamsDto = {
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
          'Erro ao buscar Notifications paginados',
        );
      }
    });
  });

  describe('list', () => {
    it('should return all Notifications', async () => {
      const params: ListNotificationsParamsDto = {};
      const result = await service.list(params);

      expect(repository.list).toHaveBeenCalledWith(params);
      expect(result).toEqual([mockNotification]);
    });

    it('should throw BadRequestException on list error', async () => {
      const params: ListNotificationsParamsDto = {};

      jest.spyOn(repository, 'list').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      try {
        await service.list(params);
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain(
          'Erro ao listar Notifications',
        );
      }
    });
  });

  describe('findOne', () => {
    it('should return a Notification by id', async () => {
      const result = await service.findOne('mock-id');

      expect(repository.findOne).toHaveBeenCalledWith('mock-id');
      expect(result).toEqual(mockNotification);
    });

    it('should rethrow NotFoundException from repository', async () => {
      jest
        .spyOn(repository, 'findOne')
        .mockRejectedValueOnce(new NotFoundException('Notification not found'));

      try {
        await service.findOne('not-found');
        fail('Expected NotFoundException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toContain(
          'Notification not found',
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
          'Erro ao buscar Notification',
        );
      }
    });
  });

  describe('update', () => {
    it('should update a Notification', async () => {
      const result = await service.update('mock-id', mockUpdateDto);

      expect(repository.update).toHaveBeenCalledWith('mock-id', mockUpdateDto);
      expect(result).toEqual(mockUpdatedNotification);
    });

    it('should rethrow NotFoundException from repository', async () => {
      jest
        .spyOn(repository, 'update')
        .mockRejectedValueOnce(new NotFoundException('Notification not found'));

      try {
        await service.update('not-found', mockUpdateDto);
        fail('Expected NotFoundException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toContain(
          'Notification not found',
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
          'Erro ao atualizar Notification',
        );
      }
    });
  });

  describe('remove', () => {
    it('should remove a Notification', async () => {
      const result = await service.remove('mock-id');

      expect(repository.remove).toHaveBeenCalledWith('mock-id');
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message');
    });

    it('should rethrow NotFoundException from repository', async () => {
      jest
        .spyOn(repository, 'remove')
        .mockRejectedValueOnce(new NotFoundException('Notification not found'));

      try {
        await service.remove('not-found');
        fail('Expected NotFoundException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toContain(
          'Notification not found',
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
          'Erro ao remover Notification',
        );
      }
    });
  });
});
