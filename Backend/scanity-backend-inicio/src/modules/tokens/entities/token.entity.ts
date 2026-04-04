export enum TokenType {
  REFRESH_TOKEN = 'REFRESH_TOKEN',
  ACCESS_TOKEN = 'ACCESS_TOKEN',
  ACCOUNT_CONFIRMATION_TOKEN = 'ACCOUNT_CONFIRMATION_TOKEN',
  ACCOUNT_DELETION_TOKEN = 'ACCOUNT_DELETION_TOKEN',
}

export interface Token {
  id: string;
  type: TokenType;
  token: string;
  account_id: string;
  user_id?: string | null;
  revoked_at?: string | null;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}
