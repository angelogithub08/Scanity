export interface User {
  id?: string | null;
  name: string | null;
  email: string | null;
  password: string | null;
  account_id: string | null;
  profile_id: string | null;
  token?: string | null;
  is_active?: boolean | null;
  created_at?: string;
  updated_at?: string;

  account_name?: string | null;
  account_type?: 'ADMIN' | 'USER' | null;

  subscribed_to_free_plan?: boolean | null;
  subscribed_to_paid_plan?: boolean | null;
}
