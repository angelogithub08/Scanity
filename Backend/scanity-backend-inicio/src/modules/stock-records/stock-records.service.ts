import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import type { Knex } from 'knex';
import { CreateStockRecordsDto } from './dto/create-stock-records.dto';
import { UpdateStockRecordsDto } from './dto/update-stock-records.dto';
import {
  ListStockRecordsParamsDto,
  ListPaginatedStockRecordsParamsDto,
} from './dto/params-stock-records.dto';
import { StockRecord } from './entities/stock-record.entity';
import {
  StockRecordsRepository,
  PaginatedResult,
} from './stock-records.repository';
import { KNEX_CONNECTION } from '../../infra/database/database.providers';
import { UsersRepository } from '../users/users.repository';
import { NotificationsService } from '../notifications/notifications.service';
import type { User } from '../users/entities/user.entity';

type StockBeforeMinForSaida = {
  product_id: string;
  product_name: string;
  account_id: string;
  current_quantity: number;
  min_quantity: number;
};

type StockAfterMinForSaida = {
  product_id: string;
  product_name: string;
  account_id: string;
  current_quantity: number;
  min_quantity: number;
};

@Injectable()
export class StockRecordsService {
  private readonly logger = new Logger(StockRecordsService.name);
  private readonly stockBelowMinimumNotificationKey = 'STOCK_BELOW_MINIMUM';

