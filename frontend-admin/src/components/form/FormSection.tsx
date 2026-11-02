import type { ReactNode } from "react";

interface FormSectionProps {
  title: string;
  description?: string;
  columns?: 2 | 3 | 4;
  children: ReactNode;
}

const COLUMN_CLASS: Record<2 | 3 | 4, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

export function FormSection({ title, description, columns = 2, children }: FormSectionProps) {
  return (
    <section className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
      </div>
      <div className={`grid grid-cols-1 gap-3 ${COLUMN_CLASS[columns]}`}>{children}</div>
    </section>
  );
}
