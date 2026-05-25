import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { ReportsRepository } from './reports.repository';
import type {
  StockBelowMinimumReportParams,
  StockBelowMinimumReportResponse,
  StockProductsReportParams,
  StockProductsReportResponse,
  StockMovementsReportParams,
  StockMovementsReportResponse,
  MostMovedProductsReportParams,
  MostMovedProductsReportResponse,
} from './dto/response-reports.dto';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly reportsRepository: ReportsRepository) {}

  /**
   * Relatório: Produtos em estoque e quantidade (JSON).
   */
  async getStockProducts(
    params: StockProductsReportParams & { account_id: string },
  ): Promise<StockProductsReportResponse> {
    try {
      const data = await this.reportsRepository.getStockProductsData(params);
      return { data };
    } catch (error) {
      this.logger.error(
        `Erro ao gerar relatório stock-products: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao gerar relatório de produtos em estoque: ' +
          (error as Error).message,
      );
    }
  }

  /**
   * Relatório: Produtos em estoque e quantidade (Excel).
   * Monta o arquivo em memória e retorna o buffer para stream (não salva no backend).
   */
  async getStockProductsExcel(
    params: StockProductsReportParams & { account_id: string },
  ): Promise<Buffer> {
    try {
      const data = await this.reportsRepository.getStockProductsData(params);

      const headers = [
        'Produto',
        'Quantidade atual',
        'Quantidade mínima',
        'Categoria',
        'Código de barras',
      ];
      const rows = data.map((item) => [
        item.product_name,
        item.current_quantity,
        item.min_quantity,
        item.category_name ?? '',
        item.barcode ?? '',
      ]);

      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Produtos em estoque');

      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      return buf as Buffer;
    } catch (error) {
      this.logger.error(
        `Erro ao exportar Excel stock-products: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao exportar relatório para Excel: ' + (error as Error).message,
      );
    }
  }

  /**
   * Relatório: Produtos abaixo do estoque mínimo (JSON).
   */
  async getStockBelowMinimum(
    params: StockBelowMinimumReportParams & { account_id: string },
  ): Promise<StockBelowMinimumReportResponse> {
    try {
      const data =
        await this.reportsRepository.getStockBelowMinimumData(params);
      return { data };
    } catch (error) {
      this.logger.error(
        `Erro ao gerar relatório stock-below-minimum: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao gerar relatório de produtos abaixo do estoque mínimo: ' +
          (error as Error).message,
      );
    }
  }

  /**
   * Relatório: Produtos abaixo do estoque mínimo (Excel).
   */
  async getStockBelowMinimumExcel(
    params: StockBelowMinimumReportParams & { account_id: string },
  ): Promise<Buffer> {
    try {
      const data =
        await this.reportsRepository.getStockBelowMinimumData(params);

      const headers = [
        'Produto',
        'Quantidade atual',
        'Quantidade mínima',
        'Categoria',
        'Código de barras',
      ];
      const rows = data.map((item) => [
        item.product_name,
        item.current_quantity,
        item.min_quantity,
        item.category_name ?? '',
        item.barcode ?? '',
      ]);

      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Produtos abaixo do mínimo');

      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      return buf as Buffer;
    } catch (error) {
      this.logger.error(
        `Erro ao exportar Excel stock-below-minimum: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao exportar relatório para Excel: ' + (error as Error).message,
      );
    }
  }

  /**
   * Relatório: Movimentações de estoque (JSON).
   */
  async getStockMovements(
    params: StockMovementsReportParams & { account_id: string },
  ): Promise<StockMovementsReportResponse> {
    try {
      const data = await this.reportsRepository.getStockMovementsData(params);
      return { data };
    } catch (error) {
      this.logger.error(
        `Erro ao gerar relatório stock-movements: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao gerar relatório de movimentações de estoque: ' +
          (error as Error).message,
      );
    }
  }

  /**
   * Relatório: Movimentações de estoque (Excel).
   * Monta o arquivo em memória e retorna o buffer para stream.
   */
  async getStockMovementsExcel(
    params: StockMovementsReportParams & { account_id: string },
  ): Promise<Buffer> {
    try {
      const data = await this.reportsRepository.getStockMovementsData(params);

      const headers = [
        'Código de barras',
        'Produto',
        'Tipo de movimentação',
        'Quantidade',
        'Usuário',
      ];
      const rows = data.map((item) => [
        item.barcode ?? '',
        item.product_name,
        item.type,
        item.quantity,
        item.user_name ?? '',
      ]);

      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Movimentações de estoque');

      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      return buf as Buffer;
    } catch (error) {
      this.logger.error(
        `Erro ao exportar Excel stock-movements: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao exportar relatório para Excel: ' + (error as Error).message,
      );
    }
  }

  /**
   * Relatório: Produtos mais movimentados (JSON).
   */
  async getMostMovedProducts(
    params: MostMovedProductsReportParams & { account_id: string },
  ): Promise<MostMovedProductsReportResponse> {
    try {
      const data =
        await this.reportsRepository.getMostMovedProductsData(params);
      return { data };
    } catch (error) {
      this.logger.error(
        `Erro ao gerar relatório most-moved-products: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao gerar relatório de produtos mais movimentados: ' +
          (error as Error).message,
      );
    }
  }

  /**
   * Relatório: Produtos mais movimentados (Excel).
   */
  async getMostMovedProductsExcel(
    params: MostMovedProductsReportParams & { account_id: string },
  ): Promise<Buffer> {
    try {
      const data =
        await this.reportsRepository.getMostMovedProductsData(params);

      const headers = [
        'Produto',
        'Categoria',
        'Código de barras',
        'Total de entradas',
        'Total de saídas',
        'Total movimentado',
        'Total de movimentações',
      ];
      const rows = data.map((item) => [
        item.product_name,
        item.category_name ?? '',
        item.barcode ?? '',
        item.entries_quantity,
        item.exits_quantity,
        item.total_quantity,
        item.movements_count,
      ]);

      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Produtos mais movimentados');

      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      return buf as Buffer;
    } catch (error) {
      this.logger.error(
        `Erro ao exportar Excel most-moved-products: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao exportar relatório para Excel: ' + (error as Error).message,
      );
    }
  }
}
