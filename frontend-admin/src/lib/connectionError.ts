import axios from 'axios';

/**
 * Returns true when an error should be treated as a connectivity failure
 * rather than a genuine auth rejection:
 *
 *  - Browser has no network at all (navigator.onLine === false)
 *  - Axios got no response (DNS failure, connection refused reaching the backend)
 *  - Backend replied 503 (it reached us but couldn't reach the remote DB)
 *
 * Used by initialize(), refreshToken(), and the axios 401 interceptor to
 * decide whether to log the user out or retain the offline-trusted session.
 */
export function isConnectionError(error: unknown): boolean {
  if (!navigator.onLine) return true;

  if (axios.isAxiosError(error)) {
    if (!error.response) return true;           // no response — network/DNS failure
    if (error.response.status === 503) return true; // backend DB unreachable
  }

  return false;
}
