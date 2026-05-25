import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Knex } from 'knex';
import { CreateStocksDto } from './dto/create-stocks.dto';
import {
  ListStocksParamsDto,
  ListPaginatedStocksParamsDto,
} from './dto/params-stocks.dto';
import { UpdateStocksDto } from './dto/update-stocks.dto';
import { Stock } from './entities/stock.entity';
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
export class StocksRepository {
  private readonly logger = new Logger(StocksRepository.name);
  private readonly table = 'stocks';
  private readonly defaultSelectFields = [
    'stocks.id as id',
    'stocks.product_id as product_id',
    'stocks.current_quantity as current_quantity',
    'stocks.min_quantity as min_quantity',
    'stocks.created_at as created_at',
    'stocks.updated_at as updated_at',
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
    params: ListPaginatedStocksParamsDto,
  ): Promise<PaginatedResult<Stock>> {
    const { account_id, page = 1, limit = 10, ...filters } = params;
    this.logger.debug(
      `Buscando stocks paginados: página ${page}, limite ${limit}`,
    );

    try {
      // 1) total de registros (mesmos filtros)
      const result = (await this.defaultQuery(filters)
        .clone()
        .leftJoin('products', 'stocks.product_id', 'products.id')
        .where('products.account_id', account_id)
        .count('* as count')
        .first()) as CountResult;

      const total = Number(result?.count || 0);

      // 2) lista de dados (mesmos filtros + paginação + seleção de campos)
      const offset = (page - 1) * limit;
      const data = (await this.defaultQuery(filters)
        .clone()
        .leftJoin('products', 'stocks.product_id', 'products.id')
        .where('products.account_id', account_id)
        .select([
          ...this.defaultSelectFields,
          'products.name as product_name',
          'products.barcode as product_barcode',
          'products.thumbnail_path as product_thumbnail_path',
        ])
        .limit(limit)
        .offset(offset)) as Stock[];

      // 3) calcula última página
      const last_page = limit > 0 ? Math.ceil(total / limit) : 1;

      this.logger.debug(
        `Encontrados ${total} stocks, ${data.length} na página atual`,
      );
      return { data, total, page: +page, last_page: +last_page, limit: +limit };
    } catch (error) {
      this.logger.error(
        `Erro ao buscar stocks paginados: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /** Listagem simples (sem paginação), só campos padrão */
  async list(params: ListStocksParamsDto): Promise<Stock[]> {
    const { account_id, ...filters } = params;
    this.logger.debug(
      `Listando todos os stocks com filtros: ${JSON.stringify(filters)}`,
    );
    try {
      const results = (await this.defaultQuery(filters)
        .clone()
        .leftJoin('products', 'stocks.product_id', 'products.id')
        .where('products.account_id', account_id)
        .select([
          ...this.defaultSelectFields,
          'products.name as product_name',
          'products.barcode as product_barcode',
        ])) as Stock[];

      this.logger.debug(`Encontrados ${results.length} stocks`);
      return results;
    } catch (error) {
      this.logger.error(
        `Erro ao listar stocks: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /** Busca individual, sem paginação */
  async findOne(id: string): Promise<Stock> {
    this.logger.debug(`Buscando stock com ID: ${id}`);
    try {
      const record = (await this.defaultQuery({ id })
        .clone()
        .select(this.defaultSelectFields)
        .first()) as Stock;

      if (!record) {
        this.logger.warn(`stock com ID ${id} não encontrado`);
        throw new NotFoundException(
          `${this.table} com ID ${id} não encontrado`,
        );
      }
      return record;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar stock ${id}: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async create(data: CreateStocksDto): Promise<Stock> {
    this.logger.debug(`Criando novo stock: ${JSON.stringify(data)}`);
    try {
      const [inserted] = (await this.knex(this.table)
        .insert(data)
        .returning(this.defaultSelectFields)) as Stock[];

      this.logger.debug(`stock criado com ID: ${inserted.id}`);
      return inserted;
    } catch (error) {
      this.logger.error(
        `Erro ao criar stock: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async update(id: string, data: UpdateStocksDto): Promise<Stock> {
    this.logger.debug(`Atualizando stock ID ${id}: ${JSON.stringify(data)}`);
    try {
      const count = await this.knex(this.table)
        .where({ id })
        .update({ ...data, updated_at: new Date() });

      if (count === 0) {
        this.logger.warn(`stock com ID ${id} não encontrado para atualização`);
        throw new NotFoundException(
          `${this.table} com ID ${id} não encontrado`,
        );
      }
      this.logger.debug(`stock ${id} atualizado com sucesso`);
      return this.findOne(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erro ao atualizar stock ${id}: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async remove(id: string): Promise<number> {
    this.logger.debug(`Removendo stock com ID: ${id}`);
    try {
      const count = await this.knex(this.table)
        .where({ id })
        .update({ deleted_at: new Date(), updated_at: new Date() });

      if (count === 0) {
        this.logger.warn(`stock com ID ${id} não encontrado para remoção`);
        throw new NotFoundException(
          `${this.table} com ID ${id} não encontrado`,
        );
      }
      this.logger.debug(`stock ${id} removido com sucesso`);
      return count;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erro ao remover stock ${id}: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
