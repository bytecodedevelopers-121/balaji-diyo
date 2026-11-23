import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

// Webhook signing secrets must be recoverable (the server signs with them), so they are encrypted at
// rest rather than hashed. Set B2B_SECRET_ENCRYPTION_KEY in production; JWT_SECRET is the fallback so
// the feature works out of the box. Rotating that key requires re-issuing the endpoint secrets.
const key = (): Buffer => {
  const material = process.env.B2B_SECRET_ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!material) throw new Error('B2B_SECRET_ENCRYPTION_KEY (or JWT_SECRET) is not configured');
  return createHash('sha256').update(`b2b-webhook-secret:${material}`).digest();
};

const PREFIX = 'enc:v1:';

export const encryptSecret = (plain: string): string => {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return `${PREFIX}${iv.toString('base64url')}:${cipher.getAuthTag().toString('base64url')}:${ct.toString('base64url')}`;
};

export const decryptSecret = (stored: string): string => {
  if (!stored.startsWith(PREFIX)) throw new Error('Unrecognised secret format');
  const [iv, tag, ct] = stored.slice(PREFIX.length).split(':');
  if (!iv || !tag || !ct) throw new Error('Corrupt secret');
  const decipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(ct, 'base64url')), decipher.final()]).toString('utf8');
};
