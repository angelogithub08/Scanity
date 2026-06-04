/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { MovementStagesController } from './movement-stages.controller';
import { MovementStagesService } from './movement-stages.service';
import { CreateMovementStagesDto } from './dto/create-movement-stages.dto';
import { UpdateMovementStagesDto } from './dto/update-movement-stages.dto';
import {
  ListMovementStagesParamsDto,
  ListPaginatedMovementStagesParamsDto,
} from './dto/params-movement-stages.dto';

describe('MovementStagesController', () => {
  let controller: MovementStagesController;
  let service: MovementStagesService;

  // Mock data para MovementStage
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
  const mockCreateDto: CreateMovementStagesDto = {
    name: 'Test name',
    account_id: 'Test account_id',
  };

  // Mock para o DTO de atualização
  const mockUpdateDto: Partial<CreateMovementStagesDto> = {
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
      controllers: [MovementStagesController],
      providers: [
        {
          provide: MovementStagesService,
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

    controller = module.get<MovementStagesController>(MovementStagesController);
    service = module.get<MovementStagesService>(MovementStagesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  it('should create a new MovementStage', async () => {
    const result = await controller.create(mockCreateDto);

    expect(service.create).toHaveBeenCalledWith(mockCreateDto);
    expect(result).toEqual(mockData);
    expect(result.name).toBeDefined();
    expect(result.account_id).toBeDefined();
  });

  it('should return paginated MovementStage list', async () => {
    const params = {
      page: 1,
      limit: 10,
    } as ListPaginatedMovementStagesParamsDto;
    const result = await controller.findAll(params);

    expect(service.findAll).toHaveBeenCalledWith(params);
    expect(result).toEqual(mockPaginatedResult);
    expect(result.data).toHaveLength(1);
  });

  it('should return all MovementStage records', async () => {
    const params = {} as ListMovementStagesParamsDto;
    const result = await controller.list(params);

    expect(service.list).toHaveBeenCalledWith(params);
    expect(result).toEqual([mockData]);
    expect(result).toHaveLength(1);
  });

  it('should return a MovementStage by id', async () => {
    const id = 'mock-id';
    const result = await controller.findOne(id);

    expect(service.findOne).toHaveBeenCalledWith(id);
    expect(result).toEqual(mockData);
    expect(result.id).toBe(id);
  });

  it('should update a MovementStage', async () => {
    const id = 'mock-id';
    const result = await controller.update(
      id,
      mockUpdateDto as UpdateMovementStagesDto,
    );

    expect(service.update).toHaveBeenCalledWith(id, mockUpdateDto);
    expect(result).toEqual(mockUpdatedData);
    expect(result.name).toBeDefined();
    expect(result.account_id).toBeDefined();
  });

  it('should remove a MovementStage', async () => {
    const id = 'mock-id';
    const result = await controller.remove(id);

    expect(service.remove).toHaveBeenCalledWith(id);
    expect(result).toEqual({ deleted: true });
  });
});
