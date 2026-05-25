import { Request } from 'express';

/**
 * Obtém o IP real do cliente, considerando proxies e load balancers
 * @param req Objeto Request do Express
 * @returns IP do cliente ou '127.0.0.1' como fallback
 */
export function getClientIp(req: Request): string {
  // Verifica o header x-forwarded-for (pode conter múltiplos IPs separados por vírgula)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    // Pega o primeiro IP da lista (IP original do cliente)
    const firstIp = ips.split(',')[0].trim();
    if (firstIp) {
      return firstIp;
    }
  }

  // Verifica o header x-real-ip (comum em nginx)
  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    const ip = Array.isArray(realIp) ? realIp[0] : realIp;
    if (ip) {
      return ip;
    }
  }

  // Verifica o header cf-connecting-ip (Cloudflare)
  const cfConnectingIp = req.headers['cf-connecting-ip'];
  if (cfConnectingIp) {
    const ip = Array.isArray(cfConnectingIp)
      ? cfConnectingIp[0]
      : cfConnectingIp;
    if (ip) {
      return ip;
    }
  }

  // Fallback para o IP da conexão direta
  const socketIp = req.socket?.remoteAddress;
  if (socketIp) {
    // Remove o prefixo ::ffff: do IPv4 mapeado em IPv6
    return socketIp.replace(/^::ffff:/, '');
  }

  // Último fallback
  return '127.0.0.1';
}
