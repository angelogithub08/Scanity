import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('chat_history', function (table) {
    table.uuid('id').defaultTo(knex.fn.uuid()).unique().primary();
    table.uuid('user_id').notNullable();
    table.string('role', 20).notNullable();
    table.text('content').notNullable();
    table.uuid('account_id').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();

    table.foreign('user_id').references('id').inTable('users');
    table.foreign('account_id').references('id').inTable('accounts');
    table.index(['user_id', 'created_at'], 'idx_chat_history_user_created');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('chat_history');
}
