import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', function (table) {
    table.dropColumn('type');
    table.uuid('profile_id').nullable();
    table.foreign('profile_id').references('id').inTable('profiles');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', function (table) {
    table.dropForeign(['profile_id']);
    table.dropColumn('profile_id');
    table.string('type').nullable().defaultTo('USER');
  });
}
