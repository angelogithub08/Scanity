export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  account_id: string;
  admin: boolean;
  // Adicione aqui outros campos que você inclui no token JWT
}
