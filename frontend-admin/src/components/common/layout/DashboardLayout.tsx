import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";
import { OfflineBanner } from "@/components/ui/OfflineBanner";

/**
 * DashboardLayout
 * Root shell that composes Sidebar + Navbar + page content (via <Outlet />).
 * Manages sidebar collapsed/mobile-open state and closes the mobile overlay on route change.
 */
export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile overlay on route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-on-surface">
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCollapse={() => setCollapsed((c) => !c)}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Right-side wrapper */}
      <div
        className={[
          "flex flex-col flex-1 min-w-0 transition-all duration-300",
          // On large screens push content; sidebar is always visible
          collapsed ? "lg:ml-20" : "lg:ml-64",
        ].join(" ")}
      >
        <Navbar
          sidebarCollapsed={collapsed}
          onMobileMenuToggle={() => setMobileOpen((o) => !o)}
        />

        {/* Top padding lives on the inner wrapper, not <main>: a sticky child (e.g. the rich-text
            toolbar) sticks below its scroller's padding, which left a 24px gap under the navbar. */}
        <main className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="pt-6">
            <OfflineBanner />
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
