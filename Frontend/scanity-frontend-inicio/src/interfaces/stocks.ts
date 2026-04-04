export interface Stock {
  id?: string | null;
  product_id: string | null;
  current_quantity: number | null;
  min_quantity: number | null;
  created_at?: string;
  updated_at?: string;
}
