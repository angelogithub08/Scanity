export interface Profile {
  id: string;
  name: string;
  key: string;
  account_id: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}
