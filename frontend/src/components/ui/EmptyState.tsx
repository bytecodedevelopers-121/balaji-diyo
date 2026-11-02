import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

/** Placeholder for lists/sections with no data yet (e.g. no trips returned by the API). */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-neutral-300 px-6 py-12 text-center">
      <p className="text-base font-medium text-neutral-900">{title}</p>
      {description ? (
        <p className="text-body-m text-neutral-600">{description}</p>
      ) : null}
      {action}
    </div>
  );
}
