import { Inject, Injectable, Logger } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../../infra/database/database.providers';
import { CreateChatHistoryDto } from './dto/create-chat-history.dto';
import { ChatHistory } from './entities/chat-history.entity';

export interface CountResult {
  count: number;
}

@Injectable()
export class ChatHistoryRepository {
  private readonly logger = new Logger(ChatHistoryRepository.name);
  private readonly table = 'chat_history';
  private readonly defaultSelectFields = [
    'id',
    'user_id',
    'role',
    'content',
    'account_id',
    'created_at',
    'updated_at',
  ];

  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  async create(data: CreateChatHistoryDto): Promise<ChatHistory> {
    try {
      const [inserted] = (await this.knex(this.table)
        .insert(data)
        .returning(this.defaultSelectFields)) as ChatHistory[];

      return inserted;
    } catch (error) {
      this.logger.error(
        `Erro ao criar chat_history: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  async findByUserId(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{
    data: ChatHistory[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const baseQuery = this.knex(this.table)
        .where('user_id', userId)
        .whereNull('deleted_at');

      const countResult = (await baseQuery
        .clone()
        .count('* as count')
        .first()) as unknown as CountResult;

      const total = Number(countResult?.count || 0);

      const offset = (page - 1) * limit;
      const data = (await baseQuery
        .clone()
        .orderBy('created_at', 'desc')
        .select(this.defaultSelectFields)
        .limit(limit)
        .offset(offset)) as ChatHistory[];

      data.reverse();

      return { data, total, page, limit };
    } catch (error) {
      this.logger.error(
        `Erro ao buscar chat_history: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  async findByUserIdAsc(userId: string, limit: number): Promise<ChatHistory[]> {
    try {
      const data = (await this.knex(this.table)
        .where('user_id', userId)
        .whereNull('deleted_at')
        .orderBy('created_at', 'desc')
        .select(this.defaultSelectFields)
        .limit(limit)) as ChatHistory[];

      data.reverse();
      return data;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar chat_history asc: ${(error as Error).message}`,
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

  async clearByUserId(userId: string): Promise<number> {
    try {
      const count = await this.knex(this.table)
        .where('user_id', userId)
        .whereNull('deleted_at')
        .update({ deleted_at: new Date(), updated_at: new Date() });

      return count;
    } catch (error) {
      this.logger.error(
        `Erro ao limpar chat_history: ${(error as Error).message}`,
      );
      throw error;
    }
  }
}
