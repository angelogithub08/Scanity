import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Knex } from 'knex';
import { CreateStockRecordsDto } from './dto/create-stock-records.dto';
import {
  ListStockRecordsParamsDto,
  ListPaginatedStockRecordsParamsDto,
} from './dto/params-stock-records.dto';
import { UpdateStockRecordsDto } from './dto/update-stock-records.dto';
import { StockRecord } from './entities/stock-record.entity';
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
export class StockRecordsRepository {
  private readonly logger = new Logger(StockRecordsRepository.name);
  private readonly table = 'stock_records';
  private readonly defaultSelectFields = [
    `${this.table}.id`,
    `${this.table}.stock_id`,
    `${this.table}.quantity`,
    `${this.table}.type`,
    `${this.table}.observation`,
    `${this.table}.user_id`,
    `${this.table}.created_at`,
    `${this.table}.updated_at`,
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
    params: ListPaginatedStockRecordsParamsDto,
  ): Promise<PaginatedResult<StockRecord>> {
    const { page = 1, limit = 10, ...filters } = params;
    this.logger.debug(
      `Buscando stock-records paginados: página ${page}, limite ${limit}`,
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
        .orderBy('stock_records.created_at', 'desc')
        .select([...this.defaultSelectFields])
        .limit(limit)
        .offset(offset)) as StockRecord[];

      // 3) calcula última página
      const last_page = limit > 0 ? Math.ceil(total / limit) : 1;

      this.logger.debug(
        `Encontrados ${total} stock-records, ${data.length} na página atual`,
      );
      return { data, total, page: +page, last_page: +last_page, limit: +limit };
    } catch (error) {
      this.logger.error(
        `Erro ao buscar stock-records paginados: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /** Listagem simples (sem paginação), só campos padrão */
  async list(filters: ListStockRecordsParamsDto): Promise<StockRecord[]> {
    this.logger.debug(
      `Listando todos os stock-records com filtros: ${JSON.stringify(filters)}`,
    );
    try {
      const results = (await this.defaultQuery(filters)
        .clone()
        .select([...this.defaultSelectFields])) as StockRecord[];

      this.logger.debug(`Encontrados ${results.length} stock-records`);
      return results;
    } catch (error) {
      this.logger.error(
        `Erro ao listar stock-records: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /** Busca individual, sem paginação */
  async findOne(id: string): Promise<StockRecord> {
    this.logger.debug(`Buscando stock-record com ID: ${id}`);
    try {
      const record = (await this.defaultQuery({ id })
        .clone()
        .select([...this.defaultSelectFields])
        .first()) as StockRecord;

      if (!record) {
        this.logger.warn(`stock-record com ID ${id} não encontrado`);
        throw new NotFoundException(
          `${this.table} com ID ${id} não encontrado`,
        );
      }
      return record;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar stock-record ${id}: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async create(data: CreateStockRecordsDto): Promise<StockRecord> {
    this.logger.debug(`Criando novo stock-record: ${JSON.stringify(data)}`);
    try {
      const [inserted] = (await this.knex(this.table)
        .insert(data)
        .returning(this.defaultSelectFields)) as StockRecord[];

      this.logger.debug(`stock-record criado com ID: ${inserted.id}`);
      return inserted;
    } catch (error) {
      this.logger.error(
        `Erro ao criar stock-record: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async update(id: string, data: UpdateStockRecordsDto): Promise<StockRecord> {
    this.logger.debug(
      `Atualizando stock-record ID ${id}: ${JSON.stringify(data)}`,
    );
    try {
      const count = await this.knex(this.table)
        .where({ id })
        .update({ ...data, updated_at: new Date() });

      if (count === 0) {
        this.logger.warn(
          `stock-record com ID ${id} não encontrado para atualização`,
        );
        throw new NotFoundException(
          `${this.table} com ID ${id} não encontrado`,
        );
      }
      this.logger.debug(`stock-record ${id} atualizado com sucesso`);
      return this.findOne(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erro ao atualizar stock-record ${id}: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async remove(id: string): Promise<number> {
    this.logger.debug(`Removendo stock-record com ID: ${id}`);
    try {
      const count = await this.knex(this.table)
        .where({ id })
        .update({ deleted_at: new Date(), updated_at: new Date() });

      if (count === 0) {
        this.logger.warn(
          `stock-record com ID ${id} não encontrado para remoção`,
        );
        throw new NotFoundException(
          `${this.table} com ID ${id} não encontrado`,
        );
      }
      this.logger.debug(`stock-record ${id} removido com sucesso`);
      return count;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erro ao remover stock-record ${id}: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
