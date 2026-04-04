import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Knex } from 'knex';
import { CreateProductsDto } from './dto/create-products.dto';
import {
  ListProductsParamsDto,
  ListPaginatedProductsParamsDto,
} from './dto/params-products.dto';
import { UpdateProductsDto } from './dto/update-products.dto';
import { Product } from './entities/product.entity';
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
export class ProductsRepository {
  private readonly logger = new Logger(ProductsRepository.name);
  private readonly table = 'products';
  private readonly defaultSelectFields = [
    'products.id',
    'products.name',
    'products.value',
    'products.description',
    'products.barcode',
    'products.category_id',
    'products.account_id',
    'products.thumbnail_path',
    'products.created_at',
    'products.updated_at',
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
    params: ListPaginatedProductsParamsDto,
  ): Promise<PaginatedResult<Product>> {
    const { page = 1, limit = 10, ...filters } = params;
    this.logger.debug(
      `Buscando products paginados: página ${page}, limite ${limit}`,
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
        .select([
          ...this.defaultSelectFields,
          'categories.name as category_name',
        ])
        .leftJoin('categories', 'products.category_id', 'categories.id')
        .limit(limit)
        .offset(offset)) as Product[];

      // 3) calcula última página
      const last_page = limit > 0 ? Math.ceil(total / limit) : 1;

      this.logger.debug(
        `Encontrados ${total} products, ${data.length} na página atual`,
      );
      return { data, total, page: +page, last_page: +last_page, limit: +limit };
    } catch (error) {
      this.logger.error(
        `Erro ao buscar products paginados: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /** Listagem simples (sem paginação), só campos padrão */
  async list(filters: ListProductsParamsDto): Promise<Product[]> {
    this.logger.debug(
      `Listando todos os products com filtros: ${JSON.stringify(filters)}`,
    );
    try {
      const results = (await this.defaultQuery(filters)
        .clone()
        .select(this.defaultSelectFields)) as Product[];

      this.logger.debug(`Encontrados ${results.length} products`);
      return results;
    } catch (error) {
      this.logger.error(
        `Erro ao listar products: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Busca produto por código de barras de forma estrita (igualdade exata).
   * Considera apenas registros não deletados e da conta informada.
   */
  async findOneByBarcode(
    accountId: string,
    barcode: string,
  ): Promise<Product | null> {
    this.logger.debug(
      `Buscando product por barcode estrito: accountId=${accountId}, barcode=${barcode}`,
    );
    try {
      const record = (await this.knex(this.table)
        .whereNull('deleted_at')
        .where({ account_id: accountId, barcode: barcode.trim() })
        .select(this.defaultSelectFields)
        .first()) as Product | undefined;

      return record ?? null;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar product por barcode: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /** Busca individual, sem paginação */
  async findOne(id: string): Promise<Product> {
    this.logger.debug(`Buscando product com ID: ${id}`);
    try {
      const record = (await this.defaultQuery({ id })
        .clone()
        .select(this.defaultSelectFields)
        .first()) as Product;

      if (!record) {
        this.logger.warn(`product com ID ${id} não encontrado`);
        throw new NotFoundException(
          `${this.table} com ID ${id} não encontrado`,
        );
      }
      return record;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar product ${id}: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async create(data: CreateProductsDto): Promise<Product> {
    this.logger.debug(`Criando novo product: ${JSON.stringify(data)}`);
    try {
      const [inserted] = (await this.knex(this.table)
        .insert(data)
        .returning(this.defaultSelectFields)) as Product[];

      this.logger.debug(`product criado com ID: ${inserted.id}`);
      return inserted;
    } catch (error) {
      this.logger.error(
        `Erro ao criar product: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async update(id: string, data: UpdateProductsDto): Promise<Product> {
    this.logger.debug(`Atualizando product ID ${id}: ${JSON.stringify(data)}`);
    try {
      const count = await this.knex(this.table)
        .where({ id })
        .update({ ...data, updated_at: new Date() });

      if (count === 0) {
        this.logger.warn(
          `product com ID ${id} não encontrado para atualização`,
        );
        throw new NotFoundException(
          `${this.table} com ID ${id} não encontrado`,
        );
      }
      this.logger.debug(`product ${id} atualizado com sucesso`);
      return this.findOne(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erro ao atualizar product ${id}: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async remove(id: string): Promise<number> {
    this.logger.debug(`Removendo product com ID: ${id}`);
    try {
      const count = await this.knex(this.table)
        .where({ id })
        .update({ deleted_at: new Date(), updated_at: new Date() });

      if (count === 0) {
        this.logger.warn(`product com ID ${id} não encontrado para remoção`);
        throw new NotFoundException(
          `${this.table} com ID ${id} não encontrado`,
        );
      }
      this.logger.debug(`product ${id} removido com sucesso`);
      return count;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erro ao remover product ${id}: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
