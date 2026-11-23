import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { PATHS } from "@/constants/PATHS";
import { Button } from "@/components/ui/Button";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { cn } from "@/utils";

/** Minimal shell for agency accounts — deliberately does not reuse the staff Navbar/Sidebar, which call staff-only APIs. */
export function PartnerLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const isAdmin = user?.b2bRole === "AGENCY_ADMIN";
  const isActive = user?.b2bPartnerStatus === "ACTIVE";

  const link = ({ isActive }: { isActive: boolean }) =>
    cn("rounded-lg px-3 py-1.5 text-sm font-medium", isActive ? "bg-logo-navy-dark text-white" : "text-gray-600 hover:bg-gray-100");

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <header className="border-b border-[#efe6da] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <img src="/logo.png" alt="Joyful Trekking" className="h-8 w-auto" />
            <nav className="flex items-center gap-1">
              <NavLink to={PATHS.PARTNER_HOME} end className={link}>Dashboard</NavLink>
              {isActive && <NavLink to={PATHS.PARTNER_CATALOG} className={link}>Catalog</NavLink>}
              {isActive && <NavLink to={PATHS.PARTNER_HOLDS} className={link}>Holds</NavLink>}
              {isActive && <NavLink to={PATHS.PARTNER_BOOKINGS} className={link}>Bookings</NavLink>}
              {isActive && <NavLink to={PATHS.PARTNER_WALLET} className={link}>Wallet</NavLink>}
              {isActive && (isAdmin || user?.b2bRole === "FINANCE_MANAGER") && <NavLink to={PATHS.PARTNER_SETTLEMENTS} className={link}>Settlements</NavLink>}
              {isActive && <NavLink to={PATHS.PARTNER_TICKETS} className={link}>Requests</NavLink>}
              {isActive && isAdmin && <NavLink to={PATHS.PARTNER_DEVELOPER} className={link}>Developer</NavLink>}
              {isAdmin && <NavLink to={PATHS.PARTNER_TEAM} className={link}>Team</NavLink>}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-gray-500 sm:inline">{user?.email}</span>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<LogOut className="h-4 w-4" />}
              onClick={async () => {
                await logout();
                navigate(PATHS.LOGIN);
              }}
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <OfflineBanner />
        <Outlet />
      </main>
    </div>
  );
}
