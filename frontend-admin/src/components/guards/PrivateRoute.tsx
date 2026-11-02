import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { PATHS } from "@/constants/PATHS";
import { FullPageSpinner } from "@/components/ui/FullPageSpinner";

/**
 * Guards routes that require an authenticated session of any kind.
 * Redirects to /login if the user is not authenticated.
 */
export function PrivateRoute() {
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isLoading) return <FullPageSpinner />;

  if (!isAuthenticated) return <Navigate to={PATHS.LOGIN} replace />;

  return <Outlet />;
}
