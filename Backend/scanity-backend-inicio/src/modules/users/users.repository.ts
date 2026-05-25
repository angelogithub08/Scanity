import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Knex } from 'knex';
import { CreateUsersDto } from './dto/create-users.dto';
import {
  ListUsersParamsDto,
  ListPaginatedUsersParamsDto,
} from './dto/params-users.dto';
import { UpdateUsersDto } from './dto/update-users.dto';
import { User } from './entities/user.entity';
import { KNEX_CONNECTION } from '../../infra/database/database.providers';
import { throwIfUniqueViolation } from 'src/utils/db-errors.util';
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
export class UsersRepository {
  private readonly logger = new Logger(UsersRepository.name);
  private readonly table = 'users';
  private readonly defaultSelectFields = [
    'users.id',
    'users.name',
    'users.token',
    'users.account_id',
    'users.is_active',
    'users.created_at',
    'users.updated_at',
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
    params: ListPaginatedUsersParamsDto,
  ): Promise<PaginatedResult<User>> {
    const { page = 1, limit = 10, ...filters } = params;
    this.logger.debug(
      `Buscando users paginados: página ${page}, limite ${limit}`,
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
        .orderBy('users.name', 'asc')
        .leftJoin('accounts', 'users.account_id', 'accounts.id')
        .select([
          ...this.defaultSelectFields,
          'accounts.name as account_name',
          'accounts.type as account_type',
        ])
        .limit(limit)
        .offset(offset)) as User[];

      // 3) calcula última página
      const last_page = limit > 0 ? Math.ceil(total / limit) : 1;

      this.logger.debug(
        `Encontrados ${total} users, ${data.length} na página atual`,
      );
      return { data, total, page: +page, last_page: +last_page, limit: +limit };
    } catch (error) {
      this.logger.error(
        `Erro ao buscar users paginados: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /** Listagem simples (sem paginação), só campos padrão */
  async list(filters: ListUsersParamsDto): Promise<User[]> {
    this.logger.debug(
      `Listando todos os users com filtros: ${JSON.stringify(filters)}`,
    );
    try {
      const results = (await this.defaultQuery(filters)
        .clone()
        .leftJoin('accounts', 'users.account_id', 'accounts.id')
        .select([
          ...this.defaultSelectFields,
          'accounts.name as account_name',
          'accounts.type as account_type',
        ])) as User[];

      this.logger.debug(`Encontrados ${results.length} users`);
      return results;
    } catch (error) {
      this.logger.error(
        `Erro ao listar users: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /** Busca individual, sem paginação */
  async findOne(id: string): Promise<User> {
    this.logger.debug(`Buscando user com ID: ${id}`);
    try {
      const record = (await this.defaultQuery({ id })
        .clone()
        .leftJoin('accounts', 'users.account_id', 'accounts.id')
        .select([
          ...this.defaultSelectFields,
          'accounts.name as account_name',
          'accounts.type as account_type',
        ])
        .first()) as User;

      if (!record) {
        this.logger.warn(`user com ID ${id} não encontrado`);
        throw new NotFoundException(
          `${this.table} com ID ${id} não encontrado`,
        );
      }
      return record;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar user ${id}: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async findByToken(token: string, showPassword = false): Promise<User> {
    this.logger.debug(`Buscando user por token: ${token}`);
    try {
      const selectFields = showPassword
        ? [...this.defaultSelectFields, 'users.password']
        : this.defaultSelectFields;

      const record = (await this.defaultQuery({ token })
        .clone()
        .leftJoin('accounts', 'users.account_id', 'accounts.id')
        .select([
          ...selectFields,
          'accounts.name as account_name',
          'accounts.type as account_type',
        ])
        .first()) as User;

      if (!record) {
        this.logger.warn(`user com token ${token} não encontrado`);
        throw new NotFoundException(
          `${this.table} com token ${token} não encontrado`,
        );
      }
      return record;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar user por token ${token}: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async findByEmail(email: string, showPassword = false): Promise<User> {
    this.logger.debug(`Buscando user por email: ${email}`);
    try {
      const selectFields = showPassword
        ? [...this.defaultSelectFields, 'users.password']
        : this.defaultSelectFields;

      const record = (await this.defaultQuery({ email })
        .clone()
        .leftJoin('accounts', 'users.account_id', 'accounts.id')
        .select([
          ...selectFields,
          'accounts.name as account_name',
          'accounts.type as account_type',
        ])
        .first()) as User;

      if (!record) {
        this.logger.warn(`user com email ${email} não encontrado`);
        throw new NotFoundException(
          `${this.table} com email ${email} não encontrado`,
        );
      }
      return record;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar user por email ${email}: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async create(data: CreateUsersDto): Promise<User> {
    this.logger.debug(`Criando novo user: ${JSON.stringify(data)}`);
    try {
      const [inserted] = (await this.knex(this.table)
        .insert(data)
        .returning(this.defaultSelectFields)) as User[];

      this.logger.debug(`user criado com ID: ${inserted.id}`);
      return inserted;
    } catch (error) {
      this.logger.error(
        `Erro ao criar user: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      // Trata violação de unique do email
      throwIfUniqueViolation(
        error,
        {
          users_email_unique: 'Já existe um usuário com este e-mail.',
        },
        'Já existe um usuário com este e-mail.',
      );
      throw error;
    }
  }

  async update(id: string, data: UpdateUsersDto): Promise<User> {
    this.logger.debug(`Atualizando user ID ${id}: ${JSON.stringify(data)}`);
    try {
      const count = await this.knex(this.table)
        .where({ id })
        .update({ ...data, updated_at: new Date() });

      if (count === 0) {
        this.logger.warn(`user com ID ${id} não encontrado para atualização`);
        throw new NotFoundException(
          `${this.table} com ID ${id} não encontrado`,
        );
      }
      this.logger.debug(`user ${id} atualizado com sucesso`);
      return this.findOne(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erro ao atualizar user ${id}: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      // Trata violação de unique do email
      throwIfUniqueViolation(
        error,
        {
          users_email_unique: 'Já existe um usuário com este e-mail.',
        },
        'Já existe um usuário com este e-mail.',
      );
      throw error;
    }
  }

  async remove(id: string): Promise<number> {
    this.logger.debug(`Removendo user com ID: ${id}`);
    try {
      const count = await this.knex(this.table)
        .where({ id })
        .update({ deleted_at: new Date(), updated_at: new Date() });

      if (count === 0) {
        this.logger.warn(`user com ID ${id} não encontrado para remoção`);
        throw new NotFoundException(
          `${this.table} com ID ${id} não encontrado`,
        );
      }
      this.logger.debug(`user ${id} removido com sucesso`);
      return count;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erro ao remover user ${id}: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async deactivateByAccountId(accountId: string): Promise<number> {
    this.logger.debug(`Desativando usuários da conta: ${accountId}`);
    try {
      const count = await this.knex(this.table)
        .where({ account_id: accountId })
        .whereNull('deleted_at')
        .update({
          is_active: false,
          token: null,
          deleted_at: new Date(),
          updated_at: new Date(),
        });

      this.logger.debug(`Usuários desativados da conta ${accountId}: ${count}`);
      return count;
    } catch (error) {
      this.logger.error(
        `Erro ao desativar usuários da conta ${accountId}: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
