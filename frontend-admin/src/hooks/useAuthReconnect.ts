import { useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";

/**
 * Silently re-establishes a real session when the device comes back online
 * after being in the offline-trusted state (isAuthenticated=true, accessToken=null).
 * Fires only on the actual 'online' event — never on render.
 */
export function useAuthReconnect() {
  useEffect(() => {
    const handleOnline = () => {
      const { isAuthenticated, accessToken } = useAuthStore.getState();
      // Only act when in offline-trusted state: authenticated but no real token.
      if (isAuthenticated && !accessToken) {
        void useAuthStore.getState().refreshToken().catch(() => {
          // Session expired while offline — refreshToken() clears auth state and
          // PrivateRoute will redirect to login on the next render.
        });
      }
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);
}
