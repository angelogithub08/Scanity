import { api } from 'src/boot/axios';
import type { ReportParamsBase } from 'src/interfaces/reports';
import type {
  StockProductsReportParams,
  StockProductsReportResponse,
} from 'src/interfaces/reports';
import type {
  StockBelowMinimumReportParams,
  StockBelowMinimumReportResponse,
} from 'src/interfaces/reports';
import type {
  StockMovementsReportParams,
  StockMovementsReportResponse,
} from 'src/interfaces/reports';
import type {
  MostMovedProductsReportParams,
  MostMovedProductsReportResponse,
} from 'src/interfaces/reports';

/**
 * Composable reutilizado por todos os relatórios.
 * Cada relatório usa o mesmo padrão: GET /reports/{nome}?filtros
 */
export function useReportsResource() {
  /**
   * Chama um endpoint de relatório por nome.
   * @param reportName - Nome do relatório (ex: 'stock-products')
   * @param params - Parâmetros da query (filtros)
   */
  function getReport<T>(reportName: string, params?: ReportParamsBase) {
    return api.get<T>(`/reports/${reportName}`, { params });
  }

  /**
   * Relatório: Produtos em estoque e quantidade.
   */
  function getStockProducts(params?: StockProductsReportParams) {
    return getReport<StockProductsReportResponse>('stock-products', params);
  }

  /**
   * Exportar relatório Produtos em estoque (Excel).
   * Retorna o stream do arquivo (response.data é Blob).
   */
  function getStockProductsExport(params?: StockProductsReportParams) {
    return api.get<Blob>('/reports/stock-products/export', {
      params,
      responseType: 'blob',
    });
  }

  /**
   * Relatório: Produtos abaixo do estoque mínimo.
   */
  function getStockBelowMinimum(params?: StockBelowMinimumReportParams) {
    return getReport<StockBelowMinimumReportResponse>('stock-below-minimum', params);
  }

  /**
   * Exportar relatório Produtos abaixo do estoque mínimo (Excel).
   */
  function getStockBelowMinimumExport(params?: StockBelowMinimumReportParams) {
    return api.get<Blob>('/reports/stock-below-minimum/export', {
      params,
      responseType: 'blob',
    });
  }

  /**
   * Relatório: Movimentações de estoque.
   */
  function getStockMovements(params?: StockMovementsReportParams) {
    return getReport<StockMovementsReportResponse>('stock-movements', params);
  }

  /**
   * Exportar relatório Movimentações de estoque (Excel).
   */
  function getStockMovementsExport(params?: StockMovementsReportParams) {
    return api.get<Blob>('/reports/stock-movements/export', {
      params,
      responseType: 'blob',
    });
  }

  /**
   * Relatório: Produtos mais movimentados (entrada/saída).
   */
  function getMostMovedProducts(params?: MostMovedProductsReportParams) {
    return getReport<MostMovedProductsReportResponse>('most-moved-products', params);
  }

  /**
   * Exportar relatório Produtos mais movimentados (Excel).
   */
  function getMostMovedProductsExport(params?: MostMovedProductsReportParams) {
    return api.get<Blob>('/reports/most-moved-products/export', {
      params,
      responseType: 'blob',
    });
  }

  return {
    getReport,
    getStockProducts,
    getStockProductsExport,
    getStockBelowMinimum,
    getStockBelowMinimumExport,
    getStockMovements,
    getStockMovementsExport,
    getMostMovedProducts,
    getMostMovedProductsExport,
  };
}
