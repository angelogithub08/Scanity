import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  return knex.schema.table('accounts', function (table) {
    table.string('gateway_customer_id').nullable();
  });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.table('accounts', function (table) {
    table.dropColumn('gateway_customer_id');
  });
}

