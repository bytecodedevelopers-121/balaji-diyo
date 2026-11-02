// src/components/common/layout/Sidebar/Sidebar.tsx
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { SidebarNav } from "./SidebarNav";
import { COMPANY_INFO } from "@/constants";

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onCollapse: () => void;
  onMobileClose: () => void;
}

/**
 * Sidebar
 * Fixed navigation panel with collapsible support and mobile overlay mode.
 * - On lg+ screens: always visible, can be collapsed to icon-only mode.
 * - Below lg: hidden by default, slides in as a full overlay when mobileOpen=true.
 */
export function Sidebar({ collapsed, mobileOpen, onCollapse }: SidebarProps) {
  return (
    <aside
      className={[
        // Base
        "fixed top-0 left-0 z-40 h-screen flex flex-col text-on-surface shadow-xl",
        "bg-surface border-r border-outline-variant/60",
        "transition-all duration-300 ease-in-out",
        // Width
        collapsed ? "w-20" : "w-64",
        // Mobile: slide in/out
        "lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
      ].join(" ")}
    >
      {/* Logo area */}
      <div className="flex items-center justify-center px-5 h-16 border-b border-outline-variant/60 shrink-0 bg-surface/50 backdrop-blur-sm">
        <img
          src="/logo.svg"
          alt={COMPANY_INFO.name}
          className={collapsed ? "h-8 w-8 shrink-0 object-contain" : "h-9 w-auto shrink-0 object-contain"}
        />
      </div>

      {/* Navigation */}
      <SidebarNav collapsed={collapsed} />

      {/* Collapse toggle — desktop only */}
      <div className="hidden lg:flex px-4 py-4 border-t border-outline-variant/60 shrink-0">
        <button
          type="button"
          onClick={onCollapse}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-on-surface-variant
                     hover:bg-surface-container-high hover:text-on-surface transition-all duration-300 w-full
                     cursor-pointer group ring-1 ring-transparent hover:ring-outline-variant/50"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen
              size={18}
              className="shrink-0 mx-auto transform group-hover:scale-110 transition-transform duration-200"
            />
          ) : (
            <>
              <PanelLeftClose
                size={18}
                className="shrink-0 transform group-hover:scale-110 transition-transform duration-200"
              />
              <span className="text-xs font-semibold uppercase tracking-wider">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
