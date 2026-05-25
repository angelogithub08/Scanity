import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Knex } from 'knex';
import { CreatePermissionsDto } from './dto/create-permissions.dto';
import {
  ListPermissionsParamsDto,
  ListPaginatedPermissionsParamsDto,
} from './dto/params-permissions.dto';
import { UpdatePermissionsDto } from './dto/update-permissions.dto';
import { Permission } from './entities/permission.entity';
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
export class PermissionsRepository {
  private readonly logger = new Logger(PermissionsRepository.name);
  private readonly table = 'permissions';
  private readonly defaultSelectFields = [
    'permissions.id',
    'permissions.name',
    'permissions.key_group',
    'permissions.key',
    'permissions.created_at',
    'permissions.updated_at',
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
    params: ListPaginatedPermissionsParamsDto,
  ): Promise<PaginatedResult<Permission>> {
    const { page = 1, limit = 10, ...filters } = params;
    this.logger.debug(
      `Buscando permissions paginados: página ${page}, limite ${limit}`,
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
        .select(this.defaultSelectFields)
        .limit(limit)
        .offset(offset)) as Permission[];

      // 3) calcula última página
      const last_page = limit > 0 ? Math.ceil(total / limit) : 1;

      this.logger.debug(
        `Encontrados ${total} permissions, ${data.length} na página atual`,
      );
      return { data, total, page: +page, last_page: +last_page, limit: +limit };
    } catch (error) {
      this.logger.error(
        `Erro ao buscar permissions paginados: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Lista todas as permissões do sistema (sem filtro por profile).
   * Útil para vincular permissões a perfis na criação da conta.
   */
  async listAll(options?: {
    key_group_not_in?: string[];
  }): Promise<Permission[]> {
    this.logger.debug(
      `Listando todas as permissions (key_group_not_in: ${options?.key_group_not_in?.join(', ') ?? 'nenhum'})`,
    );
    try {
      let qb = this.knex(this.table)
        .whereNull(`${this.table}.deleted_at`)
        .select(this.defaultSelectFields)
        .orderBy(`${this.table}.name`, 'asc');

      if (options?.key_group_not_in?.length) {
        qb = qb.whereNotIn(`${this.table}.key_group`, options.key_group_not_in);
      }

      const results = (await qb) as Permission[];
      this.logger.debug(`Encontradas ${results.length} permissions`);
      return results;
    } catch (error) {
      this.logger.error(
        `Erro ao listar todas as permissions: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /** Listagem simples (sem paginação), só campos padrão */
  async list(params: ListPermissionsParamsDto): Promise<Permission[]> {
    const { profile_id, ...filters } = params;

    this.logger.debug(
      `Listando todos os permissions com filtros: ${JSON.stringify(params)}`,
    );
    try {
      const results = (await this.defaultQuery(filters)
        .clone()
        .innerJoin(
          'profile_permissions',
          'permissions.id',
          'profile_permissions.permission_id',
        )
        .where('profile_permissions.profile_id', profile_id)
        .select(this.defaultSelectFields)) as Permission[];

      this.logger.debug(`Encontrados ${results.length} permissions`);
      return results;
    } catch (error) {
      this.logger.error(
        `Erro ao listar permissions: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /** Busca individual, sem paginação */
  async findOne(id: string): Promise<Permission> {
    this.logger.debug(`Buscando permission com ID: ${id}`);
    try {
      const record = (await this.defaultQuery({ id })
        .clone()
        .select(this.defaultSelectFields)
        .first()) as Permission;

      if (!record) {
        this.logger.warn(`permission com ID ${id} não encontrado`);
        throw new NotFoundException(
          `${this.table} com ID ${id} não encontrado`,
        );
      }
      return record;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar permission ${id}: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async create(data: CreatePermissionsDto): Promise<Permission> {
    this.logger.debug(`Criando novo permission: ${JSON.stringify(data)}`);
    try {
      const [inserted] = (await this.knex(this.table)
        .insert(data)
        .returning(this.defaultSelectFields)) as Permission[];

      this.logger.debug(`permission criado com ID: ${inserted.id}`);
      return inserted;
    } catch (error) {
      this.logger.error(
        `Erro ao criar permission: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async update(id: string, data: UpdatePermissionsDto): Promise<Permission> {
    this.logger.debug(
      `Atualizando permission ID ${id}: ${JSON.stringify(data)}`,
    );
    try {
      const count = await this.knex(this.table)
        .where({ id })
        .update({ ...data, updated_at: new Date() });

      if (count === 0) {
        this.logger.warn(
          `permission com ID ${id} não encontrado para atualização`,
        );
        throw new NotFoundException(
          `${this.table} com ID ${id} não encontrado`,
        );
      }
      this.logger.debug(`permission ${id} atualizado com sucesso`);
      return this.findOne(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erro ao atualizar permission ${id}: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async remove(id: string): Promise<number> {
    this.logger.debug(`Removendo permission com ID: ${id}`);
    try {
      const count = await this.knex(this.table)
        .where({ id })
        .update({ deleted_at: new Date(), updated_at: new Date() });

      if (count === 0) {
        this.logger.warn(`permission com ID ${id} não encontrado para remoção`);
        throw new NotFoundException(
          `${this.table} com ID ${id} não encontrado`,
        );
      }
      this.logger.debug(`permission ${id} removido com sucesso`);
      return count;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erro ao remover permission ${id}: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /** Busca permissões por profile_id através da tabela de relacionamento */
  async findByProfileId(profileId: string): Promise<Permission[]> {
    this.logger.debug(`Buscando permissions para profile ID: ${profileId}`);
    try {
      const results = (await this.knex(this.table)
        .select(this.defaultSelectFields)
        .leftJoin(
          'profile_permissions',
          `${this.table}.id`,
          'profile_permissions.permission_id',
        )
        .where('profile_permissions.profile_id', profileId)
        .orderBy(`${this.table}.name`, 'asc')) as Permission[];

      this.logger.debug(
        `Encontradas ${results.length} permissions para profile ${profileId}`,
      );
      return results;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar permissions para profile ${profileId}: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
