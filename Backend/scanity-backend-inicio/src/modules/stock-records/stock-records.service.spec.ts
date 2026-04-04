/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StockRecordsService } from './stock-records.service';
import { StockRecordsRepository } from './stock-records.repository';
import { CreateStockRecordsDto } from './dto/create-stock-records.dto';
import {
  ListStockRecordsParamsDto,
  ListPaginatedStockRecordsParamsDto,
} from './dto/params-stock-records.dto';
import { StockRecord } from './entities/stock-record.entity';

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  last_page: number;
}

describe('StockRecordsService', () => {
  let service: StockRecordsService;
  let repository: StockRecordsRepository;

  // Mock data para StockRecord
  const mockStockRecord = {
    id: 1,
    stock_id: 'Test stock_id',
    quantity: 1,
    type: 'Test type',
    observation: 'Test observation',
    user_id: 'Test user_id',
    movement_stage_id: undefined,
    created_at: new Date(),
    updated_at: new Date(),
  } as unknown as StockRecord;

  const mockPaginatedResult: PaginatedResult<StockRecord> = {
    data: [mockStockRecord],
    total: 1,
    page: 1,
    last_page: 1,
  };

  // Mock para o DTO de criação
  const mockCreateDto: CreateStockRecordsDto = {
    stock_id: 'Test stock_id',
    quantity: 1,
    type: 'Test type',
    observation: 'Test observation',
    user_id: 'Test user_id',
    movement_stage_id: undefined,
  };

  // Mock para o DTO de atualização
  const mockUpdateDto: Partial<CreateStockRecordsDto> = {
    stock_id: 'Updated stock_id',
    quantity: 2,
    type: 'Updated type',
    observation: 'Updated observation',
    user_id: 'Updated user_id',
    movement_stage_id: '550e8400-e29b-41d4-a716-446655440000',
  };

  // Mock para dados após atualização
  const mockUpdatedStockRecord = {
    ...mockStockRecord,
    ...mockUpdateDto,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockRecordsService,
        {
          provide: StockRecordsRepository,
          useValue: {
            create: jest.fn().mockResolvedValue(mockStockRecord),
            findAll: jest.fn().mockResolvedValue(mockPaginatedResult),
            list: jest.fn().mockResolvedValue([mockStockRecord]),
            findOne: jest.fn().mockResolvedValue(mockStockRecord),
            update: jest.fn().mockResolvedValue(mockUpdatedStockRecord),
            remove: jest.fn().mockResolvedValue(1),
          },
        },
      ],
    }).compile();

    service = module.get<StockRecordsService>(StockRecordsService);
    repository = module.get<StockRecordsRepository>(StockRecordsRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a StockRecord successfully', async () => {
      const result = await service.create(mockCreateDto);

      const expectedPayload = {
        ...mockCreateDto,
        quantity:
          mockCreateDto.type === 'ENTRADA'
            ? mockCreateDto.quantity
            : -mockCreateDto.quantity,
      };
      expect(repository.create).toHaveBeenCalledWith(expectedPayload);
      expect(result).toEqual(mockStockRecord);
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
          'Erro ao criar StockRecord',
        );
      }
    });
  });

  describe('findAll', () => {
    it('should return paginated StockRecords', async () => {
      const params: ListPaginatedStockRecordsParamsDto = { page: 1, limit: 10 };
      const result = await service.findAll(params);

      expect(repository.findAll).toHaveBeenCalledWith(params);
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should throw BadRequestException on findAll error', async () => {
      const params: ListPaginatedStockRecordsParamsDto = { page: 1, limit: 10 };

      jest.spyOn(repository, 'findAll').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      try {
        await service.findAll(params);
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain(
          'Erro ao buscar StockRecords paginados',
        );
      }
    });
  });

  describe('list', () => {
    it('should return all StockRecords', async () => {
      const params: ListStockRecordsParamsDto = {};
      const result = await service.list(params);

      expect(repository.list).toHaveBeenCalledWith(params);
      expect(result).toEqual([mockStockRecord]);
    });

    it('should throw BadRequestException on list error', async () => {
      const params: ListStockRecordsParamsDto = {};

      jest.spyOn(repository, 'list').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      try {
        await service.list(params);
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain(
          'Erro ao listar StockRecords',
        );
      }
    });
  });

  describe('findOne', () => {
    it('should return a StockRecord by id', async () => {
      const result = await service.findOne('mock-id');

      expect(repository.findOne).toHaveBeenCalledWith('mock-id');
      expect(result).toEqual(mockStockRecord);
    });

    it('should rethrow NotFoundException from repository', async () => {
      jest
        .spyOn(repository, 'findOne')
        .mockRejectedValueOnce(new NotFoundException('StockRecord not found'));

      try {
        await service.findOne('not-found');
        fail('Expected NotFoundException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toContain(
          'StockRecord not found',
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
          'Erro ao buscar StockRecord',
        );
      }
    });
  });

  describe('update', () => {
    it('should update a StockRecord', async () => {
      const result = await service.update('mock-id', mockUpdateDto);

      expect(repository.update).toHaveBeenCalledWith('mock-id', mockUpdateDto);
      expect(result).toEqual(mockUpdatedStockRecord);
    });

    it('should rethrow NotFoundException from repository', async () => {
      jest
        .spyOn(repository, 'update')
        .mockRejectedValueOnce(new NotFoundException('StockRecord not found'));

      try {
        await service.update('not-found', mockUpdateDto);
        fail('Expected NotFoundException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toContain(
          'StockRecord not found',
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
          'Erro ao atualizar StockRecord',
        );
      }
    });
  });

  describe('remove', () => {
    it('should remove a StockRecord', async () => {
      const result = await service.remove('mock-id');

      expect(repository.remove).toHaveBeenCalledWith('mock-id');
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message');
    });

    it('should rethrow NotFoundException from repository', async () => {
      jest
        .spyOn(repository, 'remove')
        .mockRejectedValueOnce(new NotFoundException('StockRecord not found'));

      try {
        await service.remove('not-found');
        fail('Expected NotFoundException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toContain(
          'StockRecord not found',
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
          'Erro ao remover StockRecord',
        );
      }
    });
  });
});
