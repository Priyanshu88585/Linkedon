// ============================================================
// Standardized API Response Format
// All endpoints return this shape
// ============================================================

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Auth-specific response types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponse {
  user: import("./user").User;
  tokens: AuthTokens;
  workspace?: import("./workspace").Workspace;
}

export interface RegisterResponse {
  user: import("./user").User;
  tokens: AuthTokens;
  workspace: import("./workspace").Workspace;
}
