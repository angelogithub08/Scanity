import { api } from 'src/boot/axios';
import type { User } from 'src/interfaces/users';

// Interface para os dados de login
interface LoginCredentials {
  email: string;
  password: string;
}
// Interface para redefinição de senha
interface NewPasswordData {
  token: string;
  password: string;
}

export function useAuthResource() {
  function getToken() {
    return localStorage.getItem('token');
  }

  function getRefreshToken() {
    return localStorage.getItem('refresh_token');
  }

  function setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem('token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  /**
   * Realiza o login do usuário (pode retornar requires_two_factor para 2FA)
   * @param credentials Email e senha do usuário
   * @returns Promise com a resposta da API (access_token/refresh_token ou requires_two_factor)
   */
  function login(credentials: LoginCredentials) {
    return api.post<{
      access_token?: string;
      refresh_token?: string;
      requires_two_factor?: boolean;
    }>('/auth/login', credentials);
  }

  /**
   * Confirma o login com o código de 6 dígitos enviado por e-mail (2FA)
   * @param email E-mail do usuário
   * @param code Código de 6 dígitos
   * @returns Promise com access_token e refresh_token
   */
  function verifyTwoFactor(email: string, code: string) {
    return api.post<{ access_token: string; refresh_token: string }>('/auth/verify-2fa', {
      email,
      code,
    });
  }

  /**
   * Renova o access token usando o refresh token
   * @returns Promise com os novos tokens
   */
  function refreshToken(
    user_id: string,
  ): Promise<{ data: { user: User; access_token: string; refresh_token: string } }> {
    const refresh_token = getRefreshToken();
    if (!refresh_token) {
      return Promise.reject(new Error('Refresh token não encontrado'));
    }
    return api.post('/auth/refresh', { refresh_token, user_id });
  }

  /**
   * Obtém os dados do usuário logado
   * @returns Promise com os dados do usuário
   */
  function getMe(): Promise<{ data: User }> {
    return api.get<User>('/auth/me') as any;
  }

  /**
   * Solicita token de recuperação de senha
   * @param email Email do usuário
   * @returns Promise com a resposta da API
   */
  function recoveryPassword(email: string) {
    return api.post('/auth/recovery-password', { email });
  }

  /**
   * Define uma nova senha usando o token de recuperação
   * @param data Objeto contendo o token e a nova senha
   * @returns Promise com a resposta da API
   */
  function newPassword(data: NewPasswordData) {
    return api.post('/auth/new-password', data);
  }

  /**
   * Faz logout do usuário
   */
  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('userData');
    // Limpa outros dados de sessão se necessário
  }

  function generateTmpToken(data: { ttl: number }) {
    return api.post('/auth/generate-tmp-token', data);
  }

  return {
    getToken,
    getRefreshToken,
    setTokens,
    login,
    verifyTwoFactor,
    refreshToken,
    getMe,
    recoveryPassword,
    newPassword,
    logout,
    generateTmpToken,
  };
}
