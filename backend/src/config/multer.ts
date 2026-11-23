// ══════════════════════════════════════════════════════════════════════════════
// OLD Multer config (Cloudinary memory storage) — kept for future reference
// ══════════════════════════════════════════════════════════════════════════════
/*
import multer, { FileFilterCallback } from "multer";
import { Request } from "express";
import { ApiError } from "../common/exceptions/api-error";

const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/jpeg": "image",
  "image/jpg": "image",
  "image/png": "image",
  "image/webp": "image",
  "image/gif": "image",
  "image/svg+xml": "image",
  "video/mp4": "video",
  "video/webm": "video",
  "video/quicktime": "video",
  "application/pdf": "document",
  "application/msword": "document",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "document",
  "application/vnd.ms-excel": "document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "document",
};

const SIZE_LIMITS: Record<string, number> = {
  image: 5 * 1024 * 1024,
  video: 100 * 1024 * 1024,
  document: 10 * 1024 * 1024,
};

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (ALLOWED_MIME_TYPES[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new ApiError(400, `File type not allowed: ${file.mimetype}`));
  }
};

export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 },
});

export const getMediaType = (mimeType: string) =>
  ALLOWED_MIME_TYPES[mimeType] ?? "image";

export const getSizeLimit = (mimeType: string) =>
  SIZE_LIMITS[getMediaType(mimeType)] ?? SIZE_LIMITS.image;
*/

// ── New local-disk Multer config ──────────────────────────────────────────────

import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fsSync from 'fs';
import { Request } from 'express';
import { ApiError } from '../common/exceptions/api-error';
import { PRIVATE_ROOT } from './storage';
import { sanitizeStoragePath } from '../lib/sanitize';

// ── Image filter (public uploads — photos / avatars) ─────────────────────────

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const imageFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, `Image type not allowed: ${file.mimetype}. Allowed: JPG, PNG, WebP`));
  }
};

// ── Document filter (private uploads — PDFs / images used as docs) ────────────

const ALLOWED_DOC_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const documentFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void => {
  if (ALLOWED_DOC_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, `Document type not allowed: ${file.mimetype}. Allowed: PDF, JPG, PNG, WebP`));
  }
};

// ── Media library upload (admin-only, authenticated) — images + video ────────
// Deliberately a separate multer instance from `uploadPublic` below, even
// though both start from memory storage: `uploadPublic` also backs the
// *unauthenticated* `/files/upload/public` route (worker/avatar photos), so
// broadening its allowlist/size limit to fit video would widen what an
// anonymous request can push through that route too. This one only ever
// backs the authenticated `/media/upload` route (media.routes.ts).

const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

const mediaLibraryFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype) || ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, `File type not allowed: ${file.mimetype}. Allowed: JPG, PNG, WebP, MP4, WebM, MOV`));
  }
};

export const uploadMediaLibrary = multer({
  storage: multer.memoryStorage(),
  fileFilter: mediaLibraryFilter,
  limits: { fileSize: 60 * 1024 * 1024 }, // 60 MB — video needs far more headroom than the 5 MB image cap elsewhere
});

// ── Passport scan upload — memory storage (buffer forwarded to OCR service) ───

export const uploadPassport = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// ── Public upload — memory storage (sharp compresses and saves to disk) ───────

export const uploadPublic = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// ── Private upload — disk storage (saved as-is, no in-memory buffer) ─────────
// NOTE: storagePath field MUST appear before the file field in the multipart
// form so multer can use it in destination/filename callbacks.

export const uploadPrivate = multer({
  storage: multer.diskStorage({
    destination: (req, _file, cb) => {
      const rawPath = (req.body as { storagePath?: string }).storagePath ?? '';
      const safe = sanitizeStoragePath(rawPath);
      const dir = path.join(PRIVATE_ROOT, path.dirname(safe));
      fsSync.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, _file, cb) => {
      const rawPath = (req.body as { storagePath?: string }).storagePath ?? '';
      const safe = sanitizeStoragePath(rawPath);
      cb(null, path.basename(safe) || _file.originalname);
    },
  }),
  fileFilter: documentFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// ── B2B KYC upload — memory storage; B2B KycStorage verifies file signatures and writes to private disk ──

export const uploadKyc = multer({
  storage: multer.memoryStorage(),
  fileFilter: documentFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 }, // 10 MB each, 5 per request
});
