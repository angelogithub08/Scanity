import type { Knex } from 'knex';

const CRUD_MODULES = [
  'PRODUCTS',
  'CATEGORIES',
  'STOCK',
  'INVENTORY',
  'SUPLIERS',
  'CUSTOMERS',
  'USERS',
  'PROFILES',
] as const;

const CRUD_OPERATIONS = ['LIST', 'CREATE', 'UPDATE', 'DELETE'] as const;

const REPORT_KEYS = [
  'REPORT_PRODUCTS_IN_STOCK',
  'REPORT_STOCK_BELLOW_MINIMUM',
  'REPORT_STOCK_MOVEMENTS',
] as const;

const MODULE_NAMES: Record<string, string> = {
  PRODUCTS: 'Produtos',
  CATEGORIES: 'Categorias',
  STOCK: 'Estoque',
  INVENTORY: 'Inventário',
  SUPLIERS: 'Fornecedores',
  CUSTOMERS: 'Clientes',
  PROFILES: 'Perfis',
  USERS: 'Usuários',
};

const REPORT_NAMES: Record<string, string> = {
  REPORT_PRODUCTS_IN_STOCK: 'Relatório - Produtos em Estoque',
  REPORT_STOCK_BELLOW_MINIMUM: 'Relatório - Estoque Abaixo do Mínimo',
  REPORT_STOCK_MOVEMENTS: 'Relatório - Movimentações de Estoque',
};

const PROFILE_DEFINITIONS = [
  { key: 'ADMIN', name: 'Administrador' },
  { key: 'USER', name: 'Usuário' },
] as const;

// Módulos que o perfil USER não tem acesso
const USER_EXCLUDED_MODULES = ['USERS', 'PROFILES'];

function buildPermissions(): Array<{ name: string; key_group: string; key: string }> {
  const permissions: Array<{ name: string; key_group: string; key: string }> = [];

  for (const module of CRUD_MODULES) {
    const moduleLabel = MODULE_NAMES[module] ?? module;
    for (const op of CRUD_OPERATIONS) {
      const opLabel =
        op === 'LIST'
          ? 'Listar'
          : op === 'CREATE'
            ? 'Criar'
            : op === 'UPDATE'
              ? 'Editar'
              : 'Excluir';
      permissions.push({
        name: `${moduleLabel} - ${opLabel}`,
        key_group: module,
        key: `${module}_${op}`,
      });
    }
  }

  for (const reportKey of REPORT_KEYS) {
    permissions.push({
      name: REPORT_NAMES[reportKey] ?? reportKey,
      key_group: reportKey,
      key: reportKey,
    });
  }

  return permissions;
}

export async function up(knex: Knex): Promise<void> {
  const permissions = buildPermissions();

  // 1. Garantir que as permissões existam (merge: ON CONFLICT DO NOTHING)
  for (const p of permissions) {
    await knex('permissions')
      .insert({
        name: p.name,
        key_group: p.key_group,
        key: p.key,
      })
      .onConflict(['key_group', 'key'])
      .ignore();
  }

  const accounts = await knex('accounts')
    .select('id')
    .whereNull('deleted_at');

  for (const account of accounts) {
    const accountId = account.id;

    // 2. Garantir que os perfis ADMIN e USER existam por conta (merge: ON CONFLICT DO UPDATE)
    for (const def of PROFILE_DEFINITIONS) {
      await knex.raw(
        `
        INSERT INTO profiles (id, name, key, account_id, created_at, updated_at)
        VALUES (gen_random_uuid(), ?, ?, ?, NOW(), NOW())
        ON CONFLICT (key, account_id) DO UPDATE SET
          name = EXCLUDED.name,
          updated_at = NOW()
        `,
        [def.name, def.key, accountId],
      );
    }

    const profiles = await knex('profiles')
      .select('id', 'key')
      .where('account_id', accountId)
      .whereIn('key', ['ADMIN', 'USER'])
      .whereNull('deleted_at');

    const profileById = Object.fromEntries(
      profiles.map((p: { id: string; key: string }) => [p.key, p.id]),
    );
    const adminProfileId = profileById.ADMIN;
    const userProfileId = profileById.USER;

    if (!adminProfileId || !userProfileId) continue;

    const allPermissions = await knex('permissions')
      .select('id', 'key_group', 'key')
      .whereNull('deleted_at');

    const adminPermissionIds = allPermissions.map((p: { id: string }) => p.id);

    const userPermissionIds = allPermissions
      .filter(
        (p: { key_group: string }) => !USER_EXCLUDED_MODULES.includes(p.key_group),
      )
      .map((p: { id: string }) => p.id);

    const adminLinks = adminPermissionIds.map((permission_id: string) => ({
      profile_id: adminProfileId,
      permission_id,
    }));
    const userLinks = userPermissionIds.map((permission_id: string) => ({
      profile_id: userProfileId,
      permission_id,
    }));

    if (adminLinks.length > 0) {
      await knex('profile_permissions')
        .insert(adminLinks)
        .onConflict(['profile_id', 'permission_id'])
        .ignore();
    }
    if (userLinks.length > 0) {
      await knex('profile_permissions')
        .insert(userLinks)
        .onConflict(['profile_id', 'permission_id'])
        .ignore();
    }
  }

  // 3. Atribuir profile_id ADMIN aos usuários que não possuem profile_id
  const adminProfilesByAccount = await knex('profiles')
    .select('id', 'account_id')
    .where('key', 'ADMIN')
    .whereNull('deleted_at');

  for (const profile of adminProfilesByAccount) {
    await knex('users')
      .where('account_id', profile.account_id)
      .whereNull('profile_id')
      .whereNull('deleted_at')
      .update({ profile_id: profile.id, updated_at: knex.fn.now() });
  }
}

export async function down(knex: Knex): Promise<void> {
  const adminProfileIds = await knex('profiles')
    .select('id')
    .where('key', 'ADMIN')
    .whereNull('deleted_at')
    .then((rows: Array<{ id: string }>) => rows.map((r) => r.id));

  if (adminProfileIds.length > 0) {
    await knex('users')
      .whereIn('profile_id', adminProfileIds)
      .update({ profile_id: null, updated_at: knex.fn.now() });
  }
}
