import type { ReactNode } from "react";
import { TableSkeleton } from "./TableSkeleton";
import { cn } from "@/utils";

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  width?: string;
  render: (row: T, index: number) => ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  isLoading?: boolean;
  skeletonRows?: number;
  emptyMessage?: string;
  emptyAction?: ReactNode;
  className?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  skeletonRows = 5,
  emptyMessage = "No data found",
  emptyAction,
  className,
  onRowClick,
}: DataTableProps<T>) {
  return (
    <div className={cn("overflow-x-auto rounded-2xl border border-[#efe6da] bg-white", className)}>
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="sticky top-0 bg-logo-navy-dark">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={col.width ? { width: col.width } : undefined}
                className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {isLoading ? (
            <TableSkeleton rows={skeletonRows} cols={columns.length} />
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center">
                <p className="text-sm text-gray-500">{emptyMessage}</p>
                {emptyAction && <div className="mt-3 flex justify-center">{emptyAction}</div>}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={i}
                className={cn("hover:bg-site-row", onRowClick && "cursor-pointer")}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    {col.render(row, i)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
