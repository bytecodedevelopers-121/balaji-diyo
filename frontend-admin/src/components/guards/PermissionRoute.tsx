import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { PATHS } from "@/constants/PATHS";

interface PermissionRouteProps {
  permission: string;
}

const NO_PERMISSIONS: string[] = [];

/**
 * Guards a route behind a specific permission. Must be nested inside
 * <PrivateRoute> — it assumes the user is already authenticated and only
 * checks the permission itself. SuperAdmin always bypasses the check.
 */
export function PermissionRoute({ permission }: PermissionRouteProps) {
  const isSuperAdmin = useAuthStore((s) => s.user?.isSuperAdmin ?? false);
  const permissions = useAuthStore((s) => s.user?.permissions ?? NO_PERMISSIONS);

  if (isSuperAdmin) return <Outlet />;
  if (!permissions.includes(permission)) return <Navigate to={PATHS.FORBIDDEN} replace />;

  return <Outlet />;
}
