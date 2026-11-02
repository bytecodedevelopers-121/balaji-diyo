// ══════════════════════════════════════════════════════════════════════════════
// OLD FilesController (Supabase signed URLs) — kept for future reference
// ══════════════════════════════════════════════════════════════════════════════
/*
import { Request, Response } from 'express';
import { FilesService } from './files.service';
import { ApiError } from '../../common/exceptions/api-error';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';

const assertWorkerPath = (path: string): void => {
  if (!path.startsWith('workers/')) throw new ApiError(403, 'Access denied');
};

export class FilesController {
  constructor(private service: FilesService) {}

  getSignedUrl = async (req: Request, res: Response) => {
    const { path } = req.body;
    if (!path || typeof path !== 'string') throw new ApiError(400, 'path is required');
    assertWorkerPath(path);

    const signedUrl = await this.service.getSignedUrl(path);

    SuccessResponseDto.send(res, {
      message: 'Signed URL generated',
      data: { signedUrl },
      req,
    });
  };

  getSignedUrls = async (req: Request, res: Response) => {
    const { paths } = req.body;
    if (!Array.isArray(paths) || paths.length === 0) throw new ApiError(400, 'paths must be a non-empty array');
    paths.forEach((p: string) => assertWorkerPath(p));

    const signedUrls = await this.service.getSignedUrls(paths);

    SuccessResponseDto.send(res, {
      message: 'Signed URLs generated',
      data: { signedUrls },
      req,
    });
  };

  deleteFile = async (req: Request, res: Response) => {
    const { path } = req.body;
    if (!path || typeof path !== 'string') throw new ApiError(400, 'path is required');
    assertWorkerPath(path);

    await this.service.deleteFile(path);

    SuccessResponseDto.send(res, {
      message: 'File deleted',
      data: null,
      req,
    });
  };
}
*/

// ── New FilesController (local disk storage) ──────────────────────────────────

import path from 'path';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import { FilesService } from './files.service';
import { ApiError } from '../../common/exceptions/api-error';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';
import { PRIVATE_ROOT } from '../../config/storage';
import { sanitizeStoragePath } from '../../lib/sanitize';
import type { ImagePreset } from '../../lib/imageProcessor';

export class FilesController {
  constructor(private service: FilesService) {}

  // POST /files/upload/public — multer memoryStorage + sharp → save to disk
  uploadPublic = async (req: Request, res: Response): Promise<void> => {
    if (!req.file) throw new ApiError(400, 'No file uploaded');

    const rawPath = (req.body as { storagePath?: string }).storagePath;
    if (!rawPath || typeof rawPath !== 'string') throw new ApiError(400, 'storagePath is required');

    const preset: ImagePreset = rawPath.includes('users/avatars') ? 'avatar' : 'workerPhoto';
    // Always save as .webp after sharp compression (swap any client-sent
    // image extension rather than stacking one on top of it).
    const storagePath = `${rawPath.replace(/\.(jpe?g|png|webp)$/i, '')}.webp`;
    const { path: savedPath } = await this.service.savePublicImage(req.file.buffer, storagePath, preset);

    SuccessResponseDto.send(res, { message: 'File uploaded', data: { path: savedPath }, req });
  };

  // POST /files/upload/passport — public (the booking checkout form has no
  // session to authenticate), but the passport scan itself is sensitive PII
  // — saved into PRIVATE_ROOT under a server-generated filename (never a
  // client-supplied storagePath, unlike uploadPublic) so it's only readable
  // back through the authenticated `GET /files/private/*path` route.
  uploadBookingPassport = async (req: Request, res: Response): Promise<void> => {
    if (!req.file) throw new ApiError(400, 'No file uploaded');

    const storagePath = `bookings/passports/${randomUUID()}.jpg`;
    const { path: savedPath } = await this.service.savePrivateImage(req.file.buffer, storagePath, 'contentImage');

    SuccessResponseDto.send(res, { message: 'File uploaded', data: { path: savedPath }, req });
  };

  // POST /files/upload/photo — same shape as uploadBookingPassport above
  // (public, no session on the checkout form; PII, so private storage
  // behind the authenticated `GET /files/private/*path` route), for the
  // per-traveller personal photo field (`Traveller.photo`) — a separate
  // upload from the passport scan, not a duplicate of it.
  uploadBookingPhoto = async (req: Request, res: Response): Promise<void> => {
    if (!req.file) throw new ApiError(400, 'No file uploaded');

    const storagePath = `bookings/photos/${randomUUID()}.jpg`;
    const { path: savedPath } = await this.service.savePrivateImage(req.file.buffer, storagePath, 'contentImage');

    SuccessResponseDto.send(res, { message: 'File uploaded', data: { path: savedPath }, req });
  };

  // POST /files/upload/private — multer diskStorage saves the file directly
  uploadPrivate = async (req: Request, res: Response): Promise<void> => {
    if (!req.file) throw new ApiError(400, 'No file uploaded');

    const rawPath = (req.body as { storagePath?: string }).storagePath;
    if (!rawPath || typeof rawPath !== 'string') throw new ApiError(400, 'storagePath is required');

    const safePath = sanitizeStoragePath(rawPath);

    SuccessResponseDto.send(res, { message: 'File uploaded', data: { path: safePath }, req });
  };

  // GET /files/private/* — JWT-protected file serving
  servePrivate = async (req: Request, res: Response): Promise<void> => {
    // Extract everything after '/files/private/' from the original URL
    const match = /\/files\/private\/([^?#]+)/.exec(req.originalUrl);
    const rawPath = match?.[1] ?? '';
    if (!rawPath) throw new ApiError(400, 'File path required');

    const safePath = sanitizeStoragePath(rawPath);
    const resolved = path.resolve(PRIVATE_ROOT, safePath);

    // Path traversal guard
    if (!resolved.startsWith(PRIVATE_ROOT + path.sep)) {
      throw new ApiError(403, 'Access denied');
    }

    res.sendFile(resolved);
  };

  // DELETE /files/delete — JWT-protected file deletion
  deleteFile = async (req: Request, res: Response): Promise<void> => {
    const { path: rawPath, bucket } = req.body as { path?: string; bucket?: 'public' | 'private' };
    if (!rawPath || typeof rawPath !== 'string') throw new ApiError(400, 'path is required');

    const resolvedBucket: 'public' | 'private' = bucket === 'public' ? 'public' : 'private';
    await this.service.deleteFile(rawPath, resolvedBucket);

    SuccessResponseDto.send(res, { message: 'File deleted', data: null, req });
  };
}
