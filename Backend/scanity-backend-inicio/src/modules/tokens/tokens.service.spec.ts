/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TokensService } from './tokens.service';
import { TokensRepository } from './tokens.repository';
import { CreateTokensDto } from './dto/create-tokens.dto';
import {
  ListTokensParamsDto,
  ListPaginatedTokensParamsDto,
} from './dto/params-tokens.dto';
import { Token, TokenType } from './entities/token.entity';

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  last_page: number;
}

describe('TokensService', () => {
  let service: TokensService;
  let repository: TokensRepository;

  // Mock data para Token
  const mockToken = {
    id: '1',
    type: TokenType.REFRESH_TOKEN,
    token: '550e8400-e29b-41d4-a716-446655440000',
    account_id: '123e4567-e89b-12d3-a456-426614174000',
    user_id: '123e4567-e89b-12d3-a456-426614174001',
    revoked_at: null,
    created_at: new Date(),
    updated_at: new Date(),
  } as unknown as Token;

  const mockPaginatedResult: PaginatedResult<Token> = {
    data: [mockToken],
    total: 1,
    page: 1,
    last_page: 1,
  };

  // Mock para o DTO de criação
  const mockCreateDto: CreateTokensDto = {
    type: TokenType.REFRESH_TOKEN,
    token: '550e8400-e29b-41d4-a716-446655440000',
    account_id: '123e4567-e89b-12d3-a456-426614174000',
  };

  // Mock para o DTO de atualização
  const mockUpdateDto: Partial<CreateTokensDto> = {
    type: TokenType.ACCESS_TOKEN,
    token: '660e8400-e29b-41d4-a716-446655440001',
  };

  // Mock para dados após atualização
  const mockUpdatedToken = {
    ...mockToken,
    ...mockUpdateDto,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokensService,
        {
          provide: TokensRepository,
          useValue: {
            create: jest.fn().mockResolvedValue(mockToken),
            findAll: jest.fn().mockResolvedValue(mockPaginatedResult),
            list: jest.fn().mockResolvedValue([mockToken]),
            findOne: jest.fn().mockResolvedValue(mockToken),
            update: jest.fn().mockResolvedValue(mockUpdatedToken),
            remove: jest.fn().mockResolvedValue(1),
          },
        },
      ],
    }).compile();

    service = module.get<TokensService>(TokensService);
    repository = module.get<TokensRepository>(TokensRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a Token successfully', async () => {
      const result = await service.create(mockCreateDto);

      expect(repository.create).toHaveBeenCalledWith(mockCreateDto);
      expect(result).toEqual(mockToken);
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
          'Erro ao criar Token',
        );
      }
    });
  });

  describe('findAll', () => {
    it('should return paginated Tokens', async () => {
      const params: ListPaginatedTokensParamsDto = { page: 1, limit: 10 };
      const result = await service.findAll(params);

      expect(repository.findAll).toHaveBeenCalledWith(params);
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should throw BadRequestException on findAll error', async () => {
      const params: ListPaginatedTokensParamsDto = { page: 1, limit: 10 };

      jest.spyOn(repository, 'findAll').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      try {
        await service.findAll(params);
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain(
          'Erro ao buscar Tokens paginados',
        );
      }
    });
  });

  describe('list', () => {
    it('should return all Tokens', async () => {
      const params: ListTokensParamsDto = {};
      const result = await service.list(params);

      expect(repository.list).toHaveBeenCalledWith(params);
      expect(result).toEqual([mockToken]);
    });

    it('should throw BadRequestException on list error', async () => {
      const params: ListTokensParamsDto = {};

      jest.spyOn(repository, 'list').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      try {
        await service.list(params);
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain(
          'Erro ao listar Tokens',
        );
      }
    });
  });

  describe('findOne', () => {
    it('should return a Token by id', async () => {
      const result = await service.findOne('mock-id');

      expect(repository.findOne).toHaveBeenCalledWith('mock-id');
      expect(result).toEqual(mockToken);
    });

    it('should rethrow NotFoundException from repository', async () => {
      jest
        .spyOn(repository, 'findOne')
        .mockRejectedValueOnce(new NotFoundException('Token not found'));

      try {
        await service.findOne('not-found');
        fail('Expected NotFoundException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toContain(
          'Token not found',
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
          'Erro ao buscar Token',
        );
      }
    });
  });

  describe('update', () => {
    it('should update a Token', async () => {
      const result = await service.update('mock-id', mockUpdateDto);

      expect(repository.update).toHaveBeenCalledWith('mock-id', mockUpdateDto);
      expect(result).toEqual(mockUpdatedToken);
    });

    it('should rethrow NotFoundException from repository', async () => {
      jest
        .spyOn(repository, 'update')
        .mockRejectedValueOnce(new NotFoundException('Token not found'));

      try {
        await service.update('not-found', mockUpdateDto);
        fail('Expected NotFoundException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toContain(
          'Token not found',
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
          'Erro ao atualizar Token',
        );
      }
    });
  });

  describe('remove', () => {
    it('should remove a Token', async () => {
      const result = await service.remove('mock-id');

      expect(repository.remove).toHaveBeenCalledWith('mock-id');
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message');
    });

    it('should rethrow NotFoundException from repository', async () => {
      jest
        .spyOn(repository, 'remove')
        .mockRejectedValueOnce(new NotFoundException('Token not found'));

      try {
        await service.remove('not-found');
        fail('Expected NotFoundException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toContain(
          'Token not found',
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
          'Erro ao remover Token',
        );
      }
    });
  });
});
