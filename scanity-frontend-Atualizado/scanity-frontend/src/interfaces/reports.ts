/**
 * Parâmetros base reutilizados por todos os relatórios.
 * Cada relatório estende esta interface adicionando seus filtros específicos.
 */
export interface ReportParamsBase {
  account_id?: string;
}

/**
 * Parâmetros do relatório Produtos em estoque e quantidade.
 */
export interface StockProductsReportParams extends ReportParamsBase {
  search?: string | null;
  product_id?: string | null;
  category_id?: string | null;
}

/**
 * Item retornado por linha do relatório Produtos em estoque e quantidade.
 */
export interface StockProductsReportItem {
  product_id: string;
  product_name: string;
  current_quantity: number;
  min_quantity: number;
  category_name: string | null;
  barcode: string | null;
}

/**
 * Response do endpoint GET /reports/stock-products.
 */
export interface StockProductsReportResponse {
  data: StockProductsReportItem[];
}

/**
 * Parâmetros do relatório Produtos abaixo do estoque mínimo.
 */
export interface StockBelowMinimumReportParams extends ReportParamsBase {
  search?: string | null;
  product_id?: string | null;
  category_id?: string | null;
}

/**
 * Item retornado por linha do relatório Produtos abaixo do estoque mínimo.
 */
export interface StockBelowMinimumReportItem {
  product_id: string;
  product_name: string;
  current_quantity: number;
  min_quantity: number;
  category_name: string | null;
  barcode: string | null;
}

/**
 * Response do endpoint GET /reports/stock-below-minimum.
 */
export interface StockBelowMinimumReportResponse {
  data: StockBelowMinimumReportItem[];
}

/**
 * Parâmetros do relatório Movimentações de estoque.
 */
export interface StockMovementsReportParams extends ReportParamsBase {
  barcode?: string | null;
  product_id?: string | null;
  type?: string | null;
  user_id?: string | null;
}

/**
 * Item retornado por linha do relatório Movimentações de estoque.
 */
export interface StockMovementsReportItem {
  barcode: string | null;
  product_name: string;
  type: string;
  quantity: number;
  user_name: string | null;
  created_at: string | null;
}

/**
 * Response do endpoint GET /reports/stock-movements.
 */
export interface StockMovementsReportResponse {
  data: StockMovementsReportItem[];
}

/**
 * Parâmetros do relatório Produtos mais movimentados.
 */
export interface MostMovedProductsReportParams extends ReportParamsBase {
  search?: string | null;
  product_id?: string | null;
  category_id?: string | null;
  type?: string | null;
}

/**
 * Item retornado por linha do relatório Produtos mais movimentados.
 */
export interface MostMovedProductsReportItem {
  product_id: string;
  product_name: string;
  category_name: string | null;
  barcode: string | null;
  entries_quantity: number;
  exits_quantity: number;
  total_quantity: number;
  movements_count: number;
}

/**
 * Response do endpoint GET /reports/most-moved-products.
 */
export interface MostMovedProductsReportResponse {
  data: MostMovedProductsReportItem[];
}
