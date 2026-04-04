import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Knex } from 'knex';
import { CreateCategoriesDto } from './dto/create-categories.dto';
import {
  ListCategoriesParamsDto,
  ListPaginatedCategoriesParamsDto,
} from './dto/params-categories.dto';
import { UpdateCategoriesDto } from './dto/update-categories.dto';
import { Category } from './entities/category.entity';
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
export class CategoriesRepository {
  private readonly logger = new Logger(CategoriesRepository.name);
  private readonly table = 'categories';
  private readonly defaultSelectFields = [
    'id',
    'name',
    'description',
    'created_at',
    'updated_at',
    'account_id',
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
    params: ListPaginatedCategoriesParamsDto,
  ): Promise<PaginatedResult<Category>> {
    const { page = 1, limit = 10, ...filters } = params;
    this.logger.debug(
      `Buscando categories paginados: página ${page}, limite ${limit}`,
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
        .orderBy('name', 'asc')
        .select(this.defaultSelectFields)
        .limit(limit)
        .offset(offset)) as Category[];

      // 3) calcula última página
      const last_page = limit > 0 ? Math.ceil(total / limit) : 1;

      this.logger.debug(
        `Encontrados ${total} categories, ${data.length} na página atual`,
      );
      return { data, total, page: +page, last_page: +last_page, limit: +limit };
    } catch (error) {
      this.logger.error(
        `Erro ao buscar categories paginados: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /** Listagem simples (sem paginação), só campos padrão */
  async list(filters: ListCategoriesParamsDto): Promise<Category[]> {
    this.logger.debug(
      `Listando todos os categories com filtros: ${JSON.stringify(filters)}`,
    );
    try {
      const results = (await this.defaultQuery(filters)
        .clone()
        .select(this.defaultSelectFields)) as Category[];

      this.logger.debug(`Encontrados ${results.length} categories`);
      return results;
    } catch (error) {
      this.logger.error(
        `Erro ao listar categories: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /** Busca individual, sem paginação */
  async findOne(id: string): Promise<Category> {
    this.logger.debug(`Buscando category com ID: ${id}`);
    try {
      const record = (await this.defaultQuery({ id })
        .clone()
        .select(this.defaultSelectFields)
        .first()) as Category;

      if (!record) {
        this.logger.warn(`category com ID ${id} não encontrado`);
        throw new NotFoundException(
          `${this.table} com ID ${id} não encontrado`,
        );
      }
      return record;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar category ${id}: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async create(data: CreateCategoriesDto): Promise<Category> {
    this.logger.debug(`Criando novo category: ${JSON.stringify(data)}`);
    try {
      const [inserted] = (await this.knex(this.table)
        .insert(data)
        .returning(this.defaultSelectFields)) as Category[];

      this.logger.debug(`category criado com ID: ${inserted.id}`);
      return inserted;
    } catch (error) {
      this.logger.error(
        `Erro ao criar category: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async update(id: string, data: UpdateCategoriesDto): Promise<Category> {
    this.logger.debug(`Atualizando category ID ${id}: ${JSON.stringify(data)}`);
    try {
      const count = await this.knex(this.table)
        .where({ id })
        .update({ ...data, updated_at: new Date() });

      if (count === 0) {
        this.logger.warn(
          `category com ID ${id} não encontrado para atualização`,
        );
        throw new NotFoundException(
          `${this.table} com ID ${id} não encontrado`,
        );
      }
      this.logger.debug(`category ${id} atualizado com sucesso`);
      return this.findOne(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erro ao atualizar category ${id}: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async remove(id: string): Promise<number> {
    this.logger.debug(`Removendo category com ID: ${id}`);
    try {
      const count = await this.knex(this.table)
        .where({ id })
        .update({ deleted_at: new Date(), updated_at: new Date() });

      if (count === 0) {
        this.logger.warn(`category com ID ${id} não encontrado para remoção`);
        throw new NotFoundException(
          `${this.table} com ID ${id} não encontrado`,
        );
      }
      this.logger.debug(`category ${id} removido com sucesso`);
      return count;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erro ao remover category ${id}: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
