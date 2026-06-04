/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { TokensController } from './tokens.controller';
import { TokensService } from './tokens.service';
import { CreateTokensDto } from './dto/create-tokens.dto';
import { UpdateTokensDto } from './dto/update-tokens.dto';
import {
  ListTokensParamsDto,
  ListPaginatedTokensParamsDto,
} from './dto/params-tokens.dto';
import { TokenType } from './entities/token.entity';

describe('TokensController', () => {
  let controller: TokensController;
  let service: TokensService;

  // Mock data para Token
  const mockData = {
    id: 'mock-id',
    type: TokenType.REFRESH_TOKEN,
    token: '550e8400-e29b-41d4-a716-446655440000',
    account_id: '123e4567-e89b-12d3-a456-426614174000',
    user_id: '123e4567-e89b-12d3-a456-426614174001',
    revoked_at: null,
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
  const mockUpdatedData = {
    ...mockData,
    ...mockUpdateDto,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TokensController],
      providers: [
        {
          provide: TokensService,
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

    controller = module.get<TokensController>(TokensController);
    service = module.get<TokensService>(TokensService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  it('should create a new Token', async () => {
    const result = await controller.create(mockCreateDto);

    expect(service.create).toHaveBeenCalledWith(mockCreateDto);
    expect(result).toEqual(mockData);
    expect(result.type).toBeDefined();
    expect(result.token).toBeDefined();
    expect(result.account_id).toBeDefined();
  });

  it('should return paginated Token list', async () => {
    const params = { page: 1, limit: 10 } as ListPaginatedTokensParamsDto;
    const result = await controller.findAll(params);

    expect(service.findAll).toHaveBeenCalledWith(params);
    expect(result).toEqual(mockPaginatedResult);
    expect(result.data).toHaveLength(1);
  });

  it('should return all Token records', async () => {
    const params = {} as ListTokensParamsDto;
    const result = await controller.list(params);

    expect(service.list).toHaveBeenCalledWith(params);
    expect(result).toEqual([mockData]);
    expect(result).toHaveLength(1);
  });

  it('should return a Token by id', async () => {
    const id = 'mock-id';
    const result = await controller.findOne(id);

    expect(service.findOne).toHaveBeenCalledWith(id);
    expect(result).toEqual(mockData);
    expect(result.id).toBe(id);
  });

  it('should update a Token', async () => {
    const id = 'mock-id';
    const result = await controller.update(
      id,
      mockUpdateDto as UpdateTokensDto,
    );

    expect(service.update).toHaveBeenCalledWith(id, mockUpdateDto);
    expect(result).toEqual(mockUpdatedData);
    expect(result.type).toBeDefined();
    expect(result.token).toBeDefined();
    expect(result.account_id).toBeDefined();
  });

  it('should remove a Token', async () => {
    const id = 'mock-id';
    const result = await controller.remove(id);

    expect(service.remove).toHaveBeenCalledWith(id);
    expect(result).toEqual({ deleted: true });
  });
});
