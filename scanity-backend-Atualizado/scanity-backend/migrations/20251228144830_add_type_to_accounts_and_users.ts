import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Adicionar campo type à tabela accounts
  await knex.schema.table('accounts', function (table) {
    table.string('type').nullable().defaultTo('USER');
  });

  // Adicionar campo type à tabela users
  await knex.schema.table('users', function (table) {
    table.string('type').nullable().defaultTo('USER');
  });
}

export async function down(knex: Knex): Promise<void> {
  // Remover campo type da tabela accounts
  await knex.schema.table('accounts', function (table) {
    table.dropColumn('type');
  });

  // Remover campo type da tabela users
  await knex.schema.table('users', function (table) {
    table.dropColumn('type');
  });
}

