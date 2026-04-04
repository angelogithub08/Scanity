export interface Product {
  id?: string | null;
  name: string | null;
  value: number | null;
  barcode?: string | null;
  description?: string | null;
  account_id: string | null;
  category_id?: string | null;
  thumbnail_path?: string | null;
  created_at?: string;
  updated_at?: string;
}
