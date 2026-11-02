/**
 * Types for the Express API's response envelope. These mirror the backend
 * exactly — see backend/src/common/dto/api-response.dto.ts and
 * pagination.dto.ts — so keep the two in sync if the backend shape changes.
 */

export type ApiStatus = "success" | "error";

/** The envelope every backend/src/common/dto/api-response.dto.ts response is wrapped in. */
export interface ApiEnvelope<T> {
  status: ApiStatus;
  statusCode: number;
  message: string;
  data: T | null;
  timestamp: string;
  requestId?: string;
}

export interface PaginationMeta {
  currentPage: number;
  perPage: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/** Shape returned inside `data` for paginated endpoints (backend's PaginationDto). */
export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}
