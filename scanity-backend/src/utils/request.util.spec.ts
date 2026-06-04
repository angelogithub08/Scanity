import { Request } from 'express';
import { getClientIp } from './request.util';

const mockReq = (headers: Record<string, any>, socketIp?: string) =>
  ({
    headers,
    socket: { remoteAddress: socketIp },
  }) as unknown as Request;

describe('getClientIp', () => {
  it('should return IP from x-forwarded-for header (first IP from comma-separated list)', () => {
    const req = mockReq({
      'x-forwarded-for': '192.168.1.1, 10.0.0.1, 172.16.0.1',
    });
    expect(getClientIp(req)).toBe('192.168.1.1');
  });

  it('should return IP from x-real-ip header', () => {
    const req = mockReq({ 'x-real-ip': '10.0.0.1' });
    expect(getClientIp(req)).toBe('10.0.0.1');
  });

  it('should return IP from cf-connecting-ip header (Cloudflare)', () => {
    const req = mockReq({ 'cf-connecting-ip': '203.0.113.1' });
    expect(getClientIp(req)).toBe('203.0.113.1');
  });

  it('should return IP from req.socket.remoteAddress', () => {
    const req = mockReq({}, '192.168.1.100');
    expect(getClientIp(req)).toBe('192.168.1.100');
  });

  it('should strip ::ffff: prefix from IPv4-mapped IPv6 addresses', () => {
    const req = mockReq({}, '::ffff:192.168.1.1');
    expect(getClientIp(req)).toBe('192.168.1.1');
  });

  it("should return '127.0.0.1' when no IP is found", () => {
    const req = mockReq({});
    expect(getClientIp(req)).toBe('127.0.0.1');
  });
});
