import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('tokens', function (table) {
    table.uuid('id').defaultTo(knex.fn.uuid()).unique().primary();
    table.string('type').notNullable().defaultTo('ACCESS_TOKEN');
    table.uuid('token').notNullable().defaultTo(knex.fn.uuid());
    table.uuid('account_id').notNullable();
    table.timestamp('revoked_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();

    table.foreign('account_id').references('id').inTable('accounts');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('tokens');
}
