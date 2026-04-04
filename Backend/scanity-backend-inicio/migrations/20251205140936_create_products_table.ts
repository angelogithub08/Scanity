import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('products', function (table) {
    table.uuid('id').defaultTo(knex.fn.uuid()).unique().primary();
    table.string('name').notNullable();
    table.decimal('value', 10, 2).defaultTo(0);
    table.uuid('account_id').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();

    table.foreign('account_id').references('id').inTable('accounts');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('products');
}

