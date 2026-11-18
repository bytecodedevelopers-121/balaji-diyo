import { Menu } from "lucide-react";
import { UserMenu } from "./UserMenu";
import { FullscreenToggle } from "./FullscreenToggle";

interface NavbarProps {
  sidebarCollapsed: boolean;
  onMobileMenuToggle: () => void;
}

/**
 * Navbar
 * Sticky top bar with the user menu.
 * Hamburger button is only shown on mobile (below lg breakpoint).
 */
export function Navbar({ onMobileMenuToggle }: NavbarProps) {
  return (
    <header
      className="sticky top-0 z-30 h-16 shrink-0
                 bg-surface/85 backdrop-blur-md border-b border-outline-variant/60 shadow-sm
                 flex items-center gap-4 px-4 lg:px-6 transition-all duration-300"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-[linear-gradient(90deg,var(--color-logo-sky),var(--color-logo-green),var(--color-logo-sun))]"
      />
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={onMobileMenuToggle}
        className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl
                   text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface
                   transition-all cursor-pointer"
        aria-label="Open navigation menu"
      >
        <Menu size={18} />
      </button>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-3">
        <FullscreenToggle />
        <div className="w-px h-5 bg-outline-variant/80 mx-1" />
        <UserMenu />
      </div>
    </header>
  );
}
