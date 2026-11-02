// ══════════════════════════════════════════════════════════════════════════════
// OLD FilesService (Supabase storage) — kept for future reference
// ══════════════════════════════════════════════════════════════════════════════
/*
import { supabaseAdmin, STORAGE_BUCKET_PRIVATE, SIGNED_URL_EXPIRY } from '../../config/supabase';
import { ApiError } from '../../common/exceptions/api-error';

export class FilesService {
  async getSignedUrl(path: string): Promise<string> {
    const { data, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET_PRIVATE)
      .createSignedUrl(path, SIGNED_URL_EXPIRY);

    if (error || !data?.signedUrl) throw new ApiError(500, 'Failed to generate signed URL');

    return data.signedUrl;
  }

  async getSignedUrls(paths: string[]): Promise<Record<string, string>> {
    const { data, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET_PRIVATE)
      .createSignedUrls(paths, SIGNED_URL_EXPIRY);

    if (error || !data) throw new ApiError(500, 'Failed to generate signed URLs');

    return Object.fromEntries(
      data.filter((item) => item.signedUrl).map((item) => [item.path, item.signedUrl!]),
    );
  }

  async deleteFile(path: string): Promise<void> {
    const { error } = await supabaseAdmin.storage.from(STORAGE_BUCKET_PRIVATE).remove([path]);

    if (error) throw new ApiError(500, 'Failed to delete file');
  }
}
*/

// ── New FilesService (local disk storage) ─────────────────────────────────────

import path from 'path';
import fs from 'fs/promises';
import { PUBLIC_ROOT, PRIVATE_ROOT } from '../../config/storage';
import { ApiError } from '../../common/exceptions/api-error';
import { processImage, type ImagePreset } from '../../lib/imageProcessor';
import { sanitizeStoragePath } from '../../lib/sanitize';

export class FilesService {
  private resolveSafe(root: string, storagePath: string): string {
    const safe = sanitizeStoragePath(storagePath);
    const resolved = path.resolve(root, safe);
    // Guard against path traversal
    if (!resolved.startsWith(root + path.sep) && resolved !== root) {
      throw new ApiError(403, 'Invalid file path');
    }
    return resolved;
  }

  async savePublicImage(
    buffer: Buffer,
    storagePath: string,
    preset: ImagePreset,
  ): Promise<{ path: string; width: number; height: number }> {
    const safe = sanitizeStoragePath(storagePath);
    const resolved = this.resolveSafe(PUBLIC_ROOT, safe);
    await fs.mkdir(path.dirname(resolved), { recursive: true });
    const { buffer: compressed, width, height } = await processImage(buffer, preset, 'webp');
    await fs.writeFile(resolved, compressed);
    return { path: safe, width, height };
  }

  // Video files (media library only) — saved as-is, unlike savePublicImage:
  // sharp only understands image formats, so a video buffer just needs to
  // land on disk under its own storagePath, not be re-encoded.
  async savePublicRaw(buffer: Buffer, storagePath: string): Promise<{ path: string }> {
    const safe = sanitizeStoragePath(storagePath);
    const resolved = this.resolveSafe(PUBLIC_ROOT, safe);
    await fs.mkdir(path.dirname(resolved), { recursive: true });
    await fs.writeFile(resolved, buffer);
    return { path: safe };
  }

  // Passport scans from the public booking checkout form (no client-
  // supplied storagePath, unlike savePublicImage — this endpoint is
  // reachable without auth, so the filename is generated server-side
  // rather than trusted from the request) land in PRIVATE_ROOT, not
  // PUBLIC_ROOT: they're sensitive PII, so viewing one back requires
  // going through the authenticated `GET /files/private/*path` route
  // even though anyone could submit one.
  async savePrivateImage(
    buffer: Buffer,
    storagePath: string,
    preset: ImagePreset,
  ): Promise<{ path: string; width: number; height: number }> {
    const safe = sanitizeStoragePath(storagePath);
    const resolved = this.resolveSafe(PRIVATE_ROOT, safe);
    await fs.mkdir(path.dirname(resolved), { recursive: true });
    const { buffer: compressed, width, height } = await processImage(buffer, preset);
    await fs.writeFile(resolved, compressed);
    return { path: safe, width, height };
  }

  async deleteFile(storagePath: string, bucket: 'public' | 'private'): Promise<void> {
    const root = bucket === 'public' ? PUBLIC_ROOT : PRIVATE_ROOT;
    const resolved = this.resolveSafe(root, storagePath);
    try {
      await fs.unlink(resolved);
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw new ApiError(500, 'Failed to delete file');
      }
    }
  }
}
