import type { Knex } from 'knex';

const PROFILE_DEFINITIONS = [
  { name: 'Administrador', key: 'ADMIN' },
  { name: 'Usuário', key: 'USER' },
] as const;

const USER_MODULES = [
  'PRODUCTS',
  'CATEGORIES',
  'STOCK',
  'INVENTORY',
  'SUPLIERS',
] as const;

const USER_REPORTS = [
  'REPORT_PRODUCTS_IN_STOCK',
  'REPORT_STOCK_BELLOW_MINIMUM',
  'REPORT_STOCK_MOVEMENTS',
] as const;

const CRUD_OPERATIONS = ['LIST', 'CREATE', 'UPDATE', 'DELETE'] as const;

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('profiles', function (table) {
    table.string('key').after('id').nullable();
  });
  await knex.schema.alterTable('profiles', function (table) {
    table.unique(['key', 'account_id']);
  });

  const accounts = await knex('accounts').select('id').whereNull('deleted_at');

  for (const account of accounts) {
    const accountId = account.id;
    const profileIds: Record<string, string> = {};

    for (const def of PROFILE_DEFINITIONS) {
      const [inserted] = await knex('profiles')
        .insert({
          name: def.name,
          key: def.key,
          account_id: accountId,
        })
        .returning('id');
      profileIds[def.key] = inserted.id;
    }

    const allPermissions = await knex('permissions')
      .select('id', 'key_group', 'key')
      .whereNull('deleted_at');

    const allPermissionIds = allPermissions.map((p) => p.id);

    const userPermissionKeys = new Set<string>();
    for (const mod of USER_MODULES) {
      for (const op of CRUD_OPERATIONS) {
        userPermissionKeys.add(`${mod}:${op}`);
      }
    }
    for (const reportKey of USER_REPORTS) {
      userPermissionKeys.add(`${reportKey}:${reportKey}`);
    }

    const userPermissionIds = allPermissions
      .filter((p) => userPermissionKeys.has(`${p.key_group}:${p.key}`))
      .map((p) => p.id);

    const adminLinks = allPermissionIds.map((permission_id) => ({
      profile_id: profileIds.ADMIN,
      permission_id,
    }));
    const userLinks = userPermissionIds.map((permission_id) => ({
      profile_id: profileIds.USER,
      permission_id,
    }));

    if (adminLinks.length > 0) {
      await knex('profile_permissions').insert(adminLinks);
    }
    if (userLinks.length > 0) {
      await knex('profile_permissions').insert(userLinks);
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  const profileKeys = PROFILE_DEFINITIONS.map((d) => d.key);
  const profiles = await knex('profiles')
    .select('id')
    .whereIn('key', profileKeys)
    .whereNull('deleted_at');

  const profileIds = profiles.map((p) => p.id);

  if (profileIds.length > 0) {
    await knex('profile_permissions').whereIn('profile_id', profileIds).del();
  }

  await knex('profiles').whereIn('key', profileKeys).del();

  await knex.schema.alterTable('profiles', function (table) {
    table.dropUnique(['key', 'account_id']);
    table.dropColumn('key');
  });
}
