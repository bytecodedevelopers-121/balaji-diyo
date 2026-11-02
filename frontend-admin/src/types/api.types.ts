export interface ApiResponse<T> {
  status: "success" | "error";
  statusCode: number;
  message: string;
  data: T;
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

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}
