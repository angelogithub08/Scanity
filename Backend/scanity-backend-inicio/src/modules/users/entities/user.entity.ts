export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  token: string;
  account_id: string;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;

  account_name?: string;
  account_type?: string;
}
