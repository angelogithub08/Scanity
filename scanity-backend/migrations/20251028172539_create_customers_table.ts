import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('customers', function (table) {
    table.uuid('id').defaultTo(knex.fn.uuid()).unique().primary();
    table.string('name').notNullable();
    table.string('document').nullable();
    table.string('phone').nullable();
    table.string('email').nullable();
    table.string('street').nullable();
    table.string('number').nullable();
    table.string('city').nullable();
    table.string('state').nullable();
    table.string('neighborhood').nullable();
    table.string('zipcode').nullable();
    table.string('complement').nullable();
    table.uuid('account_id').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();

    table.foreign('account_id').references('id').inTable('accounts');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('customers');
}
