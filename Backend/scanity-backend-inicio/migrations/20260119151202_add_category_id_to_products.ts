import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.table('products', function (table) {
    table.uuid('category_id').nullable();
    table.foreign('category_id').references('id').inTable('categories');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.table('products', function (table) {
    table.dropForeign('category_id');
    table.dropColumn('category_id');
  });
}

