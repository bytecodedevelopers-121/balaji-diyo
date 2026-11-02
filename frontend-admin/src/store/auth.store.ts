import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthState, AuthStore } from "@/types/auth";
import * as authService from "@/services/auth.service";
import { clearQueryCache } from "@/lib/queryClient";
import { isConnectionError } from "@/lib/connectionError";
import { readCachedAccessToken, writeCachedAccessToken } from "@/lib/tokenStorage";

type PersistedAuthState = Pick<AuthState, "user">;

/**
 * accessToken lives in this store's state, mirrored into sessionStorage (see
 * tokenStorage.ts) so a page reload within the same tab can reuse it instead
 * of spending a round trip on /auth/refresh — it's cleared the moment the
 * tab closes. Only `user` (non-sensitive, for UI) is written to localStorage
 * via zustand's `persist`. The refresh token lives in an httpOnly cookie the
 * backend controls and is never visible to this code.
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,
      isInitialized: false,
      hasHydrated: false,

      setHasHydrated: (value: boolean) => set({ hasHydrated: value }),

      login: async (email: string, password: string) => {
        const { accessToken } = await authService.login({ email, password });
        set({ accessToken });
        writeCachedAccessToken(accessToken);

        const user = await authService.getMe();
        set({ user, isAuthenticated: true });

        return user;
      },

      logout: async () => {
        try {
          await authService.logout();
        } finally {
          set({ accessToken: null, user: null, isAuthenticated: false });
          writeCachedAccessToken(null);
          clearQueryCache();
        }
      },

      refreshToken: async () => {
        try {
          const { accessToken } = await authService.refresh();
          set({ accessToken });
          writeCachedAccessToken(accessToken);

          const user = await authService.getMe();
          set({ user, isAuthenticated: true });
        } catch (error) {
          // Connection errors leave the offline-trusted state intact so the user
          // isn't logged out during a transient network or DB outage.
          if (!isConnectionError(error)) {
            set({ accessToken: null, user: null, isAuthenticated: false });
            writeCachedAccessToken(null);
          }
          throw error;
        }
      },

      initialize: async () => {
        set({ isLoading: true });
        // Capture before anything can clear it. We avoid get().refreshToken()
        // below so the store is never mutated inside the try — cachedUser
        // stays valid for the offline branch.
        const cachedUser = get().user;

        try {
          // Reuse the token cached from this tab's last load instead of
          // spending a round trip on /auth/refresh. If it's actually been
          // revoked, getMe() below 401s and the axios response interceptor
          // transparently refreshes it for us before this catch ever sees it.
          const cachedToken = readCachedAccessToken();
          const { accessToken } = cachedToken ? { accessToken: cachedToken } : await authService.refresh();
          set({ accessToken });
          writeCachedAccessToken(accessToken);

          const user = await authService.getMe();
          set({ user, isAuthenticated: true, isLoading: false, isInitialized: true });
        } catch (error) {
          if (isConnectionError(error) && cachedUser) {
            // Connectivity failure (offline, no-response, or backend DB down — 503).
            // Keep the cached user visible; useAuthReconnect re-authenticates silently
            // when the connection is restored.
            set({ user: cachedUser, accessToken: null, isAuthenticated: true, isLoading: false, isInitialized: true });
          } else {
            // Received a real auth error (401/403) — session is genuinely invalid.
            set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false, isInitialized: true });
            writeCachedAccessToken(null);
          }
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state): PersistedAuthState => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
