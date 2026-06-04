import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Knex } from 'knex';
import { CreateMovementStagesDto } from './dto/create-movement-stages.dto';
import {
  ListMovementStagesParamsDto,
  ListPaginatedMovementStagesParamsDto,
} from './dto/params-movement-stages.dto';
import { UpdateMovementStagesDto } from './dto/update-movement-stages.dto';
import { MovementStage } from './entities/movement-stage.entity';
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
export class MovementStagesRepository {
  private readonly logger = new Logger(MovementStagesRepository.name);
  private readonly table = 'movement_stages';
  private readonly defaultSelectFields = [
    'id',
    'name',
    'account_id',
    'created_at',
    'updated_at',
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
    params: ListPaginatedMovementStagesParamsDto,
  ): Promise<PaginatedResult<MovementStage>> {
    const { page = 1, limit = 10, ...filters } = params;
    this.logger.debug(
      `Buscando movement-stages paginados: página ${page}, limite ${limit}`,
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
        .offset(offset)) as MovementStage[];

      // 3) calcula última página
      const last_page = limit > 0 ? Math.ceil(total / limit) : 1;

      this.logger.debug(
        `Encontrados ${total} movement-stages, ${data.length} na página atual`,
      );
      return { data, total, page: +page, last_page: +last_page, limit: +limit };
    } catch (error) {
      this.logger.error(
        `Erro ao buscar movement-stages paginados: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /** Listagem simples (sem paginação), só campos padrão */
  async list(filters: ListMovementStagesParamsDto): Promise<MovementStage[]> {
    this.logger.debug(
      `Listando todos os movement-stages com filtros: ${JSON.stringify(filters)}`,
    );
    try {
      const results = (await this.defaultQuery(filters)
        .clone()
        .select(this.defaultSelectFields)) as MovementStage[];

      this.logger.debug(`Encontrados ${results.length} movement-stages`);
      return results;
    } catch (error) {
      this.logger.error(
        `Erro ao listar movement-stages: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /** Busca individual, sem paginação */
  async findOne(id: string): Promise<MovementStage> {
    this.logger.debug(`Buscando movement-stage com ID: ${id}`);
    try {
      const record = (await this.defaultQuery({ id })
        .clone()
        .select(this.defaultSelectFields)
        .first()) as MovementStage;

      if (!record) {
        this.logger.warn(`movement-stage com ID ${id} não encontrado`);
        throw new NotFoundException(
          `${this.table} com ID ${id} não encontrado`,
        );
      }
      return record;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar movement-stage ${id}: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async create(data: CreateMovementStagesDto): Promise<MovementStage> {
    this.logger.debug(`Criando novo movement-stage: ${JSON.stringify(data)}`);
    try {
      const [inserted] = (await this.knex(this.table)
        .insert(data)
        .returning(this.defaultSelectFields)) as MovementStage[];

      this.logger.debug(`movement-stage criado com ID: ${inserted.id}`);
      return inserted;
    } catch (error) {
      this.logger.error(
        `Erro ao criar movement-stage: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Cria múltiplos registros de uma vez (usado para gerar Entrada/Saída).
   */
  async createMany(data: CreateMovementStagesDto[]): Promise<MovementStage[]> {
    this.logger.debug(
      `Criando múltiplos movement-stages: ${JSON.stringify(data)}`,
    );
    try {
      const inserted = (await this.knex(this.table)
        .insert(data)
        .returning(this.defaultSelectFields)) as MovementStage[];

      this.logger.debug(`${inserted.length} movement-stages criados`);
      return inserted;
    } catch (error) {
      this.logger.error(
        `Erro ao criar múltiplos movement-stages: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async update(
    id: string,
    data: UpdateMovementStagesDto,
  ): Promise<MovementStage> {
    this.logger.debug(
      `Atualizando movement-stage ID ${id}: ${JSON.stringify(data)}`,
    );
    try {
      const count = await this.knex(this.table)
        .where({ id })
        .update({ ...data, updated_at: new Date() });

      if (count === 0) {
        this.logger.warn(
          `movement-stage com ID ${id} não encontrado para atualização`,
        );
        throw new NotFoundException(
          `${this.table} com ID ${id} não encontrado`,
        );
      }
      this.logger.debug(`movement-stage ${id} atualizado com sucesso`);
      return this.findOne(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erro ao atualizar movement-stage ${id}: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async remove(id: string): Promise<number> {
    this.logger.debug(`Removendo movement-stage com ID: ${id}`);
    try {
      const count = await this.knex(this.table)
        .where({ id })
        .update({ deleted_at: new Date(), updated_at: new Date() });

      if (count === 0) {
        this.logger.warn(
          `movement-stage com ID ${id} não encontrado para remoção`,
        );
        throw new NotFoundException(
          `${this.table} com ID ${id} não encontrado`,
        );
      }
      this.logger.debug(`movement-stage ${id} removido com sucesso`);
      return count;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erro ao remover movement-stage ${id}: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async removeByAccountId(
    accountId: string,
    trx?: Knex.Transaction,
  ): Promise<number> {
    this.logger.debug(
      `Removendo registros de ${this.table} da conta: ${accountId}`,
    );
    try {
      const connector = trx ?? this.knex;
      const count = await connector(this.table)
        .where({ account_id: accountId })
        .whereNull('deleted_at')
        .update({ deleted_at: new Date(), updated_at: new Date() });

      this.logger.debug(
        `Registros de ${this.table} removidos da conta ${accountId}: ${count}`,
      );
      return count;
    } catch (error) {
      this.logger.error(
        `Erro ao remover registros de ${this.table} da conta ${accountId}: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
