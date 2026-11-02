export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  isSuperAdmin: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: TokenPayload;
}

export type AccessTokenResponse = Omit<AuthResponse, 'refreshToken'>;

export interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
}
