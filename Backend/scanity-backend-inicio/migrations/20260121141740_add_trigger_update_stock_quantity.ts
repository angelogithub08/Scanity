import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Cria função que recalcula o current_quantity baseado nos stock_records
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_stock_current_quantity()
    RETURNS TRIGGER AS $$
    BEGIN
      -- Atualiza o stock do novo stock_id (ou atualizado)
      UPDATE stocks
      SET current_quantity = COALESCE(
        (
          SELECT SUM(quantity)
          FROM stock_records
          WHERE stock_id = NEW.stock_id
            AND deleted_at IS NULL
        ),
        0
      ),
      updated_at = NOW()
      WHERE id = NEW.stock_id;
      
      -- Se for UPDATE e o stock_id mudou, também atualiza o stock antigo
      IF TG_OP = 'UPDATE' AND OLD.stock_id IS DISTINCT FROM NEW.stock_id THEN
        UPDATE stocks
        SET current_quantity = COALESCE(
          (
            SELECT SUM(quantity)
            FROM stock_records
            WHERE stock_id = OLD.stock_id
              AND deleted_at IS NULL
          ),
          0
        ),
        updated_at = NOW()
        WHERE id = OLD.stock_id;
      END IF;
      
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Cria trigger que executa a função após INSERT em stock_records
  await knex.raw(`
    CREATE TRIGGER trigger_update_stock_quantity_on_insert
    AFTER INSERT ON stock_records
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_current_quantity();
  `);

  // Cria trigger que executa a função após UPDATE em stock_records
  await knex.raw(`
    CREATE TRIGGER trigger_update_stock_quantity_on_update
    AFTER UPDATE ON stock_records
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_current_quantity();
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Remove os triggers
  await knex.raw(`
    DROP TRIGGER IF EXISTS trigger_update_stock_quantity_on_insert ON stock_records;
  `);

  await knex.raw(`
    DROP TRIGGER IF EXISTS trigger_update_stock_quantity_on_update ON stock_records;
  `);

  // Remove a função
  await knex.raw(`
    DROP FUNCTION IF EXISTS update_stock_current_quantity();
  `);
}

