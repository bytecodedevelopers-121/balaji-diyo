import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  breadcrumbs?: Breadcrumb[];
  action?: ReactNode;
  backHref?: string;
  isLoading?: boolean;
}

export function PageHeader({ title, breadcrumbs, action, backHref, isLoading }: PageHeaderProps) {
  const hasBreadcrumbRow = backHref || (breadcrumbs && breadcrumbs.length > 0);

  return (
    <div className="mb-6">
      {hasBreadcrumbRow && (
        <div className="mb-1.5 flex items-center gap-2 text-sm text-gray-500">
          {backHref && (
            <Link
              to={backHref}
              aria-label="Back"
              className="inline-flex items-center text-gray-400 hover:text-gray-600"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
          )}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-1.5">
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {crumb.href ? (
                    <Link to={crumb.href} className="hover:text-gray-700">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-gray-700">{crumb.label}</span>
                  )}
                  {i < breadcrumbs.length - 1 && <span className="text-gray-300">/</span>}
                </span>
              ))}
            </nav>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {isLoading ? (
          <Skeleton className="h-8 w-48" />
        ) : (
          <h1 className="font-display text-2xl font-bold text-logo-navy-dark">{title}</h1>
        )}
        {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
      </div>
    </div>
  );
}