  constructor(
    private readonly stockRecordsRepository: StockRecordsRepository,
    @Inject(KNEX_CONNECTION) private readonly knex: Knex,
    private readonly usersRepository: UsersRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async getStockBeforeForSaida(
    stockId: string,
  ): Promise<StockBeforeMinForSaida | undefined> {
    return this.knex('stocks')
      .select(
        'stocks.product_id as product_id',
        'products.name as product_name',
        'products.account_id as account_id',
        'stocks.current_quantity as current_quantity',
        'stocks.min_quantity as min_quantity',
      )
      .innerJoin('products', 'stocks.product_id', 'products.id')
      .where('stocks.id', stockId)
      .whereNull('stocks.deleted_at')
      .whereNull('products.deleted_at')
      .first() as Promise<StockBeforeMinForSaida | undefined>;
  }

  private async getStockAfterForSaida(
    stockId: string,
  ): Promise<StockAfterMinForSaida | undefined> {
    return this.knex('stocks')
      .select(
        'stocks.product_id as product_id',
        'products.name as product_name',
        'products.account_id as account_id',
        'stocks.current_quantity as current_quantity',
        'stocks.min_quantity as min_quantity',
      )
      .innerJoin('products', 'stocks.product_id', 'products.id')
      .where('stocks.id', stockId)
      .whereNull('stocks.deleted_at')
      .first() as Promise<StockAfterMinForSaida | undefined>;
  }

  private isMinReached(stockAfter: StockAfterMinForSaida): boolean {
    // estoque saiu de > min para <= min
    return stockAfter.current_quantity <= stockAfter.min_quantity;
  }

  private async listUsersForAccount(accountId: string): Promise<User[]> {
    return this.usersRepository.list({ account_id: accountId });
  }

  private async getExistingNotReadUserIdsForProduct(params: {
    accountId: string;
    productId: string;
    userIds: string[];
  }): Promise<Set<string>> {
    const { accountId, productId, userIds } = params;
    const existingNotifications = await this.knex('notifications')
      .select('user_id')
      .where('account_id', accountId)
      .where('key', this.stockBelowMinimumNotificationKey)
      .whereNull('read_at')
      .whereNull('deleted_at')
      .whereIn('user_id', userIds)
      .andWhere('data', 'ilike', `%${productId}%`);

    return new Set(
      existingNotifications.map((n: { user_id: string }) => n.user_id),
    );
  }

  private async notifyAccountUsersStockBelowMinimum(params: {
    stockAfter: {
      product_id: string;
      product_name: string;
      account_id: string;
      current_quantity: number;
      min_quantity: number;
    };
    stockRecordId: string;
  }): Promise<void> {
    const { stockAfter, stockRecordId } = params;

    const users = await this.listUsersForAccount(stockAfter.account_id);
    const userIds = users.map((u) => u.id).filter(Boolean);
    if (userIds.length === 0) return;

    const existingUserIds = await this.getExistingNotReadUserIdsForProduct({
      accountId: stockAfter.account_id,
      productId: stockAfter.product_id,
      userIds,
    });

    const message = `Estoque mínimo atingido: ${stockAfter.product_name} (atual: ${stockAfter.current_quantity}, mínimo: ${stockAfter.min_quantity}).`;
    const data = JSON.stringify({
      product_id: stockAfter.product_id,
      current_quantity: stockAfter.current_quantity,
      min_quantity: stockAfter.min_quantity,
      stock_record_id: stockRecordId,
    });

    for (const user of users) {
      if (!user.id) continue;
      if (existingUserIds.has(user.id)) continue;

      await this.notificationsService.create({
        key: this.stockBelowMinimumNotificationKey,
        message,
        data,
        account_id: stockAfter.account_id,
        user_id: user.id,
      });
    }
  }

  findAll(
    params: ListPaginatedStockRecordsParamsDto,
  ): Promise<PaginatedResult<StockRecord>> {
    try {
      return this.stockRecordsRepository.findAll(params);
    } catch (error) {
      this.logger.error(
        `Erro ao buscar usuários paginados: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao buscar StockRecords paginados: ' + (error as Error).message,
      );
    }
  }

  list(params: ListStockRecordsParamsDto): Promise<StockRecord[]> {
    try {
      return this.stockRecordsRepository.list(params);
    } catch (error) {
      this.logger.error(
        `Erro ao listar usuários: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao listar StockRecords: ' + (error as Error).message,
      );
    }
  }

  findOne(id: string): Promise<StockRecord> {
    try {
      return this.stockRecordsRepository.findOne(id);
    } catch (error) {
      this.logger.error(
        `Erro ao buscar StockRecord: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        this.logger.warn(`StockRecord não encontrado: ID ${id}`);
        throw error;
      }
      throw new BadRequestException(
        'Erro ao buscar StockRecord: ' + (error as Error).message,
      );
    }
  }

  async create(createDto: CreateStockRecordsDto): Promise<StockRecord> {
    try {
      // Regra: criar notification quando uma SAÍDA "bate" o mínimo.
      // Consideramos "atingido" quando o estoque sai de um estado > min_quantity
      // para um estado <= min_quantity após a movimentação.
      let stockBefore:
        | {
            product_id: string;
            product_name: string;
            account_id: string;
            current_quantity: number;
            min_quantity: number;
          }
        | undefined;

      if (createDto.type === 'SAIDA') {
        stockBefore = await this.getStockBeforeForSaida(createDto.stock_id);
      }

      const quantity =
        createDto.type === 'ENTRADA' ? createDto.quantity : -createDto.quantity;
      const result = await this.stockRecordsRepository.create({
        ...createDto,
        quantity,
      });
      this.logger.log(`StockRecord criado com sucesso: ${result.id}`);

      if (createDto.type === 'SAIDA' && stockBefore) {
        const stockAfter = await this.getStockAfterForSaida(createDto.stock_id);

        if (stockAfter && this.isMinReached(stockAfter)) {
          await this.notifyAccountUsersStockBelowMinimum({
            stockAfter,
            stockRecordId: result.id,
          });
        }
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Erro ao criar StockRecord: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao criar StockRecord: ' + (error as Error).message,
      );
    }
  }

  async update(
    id: string,
    updateDto: UpdateStockRecordsDto,
  ): Promise<StockRecord> {
    try {
      const result = await this.stockRecordsRepository.update(id, updateDto);
      this.logger.log(`StockRecord atualizado com sucesso: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar StockRecord: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        this.logger.warn(`StockRecord não encontrado: ID ${id}`);
        throw error;
      }
      throw new BadRequestException(
        'Erro ao atualizar StockRecord: ' + (error as Error).message,
      );
    }
  }

  async remove(id: string) {
    try {
      const result = await this.stockRecordsRepository.remove(id);
      this.logger.log(`StockRecord removido com sucesso: ${id}`);
      return {
        success: true,
        message: `Registros removidos: ${result}`,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao remover StockRecord: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        this.logger.warn(`StockRecord não encontrado: ID ${id}`);
        throw error;
      }
      throw new BadRequestException(
        'Erro ao remover StockRecord: ' + (error as Error).message,
      );
    }
  }
}
