import { Link } from "react-router-dom";
import { ChevronRight, FolderOpen, LayoutTemplate } from "lucide-react";
import { PageCard } from "@/components/layout/PageCard";

interface CardProps {
  to: string;
  title: string;
  description: string;
  meta: string;
  folder?: boolean;
}

/** One clickable card on the Page Content screens (a page, or a folder of pages). */
export function ContentCard({ to, title, description, meta, folder }: CardProps) {
  const Icon = folder ? FolderOpen : LayoutTemplate;
  return (
    <Link to={to} className="group block">
      <PageCard padding="sm" className="h-full transition-shadow group-hover:shadow-md">
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-logo-sun/20 p-1.5 text-logo-navy-dark">
            <Icon size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900">{title}</p>
            <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{description}</p>
            <p className="mt-1 text-[11px] font-medium text-gray-400">{meta}</p>
          </div>
          <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500" />
        </div>
      </PageCard>
    </Link>
  );
}
