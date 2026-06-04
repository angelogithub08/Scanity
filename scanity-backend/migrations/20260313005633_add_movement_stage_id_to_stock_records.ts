import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.table('stock_records', function (table) {
    table.uuid('movement_stage_id').nullable();
    table.foreign('movement_stage_id').references('id').inTable('movement_stages');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.table('stock_records', function (table) {
    table.dropForeign('movement_stage_id');
    table.dropColumn('movement_stage_id');
  });
}

