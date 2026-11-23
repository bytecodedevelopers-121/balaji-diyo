/**
 * Authenticated user — decoded shape of the JWT payload, as returned by
 * /auth/me (and re-fetched there after every login/refresh to pick up
 * permissions).
 */
export interface User {
  userId: string;
  email: string;
  role: string;
  isSuperAdmin: boolean;
  permissions: string[];
  /** Set for B2B agency accounts; null/absent for internal staff. */
  b2bPartnerId?: string | null;
  b2bRole?: "AGENCY_ADMIN" | "BOOKING_AGENT" | "FINANCE_MANAGER" | null;
  b2bPartnerStatus?: "PENDING_KYC" | "ACTIVE" | "SUSPENDED" | "REJECTED" | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  /** true during session restore on app boot */
  isLoading: boolean;
  /** true after the first refresh attempt completes */
  isInitialized: boolean;
  /** true once zustand persist has finished loading from localStorage */
  hasHydrated: boolean;
}

export interface AuthActions {
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  initialize: () => Promise<void>;
  setHasHydrated: (value: boolean) => void;
}

export type AuthStore = AuthState & AuthActions;
