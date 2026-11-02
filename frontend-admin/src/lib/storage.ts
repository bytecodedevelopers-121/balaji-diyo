// ── Local disk storage helpers ─────────────────────────────────────────────
// VITE_FILE_BASE_URL points directly at the Express server (no /api suffix).
// Public files are served as plain static files at /files/public/*.
// Private files are fetched via the authenticated API at /api/files/private/*.

const FILE_BASE_URL = import.meta.env.VITE_FILE_BASE_URL as string;

// Storage path builders (no extension — the server appends .webp for images
// after sharp compression).
export const STORAGE_PATHS = {
  userAvatar: (userId: string) => `users/avatars/${userId}`,
};

// Build a direct URL for a public file (no auth required — served by express.static).
export const getPublicUrl = (path: string): string =>
  `${FILE_BASE_URL}/files/public/${path}`;

// Build the API URL for a private file (requires Authorization header).
export const getPrivateUrl = (path: string): string =>
  `${FILE_BASE_URL}/api/files/private/${path}`;
