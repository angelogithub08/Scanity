import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Knex } from 'knex';
import { CreateInventoryCountsDto } from './dto/create-inventory-counts.dto';
import {
  ListInventoryCountsParamsDto,
  ListPaginatedInventoryCountsParamsDto,
} from './dto/params-inventory-counts.dto';
import { UpdateInventoryCountsDto } from './dto/update-inventory-counts.dto';
import { InventoryCount } from './entities/inventory-count.entity';
import { KNEX_CONNECTION } from '../../infra/database/database.providers';
import { applyDefaultQuery } from 'src/utils/db.util';

export interface ListParams {
  page?: number;
  limit?: number;
  [key: string]: any; // demais filtros
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  last_page: number;
  limit: number;
}

export interface CountResult {
  count: number;
}

@Injectable()
export class InventoryCountsRepository {
  private readonly logger = new Logger(InventoryCountsRepository.name);
  private readonly table = 'inventory_counts';
  private readonly defaultSelectFields = [
    'inventory_counts.id',
    'inventory_counts.product_id',
    'inventory_counts.counted_quantity',
    'inventory_counts.stock_quantity',
    'inventory_counts.status',
    'inventory_counts.observation',
    'inventory_counts.user_id',
    'inventory_counts.created_at',
    'inventory_counts.updated_at',
  ];

  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  /**
   * Constrói o query builder aplicando filtros recebidos.
   * Não aplica paginação nem seleção de colunas.
   */
  private defaultQuery(filters: Record<string, any> = {}) {
    this.logger.debug(
      `Construindo query com filtros: ${JSON.stringify(filters)}`,
    );
    return this.knex(this.table).modify((qb) => {
      applyDefaultQuery(qb, this.table, filters);
    });
  }

  /**
   * Busca paginada e filtrada usando defaultQuery.
   */
  async findAll(
    params: ListPaginatedInventoryCountsParamsDto,
  ): Promise<PaginatedResult<InventoryCount>> {
    const { page = 1, limit = 10, ...filters } = params;
    this.logger.debug(
      `Buscando inventory-counts paginados: página ${page}, limite ${limit}`,
    );

    try {
      // 1) total de registros (mesmos filtros)
      const result = (await this.defaultQuery(filters)
        .clone()
        .count('* as count')
        .first()) as CountResult;

      const total = Number(result?.count || 0);

      // 2) lista de dados (mesmos filtros + paginação + seleção de campos)
      const offset = (page - 1) * limit;
      const data = (await this.defaultQuery(filters)
        .clone()
        .select([
          ...this.defaultSelectFields,
          'products.name as product_name',
          'users.name as user_name',
        ])
        .leftJoin('products', 'inventory_counts.product_id', 'products.id')
        .leftJoin('users', 'inventory_counts.user_id', 'users.id')
        .limit(limit)
        .offset(offset)) as InventoryCount[];

      // 3) calcula última página
      const last_page = limit > 0 ? Math.ceil(total / limit) : 1;

      this.logger.debug(
        `Encontrados ${total} inventory-counts, ${data.length} na página atual`,
      );
      return { data, total, page: +page, last_page: +last_page, limit: +limit };
    } catch (error) {
      this.logger.error(
        `Erro ao buscar inventory-counts paginados: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /** Listagem simples (sem paginação), só campos padrão */
  async list(filters: ListInventoryCountsParamsDto): Promise<InventoryCount[]> {
    this.logger.debug(
      `Listando todos os inventory-counts com filtros: ${JSON.stringify(filters)}`,
    );
    try {
      const results = (await this.defaultQuery(filters)
        .clone()
        .select(this.defaultSelectFields)) as InventoryCount[];

      this.logger.debug(`Encontrados ${results.length} inventory-counts`);
      return results;
    } catch (error) {
      this.logger.error(
        `Erro ao listar inventory-counts: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /** Busca individual, sem paginação */
  async findOne(id: string): Promise<InventoryCount> {
    this.logger.debug(`Buscando inventory-count com ID: ${id}`);
    try {
      const record = (await this.defaultQuery({ id })
        .clone()
        .select(this.defaultSelectFields)
        .first()) as InventoryCount;

      if (!record) {
        this.logger.warn(`inventory-count com ID ${id} não encontrado`);
        throw new NotFoundException(
          `${this.table} com ID ${id} não encontrado`,
        );
      }
      return record;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar inventory-count ${id}: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async create(data: CreateInventoryCountsDto): Promise<InventoryCount> {
    this.logger.debug(`Criando novo inventory-count: ${JSON.stringify(data)}`);
    try {
      const [inserted] = (await this.knex(this.table)
        .insert(data)
        .returning(this.defaultSelectFields)) as InventoryCount[];

      this.logger.debug(`inventory-count criado com ID: ${inserted.id}`);
      return inserted;
    } catch (error) {
      this.logger.error(
        `Erro ao criar inventory-count: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async update(
    id: string,
    data: UpdateInventoryCountsDto,
  ): Promise<InventoryCount> {
    this.logger.debug(
      `Atualizando inventory-count ID ${id}: ${JSON.stringify(data)}`,
    );
    try {
      const count = await this.knex(this.table)
        .where({ id })
        .update({ ...data, updated_at: new Date() });

      if (count === 0) {
        this.logger.warn(
          `inventory-count com ID ${id} não encontrado para atualização`,
        );
        throw new NotFoundException(
          `${this.table} com ID ${id} não encontrado`,
        );
      }
      this.logger.debug(`inventory-count ${id} atualizado com sucesso`);
      return this.findOne(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erro ao atualizar inventory-count ${id}: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async remove(id: string): Promise<number> {
    this.logger.debug(`Removendo inventory-count com ID: ${id}`);
    try {
      const count = await this.knex(this.table)
        .where({ id })
        .update({ deleted_at: new Date(), updated_at: new Date() });

      if (count === 0) {
        this.logger.warn(
          `inventory-count com ID ${id} não encontrado para remoção`,
        );
        throw new NotFoundException(
          `${this.table} com ID ${id} não encontrado`,
        );
      }
      this.logger.debug(`inventory-count ${id} removido com sucesso`);
      return count;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erro ao remover inventory-count ${id}: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
