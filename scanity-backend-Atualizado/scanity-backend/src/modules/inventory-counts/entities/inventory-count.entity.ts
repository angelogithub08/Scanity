export interface InventoryCount {
  id: string;
  product_id: string;
  counted_quantity: number;
  stock_quantity: number;
  status: string;
  observation: string;
  user_id: string;
  created_at?: Date;
  updated_at?: Date;
}
