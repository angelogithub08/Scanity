/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { CreateAccountsDto } from './dto/create-accounts.dto';
import { UpdateAccountsDto } from './dto/update-accounts.dto';
import {
  ListAccountsParamsDto,
  ListPaginatedAccountsParamsDto,
} from './dto/params-accounts.dto';
import { AccountType } from './entities/account.entity';

describe('AccountsController', () => {
  let controller: AccountsController;
  let service: AccountsService;

  // Mock data para Account
  const mockData = {
    id: 'mock-id',
    name: 'Test name',
    email: 'test@email.com',
    type: 'USER',
    phone: '(11) 98765-4321',
    document: '123.456.789-00',
    zipcode: '01234-567',
    address_number: '123',
    ia_token: 'sk-1234567890abcdef',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockPaginatedResult = {
    data: [mockData],
    total: 1,
    page: 1,
    limit: 10,
    last_page: 1,
  };

  // Mock para o DTO de criação
  const mockCreateDto: CreateAccountsDto = {
    name: 'Test name',
    email: 'test@email.com',
    type: AccountType.USER,
    phone: '(11) 98765-4321',
    document: '123.456.789-00',
    zipcode: '01234-567',
    address_number: '123',
    ia_token: 'sk-1234567890abcdef',
  };

  // Mock para o DTO de atualização
  const mockUpdateDto: Partial<CreateAccountsDto> = {
    name: 'Updated name',
    email: 'Updated email',
  };

  // Mock para dados após atualização
  const mockUpdatedData = {
    ...mockData,
    ...mockUpdateDto,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountsController],
      providers: [
        {
          provide: AccountsService,
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

    controller = module.get<AccountsController>(AccountsController);
    service = module.get<AccountsService>(AccountsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  it('should create a new Account', async () => {
    const result = await controller.create(mockCreateDto);

    expect(service.create).toHaveBeenCalledWith(mockCreateDto);
    expect(result).toEqual(mockData);
    expect(result.name).toBeDefined();
    expect(result.email).toBeDefined();
  });

  it('should return paginated Account list', async () => {
    const params = { page: 1, limit: 10 } as ListPaginatedAccountsParamsDto;
    const result = await controller.findAll(params);

    expect(service.findAll).toHaveBeenCalledWith(params);
    expect(result).toEqual(mockPaginatedResult);
    expect(result.data).toHaveLength(1);
  });

  it('should return all Account records', async () => {
    const params = {} as ListAccountsParamsDto;
    const result = await controller.list(params);

    expect(service.list).toHaveBeenCalledWith(params);
    expect(result).toEqual([mockData]);
    expect(result).toHaveLength(1);
  });

  it('should return a Account by id', async () => {
    const id = 'mock-id';
    const result = await controller.findOne(id);

    expect(service.findOne).toHaveBeenCalledWith(id);
    expect(result).toEqual(mockData);
    expect(result.id).toBe(id);
  });

  it('should update a Account', async () => {
    const id = 'mock-id';
    const result = await controller.update(
      id,
      mockUpdateDto as UpdateAccountsDto,
    );

    expect(service.update).toHaveBeenCalledWith(id, mockUpdateDto);
    expect(result).toEqual(mockUpdatedData);
    expect(result.name).toBeDefined();
    expect(result.email).toBeDefined();
  });

  it('should remove a Account', async () => {
    const id = 'mock-id';
    const result = await controller.remove(id);

    expect(service.remove).toHaveBeenCalledWith(id);
    expect(result).toEqual({ deleted: true });
  });
});
