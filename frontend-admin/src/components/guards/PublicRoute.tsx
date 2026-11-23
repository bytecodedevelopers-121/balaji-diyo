import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { PATHS } from "@/constants/PATHS";
import { FullPageSpinner } from "@/components/ui/FullPageSpinner";

/**
 * Guards routes that should only be visible to signed-out visitors (e.g.
 * /login). Redirects to /dashboard if a session already exists.
 */
export function PublicRoute() {
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isPartner = useAuthStore((s) => !!s.user?.b2bPartnerId);

  if (isLoading) return <FullPageSpinner />;

  if (isAuthenticated) {
    return <Navigate to={isPartner ? PATHS.PARTNER_HOME : PATHS.DASHBOARD} replace />;
  }

  return <Outlet />;
}
