export interface Stock {
  id?: string | null;
  product_id: string | null;
  current_quantity: number | null;
  min_quantity: number | null;
  product_name?: string;
  product_barcode?: string;
  product_thumbnail_path?: string;
  product_image?: string;
  created_at?: string;
  updated_at?: string;
}
