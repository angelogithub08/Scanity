/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InventoryCountsService } from './inventory-counts.service';
import { InventoryCountsRepository } from './inventory-counts.repository';
import { CreateInventoryCountsDto } from './dto/create-inventory-counts.dto';
import {
  ListInventoryCountsParamsDto,
  ListPaginatedInventoryCountsParamsDto,
} from './dto/params-inventory-counts.dto';
import { InventoryCount } from './entities/inventory-count.entity';

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  last_page: number;
}

describe('InventoryCountsService', () => {
  let service: InventoryCountsService;
  let repository: InventoryCountsRepository;

  // Mock data para InventoryCount
  const mockInventoryCount = {
    id: 1,
    product_id: 'Test product_id',
    counted_quantity: 1,
    stock_quantity: 1,
    status: 'Test status',
    observation: 'Test observation',
    user_id: 'Test user_id',
    created_at: new Date(),
    updated_at: new Date(),
  } as unknown as InventoryCount;

  const mockPaginatedResult: PaginatedResult<InventoryCount> = {
    data: [mockInventoryCount],
    total: 1,
    page: 1,
    last_page: 1,
  };

  // Mock para o DTO de criação
  const mockCreateDto: CreateInventoryCountsDto = {
    product_id: 'Test product_id',
    counted_quantity: 1,
    stock_quantity: 1,
    status: 'Test status',
    observation: 'Test observation',
    user_id: 'Test user_id',
  };

  // Mock para o DTO de atualização
  const mockUpdateDto: Partial<CreateInventoryCountsDto> = {
    product_id: 'Updated product_id',
    counted_quantity: 2,
    stock_quantity: 2,
    status: 'Updated status',
    observation: 'Updated observation',
    user_id: 'Updated user_id',
  };

  // Mock para dados após atualização
  const mockUpdatedInventoryCount = {
    ...mockInventoryCount,
    ...mockUpdateDto,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryCountsService,
        {
          provide: InventoryCountsRepository,
          useValue: {
            create: jest.fn().mockResolvedValue(mockInventoryCount),
            findAll: jest.fn().mockResolvedValue(mockPaginatedResult),
            list: jest.fn().mockResolvedValue([mockInventoryCount]),
            findOne: jest.fn().mockResolvedValue(mockInventoryCount),
            update: jest.fn().mockResolvedValue(mockUpdatedInventoryCount),
            remove: jest.fn().mockResolvedValue(1),
          },
        },
      ],
    }).compile();

    service = module.get<InventoryCountsService>(InventoryCountsService);
    repository = module.get<InventoryCountsRepository>(
      InventoryCountsRepository,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a InventoryCount successfully', async () => {
      const result = await service.create(mockCreateDto);

      expect(repository.create).toHaveBeenCalledWith(mockCreateDto);
      expect(result).toEqual(mockInventoryCount);
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
          'Erro ao criar InventoryCount',
        );
      }
    });
  });

  describe('findAll', () => {
    it('should return paginated InventoryCounts', async () => {
      const params: ListPaginatedInventoryCountsParamsDto = {
        page: 1,
        limit: 10,
      };
      const result = await service.findAll(params);

      expect(repository.findAll).toHaveBeenCalledWith(params);
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should throw BadRequestException on findAll error', async () => {
      const params: ListPaginatedInventoryCountsParamsDto = {
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
          'Erro ao buscar InventoryCounts paginados',
        );
      }
    });
  });

  describe('list', () => {
    it('should return all InventoryCounts', async () => {
      const params: ListInventoryCountsParamsDto = {};
      const result = await service.list(params);

      expect(repository.list).toHaveBeenCalledWith(params);
      expect(result).toEqual([mockInventoryCount]);
    });

    it('should throw BadRequestException on list error', async () => {
      const params: ListInventoryCountsParamsDto = {};

      jest.spyOn(repository, 'list').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      try {
        await service.list(params);
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain(
          'Erro ao listar InventoryCounts',
        );
      }
    });
  });

  describe('findOne', () => {
    it('should return a InventoryCount by id', async () => {
      const result = await service.findOne('mock-id');

      expect(repository.findOne).toHaveBeenCalledWith('mock-id');
      expect(result).toEqual(mockInventoryCount);
    });

    it('should rethrow NotFoundException from repository', async () => {
      jest
        .spyOn(repository, 'findOne')
        .mockRejectedValueOnce(
          new NotFoundException('InventoryCount not found'),
        );

      try {
        await service.findOne('not-found');
        fail('Expected NotFoundException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toContain(
          'InventoryCount not found',
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
          'Erro ao buscar InventoryCount',
        );
      }
    });
  });

  describe('update', () => {
    it('should update a InventoryCount', async () => {
      const result = await service.update('mock-id', mockUpdateDto);

      expect(repository.update).toHaveBeenCalledWith('mock-id', mockUpdateDto);
      expect(result).toEqual(mockUpdatedInventoryCount);
    });

    it('should rethrow NotFoundException from repository', async () => {
      jest
        .spyOn(repository, 'update')
        .mockRejectedValueOnce(
          new NotFoundException('InventoryCount not found'),
        );

      try {
        await service.update('not-found', mockUpdateDto);
        fail('Expected NotFoundException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toContain(
          'InventoryCount not found',
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
          'Erro ao atualizar InventoryCount',
        );
      }
    });
  });

  describe('remove', () => {
    it('should remove a InventoryCount', async () => {
      const result = await service.remove('mock-id');

      expect(repository.remove).toHaveBeenCalledWith('mock-id');
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message');
    });

    it('should rethrow NotFoundException from repository', async () => {
      jest
        .spyOn(repository, 'remove')
        .mockRejectedValueOnce(
          new NotFoundException('InventoryCount not found'),
        );

      try {
        await service.remove('not-found');
        fail('Expected NotFoundException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toContain(
          'InventoryCount not found',
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
          'Erro ao remover InventoryCount',
        );
      }
    });
  });
});
