export interface StockRecord {
  id: string;
  stock_id: string;
  quantity: number;
  type: string;
  observation: string;
  user_id: string;
  movement_stage_id?: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}
