import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Knex } from 'knex';
import { CreateNotificationsDto } from './dto/create-notifications.dto';
import {
  ListNotificationsParamsDto,
  ListPaginatedNotificationsParamsDto,
} from './dto/params-notifications.dto';
import { UpdateNotificationsDto } from './dto/update-notifications.dto';
import { Notification } from './entities/notification.entity';
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
export class NotificationsRepository {
  private readonly logger = new Logger(NotificationsRepository.name);
  private readonly table = 'notifications';
  private readonly defaultSelectFields = [
    'id',
    'key',
    'message',
    'data',
    'account_id',
    'user_id',
    'read_at',
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
    params: ListPaginatedNotificationsParamsDto,
  ): Promise<PaginatedResult<Notification> & { total_unread: number }> {
    const { page = 1, limit = 10, ...filters } = params;
    this.logger.debug(
      `Buscando notifications paginados: página ${page}, limite ${limit}`,
    );

    try {
      // 1) total de registros (mesmos filtros)
      const result = (await this.defaultQuery(filters)
        .clone()
        .count('* as count')
        .first()) as CountResult;

      const total = Number(result?.count || 0);

      const resultUnread = await this.defaultQuery(filters)
        .clone()
        .whereNull('read_at')
        .count('* as count')
        .first();

      const totalUnread = Number(resultUnread?.count || 0);

      // 2) lista de dados (mesmos filtros + paginação + seleção de campos)
      const offset = (page - 1) * limit;
      const data = (await this.defaultQuery(filters)
        .clone()
        .orderBy('created_at', 'desc')
        .select(this.defaultSelectFields)
        .limit(limit)
        .offset(offset)) as Notification[];

      // 3) calcula última página
      const last_page = limit > 0 ? Math.ceil(total / limit) : 1;

      this.logger.debug(
        `Encontrados ${total} notifications, ${data.length} na página atual`,
      );
      return {
        data,
        total,
        page: +page,
        last_page: +last_page,
        limit: +limit,
        total_unread: totalUnread,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao buscar notifications paginados: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /** Listagem simples (sem paginação), só campos padrão */
  async list(filters: ListNotificationsParamsDto): Promise<Notification[]> {
    this.logger.debug(
      `Listando todos os notifications com filtros: ${JSON.stringify(filters)}`,
    );
    try {
      const results = (await this.defaultQuery(filters)
        .clone()
        .select(this.defaultSelectFields)) as Notification[];

      this.logger.debug(`Encontrados ${results.length} notifications`);
      return results;
    } catch (error) {
      this.logger.error(
        `Erro ao listar notifications: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /** Busca individual, sem paginação */
  async findOne(id: string): Promise<Notification> {
    this.logger.debug(`Buscando notification com ID: ${id}`);
    try {
      const record = (await this.defaultQuery({ id })
        .clone()
        .select(this.defaultSelectFields)
        .first()) as Notification;

      if (!record) {
        this.logger.warn(`notification com ID ${id} não encontrado`);
        throw new NotFoundException(
          `${this.table} com ID ${id} não encontrado`,
        );
      }
      return record;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar notification ${id}: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async create(data: CreateNotificationsDto): Promise<Notification> {
    this.logger.debug(`Criando novo notification: ${JSON.stringify(data)}`);
    try {
      const [inserted] = (await this.knex(this.table)
        .insert(data)
        .returning(this.defaultSelectFields)) as Notification[];

      this.logger.debug(`notification criado com ID: ${inserted.id}`);
      return inserted;
    } catch (error) {
      this.logger.error(
        `Erro ao criar notification: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async update(
    id: string,
    data: UpdateNotificationsDto,
  ): Promise<Notification> {
    this.logger.debug(
      `Atualizando notification ID ${id}: ${JSON.stringify(data)}`,
    );
    try {
      const count = await this.knex(this.table)
        .where({ id })
        .update({ ...data, updated_at: new Date() });

      if (count === 0) {
        this.logger.warn(
          `notification com ID ${id} não encontrado para atualização`,
        );
        throw new NotFoundException(
          `${this.table} com ID ${id} não encontrado`,
        );
      }
      this.logger.debug(`notification ${id} atualizado com sucesso`);
      return this.findOne(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erro ao atualizar notification ${id}: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async remove(id: string): Promise<number> {
    this.logger.debug(`Removendo notification com ID: ${id}`);
    try {
      const count = await this.knex(this.table)
        .where({ id })
        .update({ updated_at: new Date() });

      if (count === 0) {
        this.logger.warn(
          `notification com ID ${id} não encontrado para remoção`,
        );
        throw new NotFoundException(
          `${this.table} com ID ${id} não encontrado`,
        );
      }
      this.logger.debug(`notification ${id} removido com sucesso`);
      return count;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erro ao remover notification ${id}: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async markAllAsRead(userId: string): Promise<number> {
    this.logger.debug(
      `Marcando todas as notificações como lidas para o usuário: ${userId}`,
    );
    try {
      const now = new Date();
      const count = await this.knex(this.table)
        .where({ user_id: userId })
        .whereNull('read_at')
        .update({
          read_at: now,
          updated_at: now,
        });

      this.logger.debug(
        `${count} notificações marcadas como lidas para o usuário ${userId}`,
      );
      return count;
    } catch (error) {
      this.logger.error(
        `Erro ao marcar notificações como lidas para o usuário ${userId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
