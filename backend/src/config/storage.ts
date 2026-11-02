import path from 'path';
import fs from 'fs/promises';

export const UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads');
export const PUBLIC_ROOT = path.join(UPLOAD_ROOT, 'public');
export const PRIVATE_ROOT = path.join(UPLOAD_ROOT, 'private');

export async function ensureUploadFolders(): Promise<void> {
  await fs.mkdir(PUBLIC_ROOT, { recursive: true });
  await fs.mkdir(PRIVATE_ROOT, { recursive: true });
}
