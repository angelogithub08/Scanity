export interface Permission {
  id: string;
  name: string;
  key_group: string;
  key: string;
  created_at?: Date;
  updated_at?: Date;
}
