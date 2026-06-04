export interface ChatHistory {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  account_id: string;
  created_at?: Date;
  updated_at?: Date;
}
