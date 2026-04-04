export interface Notification {
  id: string;
  key: string;
  message: string;
  data: string;
  account_id: string;
  user_id: string;
  read_at: string;
  created_at?: Date;
  updated_at?: Date;
}
