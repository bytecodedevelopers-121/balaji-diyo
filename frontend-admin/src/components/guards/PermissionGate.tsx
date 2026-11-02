import type { ReactNode } from "react";
import { useAuthStore } from "@/store/auth.store";
import { usePermission } from "@/hooks/usePermission";

interface PermissionGateProps {
  permission: string;
  /** Optional: rendered instead of the children when the permission is missing. */
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * UI-only permission gate — hides elements, not a route guard.
 * Usage: <PermissionGate permission="delete:worker"><DeleteButton /></PermissionGate>
 * SuperAdmin always sees the children, bypassing the permission check.
 */
export function PermissionGate({ permission, fallback = null, children }: PermissionGateProps) {
  const isSuperAdmin = useAuthStore((s) => s.user?.isSuperAdmin ?? false);
  const hasPermission = usePermission(permission);

  if (isSuperAdmin || hasPermission) return <>{children}</>;

  return <>{fallback}</>;
}
