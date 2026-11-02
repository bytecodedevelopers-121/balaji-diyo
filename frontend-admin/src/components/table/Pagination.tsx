import { cn } from "@/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

const MAX_VISIBLE_PAGES = 5;

function getPageNumbers(page: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= MAX_VISIBLE_PAGES) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = new Set<number>([
    1,
    totalPages,
    page,
    Math.max(1, page - 1),
    Math.min(totalPages, page + 1),
  ]);

  const sorted = Array.from(pages)
    .sort((a, b) => a - b)
    .slice(0, MAX_VISIBLE_PAGES);

  const result: (number | "ellipsis")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push("ellipsis");
    result.push(p);
  });

  return result;
}

export function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  isLoading = false,
}: PaginationProps) {
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm text-gray-600">
      <p>
        Showing{" "}
        <span className="font-medium text-gray-900">
          {start}-{end}
        </span>{" "}
        of <span className="font-medium text-gray-900">{total}</span> results
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={isLoading || page <= 1}
          className="rounded-md px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Prev
        </button>

        {pageNumbers.map((p, i) =>
          p === "ellipsis" ? (
            <span key={`ellipsis-${i}`} className="px-2 text-gray-400">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              disabled={isLoading}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60",
                p === page ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-100",
              )}
            >
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={isLoading || page >= totalPages}
          className="rounded-md px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
