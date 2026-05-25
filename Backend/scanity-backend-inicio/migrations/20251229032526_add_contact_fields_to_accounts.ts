import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.table('accounts', function (table) {
    table.string('phone').nullable();
    table.string('document').nullable();
    table.string('zipcode').nullable();
    table.string('address_number').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.table('accounts', function (table) {
    table.dropColumn('phone');
    table.dropColumn('document');
    table.dropColumn('zipcode');
    table.dropColumn('address_number');
  });
}

