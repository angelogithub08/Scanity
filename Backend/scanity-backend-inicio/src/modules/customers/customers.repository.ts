import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Knex } from 'knex';
import { CreateCustomersDto } from './dto/create-customers.dto';
import {
  ListCustomersParamsDto,
  ListPaginatedCustomersParamsDto,
} from './dto/params-customers.dto';
import { UpdateCustomersDto } from './dto/update-customers.dto';
import { Customer } from './entities/customer.entity';
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
export class CustomersRepository {
  private readonly logger = new Logger(CustomersRepository.name);
  private readonly table = 'customers';
  private readonly defaultSelectFields = [
    `${this.table}.id`,
    `${this.table}.name`,
    `${this.table}.document`,
    `${this.table}.phone`,
    `${this.table}.email`,
    `${this.table}.street`,
    `${this.table}.number`,
    `${this.table}.city`,
    `${this.table}.state`,
    `${this.table}.neighborhood`,
    `${this.table}.zipcode`,
    `${this.table}.complement`,
    `${this.table}.account_id`,
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
    params: ListPaginatedCustomersParamsDto,
  ): Promise<PaginatedResult<Customer>> {
    const { page = 1, limit = 10, ...filters } = params;
    this.logger.debug(
      `Buscando customers paginados: página ${page}, limite ${limit}`,
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
        .orderBy(`${this.table}.name`, 'asc')
        .select([...this.defaultSelectFields])
        .limit(limit)
        .offset(offset)) as Customer[];

      // 3) calcula última página
      const last_page = limit > 0 ? Math.ceil(total / limit) : 1;

      this.logger.debug(
        `Encontrados ${total} customers, ${data.length} na página atual`,
      );
      return { data, total, page: +page, last_page: +last_page, limit: +limit };
    } catch (error) {
      this.logger.error(
        `Erro ao buscar customers paginados: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /** Listagem simples (sem paginação), só campos padrão */
  async list(filters: ListCustomersParamsDto): Promise<Customer[]> {
    this.logger.debug(
      `Listando todos os customers com filtros: ${JSON.stringify(filters)}`,
    );
    try {
      const results = (await this.defaultQuery(filters)
        .clone()
        .orderBy(`${this.table}.name`, 'asc')
        .select([...this.defaultSelectFields])) as Customer[];

      this.logger.debug(`Encontrados ${results.length} customers`);
      return results;
    } catch (error) {
      this.logger.error(
        `Erro ao listar customers: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /** Busca individual, sem paginação */
  async findOne(id: string): Promise<Customer> {
    this.logger.debug(`Buscando customer com ID: ${id}`);
    try {
      const record = (await this.defaultQuery({ id })
        .clone()
        .select([...this.defaultSelectFields])
        .first()) as Customer;

      if (!record) {
        this.logger.warn(`customer com ID ${id} não encontrado`);
        throw new NotFoundException(
          `${this.table} com ID ${id} não encontrado`,
        );
      }
      return record;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar customer ${id}: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async create(data: CreateCustomersDto): Promise<Customer> {
    this.logger.debug(`Criando novo customer: ${JSON.stringify(data)}`);
    try {
      const [inserted] = (await this.knex(this.table)
        .insert(data)
        .returning(this.defaultSelectFields)) as Customer[];

      this.logger.debug(`customer criado com ID: ${inserted.id}`);
      return inserted;
    } catch (error) {
      this.logger.error(
        `Erro ao criar customer: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async update(id: string, data: UpdateCustomersDto): Promise<Customer> {
    this.logger.debug(`Atualizando customer ID ${id}: ${JSON.stringify(data)}`);
    try {
      const count = await this.knex(this.table)
        .where({ id })
        .update({ ...data, updated_at: new Date() });

      if (count === 0) {
        this.logger.warn(
          `customer com ID ${id} não encontrado para atualização`,
        );
        throw new NotFoundException(
          `${this.table} com ID ${id} não encontrado`,
        );
      }
      this.logger.debug(`customer ${id} atualizado com sucesso`);
      return this.findOne(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erro ao atualizar customer ${id}: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async remove(id: string): Promise<number> {
    this.logger.debug(`Removendo customer com ID: ${id}`);
    try {
      const count = await this.knex(this.table)
        .where({ id })
        .update({ deleted_at: new Date(), updated_at: new Date() });

      if (count === 0) {
        this.logger.warn(`customer com ID ${id} não encontrado para remoção`);
        throw new NotFoundException(
          `${this.table} com ID ${id} não encontrado`,
        );
      }
      this.logger.debug(`customer ${id} removido com sucesso`);
      return count;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erro ao remover customer ${id}: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
