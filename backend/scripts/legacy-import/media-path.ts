import fs from 'fs';
import path from 'path';
import { PUBLIC_ROOT } from '../../src/config/storage';

// Every legacy full_path/thumb_path value has a stray "media/" prefix that
// doesn't exist on disk (verified against flamingo-base/storage/app/public —
// e.g. DB says "media/team/member/x.jpg", the real file is "team/member/x.jpg").
// backend/uploads/public already mirrors flamingo-base's storage 1:1 (confirmed
// by diff — it's a strict superset, copied during earlier admin-panel work), so
// the corrected path is also exactly what MediaService's fullPath convention
// expects (relative to PUBLIC_ROOT, no leading slash).
export function resolveMediaPath(legacyPath: string | null | undefined): string | null {
  if (!legacyPath) return null;
  return legacyPath.replace(/^media\//, '');
}

export function mediaFileExists(relativePath: string | null): boolean {
  if (!relativePath) return false;
  return fs.existsSync(path.join(PUBLIC_ROOT, relativePath));
}
