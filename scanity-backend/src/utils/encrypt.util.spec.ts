jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$10$hashedpassword'),
  compare: jest.fn().mockResolvedValue(true),
}));

import * as bcrypt from 'bcrypt';
import {
  generateHash,
  compare,
  normalizeEmail,
  generateEmailHash,
} from './encrypt.util';

describe('encrypt.util', () => {
  beforeAll(() => {
    process.env.EMAIL_HASH_SECRET = 'test-secret';
    process.env.JWT_SECRET = 'jwt-secret';
  });

  describe('generateHash', () => {
    it('should hash a string with bcrypt using 10 salt rounds', async () => {
      const result = await generateHash('password123');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(result).toBe('$2b$10$hashedpassword');
    });
  });

  describe('compare', () => {
    it('should return true for matching strings', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
      const result = await compare('password123', '$2b$10$hashedpassword');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        '$2b$10$hashedpassword',
      );
      expect(result).toBe(true);
    });

    it('should return false for non-matching strings', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
      const result = await compare('wrongpassword', '$2b$10$hashedpassword');
      expect(result).toBe(false);
    });
  });

  describe('normalizeEmail', () => {
    it('should trim whitespace', () => {
      expect(normalizeEmail('  user@test.com  ')).toBe('user@test.com');
    });

    it('should convert to lowercase', () => {
      expect(normalizeEmail('USER@TEST.COM')).toBe('user@test.com');
    });
  });

  describe('generateEmailHash', () => {
    it('should create a SHA-256 hex hash with EMAIL_HASH_SECRET', () => {
      const result = generateEmailHash('user@test.com');
      expect(result).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should use JWT_SECRET as fallback when EMAIL_HASH_SECRET is not set', () => {
      delete process.env.EMAIL_HASH_SECRET;
      const result = generateEmailHash('user@test.com');
      expect(result).toMatch(/^[a-f0-9]{64}$/);
      process.env.EMAIL_HASH_SECRET = 'test-secret';
    });
  });
});
