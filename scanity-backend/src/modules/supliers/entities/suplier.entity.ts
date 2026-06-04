export interface Suplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  responsible_name: string;
  observations?: string;
  account_id: string;
  created_at?: Date;
  updated_at?: Date;
}
