export interface Token {
  id?: string | null;
  type: string | null;
  token: string | null;
  account_id: string | null;
  revoked_at: string | null;
  created_at?: string;
  updated_at?: string;

  user_id?: string | null;
  user_name?: string | null;
}
