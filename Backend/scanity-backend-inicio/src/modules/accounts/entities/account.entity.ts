export interface Account {
  id: string;
  name: string;
  email: string;
  phone?: string;
  document?: string;
  zipcode?: string;
  address_number?: string;
  type?: string; /// ADMIN, USER
  plan_id?: string;
  gateway_customer_id?: string;
  ia_token?: string;
  confirmed_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export enum AccountType {
  ADMIN = 'ADMIN',
  USER = 'USER',
}
