/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MovementStagesService } from './movement-stages.service';
import { MovementStagesRepository } from './movement-stages.repository';
import { CreateMovementStagesDto } from './dto/create-movement-stages.dto';
import {
  ListMovementStagesParamsDto,
  ListPaginatedMovementStagesParamsDto,
} from './dto/params-movement-stages.dto';
import { MovementStage } from './entities/movement-stage.entity';

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  last_page: number;
}

describe('MovementStagesService', () => {
  let service: MovementStagesService;
  let repository: MovementStagesRepository;

  // Mock data para MovementStage
  const mockMovementStage = {
    id: 1,
    name: 'Test name',
    account_id: 'Test account_id',
    created_at: new Date(),
    updated_at: new Date(),
  } as unknown as MovementStage;

  const mockPaginatedResult: PaginatedResult<MovementStage> = {
    data: [mockMovementStage],
    total: 1,
    page: 1,
    last_page: 1,
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
  const mockUpdatedMovementStage = {
    ...mockMovementStage,
    ...mockUpdateDto,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MovementStagesService,
        {
          provide: MovementStagesRepository,
          useValue: {
            create: jest.fn().mockResolvedValue(mockMovementStage),
            createMany: jest.fn().mockResolvedValue([mockMovementStage]),
            findAll: jest.fn().mockResolvedValue(mockPaginatedResult),
            list: jest.fn().mockResolvedValue([mockMovementStage]),
            findOne: jest.fn().mockResolvedValue(mockMovementStage),
            update: jest.fn().mockResolvedValue(mockUpdatedMovementStage),
            remove: jest.fn().mockResolvedValue(1),
          },
        },
      ],
    }).compile();

    service = module.get<MovementStagesService>(MovementStagesService);
    repository = module.get<MovementStagesRepository>(MovementStagesRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create Entrada and Saída MovementStages successfully', async () => {
      const result = await service.create(mockCreateDto);

      expect(repository.createMany).toHaveBeenCalledWith([
        { name: 'Entrada Test name', account_id: 'Test account_id' },
        { name: 'Saída Test name', account_id: 'Test account_id' },
      ]);
      expect(result).toEqual(mockMovementStage);
    });

    it('should throw BadRequestException on create error', async () => {
      jest
        .spyOn(repository, 'createMany')
        .mockRejectedValueOnce(new Error('Database error'));

      try {
        await service.create(mockCreateDto);
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain(
          'Erro ao criar MovementStage',
        );
      }
    });
  });

  describe('findAll', () => {
    it('should return paginated MovementStages', async () => {
      const params: ListPaginatedMovementStagesParamsDto = {
        page: 1,
        limit: 10,
      };
      const result = await service.findAll(params);

      expect(repository.findAll).toHaveBeenCalledWith(params);
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should throw BadRequestException on findAll error', async () => {
      const params: ListPaginatedMovementStagesParamsDto = {
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
          'Erro ao buscar MovementStages paginados',
        );
      }
    });
  });

  describe('list', () => {
    it('should return all MovementStages', async () => {
      const params: ListMovementStagesParamsDto = {};
      const result = await service.list(params);

      expect(repository.list).toHaveBeenCalledWith(params);
      expect(result).toEqual([mockMovementStage]);
    });

    it('should throw BadRequestException on list error', async () => {
      const params: ListMovementStagesParamsDto = {};

      jest.spyOn(repository, 'list').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      try {
        await service.list(params);
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain(
          'Erro ao listar MovementStages',
        );
      }
    });
  });

  describe('findOne', () => {
    it('should return a MovementStage by id', async () => {
      const result = await service.findOne('mock-id');

      expect(repository.findOne).toHaveBeenCalledWith('mock-id');
      expect(result).toEqual(mockMovementStage);
    });

    it('should rethrow NotFoundException from repository', async () => {
      jest
        .spyOn(repository, 'findOne')
        .mockRejectedValueOnce(
          new NotFoundException('MovementStage not found'),
        );

      try {
        await service.findOne('not-found');
        fail('Expected NotFoundException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toContain(
          'MovementStage not found',
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
          'Erro ao buscar MovementStage',
        );
      }
    });
  });

  describe('update', () => {
    it('should update a MovementStage', async () => {
      const result = await service.update('mock-id', mockUpdateDto);

      expect(repository.update).toHaveBeenCalledWith('mock-id', mockUpdateDto);
      expect(result).toEqual(mockUpdatedMovementStage);
    });

    it('should rethrow NotFoundException from repository', async () => {
      jest
        .spyOn(repository, 'update')
        .mockRejectedValueOnce(
          new NotFoundException('MovementStage not found'),
        );

      try {
        await service.update('not-found', mockUpdateDto);
        fail('Expected NotFoundException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toContain(
          'MovementStage not found',
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
          'Erro ao atualizar MovementStage',
        );
      }
    });
  });

  describe('remove', () => {
    it('should remove a MovementStage', async () => {
      const result = await service.remove('mock-id');

      expect(repository.remove).toHaveBeenCalledWith('mock-id');
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message');
    });

    it('should rethrow NotFoundException from repository', async () => {
      jest
        .spyOn(repository, 'remove')
        .mockRejectedValueOnce(
          new NotFoundException('MovementStage not found'),
        );

      try {
        await service.remove('not-found');
        fail('Expected NotFoundException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toContain(
          'MovementStage not found',
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
          'Erro ao remover MovementStage',
        );
      }
    });
  });
});
