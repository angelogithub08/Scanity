import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Knex } from 'knex';
import { CreateProfilesDto } from './dto/create-profiles.dto';
import {
  ListProfilesParamsDto,
  ListPaginatedProfilesParamsDto,
} from './dto/params-profiles.dto';
import { UpdateProfilesDto } from './dto/update-profiles.dto';
import { Profile } from './entities/profile.entity';
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
export class ProfilesRepository {
  private readonly logger = new Logger(ProfilesRepository.name);
  private readonly table = 'profiles';
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
    return this.knex(this.table).modify((qb) =>
      applyDefaultQuery(qb, this.table, filters),
    );
  }

  /**
   * Busca paginada e filtrada usando defaultQuery.
   */
  async findAll(
    params: ListPaginatedProfilesParamsDto,
  ): Promise<PaginatedResult<Profile>> {
    const { page = 1, limit = 10, ...filters } = params;
    this.logger.debug(
      `Buscando profiles paginados: página ${page}, limite ${limit}`,
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
        .offset(offset)) as Profile[];

      // 3) calcula última página
      const last_page = limit > 0 ? Math.ceil(total / limit) : 1;

      this.logger.debug(
        `Encontrados ${total} profiles, ${data.length} na página atual`,
      );
      return { data, total, page: +page, last_page: +last_page, limit: +limit };
    } catch (error) {
      this.logger.error(
        `Erro ao buscar profiles paginados: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /** Listagem simples (sem paginação), só campos padrão */
  async list(filters: ListProfilesParamsDto): Promise<Profile[]> {
    this.logger.debug(
      `Listando todos os profiles com filtros: ${JSON.stringify(filters)}`,
    );
    try {
      const results = (await this.defaultQuery(filters)
        .clone()
        .select(this.defaultSelectFields)) as Profile[];

      this.logger.debug(`Encontrados ${results.length} profiles`);
      return results;
    } catch (error) {
      this.logger.error(
        `Erro ao listar profiles: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /** Busca individual, sem paginação */
  async findOne(id: string): Promise<Profile> {
    this.logger.debug(`Buscando profile com ID: ${id}`);
    try {
      const record = (await this.knex(this.table)
        .where(`${this.table}.id`, id)
        .select(this.defaultSelectFields)
        .first()) as Profile;

      if (!record) {
        this.logger.warn(`profile com ID ${id} não encontrado`);
        throw new NotFoundException(
          `${this.table} com ID ${id} não encontrado`,
        );
      }
      return record;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar profile ${id}: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async create(data: CreateProfilesDto): Promise<Profile> {
    this.logger.debug(`Criando novo profile: ${JSON.stringify(data)}`);
    try {
      const [inserted] = (await this.knex(this.table)
        .insert(data)
        .returning(this.defaultSelectFields)) as Profile[];

      this.logger.debug(`profile criado com ID: ${inserted.id}`);
      return inserted;
    } catch (error) {
      this.logger.error(
        `Erro ao criar profile: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async update(id: string, data: UpdateProfilesDto): Promise<Profile> {
    this.logger.debug(`Atualizando profile ID ${id}: ${JSON.stringify(data)}`);
    try {
      const count = await this.knex(this.table)
        .where({ id })
        .update({ ...data, updated_at: new Date() });

      if (count === 0) {
        this.logger.warn(
          `profile com ID ${id} não encontrado para atualização`,
        );
        throw new NotFoundException(
          `${this.table} com ID ${id} não encontrado`,
        );
      }
      this.logger.debug(`profile ${id} atualizado com sucesso`);
      return this.findOne(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erro ao atualizar profile ${id}: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async remove(id: string): Promise<number> {
    this.logger.debug(`Removendo profile com ID: ${id}`);
    try {
      const count = await this.knex(this.table)
        .where({ id })
        .update({ deleted_at: new Date(), updated_at: new Date() });

      if (count === 0) {
        this.logger.warn(`profile com ID ${id} não encontrado para remoção`);
        throw new NotFoundException(
          `${this.table} com ID ${id} não encontrado`,
        );
      }
      this.logger.debug(`profile ${id} removido com sucesso`);
      return count;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erro ao remover profile ${id}: ${(error as Error).message}`,
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

  /** Sincroniza permissões de um perfil - remove todas e insere as novas */
  async syncProfilePermissions(
    profileId: string,
    permissionIds: string[],
  ): Promise<{ inserted: number; deleted: number }> {
    this.logger.debug(
      `Sincronizando permissões para profile ${profileId}: ${permissionIds.length} permissões`,
    );

    const trx = await this.knex.transaction();

    try {
      // 1. Verifica se o perfil existe
      const profileExists = await trx(this.table)
        .where({ id: profileId })
        .first();

      if (!profileExists) {
        this.logger.warn(`Profile com ID ${profileId} não encontrado`);
        throw new NotFoundException(
          `Profile com ID ${profileId} não encontrado`,
        );
      }

      // 2. Remove todas as permissões atuais do perfil
      const deletedCount = await trx('profile_permissions')
        .where({ profile_id: profileId })
        .delete();

      this.logger.debug(
        `Removidas ${deletedCount} permissões existentes do profile ${profileId}`,
      );

      // 3. Insere as novas permissões (se houver)
      let insertedCount = 0;
      if (permissionIds.length > 0) {
        const permissionsToInsert = permissionIds.map((permissionId) => ({
          profile_id: profileId,
          permission_id: permissionId,
        }));

        await trx('profile_permissions').insert(permissionsToInsert);
        insertedCount = permissionIds.length;

        this.logger.debug(
          `Inseridas ${insertedCount} novas permissões para profile ${profileId}`,
        );
      }

      await trx.commit();

      this.logger.log(
        `Sincronização concluída para profile ${profileId}: ${deletedCount} removidas, ${insertedCount} inseridas`,
      );

      return { inserted: insertedCount, deleted: deletedCount };
    } catch (error) {
      await trx.rollback();
      this.logger.error(
        `Erro ao sincronizar permissões para profile ${profileId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
