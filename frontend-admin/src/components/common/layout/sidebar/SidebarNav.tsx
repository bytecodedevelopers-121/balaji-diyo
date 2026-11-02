import { useAuthStore } from "@/store/auth.store";
import { SidebarNavItem } from "./SidebarNavItem";
import { NAV_ITEMS, type NavSection } from "./navConfig";

interface SidebarNavProps {
  collapsed: boolean;
}

const SECTION_ORDER: NavSection[] = ["main", "system"];
const SECTION_LABELS: Record<NavSection, string> = {
  main: "Main",
  system: "System",
};

/**
 * SidebarNav
 * Renders the full navigation menu, filtered by permission —
 * superAdmin always sees every item.
 */
export function SidebarNav({ collapsed }: SidebarNavProps) {
  const isSuperAdmin = useAuthStore((s) => s.user?.isSuperAdmin ?? false);
  const permissions = useAuthStore((s) => s.user?.permissions ?? []);

  const hasPermission = (permission?: string | null) => {
    if (isSuperAdmin) return true;
    if (!permission) return true;
    return permissions.includes(permission);
  };

  const visibleItems = NAV_ITEMS.filter((item) => hasPermission(item.permission)).map((item) => {
    if (!item.children) return item;
    return {
      ...item,
      children: item.children.filter((child) => hasPermission(child.permission)),
    };
  });

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
      {SECTION_ORDER.map((section) => {
        const items = visibleItems.filter((item) => (item.section ?? "main") === section);
        if (items.length === 0) return null;

        return (
          <div key={section} className="space-y-1">
            {!collapsed && (
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/60">
                {SECTION_LABELS[section]}
              </p>
            )}
            {items.map((item) => (
              <SidebarNavItem
                key={item.path}
                item={item}
                collapsed={collapsed}
              />
            ))}
          </div>
        );
      })}
    </nav>
  );
}
