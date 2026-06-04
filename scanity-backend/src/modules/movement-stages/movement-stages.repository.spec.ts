/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MovementStagesRepository } from './movement-stages.repository';
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

describe('MovementStagesRepository', () => {
  let repository: MovementStagesRepository;
  let mockKnex: ReturnType<typeof createMockKnex>;

  const mockStage = {
    id: '1',
    name: 'Test Stage',
    account_id: 'acc-1',
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    mockKnex = createMockKnex();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MovementStagesRepository,
        { provide: KNEX_CONNECTION, useValue: mockKnex },
      ],
    }).compile();
    repository = module.get<MovementStagesRepository>(MovementStagesRepository);
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const qb = mockKnex();
      qb.first.mockResolvedValueOnce({ count: 7 });
      qb.offset.mockResolvedValueOnce([mockStage]);

      const result = await repository.findAll({ page: 1, limit: 10 });

      expect(qb.clone).toHaveBeenCalledTimes(2);
      expect(qb.count).toHaveBeenCalledWith('* as count');
      expect(qb.first).toHaveBeenCalledTimes(1);
      expect(qb.orderBy).toHaveBeenCalledWith('name', 'asc');
      expect(qb.select).toHaveBeenCalled();
      expect(qb.limit).toHaveBeenCalledWith(10);
      expect(qb.offset).toHaveBeenCalledWith(0);
      expect(result).toEqual({
        data: [mockStage],
        total: 7,
        page: 1,
        last_page: 1,
        limit: 10,
      });
    });

    it('should apply filters correctly', async () => {
      const qb = mockKnex();
      qb.first.mockResolvedValueOnce({ count: 1 });
      qb.offset.mockResolvedValueOnce([mockStage]);

      await repository.findAll({ page: 1, limit: 10, name: 'test', account_id: 'acc-1' } as any);

      expect(qb.where).toHaveBeenCalledWith('movement_stages.name', 'ilike', '%test%');
      expect(qb.where).toHaveBeenCalledWith('movement_stages.account_id', 'acc-1');
      expect(qb.whereNull).toHaveBeenCalledWith('movement_stages.deleted_at');
    });

    it('should rethrow on database error', async () => {
      mockKnex().first.mockRejectedValueOnce(new Error('Query failed'));

      await expect(repository.findAll({ page: 1, limit: 10 })).rejects.toThrow('Query failed');
    });
  });

  describe('list', () => {
    it('should return all records matching filters', async () => {
      const qb = mockKnex();
      qb.select.mockResolvedValueOnce([mockStage]);

      const result = await repository.list({});

      expect(qb.clone).toHaveBeenCalled();
      expect(qb.select).toHaveBeenCalled();
      expect(result).toEqual([mockStage]);
    });

    it('should rethrow on database error', async () => {
      mockKnex().select.mockRejectedValueOnce(new Error('Query failed'));

      await expect(repository.list({})).rejects.toThrow('Query failed');
    });
  });

  describe('findOne', () => {
    it('should find a movement-stage by id', async () => {
      const qb = mockKnex();
      qb.first.mockResolvedValueOnce(mockStage);

      const result = await repository.findOne('1');

      expect(qb.where).toHaveBeenCalledWith('movement_stages.id', '1');
      expect(qb.first).toHaveBeenCalled();
      expect(result).toEqual(mockStage);
    });

    it('should throw NotFoundException when movement-stage is not found', async () => {
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
      const inserted = { ...mockStage, id: 'new-id' };
      mockKnex().returning.mockResolvedValueOnce([inserted]);
      const dto = { name: 'New Stage', account_id: 'acc-1' };

      const result = await repository.create(dto as any);

      expect(mockKnex).toHaveBeenCalledWith('movement_stages');
      expect(mockKnex().insert).toHaveBeenCalledWith(dto);
      expect(mockKnex().returning).toHaveBeenCalled();
      expect(result).toEqual(inserted);
    });

    it('should rethrow on database error', async () => {
      mockKnex().returning.mockRejectedValueOnce(new Error('Insert failed'));

      await expect(repository.create({} as any)).rejects.toThrow('Insert failed');
    });
  });

  describe('createMany', () => {
    it('should insert multiple records and return them', async () => {
      const entrada = { ...mockStage, id: 'entrada-id', name: 'Entrada Test' };
      const saida = { ...mockStage, id: 'saida-id', name: 'Saída Test' };
      mockKnex().returning.mockResolvedValueOnce([entrada, saida]);

      const dtos = [
        { name: 'Entrada Test', account_id: 'acc-1' },
        { name: 'Saída Test', account_id: 'acc-1' },
      ];
      const result = await repository.createMany(dtos as any);

      expect(mockKnex).toHaveBeenCalledWith('movement_stages');
      expect(mockKnex().insert).toHaveBeenCalledWith(dtos);
      expect(mockKnex().returning).toHaveBeenCalled();
      expect(result).toEqual([entrada, saida]);
    });

    it('should rethrow on database error', async () => {
      mockKnex().returning.mockRejectedValueOnce(new Error('Insert failed'));

      await expect(repository.createMany([])).rejects.toThrow('Insert failed');
    });
  });

  describe('update', () => {
    const updateDto = { name: 'Updated' };

    it('should update data and return the refreshed record', async () => {
      const updated = { ...mockStage, name: 'Updated' };
      const qb = mockKnex();
      qb.first.mockResolvedValueOnce(updated);

      const result = await repository.update('1', updateDto as any);

      expect(qb.where).toHaveBeenCalledWith({ id: '1' });
      expect(qb.update).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Updated', updated_at: expect.any(Date) }),
      );
      expect(result).toEqual(updated);
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

      expect(mockKnex).toHaveBeenCalledWith('movement_stages');
      expect(mockKnex().where).toHaveBeenCalledWith({ id: '1' });
      expect(mockKnex().update).toHaveBeenCalledWith(
        expect.objectContaining({ deleted_at: expect.any(Date), updated_at: expect.any(Date) }),
      );
      expect(result).toBe(1);
    });

    it('should throw NotFoundException when movement-stage is not found', async () => {
      mockKnex().update.mockResolvedValueOnce(0);

      await expect(repository.remove('not-found')).rejects.toThrow(NotFoundException);
    });

    it('should rethrow on database error', async () => {
      mockKnex().update.mockRejectedValueOnce(new Error('Delete failed'));

      await expect(repository.remove('1')).rejects.toThrow('Delete failed');
    });
  });

  describe('removeByAccountId', () => {
    it('should use trx when provided', async () => {
      const qb = mockKnex();
      const trx = jest.fn().mockReturnValue(qb) as any;

      const result = await repository.removeByAccountId('acc-1', trx);

      expect(trx).toHaveBeenCalledWith('movement_stages');
      expect(qb.where).toHaveBeenCalledWith({ account_id: 'acc-1' });
      expect(qb.whereNull).toHaveBeenCalledWith('deleted_at');
      expect(qb.update).toHaveBeenCalled();
      expect(result).toBe(1);
    });

    it('should use knex directly when trx is not provided', async () => {
      const result = await repository.removeByAccountId('acc-1');

      expect(mockKnex).toHaveBeenCalledWith('movement_stages');
      expect(mockKnex().update).toHaveBeenCalled();
      expect(result).toBe(1);
    });

    it('should rethrow on database error', async () => {
      mockKnex().update.mockRejectedValueOnce(new Error('Delete failed'));

      await expect(repository.removeByAccountId('acc-1')).rejects.toThrow('Delete failed');
    });
  });
});
