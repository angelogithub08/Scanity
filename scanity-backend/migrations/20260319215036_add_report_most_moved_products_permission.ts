import type { Knex } from 'knex';

const REPORT_KEY = 'REPORT_MOST_MOVED_PRODUCTS';
const REPORT_NAME = 'Relatório - Produtos Mais Movimentados';

export async function up(knex: Knex): Promise<void> {
  await knex('permissions')
    .insert({
      name: REPORT_NAME,
      key_group: REPORT_KEY,
      key: REPORT_KEY,
    })
    .onConflict(['key_group', 'key'])
    .ignore();

  const permission = await knex<{ id: string }>('permissions')
    .select('id')
    .where('key_group', REPORT_KEY)
    .where('key', REPORT_KEY)
    .whereNull('deleted_at')
    .first();

  if (!permission) return;

  const profiles = await knex('profiles')
    .select('id')
    .whereIn('key', ['ADMIN', 'USER'])
    .whereNull('deleted_at');

  if (profiles.length === 0) return;

  const links = profiles.map((profile) => ({
    profile_id: profile.id,
    permission_id: permission.id,
  }));

  await knex('profile_permissions')
    .insert(links)
    .onConflict(['profile_id', 'permission_id'])
    .ignore();
}

export async function down(knex: Knex): Promise<void> {
  const permission = await knex<{ id: string }>('permissions')
    .select('id')
    .where('key_group', REPORT_KEY)
    .where('key', REPORT_KEY)
    .whereNull('deleted_at')
    .first();

  if (!permission) return;

  await knex('profile_permissions').where('permission_id', permission.id).del();
  await knex('permissions')
    .where({ key_group: REPORT_KEY, key: REPORT_KEY })
    .del();
}
