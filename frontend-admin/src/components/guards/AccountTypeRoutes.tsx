import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { PATHS } from "@/constants/PATHS";

/** Staff-only shell: B2B agency accounts are sent to their own portal (the API 403s them on staff routes anyway). */
export function InternalRoute() {
  const isPartner = useAuthStore((s) => !!s.user?.b2bPartnerId);
  return isPartner ? <Navigate to={PATHS.PARTNER_HOME} replace /> : <Outlet />;
}

/** Partner-portal shell: staff accounts are sent back to the admin dashboard. */
export function PartnerRoute() {
  const isPartner = useAuthStore((s) => !!s.user?.b2bPartnerId);
  return isPartner ? <Outlet /> : <Navigate to={PATHS.DASHBOARD} replace />;
}
