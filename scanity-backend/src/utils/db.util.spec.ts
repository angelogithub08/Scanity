import { applyDefaultQuery } from './db.util';

const createMockQB = () => ({
  whereNull: jest.fn().mockReturnThis(),
  whereNotNull: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
});

describe('applyDefaultQuery', () => {
  it('should apply whereNull deleted_at when hasDeletedAt is true', () => {
    const qb = createMockQB();
    applyDefaultQuery(qb as any, 'users', {});
    expect(qb.whereNull).toHaveBeenCalledWith('users.deleted_at');
  });

  it('should apply whereNotNull deleted_at when show_deleted filter is true', () => {
    const qb = createMockQB();
    applyDefaultQuery(qb as any, 'users', { show_deleted: true });
    expect(qb.whereNotNull).toHaveBeenCalledWith('users.deleted_at');
  });

  it('should NOT apply deleted_at filter when hasDeletedAt is false', () => {
    const qb = createMockQB();
    applyDefaultQuery(qb as any, 'users', {}, false);
    expect(qb.whereNull).not.toHaveBeenCalled();
    expect(qb.whereNotNull).not.toHaveBeenCalled();
  });

  it('should filter by exact match for id', () => {
    const qb = createMockQB();
    applyDefaultQuery(qb as any, 'users', { id: '123' });
    expect(qb.where).toHaveBeenCalledWith('users.id', '123');
  });

  it('should filter by exact match for *_id keys', () => {
    const qb = createMockQB();
    applyDefaultQuery(qb as any, 'users', { account_id: '456' });
    expect(qb.where).toHaveBeenCalledWith('users.account_id', '456');
  });

  it('should filter by ilike for other string keys', () => {
    const qb = createMockQB();
    applyDefaultQuery(qb as any, 'users', { name: 'John' });
    expect(qb.where).toHaveBeenCalledWith('users.name', 'ilike', '%John%');
  });

  it('should skip undefined, null, empty string, and show_deleted filter values', () => {
    const qb = createMockQB();
    applyDefaultQuery(qb as any, 'users', {
      name: undefined,
      email: null,
      phone: '',
      show_deleted: true,
    });
    expect(qb.where).not.toHaveBeenCalled();
  });
});
