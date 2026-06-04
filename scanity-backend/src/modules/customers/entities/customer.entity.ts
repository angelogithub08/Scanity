export interface Customer {
  id: string;
  name: string;
  document: string;
  phone: string;
  email: string;
  street: string;
  number: string;
  city: string;
  state: string;
  neighborhood: string;
  zipcode: string;
  complement: string;
  account_id: string;
  created_at?: Date;
  updated_at?: Date;
}
