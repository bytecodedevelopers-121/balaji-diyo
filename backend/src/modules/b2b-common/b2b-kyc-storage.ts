import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';
import { PRIVATE_ROOT } from '../../config/storage';
import { ApiError } from '../../common/exceptions/api-error';
import { sanitizePathSegment } from '../../lib/sanitize';

const KYC_ROOT = path.join(PRIVATE_ROOT, 'b2b-kyc');

const EXT_BY_MIME: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

// The multer mimetype is client-supplied, and registration is anonymous, so
// also require the file's leading bytes to match the claimed type.
const hasValidSignature = (mime: string, b: Buffer): boolean => {
  switch (EXT_BY_MIME[mime]) {
    case 'pdf': return b.subarray(0, 5).toString('latin1') === '%PDF-';
    case 'jpg': return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    case 'png': return b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case 'webp': return b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP';
    default: return false;
  }
};

export interface StoredKycFile {
  /** Storage key relative to the private root's b2b-kyc folder — NOT a public URL. Served only via authorized endpoints. */
  fileUrl: string;
  fileName: string;
}

export class KycStorage {
  async save(partnerId: string, file: Express.Multer.File): Promise<StoredKycFile> {
    const ext = EXT_BY_MIME[file.mimetype];
    if (!ext || !hasValidSignature(file.mimetype, file.buffer)) {
      throw new ApiError(400, 'Invalid KYC file. Allowed: PDF, JPG, PNG, WebP');
    }
    const key = `${sanitizePathSegment(partnerId)}/${randomUUID()}.${ext}`;
    const resolved = this.resolve(key);
    await fs.mkdir(path.dirname(resolved), { recursive: true });
    await fs.writeFile(resolved, file.buffer);
    const baseName = sanitizePathSegment(path.basename(file.originalname, path.extname(file.originalname))).slice(0, 80) || 'document';
    return { fileUrl: key, fileName: `${baseName}.${ext}` };
  }

  /** Absolute path for a stored key, refusing anything that escapes the KYC folder. */
  resolve(key: string): string {
    const resolved = path.resolve(KYC_ROOT, key);
    if (!resolved.startsWith(KYC_ROOT + path.sep)) throw new ApiError(403, 'Access denied');
    return resolved;
  }

  async removeQuietly(keys: string[]): Promise<void> {
    await Promise.all(keys.map((k) => fs.rm(this.resolve(k), { force: true }).catch(() => undefined)));
  }
}
