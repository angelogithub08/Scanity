import type { Knex } from 'knex';

const MODULE_KEY = 'MOVEMENT_STAGES';
const MODULE_NAME = 'Etapas de Movimentação';

const CRUD_OPERATIONS = ['LIST', 'CREATE', 'UPDATE', 'DELETE'] as const;

const OPERATION_LABELS: Record<string, string> = {
  LIST: 'Listar',
  CREATE: 'Criar',
  UPDATE: 'Editar',
  DELETE: 'Excluir',
};

function buildMovementStagesPermissions(): Array<{
  name: string;
  key_group: string;
  key: string;
}> {
  const permissions: Array<{ name: string; key_group: string; key: string }> =
    [];
  for (const op of CRUD_OPERATIONS) {
    const opLabel = OPERATION_LABELS[op] ?? op;
    permissions.push({
      name: `${MODULE_NAME} - ${opLabel}`,
      key_group: MODULE_KEY,
      key: `${MODULE_KEY}_${op}`,
    });
  }
  return permissions;
}

export async function up(knex: Knex): Promise<void> {
  const permissions = buildMovementStagesPermissions();

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

  const movementStagesPermissionIds = await knex('permissions')
    .select('id')
    .where('key_group', MODULE_KEY)
    .whereNull('deleted_at')
    .then((rows: Array<{ id: string }>) => rows.map((r) => r.id));

  if (movementStagesPermissionIds.length === 0) return;

  const accounts = await knex('accounts').select('id').whereNull('deleted_at');

  for (const account of accounts) {
    const profiles = await knex('profiles')
      .select('id', 'key')
      .where('account_id', account.id)
      .whereIn('key', ['ADMIN', 'USER'])
      .whereNull('deleted_at');

    for (const profile of profiles) {
      const links = movementStagesPermissionIds.map(
        (permission_id: string) => ({
          profile_id: profile.id,
          permission_id,
        }),
      );
      if (links.length > 0) {
        await knex('profile_permissions')
          .insert(links)
          .onConflict(['profile_id', 'permission_id'])
          .ignore();
      }
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  const permissionIds = await knex('permissions')
    .select('id')
    .where('key_group', MODULE_KEY)
    .whereNull('deleted_at')
    .then((rows: Array<{ id: string }>) => rows.map((r) => r.id));

  if (permissionIds.length > 0) {
    await knex('profile_permissions')
      .whereIn('permission_id', permissionIds)
      .del();
  }

  await knex('permissions').where('key_group', MODULE_KEY).del();
}
