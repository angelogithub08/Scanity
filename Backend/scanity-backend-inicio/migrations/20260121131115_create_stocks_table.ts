import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('stocks', function (table) {
    table.uuid('id').defaultTo(knex.fn.uuid()).unique().primary();
    table.uuid('product_id').notNullable();
    table.integer('current_quantity').defaultTo(0).notNullable();
    table.integer('min_quantity').defaultTo(0).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();

    table.foreign('product_id').references('id').inTable('products');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('stocks');
}

