// src/components/common/layout/Sidebar/SidebarNavItem.tsx
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { ChevronDown, type LucideIcon } from "lucide-react";
import type { NavItem } from "./navConfig";

interface SidebarNavItemProps {
  item: NavItem;
  collapsed: boolean;
}

/**
 * SidebarNavItem
 * Renders a single navigation link with optional submenu support.
 * Highlights the active route via NavLink's isActive prop.
 */
export function SidebarNavItem({ item, collapsed }: SidebarNavItemProps) {
  const [subOpen, setSubOpen] = useState(false);
  const Icon: LucideIcon = item.icon;
  const hasChildren = item.children && item.children.length > 0;

  const baseItemClass =
    "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 w-full cursor-pointer";
  const activeClass = "bg-primary/10 text-primary border-l-2 border-primary shadow-xs pl-2.5";
  const inactiveClass =
    "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface border-l-2 border-transparent";

  if (hasChildren) {
    return (
      <div className="space-y-0.5">
        <button
          type="button"
          onClick={() => setSubOpen((o) => !o)}
          className={[baseItemClass, inactiveClass].join(" ")}
          title={collapsed ? item.label : undefined}
        >
          <Icon
            size={18}
            className="shrink-0 transform group-hover:scale-110 transition-transform duration-200 text-on-surface-variant group-hover:text-on-surface"
          />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{item.label}</span>
              <ChevronDown
                size={14}
                className={[
                  "transition-transform duration-300 text-on-surface-variant group-hover:text-on-surface",
                  subOpen ? "rotate-180" : "",
                ].join(" ")}
              />
            </>
          )}
        </button>

        {/* Submenu */}
        {!collapsed && subOpen && (
          <div className="mt-1 ml-5 border-l border-outline-variant/60 pl-3.5 space-y-1 animate-dropdown-enter">
            {item.children!.map((child) => (
              <NavLink
                key={child.path}
                to={child.path}
                className={({ isActive }) =>
                  [
                    "group flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60",
                  ].join(" ")
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={[
                      "w-1.5 h-1.5 rounded-full mr-2.5 transition-colors shrink-0",
                      isActive ? "bg-primary shadow-xs shadow-primary/30" : "bg-outline-variant group-hover:bg-on-surface-variant"
                    ].join(" ")} />
                    <span>{child.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.path}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        [baseItemClass, isActive ? activeClass : inactiveClass].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={18}
            className={[
              "shrink-0 transform group-hover:scale-110 transition-all duration-200",
              isActive ? "text-primary" : "text-on-surface-variant group-hover:text-on-surface"
            ].join(" ")}
          />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </>
      )}
    </NavLink>
  );
}
