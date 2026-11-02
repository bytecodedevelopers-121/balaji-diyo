import { z } from 'zod';

export const UploadMediaDto = z.object({
  altText: z.string().optional(),
  // Storage subfolder under uploads/public/ — e.g. "team", "package",
  // "content". Restricted to letters/digits/hyphens (no slashes or dots)
  // even though FilesService's own path-traversal guard (resolveSafe in
  // files.service.ts) would already reject anything that escapes
  // PUBLIC_ROOT — this just means a malformed value 400s here instead of
  // silently being sanitized character-by-character. Case isn't
  // restricted here on purpose: some existing `ownerType` values this
  // gets reused as (see AttachmentField/AttachmentGallery on the admin
  // side) are camelCase (e.g. "itineraryDetail"), not this codebase's
  // more common kebab-case — MediaService lowercases it before using it
  // as a folder name, so "itineraryDetail" and "itinerarydetail" land in
  // the same place rather than silently splitting into two folders.
  // Falls back to the generic "media" folder when omitted (see
  // media.service.ts's DEFAULT_FOLDER) so existing callers that don't
  // send this keep working unchanged.
  folder: z
    .string()
    .regex(/^[a-zA-Z0-9-]+$/, 'folder must contain only letters, digits, and hyphens')
    .max(50)
    .optional(),
});

export type UploadMediaDtoType = z.infer<typeof UploadMediaDto>;
