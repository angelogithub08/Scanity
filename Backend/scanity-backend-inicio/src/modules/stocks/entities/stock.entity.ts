export interface Stock {
  id: string;
  product_id: string;
  current_quantity: number;
  min_quantity: number;
  created_at?: Date;
  updated_at?: Date;
  product_thumbnail_path?: string;
}
