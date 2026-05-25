export interface StockRecord {
  id?: string | null;
  stock_id: string | null;
  quantity: number | null;
  type: string | null;
  observation?: string | null;
  user_id?: string | null;
  created_at?: string;
  updated_at?: string;
}
