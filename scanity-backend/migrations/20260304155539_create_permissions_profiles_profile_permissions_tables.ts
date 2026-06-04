import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('permissions', function (table) {
    table.uuid('id').defaultTo(knex.fn.uuid()).unique().primary();
    table.string('name').notNullable();
    table.string('key_group').notNullable();
    table.string('key').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
    table.unique(['key_group', 'key']);
  });

  await knex.schema.createTable('profiles', function (table) {
    table.uuid('id').defaultTo(knex.fn.uuid()).unique().primary();
    table.string('name').notNullable();
    table.uuid('account_id').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();

    table.foreign('account_id').references('id').inTable('accounts');
  });

  await knex.schema.createTable('profile_permissions', function (table) {
    table.uuid('id').defaultTo(knex.fn.uuid()).unique().primary();
    table.uuid('profile_id').notNullable();
    table.uuid('permission_id').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();

    table.foreign('profile_id').references('id').inTable('profiles');
    table.foreign('permission_id').references('id').inTable('permissions');
    table.unique(['profile_id', 'permission_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('profile_permissions');
  await knex.schema.dropTableIfExists('profiles');
  await knex.schema.dropTableIfExists('permissions');
}

