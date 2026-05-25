export interface Notification {
  id?: string | null;
  key: string | null;
  message: string | null;
  data?: any;
  account_id?: string | null;
  user_id?: string | null;
  read_at?: string | null;
  created_at?: string;
  updated_at?: string;
}
