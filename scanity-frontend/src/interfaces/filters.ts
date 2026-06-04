export interface Filters {
  name?: string;
  interest_level?: number;
  value_from?: number;
  value_to?: number;
  area_id?: string;
  origin_id?: string;
  user_id?: string;
  lost_reason_id?: string;
  archived?: boolean;
  type?: string;
  created_at_from?: string;
  created_at_to?: string;
}
