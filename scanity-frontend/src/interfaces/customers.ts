export interface Customer {
  id?: string | null;
  name: string | null;
  document?: string | null;
  phone?: string | null;
  email?: string | null;
  street?: string | null;
  number?: string | null;
  city?: string | null;
  state?: string | null;
  neighborhood?: string | null;
  zipcode?: string | null;
  complement?: string | null;
  account_id: string | null;
  created_at?: string;
  updated_at?: string;
}
