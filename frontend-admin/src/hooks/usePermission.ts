import { useAuthStore } from "@/store/auth.store";

const NO_PERMISSIONS: string[] = [];

export const usePermission = (permission: string): boolean => {
  const isSuperAdmin = useAuthStore((s) => s.user?.isSuperAdmin ?? false);
  const permissions = useAuthStore((s) => s.user?.permissions ?? NO_PERMISSIONS);
  if (isSuperAdmin) return true;
  return permissions.includes(permission);
};

export const useAnyPermission = (perms: string[]): boolean => {
  const isSuperAdmin = useAuthStore((s) => s.user?.isSuperAdmin ?? false);
  const permissions = useAuthStore((s) => s.user?.permissions ?? NO_PERMISSIONS);
  if (isSuperAdmin) return true;
  return perms.some((p) => permissions.includes(p));
};
