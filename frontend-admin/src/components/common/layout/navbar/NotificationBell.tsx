// src/components/common/layout/Navbar/NotificationBell.tsx
import { Bell } from 'lucide-react';

interface NotificationBellProps {
  count?: number;
}

/**
 * NotificationBell
 * Icon button with an optional unread-count badge.
 * Badge is hidden when count is 0 or undefined.
 */
export function NotificationBell({ count = 0 }: NotificationBellProps) {
  return (
    <button
      type="button"
      className="relative w-9 h-9 flex items-center justify-center rounded-xl
                 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface
                 transition-all duration-200 cursor-pointer group"
      aria-label={count > 0 ? `${count} unread notifications` : 'Notifications'}
    >
      <Bell 
        size={18} 
        className="group-hover:animate-wiggle transition-transform"
      />
      {count > 0 && (
        <span
          className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-error text-white
                     text-[9px] font-extrabold flex items-center justify-center leading-none
                     ring-2 ring-surface animate-pulse-subtle shadow-sm"
        >
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
}