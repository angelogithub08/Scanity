import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Adicionar confirmed_at à tabela accounts
  await knex.schema.table('accounts', function (table) {
    table.timestamp('confirmed_at').nullable();
  });

  // Remover confirmed_at da tabela users
  await knex.schema.table('users', function (table) {
    table.dropColumn('confirmed_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  // Adicionar confirmed_at de volta à tabela users
  await knex.schema.table('users', function (table) {
    table.timestamp('confirmed_at').nullable();
  });

  // Remover confirmed_at da tabela accounts
  await knex.schema.table('accounts', function (table) {
    table.dropColumn('confirmed_at');
  });
}

