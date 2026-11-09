import 'server-only';
import crypto from 'crypto';

function secret() {
  const s = process.env.KEY_ENCRYPTION_SECRET;
  if (!s || !/^[0-9a-fA-F]{64}$/.test(s)) throw new Error('KEY_ENCRYPTION_SECRET must be 64 hex characters');
  return Buffer.from(s, 'hex');
}

export function normalizeKey(raw: string) {
  return raw.trim().toUpperCase();
}

export function isValidKeyFormat(k: string) {
  return /^[A-Z0-9]{5}(-[A-Z0-9]{5}){4}$/.test(k);
}

export function encryptKey(plain: string) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', secret(), iv);
  const enc = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString('base64')).join('.');
}

export function decryptKey(payload: string) {
  const [iv, tag, enc] = payload.split('.').map((s) => Buffer.from(s, 'base64'));
  const d = crypto.createDecipheriv('aes-256-gcm', secret(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(enc), d.final()]).toString('utf8');
}

export function hashKey(plain: string) {
  return crypto.createHash('sha256').update(normalizeKey(plain)).digest('hex');
}

export function maskKey(k: string) {
  return k.replace(/^(.{5}).*(.{5})$/, '$1-•••••-•••••-•••••-$2');
}
