import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('supliers', function (table) {
    table.string('phone').nullable().alter();
    table.string('email').nullable().alter();
    table.string('responsible_name').nullable().alter();
  });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('supliers', function (table) {
    table.string('phone').notNullable().alter();
    table.string('email').notNullable().alter();
    table.string('responsible_name').notNullable().alter();
  });
}

