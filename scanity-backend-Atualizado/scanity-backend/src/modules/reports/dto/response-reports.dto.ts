interface ReportParamsBase {
  account_id?: string;
}

export interface StockBelowMinimumReportParams extends ReportParamsBase {
  search?: string;
  product_id?: string;
  category_id?: string;
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

export interface StockProductsReportParams extends ReportParamsBase {
  search?: string;
  product_id?: string;
  category_id?: string;
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

export interface StockMovementsReportParams extends ReportParamsBase {
  barcode?: string;
  product_id?: string;
  type?: string;
  user_id?: string;
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
}

/**
 * Response do endpoint GET /reports/stock-movements.
 */
export interface StockMovementsReportResponse {
  data: StockMovementsReportItem[];
}

export interface MostMovedProductsReportParams extends ReportParamsBase {
  search?: string;
  product_id?: string;
  category_id?: string;
  type?: string;
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
