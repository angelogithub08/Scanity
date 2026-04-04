export interface Account {
  id?: string | null;
  name: string | null;
  email: string | null;
  phone?: string | null;
  document?: string | null;
  zipcode?: string | null;
  address_number?: string | null;
  type?: 'ADMIN' | 'USER' | null;
  plan_id?: string | null;
  gateway_customer_id?: string | null;
  ia_token?: string | null;
  confirmed_at?: string;
  created_at?: string;
  updated_at?: string;
}
