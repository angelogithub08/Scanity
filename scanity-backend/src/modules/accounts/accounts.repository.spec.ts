/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AccountsRepository } from './accounts.repository';
import { KNEX_CONNECTION } from '../../infra/database/database.providers';

function createMockKnex() {
  const queryBuilder: any = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    whereNull: jest.fn().mockReturnThis(),
    whereNotNull: jest.fn().mockReturnThis(),
    whereIn: jest.fn().mockReturnThis(),
    whereRaw: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    join: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    count: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue({ count: 1 }),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockResolvedValue(1),
    delete: jest.fn().mockResolvedValue(1),
    clone: jest.fn().mockReturnThis(),
    modify: jest.fn().mockImplementation(function (this: any, callback: Function) {
      callback(this);
      return this;
    }),
    returning: jest.fn().mockResolvedValue([{ id: 'mock-id' }]),
  };

  const knex = jest.fn().mockReturnValue(queryBuilder) as any;
  const trx = jest.fn().mockReturnValue(queryBuilder) as any;
  trx.commit = jest.fn().mockResolvedValue(undefined);
  trx.rollback = jest.fn().mockResolvedValue(undefined);
  knex.transaction = jest.fn().mockResolvedValue(trx);
  return knex;
}

describe('AccountsRepository', () => {
  let repository: AccountsRepository;
  let mockKnex: ReturnType<typeof createMockKnex>;

  const mockAccount = {
    id: '1',
    name: 'Test Account',
    type: 'USER',
    phone: '(11) 98765-4321',
    document: '123.456.789-00',
    zipcode: '01234-567',
    address_number: '123',
    gateway_customer_id: null,
    ia_token: null,
    confirmed_at: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    mockKnex = createMockKnex();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsRepository,
        { provide: KNEX_CONNECTION, useValue: mockKnex },
      ],
    }).compile();
    repository = module.get<AccountsRepository>(AccountsRepository);
  });

  describe('findAll', () => {
    it('should return paginated results with total count and last_page', async () => {
      const qb = mockKnex();
      qb.first.mockResolvedValueOnce({ count: 15 });
      qb.offset.mockResolvedValueOnce([mockAccount]);

      const result = await repository.findAll({ page: 2, limit: 10 });

      expect(qb.clone).toHaveBeenCalledTimes(2);
      expect(qb.count).toHaveBeenCalledWith('* as count');
      expect(qb.first).toHaveBeenCalledTimes(1);
      expect(qb.orderBy).toHaveBeenCalledWith('name', 'asc');
      expect(qb.select).toHaveBeenCalled();
      expect(qb.limit).toHaveBeenCalledWith(10);
      expect(qb.offset).toHaveBeenCalledWith(10);
      expect(result).toEqual({
        data: [mockAccount],
        total: 15,
        page: 2,
        last_page: 2,
        limit: 10,
      });
    });

    it('should apply filters correctly via defaultQuery', async () => {
      const qb = mockKnex();
      qb.first.mockResolvedValueOnce({ count: 1 });
      qb.offset.mockResolvedValueOnce([mockAccount]);
      const params = { page: 1, limit: 10, name: 'test', show_deleted: true };

      await repository.findAll(params as any);

      expect(qb.where).toHaveBeenCalledWith('accounts.name', 'ilike', '%test%');
      expect(qb.whereNotNull).toHaveBeenCalledWith('accounts.deleted_at');
    });

    it('should rethrow on database error', async () => {
      mockKnex().first.mockRejectedValueOnce(new Error('Query failed'));

      await expect(repository.findAll({ page: 1, limit: 10 })).rejects.toThrow('Query failed');
    });
  });

  describe('list', () => {
    it('should return all records matching filters', async () => {
      const qb = mockKnex();
      qb.select.mockResolvedValueOnce([mockAccount]);

      const result = await repository.list({});

      expect(qb.clone).toHaveBeenCalled();
      expect(qb.select).toHaveBeenCalled();
      expect(result).toEqual([mockAccount]);
    });

    it('should rethrow on database error', async () => {
      mockKnex().select.mockRejectedValueOnce(new Error('Query failed'));

      await expect(repository.list({})).rejects.toThrow('Query failed');
    });
  });

  describe('findOne', () => {
    it('should find a account by id', async () => {
      const qb = mockKnex();
      qb.first.mockResolvedValueOnce(mockAccount);

      const result = await repository.findOne('1');

      expect(qb.where).toHaveBeenCalledWith('accounts.id', '1');
      expect(qb.clone).toHaveBeenCalled();
      expect(qb.select).toHaveBeenCalled();
      expect(qb.first).toHaveBeenCalled();
      expect(result).toEqual(mockAccount);
    });

    it('should throw NotFoundException when account is not found', async () => {
      mockKnex().first.mockResolvedValueOnce(undefined);

      await expect(repository.findOne('not-found')).rejects.toThrow(NotFoundException);
    });

    it('should rethrow on database error', async () => {
      mockKnex().first.mockRejectedValueOnce(new Error('Query failed'));

      await expect(repository.findOne('1')).rejects.toThrow('Query failed');
    });
  });

  describe('create', () => {
    it('should insert data with returning and return the inserted record', async () => {
      const insertedRecord = { ...mockAccount, id: 'new-id' };
      mockKnex().returning.mockResolvedValueOnce([insertedRecord]);
      const dto = { name: 'New Account', type: 'USER' };

      const result = await repository.create(dto as any);

      expect(mockKnex).toHaveBeenCalledWith('accounts');
      expect(mockKnex().insert).toHaveBeenCalledWith(dto);
      expect(mockKnex().returning).toHaveBeenCalled();
      expect(result).toEqual(insertedRecord);
    });

    it('should rethrow on database error', async () => {
      mockKnex().returning.mockRejectedValueOnce(new Error('Insert failed'));

      await expect(repository.create({} as any)).rejects.toThrow('Insert failed');
    });
  });

  describe('update', () => {
    const updateDto = { name: 'Updated' };

    it('should update data and return the refreshed record', async () => {
      const updatedAccount = { ...mockAccount, name: 'Updated' };
      const qb = mockKnex();
      qb.first.mockResolvedValueOnce(updatedAccount);

      const result = await repository.update('1', updateDto as any);

      expect(qb.where).toHaveBeenCalledWith({ id: '1' });
      expect(qb.update).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Updated', updated_at: expect.any(Date) }),
      );
      expect(qb.first).toHaveBeenCalled();
      expect(result).toEqual(updatedAccount);
    });

    it('should throw NotFoundException when count is 0', async () => {
      mockKnex().update.mockResolvedValueOnce(0);

      await expect(repository.update('not-found', updateDto as any)).rejects.toThrow(NotFoundException);
    });

    it('should rethrow on database error', async () => {
      mockKnex().update.mockRejectedValueOnce(new Error('Update failed'));

      await expect(repository.update('1', updateDto as any)).rejects.toThrow('Update failed');
    });
  });

  describe('remove', () => {
    it('should soft-delete and return the count', async () => {
      const result = await repository.remove('1');

      expect(mockKnex).toHaveBeenCalledWith('accounts');
      expect(mockKnex().where).toHaveBeenCalledWith({ id: '1' });
      expect(mockKnex().update).toHaveBeenCalledWith(
        expect.objectContaining({ deleted_at: expect.any(Date), updated_at: expect.any(Date) }),
      );
      expect(result).toBe(1);
    });

    it('should throw NotFoundException when account is not found', async () => {
      mockKnex().update.mockResolvedValueOnce(0);

      await expect(repository.remove('not-found')).rejects.toThrow(NotFoundException);
    });

    it('should use trx when provided', async () => {
      const trx = jest.fn().mockReturnValue(mockKnex()) as any;

      const result = await repository.remove('1', trx);

      expect(trx).toHaveBeenCalledWith('accounts');
      expect(result).toBe(1);
    });

    it('should rethrow on database error', async () => {
      mockKnex().update.mockRejectedValueOnce(new Error('Delete failed'));

      await expect(repository.remove('1')).rejects.toThrow('Delete failed');
    });
  });
});
