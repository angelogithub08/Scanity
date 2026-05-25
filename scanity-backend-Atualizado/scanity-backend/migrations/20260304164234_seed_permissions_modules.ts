import type { Knex } from 'knex';

const CRUD_MODULES = [
  'PRODUCTS',
  'CATEGORIES',
  'STOCK',
  'INVENTORY',
  'SUPLIERS',
  'CUSTOMERS',
  'PROFILES',
  'USERS',
] as const;

const CRUD_OPERATIONS = ['LIST', 'CREATE', 'UPDATE', 'DELETE'] as const;

const REPORT_KEYS = [
  'REPORT_PRODUCTS_IN_STOCK',
  'REPORT_STOCK_BELLOW_MINIMUM',
  'REPORT_STOCK_MOVEMENTS',
] as const;

const MODULE_NAMES: Record<string, string> = {
  PRODUCTS: 'Produtos',
  CATEGORIES: 'Categorias',
  STOCK: 'Estoque',
  INVENTORY: 'Inventário',
  SUPLIERS: 'Fornecedores',
  CUSTOMERS: 'Clientes',
  PROFILES: 'Perfis',
  USERS: 'Usuários',
};

const REPORT_NAMES: Record<string, string> = {
  REPORT_PRODUCTS_IN_STOCK: 'Relatório - Produtos em Estoque',
  REPORT_STOCK_BELLOW_MINIMUM: 'Relatório - Estoque Abaixo do Mínimo',
  REPORT_STOCK_MOVEMENTS: 'Relatório - Movimentações de Estoque',
};

export async function up(knex: Knex): Promise<void> {
  const permissions: Array<{ name: string; key_group: string; key: string }> =
    [];

  // CRUD: key_group = módulo, key = operação (LIST, CREATE, UPDATE, DELETE)
  for (const module of CRUD_MODULES) {
    const moduleLabel = MODULE_NAMES[module] ?? module;
    for (const op of CRUD_OPERATIONS) {
      const opLabel =
        op === 'LIST'
          ? 'Listar'
          : op === 'CREATE'
            ? 'Criar'
            : op === 'UPDATE'
              ? 'Editar'
              : 'Excluir';
      permissions.push({
        name: `${moduleLabel} - ${opLabel}`,
        key_group: module,
        key: module + '_' + op,
      });
    }
  }

  // REPORTS: key_group = key (cada tipo de relatório)
  for (const reportKey of REPORT_KEYS) {
    permissions.push({
      name: REPORT_NAMES[reportKey] ?? reportKey,
      key_group: reportKey,
      key: reportKey,
    });
  }

  await knex('permissions').insert(
    permissions.map((p) => ({
      name: p.name,
      key_group: p.key_group,
      key: p.key,
    })),
  );
}

export async function down(knex: Knex): Promise<void> {
  const keysToDelete: Array<{ key_group: string; key: string }> = [];

  for (const module of CRUD_MODULES) {
    for (const op of CRUD_OPERATIONS) {
      keysToDelete.push({ key_group: module, key: op });
    }
  }

  for (const reportKey of REPORT_KEYS) {
    keysToDelete.push({ key_group: reportKey, key: reportKey });
  }

  for (const { key_group, key } of keysToDelete) {
    await knex('permissions').where({ key_group, key }).del();
  }
}
