import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import type { Knex } from 'knex';
import { KNEX_CONNECTION } from '../../infra/database/database.providers';
import { UsersRepository } from '../users/users.repository';
import { NotificationsService } from '../notifications/notifications.service';
import type { User } from '../users/entities/user.entity';

type StockBelowMinimumItem = {
  product_id: string;
  product_name: string;
  current_quantity: number;
  min_quantity: number;
};

@Injectable()
export class StocksSchedule {
  private readonly logger = new Logger(StocksSchedule.name);
  private readonly stockBelowMinimumNotificationKey = 'STOCK_BELOW_MINIMUM';

  private isRunning = false;

  constructor(
    @Inject(KNEX_CONNECTION) private readonly knex: Knex,
    private readonly usersRepository: UsersRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async getAccountIdsWithStockBelowMinimum(): Promise<string[]> {
    const accounts = await this.knex('stocks')
      .distinct('products.account_id as account_id')
      .innerJoin('products', 'stocks.product_id', 'products.id')
      .whereNull('stocks.deleted_at')
      .whereNull('products.deleted_at')
      .whereRaw('stocks.current_quantity <= stocks.min_quantity');

    return accounts
      .map((r: { account_id: string }) => r.account_id)
      .filter(Boolean);
  }

  private async getItemsBelowMinimumForAccount(
    accountId: string,
  ): Promise<StockBelowMinimumItem[]> {
    return (await this.knex('stocks')
      .select(
        'products.id as product_id',
        'products.name as product_name',
        'stocks.current_quantity as current_quantity',
        'stocks.min_quantity as min_quantity',
      )
      .innerJoin('products', 'stocks.product_id', 'products.id')
      .whereNull('stocks.deleted_at')
      .whereNull('products.deleted_at')
      .where('products.account_id', accountId)
      .whereRaw('stocks.current_quantity <= stocks.min_quantity')
      .orderBy('products.name', 'asc')) as StockBelowMinimumItem[];
  }

  private async listUsersForAccount(accountId: string): Promise<User[]> {
    return this.usersRepository.list({ account_id: accountId });
  }

  private extractProductIdFromNotificationData(data: unknown): string | null {
    const dataStr = typeof data === 'string' ? data : '';
    const match = dataStr.match(/"product_id"\s*:\s*"([^"]+)"/);
    return match?.[1] ?? null;
  }

  private async getExistingPairsForAccount(params: {
    accountId: string;
    userIds: string[];
    productIds: string[];
  }): Promise<Set<string>> {
    const { accountId, userIds, productIds } = params;

    const existingNotifications = await this.knex('notifications')
      .select('user_id', 'data')
      .whereNull('deleted_at')
      .whereNull('read_at')
      .where('account_id', accountId)
      .where('key', this.stockBelowMinimumNotificationKey)
      .whereIn('user_id', userIds)
      .andWhere((qb) => {
        productIds.forEach((productId) => {
          qb.orWhere('data', 'ilike', `%${productId}%`);
        });
      });

    const pairs = new Set<string>();
    for (const existing of existingNotifications) {
      const productId = this.extractProductIdFromNotificationData(
        (existing as any).data,
      );
      if (productId) pairs.add(`${(existing as any).user_id}:${productId}`);
    }
    return pairs;
  }

  private buildStockBelowMinimumMessage(item: StockBelowMinimumItem): string {
    return `Estoque mínimo atingido: ${item.product_name} (atual: ${item.current_quantity}, mínimo: ${item.min_quantity}).`;
  }

  private buildStockBelowMinimumData(item: StockBelowMinimumItem): string {
    return JSON.stringify({
      product_id: item.product_id,
      current_quantity: item.current_quantity,
      min_quantity: item.min_quantity,
    });
  }

  private async createNotificationsForAccount(params: {
    accountId: string;
    items: StockBelowMinimumItem[];
    users: User[];
    existingPairs: Set<string>;
  }): Promise<number> {
    const { accountId, items, users, existingPairs } = params;

    let createdCount = 0;

    for (const item of items) {
      const message = this.buildStockBelowMinimumMessage(item);
      const data = this.buildStockBelowMinimumData(item);

      for (const user of users) {
        if (!user.id) continue;
        if (existingPairs.has(`${user.id}:${item.product_id}`)) continue;

        try {
          await this.notificationsService.create({
            key: this.stockBelowMinimumNotificationKey,
            message,
            data,
            account_id: accountId,
            user_id: user.id,
          });
          createdCount++;
        } catch (error) {
          this.logger.error(
            `Falha ao criar notification estoque mínimo (account_id=${accountId}, user_id=${user.id}, product_id=${item.product_id}): ${
              (error as Error).message
            }`,
          );
        }
      }
    }

    return createdCount;
  }

  /**
   * Rotina periódica:
   * - identifica produtos com current_quantity <= min_quantity (por conta)
   * - cria notificações não-lidas para todos usuários daquela conta
   * - evita duplicar notificações não-lidas para o mesmo usuário/produto
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async stockBelowMinimumRoutine(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const accountIds = await this.getAccountIdsWithStockBelowMinimum();
      if (accountIds.length === 0) return;

      for (const accountId of accountIds) {
        const items = await this.getItemsBelowMinimumForAccount(accountId);
        if (items.length === 0) continue;

        const users = await this.listUsersForAccount(accountId);
        if (users.length === 0) continue;

        const userIds = users.map((u) => u.id).filter(Boolean);
        if (userIds.length === 0) continue;

        const productIds = items.map((i) => i.product_id).filter(Boolean);
        if (productIds.length === 0) continue;

        const existingPairs = await this.getExistingPairsForAccount({
          accountId,
          userIds,
          productIds,
        });

        const createdCount = await this.createNotificationsForAccount({
          accountId,
          items,
          users,
          existingPairs,
        });

        if (createdCount > 0) {
          this.logger.log(
            `Criadas ${createdCount} notificações (estoque mínimo) para account_id=${accountId}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Erro na rotina stockBelowMinimumRoutine: ${(error as Error).message}`,
      );
    } finally {
      this.isRunning = false;
    }
  }
}
