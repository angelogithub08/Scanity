export interface StockRecord {
  id?: string | null;
  stock_id: string | null;
  quantity: number | null;
  type: string | null;
  observation?: string | null;
  user_id?: string | null;
  /** Nome do usuário que fez a movimentação (vindo do backend via join, somente leitura) */
  user_name?: string | null;
  movement_stage_id?: string | null;
  /** Nome da etapa (vindo do backend via join, somente leitura) */
  movement_stage_name?: string | null;
  created_at?: string;
  updated_at?: string;
}
