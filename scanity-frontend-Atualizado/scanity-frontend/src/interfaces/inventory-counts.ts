export interface InventoryCount {
  id?: string | null;
  product_id: string | null;
  counted_quantity: number | null;
  stock_quantity: number | null;
  status: string | null;
  observation?: string | null;
  user_id: string | null;
  created_at?: string;
  updated_at?: string;
}
