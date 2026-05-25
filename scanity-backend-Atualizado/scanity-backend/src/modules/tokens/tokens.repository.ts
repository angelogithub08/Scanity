import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Knex } from 'knex';
import { CreateTokensDto } from './dto/create-tokens.dto';
import {
  ListTokensParamsDto,
  ListPaginatedTokensParamsDto,
} from './dto/params-tokens.dto';
import { UpdateTokensDto } from './dto/update-tokens.dto';
import { Token } from './entities/token.entity';
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
export class TokensRepository {
  private readonly logger = new Logger(TokensRepository.name);
  private readonly table = 'tokens';
  private readonly defaultSelectFields = [
    `${this.table}.id`,
    `${this.table}.type`,
    `${this.table}.token`,
    `${this.table}.account_id`,
    `${this.table}.user_id`,
    `${this.table}.revoked_at`,
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
    params: ListPaginatedTokensParamsDto,
  ): Promise<PaginatedResult<Token>> {
    const { page = 1, limit = 10, ...filters } = params;
    this.logger.debug(
      `Buscando tokens paginados: página ${page}, limite ${limit}`,
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
        .orderBy(`${this.table}.created_at`, 'desc')
        .leftJoin('users', 'tokens.user_id', 'users.id')
        .select([
          ...this.defaultSelectFields,
          'users.name as user_name',
          'users.email as user_email',
        ])
        .limit(limit)
        .offset(offset)) as Token[];

      // 3) calcula última página
      const last_page = limit > 0 ? Math.ceil(total / limit) : 1;

      this.logger.debug(
        `Encontrados ${total} tokens, ${data.length} na página atual`,
      );
      return { data, total, page: +page, last_page: +last_page, limit: +limit };
    } catch (error) {
      this.logger.error(
        `Erro ao buscar tokens paginados: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /** Listagem simples (sem paginação), só campos padrão */
  async list(filters: ListTokensParamsDto): Promise<Token[]> {
    this.logger.debug(
      `Listando todos os tokens com filtros: ${JSON.stringify(filters)}`,
    );
    try {
      const results = (await this.defaultQuery(filters)
        .clone()
        .orderBy(`${this.table}.created_at`, 'desc')
        .leftJoin('users', 'tokens.user_id', 'users.id')
        .select([
          ...this.defaultSelectFields,
          'users.name as user_name',
          'users.email as user_email',
        ])) as Token[];

      this.logger.debug(`Encontrados ${results.length} tokens`);
      return results;
    } catch (error) {
      this.logger.error(
        `Erro ao listar tokens: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /** Busca individual, sem paginação */
  async findOne(id: string): Promise<Token> {
    this.logger.debug(`Buscando token com ID: ${id}`);
    try {
      const record = (await this.defaultQuery({ id })
        .clone()
        .leftJoin('users', 'tokens.user_id', 'users.id')
        .select([
          ...this.defaultSelectFields,
          'users.name as user_name',
          'users.email as user_email',
        ])
        .first()) as Token;

      if (!record) {
        this.logger.warn(`token com ID ${id} não encontrado`);
        throw new NotFoundException(
          `${this.table} com ID ${id} não encontrado`,
        );
      }
      return record;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar token ${id}: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Busca token por valor do token (usado para refresh token)
   */
  async findByToken(token: string): Promise<Token | null> {
    this.logger.debug(`Buscando token: ${token}`);
    try {
      const record = (await this.knex(this.table)
        .where({ token })
        .whereNull('revoked_at')
        .whereNull('deleted_at')
        .select(this.defaultSelectFields)
        .first()) as Token;

      if (!record) {
        this.logger.warn(`Token ${token} não encontrado ou revogado`);
        return null;
      }
      return record;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar token: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Revoga um token específico
   */
  async revoke(token: string): Promise<void> {
    this.logger.debug(`Revogando token: ${token}`);
    try {
      const count = await this.knex(this.table)
        .where({ token })
        .whereNull('revoked_at')
        .update({ revoked_at: new Date() });

      if (count === 0) {
        this.logger.warn(`Token ${token} não encontrado ou já revogado`);
      } else {
        this.logger.debug(`Token ${token} revogado com sucesso`);
      }
    } catch (error) {
      this.logger.error(
        `Erro ao revogar token: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async revokeByAccountId(accountId: string): Promise<number> {
    this.logger.debug(`Revogando tokens da conta: ${accountId}`);
    try {
      const count = await this.knex(this.table)
        .where({ account_id: accountId })
        .whereNull('revoked_at')
        .update({ revoked_at: new Date(), updated_at: new Date() });

      this.logger.debug(`Tokens revogados da conta ${accountId}: ${count}`);
      return count;
    } catch (error) {
      this.logger.error(
        `Erro ao revogar tokens da conta ${accountId}: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async create(data: CreateTokensDto): Promise<Token> {
    this.logger.debug(`Criando novo token: ${JSON.stringify(data)}`);
    try {
      const [inserted] = (await this.knex(this.table)
        .insert(data)
        .returning(this.defaultSelectFields)) as Token[];

      this.logger.debug(`token criado com ID: ${inserted.id}`);
      return inserted;
    } catch (error) {
      this.logger.error(
        `Erro ao criar token: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async update(id: string, data: UpdateTokensDto): Promise<Token> {
    this.logger.debug(`Atualizando token ID ${id}: ${JSON.stringify(data)}`);
    try {
      const count = await this.knex(this.table)
        .where({ id })
        .update({ ...data, updated_at: new Date() });

      if (count === 0) {
        this.logger.warn(`token com ID ${id} não encontrado para atualização`);
        throw new NotFoundException(
          `${this.table} com ID ${id} não encontrado`,
        );
      }
      this.logger.debug(`token ${id} atualizado com sucesso`);
      return this.findOne(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erro ao atualizar token ${id}: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async remove(id: string): Promise<number> {
    this.logger.debug(`Removendo token com ID: ${id}`);
    try {
      const count = await this.knex(this.table).where({ id }).delete();

      if (count === 0) {
        this.logger.warn(`token com ID ${id} não encontrado para remoção`);
        throw new NotFoundException(
          `${this.table} com ID ${id} não encontrado`,
        );
      }
      this.logger.debug(`token ${id} removido com sucesso`);
      return count;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erro ao remover token ${id}: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
