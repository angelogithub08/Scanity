import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("notifications", function (table) {
    table.uuid("id").defaultTo(knex.fn.uuid()).unique().primary();

    table.string("key").notNullable();
    table.text("message").notNullable();
    table.text("data").nullable();

    table.uuid("account_id").notNullable();
    table.uuid("user_id").notNullable();
    table.timestamp("read_at").nullable();

    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
    table.timestamp("deleted_at").nullable();

    table.index(["account_id"]);
    table.index(["user_id"]);
    table.index(["read_at"]);

    table.foreign("account_id").references("id").inTable("accounts");
    table.foreign("user_id").references("id").inTable("users");
  });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("notifications");
}

