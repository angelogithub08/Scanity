export interface PlanBenefit {
  id?: string | null;
  plan_id: string | null;
  benefit: string | null;
  quantity: number | null;
  created_at?: string;
  updated_at?: string;
}
