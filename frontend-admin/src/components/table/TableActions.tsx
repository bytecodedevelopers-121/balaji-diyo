import type { ReactNode } from "react";
import { cn } from "@/utils";

interface TableActionsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onRestore?: () => void;
  onHardDelete?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
  isDeleting?: boolean;
  isRestoring?: boolean;
}

interface ActionButtonProps {
  onClick: () => void;
  title: string;
  variant?: "ghost" | "danger";
  disabled?: boolean;
  children: ReactNode;
}

function ActionButton({ onClick, title, variant = "ghost", disabled, children }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variant === "danger"
          ? "text-red-500 hover:bg-red-50 hover:text-red-600"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-700",
      )}
    >
      {children}
    </button>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.5">
      <path
        d="M1.5 10S4.5 4 10 4s8.5 6 8.5 6-3 6-8.5 6-8.5-6-8.5-6Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.5">
      <path d="M13.5 3.5 16 6l-9 9-3 .5.5-3 9-9Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.5">
      <path
        d="M4 6h12M8 6V4.5A1 1 0 0 1 9 3.5h2a1 1 0 0 1 1 1V6m-6.5 0 .6 9a1 1 0 0 0 1 1h4.8a1 1 0 0 0 1-1l.6-9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HardDeleteIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.5">
      <path
        d="M4 6h12M8 6V4.5A1 1 0 0 1 9 3.5h2a1 1 0 0 1 1 1V6m-6.5 0 .6 9a1 1 0 0 0 1 1h4.8a1 1 0 0 0 1-1l.6-9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="m8.5 9 3 3.5m0-3.5-3 3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RestoreIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 4v4h4" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M4.5 8a6 6 0 1 1 1.5 5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TableActions({
  onView,
  onEdit,
  onDelete,
  onRestore,
  onHardDelete,
  canEdit = true,
  canDelete = true,
  isDeleting = false,
  isRestoring = false,
}: TableActionsProps) {
  return (
    <div className="flex items-center gap-1">
      {onView && (
        <ActionButton onClick={onView} title="View">
          <EyeIcon />
        </ActionButton>
      )}
      {onEdit && canEdit && (
        <ActionButton onClick={onEdit} title="Edit">
          <PencilIcon />
        </ActionButton>
      )}
      {onDelete && canDelete && (
        <ActionButton onClick={onDelete} title="Delete" variant="danger" disabled={isDeleting}>
          <TrashIcon />
        </ActionButton>
      )}
      {onRestore && canDelete && (
        <ActionButton onClick={onRestore} title="Restore" disabled={isRestoring}>
          <RestoreIcon />
        </ActionButton>
      )}
      {onHardDelete && canDelete && (
        <ActionButton onClick={onHardDelete} title="Delete permanently" variant="danger">
          <HardDeleteIcon />
        </ActionButton>
      )}
    </div>
  );
}
