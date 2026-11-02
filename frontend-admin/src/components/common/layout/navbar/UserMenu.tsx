// src/components/common/layout/Navbar/UserMenu.tsx
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, User, ChevronDown, Settings } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useProfile } from "@/hooks/queries/useProfile";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { PATHS } from "@/constants/PATHS";

/**
 * UserMenu
 * Avatar + name button that toggles a dropdown with profile/logout options.
 * Closes when clicking outside.
 */
export function UserMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { data: profileData } = useProfile();
  const profile = profileData?.data;

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const displayName = user?.email ?? "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  async function handleLogout() {
    await logout();
    navigate(PATHS.LOGIN);
  }

  return (
    <div
      className="relative"
      ref={ref}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl
                   hover:bg-surface-container-high hover:text-on-surface transition-all duration-200 cursor-pointer"
      >
        {/* Avatar */}
        {profile?.avatar ? (
          <UserAvatar photoPath={profile.avatar} name={displayName} size="sm" className="shrink-0" />
        ) : (
          <div
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center
                         text-white text-xs font-bold shrink-0 shadow-md shadow-blue-500/10"
          >
            {initials}
          </div>
        )}

        {/* Name + role (hidden on mobile) */}
        <div className="hidden md:flex flex-col items-start min-w-0">
          <span className="text-xs font-bold text-on-surface leading-tight truncate max-w-30">
            {displayName.split('@')[0]}
          </span>
          <span className="text-[10px] font-medium text-on-surface-variant truncate max-w-30 mt-0.5 capitalize">
            {user?.role?.replace("_", " ") ?? "—"}
          </span>
        </div>

        <ChevronDown
          size={14}
          className={[
            "text-on-surface-variant transition-transform duration-200 hidden md:block",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 mt-2.5 w-52 bg-surface border border-outline-variant/65
                     rounded-xl shadow-xl p-1 z-50 animate-dropdown-enter"
        >
          {/* User Info Header in Dropdown */}
          <div className="px-3 py-2">
            <p className="text-xs font-bold text-on-surface truncate">
              {displayName}
            </p>
            <p className="text-[9px] font-semibold text-on-surface-variant/80 tracking-wider uppercase mt-0.5">
              {user?.role?.replace("_", " ") ?? "—"}
            </p>
          </div>

          <div className="border-t border-outline-variant/50 my-1 mx-1" />

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate("/profile");
            }}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium text-on-surface
                       rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer group"
          >
            <User
              size={15}
              className="text-on-surface-variant group-hover:text-primary transition-colors"
            />
            Profile Settings
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate("/change-password");
            }}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium text-on-surface
                       rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer group"
          >
            <Settings
              size={15}
              className="text-on-surface-variant group-hover:text-primary transition-colors"
            />
            Change Password
          </button>

          <div className="border-t border-outline-variant/50 my-1 mx-1" />

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-semibold text-error
                       rounded-lg hover:bg-error/10 hover:text-error transition-colors cursor-pointer"
          >
            <LogOut size={15} />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
