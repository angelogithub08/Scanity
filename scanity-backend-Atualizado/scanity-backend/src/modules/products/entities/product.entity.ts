export interface Product {
  id: string;
  name: string;
  value: number;
  description?: string;
  barcode?: string;
  category_id?: string;
  account_id: string;
  thumbnail_path?: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}
