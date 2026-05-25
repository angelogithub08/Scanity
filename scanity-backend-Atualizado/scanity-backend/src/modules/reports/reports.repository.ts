import { Inject, Injectable, Logger } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../../infra/database/database.providers';
import type {
  StockBelowMinimumReportParams,
  StockBelowMinimumReportItem,
  StockProductsReportParams,
  StockProductsReportItem,
  StockMovementsReportParams,
  StockMovementsReportItem,
  MostMovedProductsReportParams,
  MostMovedProductsReportItem,
} from './dto/response-reports.dto';
@Injectable()
export class ReportsRepository {
  private readonly logger = new Logger(ReportsRepository.name);

  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  /**
   * Relatório: Produtos em estoque e quantidade.
   * Retorna dados brutos do banco (join products, stocks, categories).
   */
  async getStockProductsData(
    params: StockProductsReportParams & { account_id: string },
  ): Promise<StockProductsReportItem[]> {
    const { account_id, search, product_id, category_id } = params;

    let query = this.knex('stocks')
      .select(
        'products.id as product_id',
        'products.name as product_name',
        'stocks.current_quantity as current_quantity',
        'stocks.min_quantity as min_quantity',
        'categories.name as category_name',
        'products.barcode as barcode',
      )
      .innerJoin('products', 'stocks.product_id', 'products.id')
      .leftJoin('categories', 'products.category_id', 'categories.id')
      .whereNull('products.deleted_at')
      .where('products.account_id', account_id);

    if (search) {
      query = query.where(function () {
        this.where('products.name', 'ilike', `%${search}%`).orWhere(
          'products.barcode',
          'ilike',
          `%${search}%`,
        );
      });
    }
    if (product_id) {
      query = query.where('products.id', product_id);
    }
    if (category_id) {
      query = query.where('products.category_id', category_id);
    }

    const data = (await query.orderBy(
      'products.name',
      'asc',
    )) as StockProductsReportItem[];

    this.logger.debug(
      `Relatório stock-products: ${data.length} registros para account_id=${account_id}`,
    );

    return data;
  }

  /**
   * Relatório: Produtos abaixo do estoque mínimo.
   * Retorna produtos onde current_quantity < min_quantity.
   */
  async getStockBelowMinimumData(
    params: StockBelowMinimumReportParams & { account_id: string },
  ): Promise<StockBelowMinimumReportItem[]> {
    const { account_id, search, product_id, category_id } = params;

    let query = this.knex('stocks')
      .select(
        'products.id as product_id',
        'products.name as product_name',
        'stocks.current_quantity as current_quantity',
        'stocks.min_quantity as min_quantity',
        'categories.name as category_name',
        'products.barcode as barcode',
      )
      .innerJoin('products', 'stocks.product_id', 'products.id')
      .leftJoin('categories', 'products.category_id', 'categories.id')
      .whereNull('products.deleted_at')
      .where('products.account_id', account_id)
      .whereRaw('stocks.current_quantity < stocks.min_quantity');

    if (search) {
      query = query.where(function () {
        this.where('products.name', 'ilike', `%${search}%`).orWhere(
          'products.barcode',
          'ilike',
          `%${search}%`,
        );
      });
    }
    if (product_id) {
      query = query.where('products.id', product_id);
    }
    if (category_id) {
      query = query.where('products.category_id', category_id);
    }

    const data = (await query.orderBy(
      'products.name',
      'asc',
    )) as StockBelowMinimumReportItem[];

    this.logger.debug(
      `Relatório stock-below-minimum: ${data.length} registros para account_id=${account_id}`,
    );

    return data;
  }

  /**
   * Relatório: Movimentações de estoque.
   * Retorna stock_records com barcode, nome do produto, tipo, quantidade e nome do usuário.
   */
  async getStockMovementsData(
    params: StockMovementsReportParams & { account_id: string },
  ): Promise<StockMovementsReportItem[]> {
    const { account_id, barcode, product_id, type, user_id } = params;

    let query = this.knex('stock_records')
      .select(
        'products.barcode as barcode',
        'products.name as product_name',
        'stock_records.type as type',
        'users.name as user_name',
        this.knex.raw('ABS(stock_records.quantity) as quantity'),
        'stock_records.created_at as created_at',
      )
      .innerJoin('stocks', 'stock_records.stock_id', 'stocks.id')
      .innerJoin('products', 'stocks.product_id', 'products.id')
      .leftJoin('users', 'stock_records.user_id', 'users.id')
      .whereNull('stock_records.deleted_at')
      .whereNull('products.deleted_at')
      .where('products.account_id', account_id);

    if (barcode) {
      query = query.where('products.barcode', 'ilike', `%${barcode}%`);
    }
    if (product_id) {
      query = query.where('products.id', product_id);
    }
    if (type) {
      query = query.where('stock_records.type', type);
    }
    if (user_id) {
      query = query.where('stock_records.user_id', user_id);
    }

    const data = (await query.orderBy(
      'stock_records.created_at',
      'desc',
    )) as StockMovementsReportItem[];

    this.logger.debug(
      `Relatório stock-movements: ${data.length} registros para account_id=${account_id}`,
    );

    return data;
  }

  /**
   * Relatório: Produtos mais movimentados (entrada/saída).
   * Agrega movimentações por produto com totais de entrada, saída e movimentação geral.
   */
  async getMostMovedProductsData(
    params: MostMovedProductsReportParams & { account_id: string },
  ): Promise<MostMovedProductsReportItem[]> {
    const { account_id, search, product_id, category_id, type } = params;

    let query = this.knex('stock_records')
      .select(
        'products.id as product_id',
        'products.name as product_name',
        'categories.name as category_name',
        'products.barcode as barcode',
        this.knex.raw(
          "COALESCE(SUM(CASE WHEN stock_records.type = 'ENTRADA' THEN ABS(stock_records.quantity) ELSE 0 END), 0) as entries_quantity",
        ),
        this.knex.raw(
          "COALESCE(SUM(CASE WHEN stock_records.type = 'SAIDA' THEN ABS(stock_records.quantity) ELSE 0 END), 0) as exits_quantity",
        ),
        this.knex.raw(
          'COALESCE(SUM(ABS(stock_records.quantity)), 0) as total_quantity',
        ),
        this.knex.raw('COUNT(stock_records.id) as movements_count'),
      )
      .innerJoin('stocks', 'stock_records.stock_id', 'stocks.id')
      .innerJoin('products', 'stocks.product_id', 'products.id')
      .leftJoin('categories', 'products.category_id', 'categories.id')
      .whereNull('stock_records.deleted_at')
      .whereNull('products.deleted_at')
      .where('products.account_id', account_id)
      .groupBy(
        'products.id',
        'products.name',
        'categories.name',
        'products.barcode',
      );

    if (search) {
      query = query.where(function () {
        this.where('products.name', 'ilike', `%${search}%`).orWhere(
          'products.barcode',
          'ilike',
          `%${search}%`,
        );
      });
    }
    if (product_id) {
      query = query.where('products.id', product_id);
    }
    if (category_id) {
      query = query.where('products.category_id', category_id);
    }
    if (type) {
      query = query.where('stock_records.type', type);
    }

    const data = (await query
      .orderBy('total_quantity', 'desc')
      .orderBy('movements_count', 'desc')
      .orderBy('products.name', 'asc')) as MostMovedProductsReportItem[];

    this.logger.debug(
      `Relatório most-moved-products: ${data.length} registros para account_id=${account_id}`,
    );

    return data;
  }
}
