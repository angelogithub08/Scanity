/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { Logger, NotFoundException } from '@nestjs/common';
import { KNEX_CONNECTION } from '../../infra/database/database.providers';
import { NotificationsRepository } from './notifications.repository';
import type { Notification } from './entities/notification.entity';

function createMockKnex() {
  const queryBuilder = {
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
    groupBy: jest.fn().mockReturnThis(),
    modify: jest.fn().mockReturnThis(),
    clone: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockResolvedValue(1),
    delete: jest.fn().mockResolvedValue(1),
    first: jest.fn().mockResolvedValue({}),
    then: jest.fn((resolve: (v: unknown) => void) => resolve(undefined)),
  };

  const knex = jest.fn().mockReturnValue(queryBuilder) as any;
  knex.raw = jest.fn().mockReturnValue({});
  const trx = jest.fn().mockReturnValue(queryBuilder) as any;
  trx.commit = jest.fn().mockResolvedValue(undefined);
  trx.rollback = jest.fn().mockResolvedValue(undefined);
  knex.transaction = jest.fn().mockResolvedValue(trx);
  return knex;
}

describe('NotificationsRepository', () => {
  let repository: NotificationsRepository;
  let mockKnex: ReturnType<typeof createMockKnex>;
  let queryBuilder: any;

  beforeEach(async () => {
    mockKnex = createMockKnex();
    queryBuilder = mockKnex();
    mockKnex.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsRepository,
        { provide: KNEX_CONNECTION, useValue: mockKnex },
      ],
    }).compile();

    repository = module.get<NotificationsRepository>(NotificationsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockNotification: Notification = {
    id: 'notif-1',
    key: 'stock_alert',
    message: 'Estoque baixo',
    data: '{"product":"Produto A"}',
    account_id: 'account-1',
    user_id: 'user-1',
    read_at: null as any,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
  };

  describe('findAll', () => {
    it('should return paginated result with total_unread', async () => {
      queryBuilder.first
        .mockResolvedValueOnce({ count: '10' })
        .mockResolvedValueOnce({ count: '3' });
      queryBuilder.then.mockImplementationOnce((resolve: (v: unknown) => void) =>
        resolve([mockNotification]),
      );

      const result = await repository.findAll({
        page: 1,
        limit: 10,
        account_id: 'account-1',
      });

      expect(result.total).toBe(10);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.last_page).toBe(1);
      expect(result.total_unread).toBe(3);
      expect(result.data).toEqual([mockNotification]);
      expect(queryBuilder.clone).toHaveBeenCalledTimes(3);
    });

    it('should handle empty result set', async () => {
      queryBuilder.first
        .mockResolvedValueOnce({ count: '0' })
        .mockResolvedValueOnce({ count: '0' });
      queryBuilder.then.mockImplementationOnce((resolve: (v: unknown) => void) =>
        resolve([]),
      );

      const result = await repository.findAll({});

      expect(result.total).toBe(0);
      expect(result.total_unread).toBe(0);
      expect(result.data).toEqual([]);
      expect(result.last_page).toBe(0);
    });

    it('should throw and log error on failure', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'error');
      queryBuilder.first.mockRejectedValueOnce(new Error('DB error'));

      await expect(repository.findAll({})).rejects.toThrow('DB error');
      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('should return all notifications matching filters', async () => {
      queryBuilder.then.mockImplementationOnce((resolve: (v: unknown) => void) =>
        resolve([mockNotification]),
      );

      const result = await repository.list({ account_id: 'account-1' });

      expect(result).toEqual([mockNotification]);
      expect(queryBuilder.select).toHaveBeenCalled();
    });

    it('should throw and log error on failure', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'error');
      queryBuilder.then.mockImplementationOnce((resolve, reject) => reject(new Error('DB error')));

      await expect(repository.list({})).rejects.toThrow('DB error');
      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return notification when found', async () => {
      queryBuilder.first.mockResolvedValueOnce(mockNotification);

      const result = await repository.findOne('notif-1');

      expect(result).toEqual(mockNotification);
    });

    it('should throw NotFoundException when not found', async () => {
      queryBuilder.first.mockResolvedValueOnce(undefined);

      await expect(repository.findOne('notif-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw and log error on failure', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'error');
      queryBuilder.first.mockRejectedValueOnce(new Error('DB error'));

      await expect(repository.findOne('notif-1')).rejects.toThrow('DB error');
      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should insert and return the notification', async () => {
      queryBuilder.then.mockImplementationOnce((resolve: (v: unknown) => void) =>
        resolve([mockNotification]),
      );

      const result = await repository.create({
        key: 'stock_alert',
        message: 'Estoque baixo',
        data: '{}',
        account_id: 'account-1',
        user_id: 'user-1',
      });

      expect(mockKnex).toHaveBeenCalledWith('notifications');
      expect(queryBuilder.insert).toHaveBeenCalled();
      expect(queryBuilder.returning).toHaveBeenCalled();
      expect(result).toEqual(mockNotification);
    });

    it('should throw and log error on failure', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'error');
      queryBuilder.then.mockImplementationOnce((resolve, reject) => reject(new Error('DB error')));

      await expect(
        repository.create({
          key: 'test',
          message: 'test',
          account_id: 'a',
          user_id: 'u',
        }),
      ).rejects.toThrow('DB error');
      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update and return the notification', async () => {
      queryBuilder.update.mockResolvedValueOnce(1);
      queryBuilder.first.mockResolvedValueOnce(mockNotification);

      const result = await repository.update('notif-1', { message: 'Updated' });

      expect(result).toEqual(mockNotification);
    });

    it('should throw NotFoundException when no rows updated', async () => {
      queryBuilder.update.mockResolvedValueOnce(0);

      await expect(
        repository.update('notif-1', { message: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw and log error on failure', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'error');
      queryBuilder.update.mockRejectedValueOnce(new Error('DB error'));

      await expect(
        repository.update('notif-1', { message: 'test' }),
      ).rejects.toThrow('DB error');
      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft-delete and return count', async () => {
      queryBuilder.update.mockResolvedValueOnce(1);

      const result = await repository.remove('notif-1');

      expect(result).toBe(1);
      expect(queryBuilder.where).toHaveBeenCalledWith({ id: 'notif-1' });
      expect(queryBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          deleted_at: expect.any(Date),
          updated_at: expect.any(Date),
        }),
      );
    });

    it('should throw NotFoundException when id not found', async () => {
      queryBuilder.update.mockResolvedValueOnce(0);

      await expect(repository.remove('notif-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw and log error on failure', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'error');
      queryBuilder.update.mockRejectedValueOnce(new Error('DB error'));

      await expect(repository.remove('notif-1')).rejects.toThrow('DB error');
      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('removeByAccountId', () => {
    it('should soft-delete all notifications for account', async () => {
      queryBuilder.update.mockResolvedValueOnce(5);

      const result = await repository.removeByAccountId('account-1');

      expect(result).toBe(5);
      expect(queryBuilder.where).toHaveBeenCalledWith({
        account_id: 'account-1',
      });
      expect(queryBuilder.whereNull).toHaveBeenCalledWith('deleted_at');
    });

    it('should use transaction when provided', async () => {
      const trx = jest.fn().mockReturnValue(queryBuilder) as any;
      trx.commit = jest.fn().mockResolvedValue(undefined);
      trx.rollback = jest.fn().mockResolvedValue(undefined);
      queryBuilder.update.mockResolvedValueOnce(3);

      const result = await repository.removeByAccountId('account-1', trx);

      expect(result).toBe(3);
      expect(trx).toHaveBeenCalled();
    });

    it('should throw and log error on failure', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'error');
      queryBuilder.update.mockRejectedValueOnce(new Error('DB error'));

      await expect(
        repository.removeByAccountId('account-1'),
      ).rejects.toThrow('DB error');
      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('markAllAsRead', () => {
    it('should update read_at for all unread notifications of user', async () => {
      queryBuilder.update.mockResolvedValueOnce(4);

      const result = await repository.markAllAsRead('user-1');

      expect(result).toBe(4);
      expect(queryBuilder.where).toHaveBeenCalledWith({ user_id: 'user-1' });
      expect(queryBuilder.whereNull).toHaveBeenCalledWith('read_at');
      expect(queryBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          read_at: expect.any(Date),
          updated_at: expect.any(Date),
        }),
      );
    });

    it('should return 0 when no unread notifications exist', async () => {
      queryBuilder.update.mockResolvedValueOnce(0);

      const result = await repository.markAllAsRead('user-1');

      expect(result).toBe(0);
    });

    it('should throw and log error on failure', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'error');
      queryBuilder.update.mockRejectedValueOnce(new Error('DB error'));

      await expect(repository.markAllAsRead('user-1')).rejects.toThrow(
        'DB error',
      );
      expect(loggerSpy).toHaveBeenCalled();
    });
  });
});
