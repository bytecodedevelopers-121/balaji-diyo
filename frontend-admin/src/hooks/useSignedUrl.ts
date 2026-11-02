// ══════════════════════════════════════════════════════════════════════════════
// OLD useSignedUrl (Supabase 1-hour signed URLs) — kept for future reference
// ══════════════════════════════════════════════════════════════════════════════
/*
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { queryKeys } from "@/lib/queryKeys";

// Only used for PRIVATE bucket files (documents, CVs) — never for the
// public bucket, which is read directly via getPublicUrl().
export const useSignedUrl = (path: string | null | undefined) =>
  useQuery({
    queryKey: queryKeys.files.signedUrl(path),
    queryFn: () => api.post("/files/signed-url", { path }).then((r) => r.data.data.signedUrl as string),
    enabled: !!path,
    staleTime: 1000 * 60 * 50, // refetch at 50min (before 1hr expiry)
    gcTime: 1000 * 60 * 55,
  });

export const useSignedUrls = (paths: (string | null | undefined)[]) =>
  useQuery({
    queryKey: queryKeys.files.signedUrls(paths),
    queryFn: () =>
      api
        .post("/files/signed-urls", { paths: paths.filter(Boolean) })
        .then((r) => r.data.data.signedUrls as Record<string, string>),
    enabled: paths.some(Boolean),
    staleTime: 1000 * 60 * 50,
  });
*/

// ── New useSignedUrl (local JWT-protected blob fetch → object URL) ────────────
// Private files are fetched with the Bearer token and turned into an object URL.
// The hook interface is identical — callers don't need to change.

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { queryKeys } from "@/lib/queryKeys";

export const useSignedUrl = (path: string | null | undefined) =>
  useQuery({
    queryKey: queryKeys.files.signedUrl(path),
    queryFn: async () => {
      const res = await api.get(`/files/private/${path}`, { responseType: "blob" });
      return URL.createObjectURL(res.data as Blob);
    },
    enabled: !!path,
    staleTime: 1000 * 60 * 50,
    gcTime:    1000 * 60 * 55,
  });

export const useSignedUrls = (paths: (string | null | undefined)[]) =>
  useQuery({
    queryKey: queryKeys.files.signedUrls(paths),
    queryFn: async () => {
      const validPaths = paths.filter(Boolean) as string[];
      const results: Record<string, string> = {};
      await Promise.all(
        validPaths.map(async (p) => {
          const res = await api.get(`/files/private/${p}`, { responseType: "blob" });
          results[p] = URL.createObjectURL(res.data as Blob);
        }),
      );
      return results;
    },
    enabled: paths.some(Boolean),
    staleTime: 1000 * 60 * 50,
  });
