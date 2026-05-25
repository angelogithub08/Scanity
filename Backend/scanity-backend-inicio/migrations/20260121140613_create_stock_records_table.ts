import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('stock_records', function (table) {
    table.uuid('id').defaultTo(knex.fn.uuid()).unique().primary();
    table.uuid('stock_id').notNullable();
    table.integer('quantity').notNullable();
    table.string('type').notNullable();
    table.text('observation').nullable();
    table.uuid('user_id').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();

    table.foreign('stock_id').references('id').inTable('stocks');
    table
      .foreign('user_id')
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('stock_records');
}

