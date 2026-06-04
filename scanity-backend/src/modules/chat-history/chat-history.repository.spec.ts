/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ChatHistoryRepository } from './chat-history.repository';
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

describe('ChatHistoryRepository', () => {
  let repository: ChatHistoryRepository;
  let mockKnex: ReturnType<typeof createMockKnex>;

  beforeEach(async () => {
    mockKnex = createMockKnex();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatHistoryRepository,
        { provide: KNEX_CONNECTION, useValue: mockKnex },
      ],
    }).compile();
    repository = module.get<ChatHistoryRepository>(ChatHistoryRepository);
  });

  describe('create', () => {
    it('should insert data with returning and return the inserted record', async () => {
      const insertedRecord = { id: 'new-id', user_id: 'user-1', role: 'user', content: 'Hello' };
      mockKnex().returning.mockResolvedValueOnce([insertedRecord]);
      const dto = { user_id: 'user-1', role: 'user', content: 'Hello' };

      const result = await repository.create(dto as any);

      expect(mockKnex).toHaveBeenCalledWith('chat_history');
      expect(mockKnex().insert).toHaveBeenCalledWith(dto);
      expect(mockKnex().returning).toHaveBeenCalled();
      expect(result).toEqual(insertedRecord);
    });

    it('should log error and rethrow on database error', async () => {
      const dbError = new Error('DB connection lost');
      mockKnex().returning.mockRejectedValueOnce(dbError);

      await expect(repository.create({} as any)).rejects.toThrow(dbError);
    });
  });

  describe('findByUserId', () => {
    const mockMessages = [
      { id: '1', user_id: 'user-1', role: 'user', content: 'Hello', created_at: new Date('2024-01-02') },
      { id: '2', user_id: 'user-1', role: 'assistant', content: 'Hi', created_at: new Date('2024-01-01') },
    ];

    it('should return paginated results with total count', async () => {
      const qb = mockKnex();
      qb.first.mockResolvedValueOnce({ count: 2 });
      qb.offset.mockResolvedValueOnce([...mockMessages]);

      const result = await repository.findByUserId('user-1', 1, 10);

      expect(qb.where).toHaveBeenCalledWith('user_id', 'user-1');
      expect(qb.whereNull).toHaveBeenCalledWith('deleted_at');
      expect(qb.clone).toHaveBeenCalledTimes(2);
      expect(qb.count).toHaveBeenCalledWith('* as count');
      expect(qb.first).toHaveBeenCalledTimes(1);
      expect(qb.orderBy).toHaveBeenCalledWith('created_at', 'desc');
      expect(qb.select).toHaveBeenCalled();
      expect(qb.limit).toHaveBeenCalledWith(10);
      expect(qb.offset).toHaveBeenCalledWith(0);
      expect(result.data).toEqual(mockMessages.reverse());
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should rethrow on database error', async () => {
      const dbError = new Error('Query failed');
      mockKnex().first.mockRejectedValueOnce(dbError);

      await expect(repository.findByUserId('user-1', 1, 10)).rejects.toThrow(dbError);
    });
  });

  describe('findByUserIdAsc', () => {
    const mockMessages = [
      { id: '1', user_id: 'user-1', role: 'user', content: 'Hello', created_at: new Date('2024-01-02') },
      { id: '2', user_id: 'user-1', role: 'assistant', content: 'Hi', created_at: new Date('2024-01-01') },
    ];

    it('should return messages ordered by created_at desc and limited', async () => {
      const qb = mockKnex();
      qb.limit.mockResolvedValueOnce([...mockMessages]);

      const result = await repository.findByUserIdAsc('user-1', 10);

      expect(qb.where).toHaveBeenCalledWith('user_id', 'user-1');
      expect(qb.whereNull).toHaveBeenCalledWith('deleted_at');
      expect(qb.orderBy).toHaveBeenCalledWith('created_at', 'desc');
      expect(qb.select).toHaveBeenCalled();
      expect(qb.limit).toHaveBeenCalledWith(10);
      expect(result).toEqual(mockMessages.reverse());
    });

    it('should rethrow on database error', async () => {
      mockKnex().limit.mockRejectedValueOnce(new Error('Query failed'));

      await expect(repository.findByUserIdAsc('user-1', 10)).rejects.toThrow('Query failed');
    });
  });

  describe('removeByAccountId', () => {
    it('should use trx when provided', async () => {
      const qb = mockKnex();
      const trx = jest.fn().mockReturnValue(qb) as any;

      const result = await repository.removeByAccountId('account-1', trx);

      expect(trx).toHaveBeenCalledWith('chat_history');
      expect(qb.where).toHaveBeenCalledWith({ account_id: 'account-1' });
      expect(qb.whereNull).toHaveBeenCalledWith('deleted_at');
      expect(qb.update).toHaveBeenCalled();
      expect(result).toBe(1);
    });

    it('should use knex directly when trx is not provided', async () => {
      const result = await repository.removeByAccountId('account-1');

      expect(mockKnex).toHaveBeenCalledWith('chat_history');
      expect(mockKnex().where).toHaveBeenCalledWith({ account_id: 'account-1' });
      expect(mockKnex().whereNull).toHaveBeenCalledWith('deleted_at');
      expect(mockKnex().update).toHaveBeenCalled();
      expect(result).toBe(1);
    });

    it('should rethrow on database error', async () => {
      mockKnex().update.mockRejectedValueOnce(new Error('Update failed'));

      await expect(repository.removeByAccountId('account-1')).rejects.toThrow('Update failed');
    });
  });

  describe('clearByUserId', () => {
    it('should soft-delete all records for the user', async () => {
      const result = await repository.clearByUserId('user-1');

      expect(mockKnex).toHaveBeenCalledWith('chat_history');
      expect(mockKnex().where).toHaveBeenCalledWith('user_id', 'user-1');
      expect(mockKnex().whereNull).toHaveBeenCalledWith('deleted_at');
      expect(mockKnex().update).toHaveBeenCalledWith(
        expect.objectContaining({ deleted_at: expect.any(Date), updated_at: expect.any(Date) }),
      );
      expect(result).toBe(1);
    });

    it('should rethrow on database error', async () => {
      mockKnex().update.mockRejectedValueOnce(new Error('Update failed'));

      await expect(repository.clearByUserId('user-1')).rejects.toThrow('Update failed');
    });
  });
});
