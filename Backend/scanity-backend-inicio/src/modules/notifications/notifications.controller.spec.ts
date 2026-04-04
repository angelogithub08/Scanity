/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { CreateNotificationsDto } from './dto/create-notifications.dto';
import { UpdateNotificationsDto } from './dto/update-notifications.dto';
import {
  ListNotificationsParamsDto,
  ListPaginatedNotificationsParamsDto,
} from './dto/params-notifications.dto';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: NotificationsService;

  // Mock data para Notification
  const mockData = {
    id: 'mock-id',
    key: 'Test key',
    message: 'Test message',
    data: 'Test data',
    account_id: 'Test account_id',
    user_id: 'Test user_id',
    read_at: 'Test read_at',
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
  const mockUpdatedData = {
    ...mockData,
    ...mockUpdateDto,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
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

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  it('should create a new Notification', async () => {
    const result = await controller.create(mockCreateDto);

    expect(service.create).toHaveBeenCalledWith(mockCreateDto);
    expect(result).toEqual(mockData);
    expect(result.key).toBeDefined();
    expect(result.message).toBeDefined();
    expect(result.data).toBeDefined();
    expect(result.account_id).toBeDefined();
    expect(result.user_id).toBeDefined();
    expect(result.read_at).toBeDefined();
  });

  it('should return paginated Notification list', async () => {
    const params = {
      page: 1,
      limit: 10,
    } as ListPaginatedNotificationsParamsDto;
    const result = await controller.findAll(params);

    expect(service.findAll).toHaveBeenCalledWith(params);
    expect(result).toEqual(mockPaginatedResult);
    expect(result.data).toHaveLength(1);
  });

  it('should return all Notification records', async () => {
    const params = {} as ListNotificationsParamsDto;
    const result = await controller.list(params);

    expect(service.list).toHaveBeenCalledWith(params);
    expect(result).toEqual([mockData]);
    expect(result).toHaveLength(1);
  });

  it('should return a Notification by id', async () => {
    const id = 'mock-id';
    const result = await controller.findOne(id);

    expect(service.findOne).toHaveBeenCalledWith(id);
    expect(result).toEqual(mockData);
    expect(result.id).toBe(id);
  });

  it('should update a Notification', async () => {
    const id = 'mock-id';
    const result = await controller.update(
      id,
      mockUpdateDto as UpdateNotificationsDto,
    );

    expect(service.update).toHaveBeenCalledWith(id, mockUpdateDto);
    expect(result).toEqual(mockUpdatedData);
    expect(result.key).toBeDefined();
    expect(result.message).toBeDefined();
    expect(result.data).toBeDefined();
    expect(result.account_id).toBeDefined();
    expect(result.user_id).toBeDefined();
    expect(result.read_at).toBeDefined();
  });

  it('should remove a Notification', async () => {
    const id = 'mock-id';
    const result = await controller.remove(id);

    expect(service.remove).toHaveBeenCalledWith(id);
    expect(result).toEqual({ deleted: true });
  });
});
