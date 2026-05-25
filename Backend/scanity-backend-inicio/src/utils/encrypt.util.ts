import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';

export async function generateHash(str: string): Promise<string> {
  const saltOrRounds = 10;
  return await bcrypt.hash(str, saltOrRounds);
}

export async function compare(str: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(str, hash);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function generateEmailHash(email: string): string {
  const normalizedEmail = normalizeEmail(email);
  const secret = process.env.EMAIL_HASH_SECRET || process.env.JWT_SECRET || '';

  return createHash('sha256')
    .update(`${secret}:${normalizedEmail}`)
    .digest('hex');
}
