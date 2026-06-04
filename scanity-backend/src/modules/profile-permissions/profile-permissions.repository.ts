import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Knex } from 'knex';
import { CreateProfilePermissionsDto } from './dto/create-profile-permissions.dto';
import {
  ListProfilePermissionsParamsDto,
  ListPaginatedProfilePermissionsParamsDto,
} from './dto/params-profile-permissions.dto';
import { UpdateProfilePermissionsDto } from './dto/update-profile-permissions.dto';
import { ProfilePermission } from './entities/profile-permission.entity';
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
export class ProfilePermissionsRepository {
  private readonly logger = new Logger(ProfilePermissionsRepository.name);
  private readonly table = 'profile_permissions';
  private readonly defaultSelectFields = [
    'id',
    'profile_id',
    'permission_id',
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
    return this.knex(this.table).modify((qb) =>
      applyDefaultQuery(qb, this.table, filters),
    );
  }

  /**
   * Busca paginada e filtrada usando defaultQuery.
   */
  async findAll(
    params: ListPaginatedProfilePermissionsParamsDto,
  ): Promise<PaginatedResult<ProfilePermission>> {
    const { page = 1, limit = 10, ...filters } = params;
    this.logger.debug(
      `Buscando profile-permissions paginados: página ${page}, limite ${limit}`,
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
        .offset(offset)) as ProfilePermission[];

      // 3) calcula última página
      const last_page = limit > 0 ? Math.ceil(total / limit) : 1;

      this.logger.debug(
        `Encontrados ${total} profile-permissions, ${data.length} na página atual`,
      );
      return { data, total, page: +page, last_page: +last_page, limit: +limit };
    } catch (error) {
      this.logger.error(
        `Erro ao buscar profile-permissions paginados: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /** Listagem simples (sem paginação), só campos padrão */
  async list(
    filters: ListProfilePermissionsParamsDto,
  ): Promise<ProfilePermission[]> {
    this.logger.debug(
      `Listando todos os profile-permissions com filtros: ${JSON.stringify(filters)}`,
    );
    try {
      const results = (await this.defaultQuery(filters)
        .clone()
        .select(this.defaultSelectFields)) as ProfilePermission[];

      this.logger.debug(`Encontrados ${results.length} profile-permissions`);
      return results;
    } catch (error) {
      this.logger.error(
        `Erro ao listar profile-permissions: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /** Busca individual, sem paginação */
  async findOne(id: string): Promise<ProfilePermission> {
    this.logger.debug(`Buscando profile-permission com ID: ${id}`);
    try {
      const record = (await this.defaultQuery({ id })
        .clone()
        .select(this.defaultSelectFields)
        .first()) as ProfilePermission;

      if (!record) {
        this.logger.warn(`profile-permission com ID ${id} não encontrado`);
        throw new NotFoundException(
          `${this.table} com ID ${id} não encontrado`,
        );
      }
      return record;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar profile-permission ${id}: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async create(data: CreateProfilePermissionsDto): Promise<ProfilePermission> {
    this.logger.debug(
      `Criando novo profile-permission: ${JSON.stringify(data)}`,
    );
    try {
      const [inserted] = (await this.knex(this.table)
        .insert(data)
        .returning(this.defaultSelectFields)) as ProfilePermission[];

      this.logger.debug(`profile-permission criado com ID: ${inserted.id}`);
      return inserted;
    } catch (error) {
      this.logger.error(
        `Erro ao criar profile-permission: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async update(
    id: string,
    data: UpdateProfilePermissionsDto,
  ): Promise<ProfilePermission> {
    this.logger.debug(
      `Atualizando profile-permission ID ${id}: ${JSON.stringify(data)}`,
    );
    try {
      const count = await this.knex(this.table)
        .where({ id })
        .update({ ...data, updated_at: new Date() });

      if (count === 0) {
        this.logger.warn(
          `profile-permission com ID ${id} não encontrado para atualização`,
        );
        throw new NotFoundException(
          `${this.table} com ID ${id} não encontrado`,
        );
      }
      this.logger.debug(`profile-permission ${id} atualizado com sucesso`);
      return this.findOne(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erro ao atualizar profile-permission ${id}: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async remove(id: string): Promise<number> {
    this.logger.debug(`Removendo profile-permission com ID: ${id}`);
    try {
      const count = await this.knex(this.table)
        .where({ id })
        .update({ deleted_at: new Date(), updated_at: new Date() });

      if (count === 0) {
        this.logger.warn(
          `profile-permission com ID ${id} não encontrado para remoção`,
        );
        throw new NotFoundException(
          `${this.table} com ID ${id} não encontrado`,
        );
      }
      this.logger.debug(`profile-permission ${id} removido com sucesso`);
      return count;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erro ao remover profile-permission ${id}: ${(error as Error).message}`,
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
        .whereIn('profile_id', function () {
          this.select('id').from('profiles').where({ account_id: accountId });
        })
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
