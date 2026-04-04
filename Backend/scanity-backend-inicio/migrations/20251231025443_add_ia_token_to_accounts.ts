import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('accounts', (table) => {
    table.text('ia_token').nullable().defaultTo(null).comment('AI token for account');
  });
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('accounts', (table) => {
    table.dropColumn('ia_token');
  });
}

