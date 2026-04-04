/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsRepository } from './products.repository';
import { CreateProductsDto } from './dto/create-products.dto';
import {
  ListProductsParamsDto,
  ListPaginatedProductsParamsDto,
} from './dto/params-products.dto';
import { Product } from './entities/product.entity';

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  last_page: number;
}

describe('ProductsService', () => {
  let service: ProductsService;
  let repository: ProductsRepository;

  // Mock data para Product
  const mockProduct = {
    id: 1,
    name: 'Test name',
    value: 1,
    account_id: 'Test account_id',
    created_at: new Date(),
    updated_at: new Date(),
  } as unknown as Product;

  const mockPaginatedResult: PaginatedResult<Product> = {
    data: [mockProduct],
    total: 1,
    page: 1,
    last_page: 1,
  };

  // Mock para o DTO de criação
  const mockCreateDto: CreateProductsDto = {
    name: 'Test name',
    value: 1,
    account_id: 'Test account_id',
    description: 'Test description',
    barcode: '1234567890',
  };

  // Mock para o DTO de atualização
  const mockUpdateDto: Partial<CreateProductsDto> = {
    name: 'Updated name',
    value: 2,
    account_id: 'Updated account_id',
    description: 'Updated description',
    barcode: '1234567890',
  };

  // Mock para dados após atualização
  const mockUpdatedProduct = {
    ...mockProduct,
    ...mockUpdateDto,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: ProductsRepository,
          useValue: {
            create: jest.fn().mockResolvedValue(mockProduct),
            findAll: jest.fn().mockResolvedValue(mockPaginatedResult),
            list: jest.fn().mockResolvedValue([mockProduct]),
            findOne: jest.fn().mockResolvedValue(mockProduct),
            update: jest.fn().mockResolvedValue(mockUpdatedProduct),
            remove: jest.fn().mockResolvedValue(1),
          },
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    repository = module.get<ProductsRepository>(ProductsRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a Product successfully', async () => {
      const result = await service.create(mockCreateDto);

      expect(repository.create).toHaveBeenCalledWith(mockCreateDto);
      expect(result).toEqual(mockProduct);
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
          'Erro ao criar Product',
        );
      }
    });
  });

  describe('findAll', () => {
    it('should return paginated Products', async () => {
      const params: ListPaginatedProductsParamsDto = { page: 1, limit: 10 };
      const result = await service.findAll(params);

      expect(repository.findAll).toHaveBeenCalledWith(params);
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should throw BadRequestException on findAll error', async () => {
      const params: ListPaginatedProductsParamsDto = { page: 1, limit: 10 };

      jest.spyOn(repository, 'findAll').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      try {
        await service.findAll(params);
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain(
          'Erro ao buscar Products paginados',
        );
      }
    });
  });

  describe('list', () => {
    it('should return all Products', async () => {
      const params: ListProductsParamsDto = {};
      const result = await service.list(params);

      expect(repository.list).toHaveBeenCalledWith(params);
      expect(result).toEqual([mockProduct]);
    });

    it('should throw BadRequestException on list error', async () => {
      const params: ListProductsParamsDto = {};

      jest.spyOn(repository, 'list').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      try {
        await service.list(params);
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain(
          'Erro ao listar Products',
        );
      }
    });
  });

  describe('findOne', () => {
    it('should return a Product by id', async () => {
      const result = await service.findOne('mock-id');

      expect(repository.findOne).toHaveBeenCalledWith('mock-id');
      expect(result).toEqual(mockProduct);
    });

    it('should rethrow NotFoundException from repository', async () => {
      jest
        .spyOn(repository, 'findOne')
        .mockRejectedValueOnce(new NotFoundException('Product not found'));

      try {
        await service.findOne('not-found');
        fail('Expected NotFoundException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toContain(
          'Product not found',
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
          'Erro ao buscar Product',
        );
      }
    });
  });

  describe('update', () => {
    it('should update a Product', async () => {
      const result = await service.update('mock-id', mockUpdateDto);

      expect(repository.update).toHaveBeenCalledWith('mock-id', mockUpdateDto);
      expect(result).toEqual(mockUpdatedProduct);
    });

    it('should rethrow NotFoundException from repository', async () => {
      jest
        .spyOn(repository, 'update')
        .mockRejectedValueOnce(new NotFoundException('Product not found'));

      try {
        await service.update('not-found', mockUpdateDto);
        fail('Expected NotFoundException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toContain(
          'Product not found',
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
          'Erro ao atualizar Product',
        );
      }
    });
  });

  describe('remove', () => {
    it('should remove a Product', async () => {
      const result = await service.remove('mock-id');

      expect(repository.remove).toHaveBeenCalledWith('mock-id');
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message');
    });

    it('should rethrow NotFoundException from repository', async () => {
      jest
        .spyOn(repository, 'remove')
        .mockRejectedValueOnce(new NotFoundException('Product not found'));

      try {
        await service.remove('not-found');
        fail('Expected NotFoundException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toContain(
          'Product not found',
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
          'Erro ao remover Product',
        );
      }
    });
  });
});
