/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CreateCategoriesDto } from './dto/create-categories.dto';
import { UpdateCategoriesDto } from './dto/update-categories.dto';
import {
  ListCategoriesParamsDto,
  ListPaginatedCategoriesParamsDto,
} from './dto/params-categories.dto';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let service: CategoriesService;

  // Mock data para Category
  const mockData = {
    id: 'mock-id',
    name: 'Test name',
    description: 'Test description',
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
  const mockCreateDto: CreateCategoriesDto = {
    name: 'Test name',
    description: 'Test description',
  };

  // Mock para o DTO de atualização
  const mockUpdateDto: Partial<CreateCategoriesDto> = {
    name: 'Updated name',
    description: 'Updated description',
  };

  // Mock para dados após atualização
  const mockUpdatedData = {
    ...mockData,
    ...mockUpdateDto,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        {
          provide: CategoriesService,
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

    controller = module.get<CategoriesController>(CategoriesController);
    service = module.get<CategoriesService>(CategoriesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  it('should create a new Category', async () => {
    const result = await controller.create(mockCreateDto);

    expect(service.create).toHaveBeenCalledWith(mockCreateDto);
    expect(result).toEqual(mockData);
    expect(result.name).toBeDefined();
    expect(result.description).toBeDefined();
  });

  it('should return paginated Category list', async () => {
    const params = { page: 1, limit: 10 } as ListPaginatedCategoriesParamsDto;
    const result = await controller.findAll(params);

    expect(service.findAll).toHaveBeenCalledWith(params);
    expect(result).toEqual(mockPaginatedResult);
    expect(result.data).toHaveLength(1);
  });

  it('should return all Category records', async () => {
    const params = {} as ListCategoriesParamsDto;
    const result = await controller.list(params);

    expect(service.list).toHaveBeenCalledWith(params);
    expect(result).toEqual([mockData]);
    expect(result).toHaveLength(1);
  });

  it('should return a Category by id', async () => {
    const id = 'mock-id';
    const result = await controller.findOne(id);

    expect(service.findOne).toHaveBeenCalledWith(id);
    expect(result).toEqual(mockData);
    expect(result.id).toBe(id);
  });

  it('should update a Category', async () => {
    const id = 'mock-id';
    const result = await controller.update(
      id,
      mockUpdateDto as UpdateCategoriesDto,
    );

    expect(service.update).toHaveBeenCalledWith(id, mockUpdateDto);
    expect(result).toEqual(mockUpdatedData);
    expect(result.name).toBeDefined();
    expect(result.description).toBeDefined();
  });

  it('should remove a Category', async () => {
    const id = 'mock-id';
    const result = await controller.remove(id);

    expect(service.remove).toHaveBeenCalledWith(id);
    expect(result).toEqual({ deleted: true });
  });
});
