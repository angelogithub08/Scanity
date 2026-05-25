import { Knex } from 'knex';

export function applyDefaultQuery(
  qb: Knex.QueryBuilder,
  table: string,
  filters: Record<string, any>,
  hasDeletedAt: boolean = true,
) {
  if (hasDeletedAt) {
    if (
      Object.keys(filters).indexOf('show_deleted') > -1 &&
      filters.show_deleted !== false &&
      filters.show_deleted !== 'false' &&
      filters.show_deleted !== undefined
    ) {
      qb.whereNotNull(`${table}.deleted_at`);
    } else {
      qb.whereNull(`${table}.deleted_at`);
    }
  }

  Object.entries(filters).forEach(([key, value]) => {
    if (
      value === undefined ||
      value === null ||
      value === '' ||
      key === 'show_deleted'
    ) {
      return;
    }

    if (key === 'id') {
      qb.where(`${table}.${key}`, `${value}`);
      return;
    }

    if (key.indexOf('_id') > -1) {
      qb.where(`${table}.${key}`, `${value}`);
    } else {
      qb.where(`${table}.${key}`, 'ilike', `%${value}%`);
    }
  });
}
