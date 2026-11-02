// ══════════════════════════════════════════════════════════════════════════════
// OLD useFileUpload (Supabase SDK) — kept for future reference
// ══════════════════════════════════════════════════════════════════════════════
/*
import { useState, useCallback } from "react";
import { supabase, STORAGE_BUCKET_PUBLIC, STORAGE_BUCKET_PRIVATE } from "@/lib/supabase";

export type BucketType = "public" | "private";

export interface UploadResult {
  path: string;
  bucket: BucketType;
  size: number;
  type: string;
}

export interface UseFileUploadReturn {
  upload: (file: File, path: string, bucket: BucketType) => Promise<UploadResult>;
  isUploading: boolean;
  progress: number;
  error: string | null;
  reset: () => void;
}

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_DOC_TYPES = ["application/pdf", ...ALLOWED_IMAGE_TYPES];

export const useFileUpload = (): UseFileUploadReturn => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
    setError(null);
  }, []);

  const upload = useCallback(async (file: File, path: string, bucket: BucketType): Promise<UploadResult> => {
    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      const maxSize = bucket === "public" ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error(`File size must be under ${bucket === "public" ? "5" : "10"}MB`);
      }

      const allowedTypes = bucket === "public" ? ALLOWED_IMAGE_TYPES : ALLOWED_DOC_TYPES;
      if (!allowedTypes.includes(file.type)) {
        throw new Error(bucket === "public" ? "Only JPG, PNG or WebP images allowed" : "Only PDF or image files allowed");
      }

      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const fullPath = `${path}.${ext}`;

      setProgress(20);

      const bucketName = bucket === "public" ? STORAGE_BUCKET_PUBLIC : STORAGE_BUCKET_PRIVATE;

      const { error: uploadError } = await supabase.storage.from(bucketName).upload(fullPath, file, {
        upsert: true,
        contentType: file.type,
      });

      if (uploadError) throw new Error(uploadError.message);

      setProgress(100);

      return { path: fullPath, bucket, size: file.size, type: file.type };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, []);

  return { upload, isUploading, progress, error, reset };
};
*/

// ── New useFileUpload (local Express + Multer) ────────────────────────────────

import { useState, useCallback } from "react";
import api from "@/lib/axios";

export type BucketType = "public" | "private";

export interface UploadResult {
  path: string;
  bucket: BucketType;
  size: number;
  type: string;
}

export interface UseFileUploadReturn {
  upload: (file: File, storagePath: string, bucket: BucketType) => Promise<UploadResult>;
  isUploading: boolean;
  progress: number;
  error: string | null;
  reset: () => void;
}

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ALLOWED_DOC_TYPES  = ["application/pdf", ...ALLOWED_IMAGE_TYPES];

export const useFileUpload = (): UseFileUploadReturn => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress]       = useState(0);
  const [error, setError]             = useState<string | null>(null);

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
    setError(null);
  }, []);

  const upload = useCallback(
    async (file: File, storagePath: string, bucket: BucketType): Promise<UploadResult> => {
      setIsUploading(true);
      setProgress(0);
      setError(null);

      try {
        // Client-side guards (server validates too, but fail fast for UX)
        const maxSize = bucket === "public" ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
        if (file.size > maxSize) {
          throw new Error(`File size must be under ${bucket === "public" ? "5" : "10"}MB`);
        }
        const allowed = bucket === "public" ? ALLOWED_IMAGE_TYPES : ALLOWED_DOC_TYPES;
        if (!allowed.includes(file.type)) {
          throw new Error(
            bucket === "public"
              ? "Only JPG, PNG or WebP images allowed"
              : "Only PDF or image files allowed",
          );
        }

        // For private docs, append the original extension to the storage path.
        // For public images, the server always saves as .webp after sharp compression.
        const finalPath =
          bucket === "private"
            ? `${storagePath}.${file.name.split(".").pop()?.toLowerCase() ?? "pdf"}`
            : storagePath;

        const endpoint = bucket === "public" ? "/files/upload/public" : "/files/upload/private";

        // storagePath MUST be the first field so multer diskStorage can read it
        // before processing the file stream.
        const formData = new FormData();
        formData.append("storagePath", finalPath);
        formData.append("file", file);

        setProgress(20);

        const res = await api.post<{ data: { path: string } }>(endpoint, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (evt) => {
            if (evt.total) {
              setProgress(Math.min(Math.round((evt.loaded * 80) / evt.total) + 20, 99));
            }
          },
        });

        setProgress(100);

        const returnedPath = res.data.data.path;
        return { path: returnedPath, bucket, size: file.size, type: file.type };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setError(message);
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [],
  );

  return { upload, isUploading, progress, error, reset };
};
