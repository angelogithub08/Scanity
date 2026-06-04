import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('inventory_counts', function (table) {
    table.uuid('id').defaultTo(knex.fn.uuid()).unique().primary();
    table.uuid('product_id').notNullable();
    table.decimal('counted_quantity', 10, 2).defaultTo(0);
    table.decimal('stock_quantity', 10, 2).defaultTo(0);
    table.string('status').notNullable();
    table.text('observation').nullable();
    table.uuid('user_id').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();

    table.foreign('product_id').references('id').inTable('products');
    table.foreign('user_id').references('id').inTable('users');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('inventory_counts');
}

