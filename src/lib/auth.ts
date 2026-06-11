import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { sql } from './db';

const SCRYPT_SALT_LENGTH = 16;
const SCRYPT_KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(SCRYPT_SALT_LENGTH).toString('hex');
  const derivedKey = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString('hex');
  return `${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, hash: string): boolean {
  const [salt, key] = hash.split(':');
  const keyBuffer = Buffer.from(key, 'hex');
  const derivedKey = scryptSync(password, salt, SCRYPT_KEY_LENGTH);
  return timingSafeEqual(keyBuffer, derivedKey);
}

export async function createSession(userId: string) {
  const sessionId = randomBytes(32).toString('hex');
  // 7 days from now
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await sql`
    INSERT INTO auth_sessions (id, user_id, expires_at)
    VALUES (${sessionId}, ${userId}, ${expiresAt.toISOString()})
  `;

  const cookieStore = await cookies();
  cookieStore.set('session', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });

  return sessionId;
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;
  
  if (!sessionId) return null;

  const results = await sql`
    SELECT u.id, u.email
    FROM auth_sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = ${sessionId} AND s.expires_at > NOW()
  `;

  if (results.length === 0) return null;
  return results[0];
}

export async function clearSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;
  
  if (sessionId) {
    await sql`DELETE FROM auth_sessions WHERE id = ${sessionId}`;
  }
  
  cookieStore.delete('session');
}
