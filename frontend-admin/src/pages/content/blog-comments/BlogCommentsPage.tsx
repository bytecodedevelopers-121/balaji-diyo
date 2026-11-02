import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { Select } from "@/components/ui/Select";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { TableActions } from "@/components/table/TableActions";
import { Pagination } from "@/components/table/Pagination";
import { usePermission } from "@/hooks/usePermission";
import {
  useBlogComments,
  useApproveBlogComment,
  useRejectBlogComment,
  useDeleteBlogComment,
} from "@/hooks/queries/useBlogComments";
import { getErrorMessage } from "@/lib/apiError";
import { formatDate } from "@/lib/formatDate";
import { COMPANY_INFO } from "@/constants";
import type { BlogComment } from "@/types/blog-comment";

export default function BlogCommentsPage() {
  const canModerate = usePermission("update:comment");
  const canDelete = usePermission("delete:comment");

  const [page, setPage] = useState(1);
  const [isActive, setIsActive] = useState<"" | "true" | "false">("");
  const [deleteTarget, setDeleteTarget] = useState<BlogComment | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Blog Comments | ${COMPANY_INFO.name} Admin`;
  }, []);

  const { data, isLoading, isError, isFetching, refetch } = useBlogComments({
    page,
    perPage: 15,
    isActive: isActive === "" ? undefined : isActive === "true",
  });
  const comments = data?.data.items ?? [];
  const meta = data?.data.meta;

  const approve = useApproveBlogComment();
  const reject = useRejectBlogComment();
  const deleteComment = useDeleteBlogComment();

  const handleDelete = () => {
    if (!deleteTarget) return;
    setError(null);
    deleteComment.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
      onError: (err) => {
        setError(getErrorMessage(err));
        setDeleteTarget(null);
      },
    });
  };

  const columns: DataTableColumn<BlogComment>[] = [
    {
      key: "commentor",
      header: "Commenter",
      render: (c) => (
        <div>
          <span className="font-medium text-gray-900">{c.commentorName}</span>
          {c.commentorEmail && <div className="text-xs text-gray-500">{c.commentorEmail}</div>}
        </div>
      ),
    },
    { key: "blog", header: "Blog", render: (c) => c.blog?.title ?? "—" },
    {
      key: "comment",
      header: "Comment",
      render: (c) => <span className="line-clamp-2 max-w-md text-sm text-gray-600">{c.comment}</span>,
    },
    {
      key: "isActive",
      header: "Status",
      render: (c) => <Badge label={c.isActive ? "Approved" : "Pending"} variant={c.isActive ? "green" : "yellow"} />,
    },
    { key: "createdAt", header: "Submitted", render: (c) => formatDate(c.createdAt) },
    {
      key: "actions",
      header: "Actions",
      render: (c) => (
        <div className="flex items-center gap-1">
          {canModerate && !c.isActive && (
            <button
              type="button"
              onClick={() => approve.mutate(c.id, { onError: (err) => setError(getErrorMessage(err)) })}
              title="Approve"
              aria-label="Approve"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-green-600 transition-colors hover:bg-green-50"
            >
              <Check className="h-4 w-4" />
            </button>
          )}
          {canModerate && c.isActive && (
            <button
              type="button"
              onClick={() => reject.mutate(c.id, { onError: (err) => setError(getErrorMessage(err)) })}
              title="Unapprove"
              aria-label="Unapprove"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-amber-600 transition-colors hover:bg-amber-50"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <TableActions
            onDelete={canDelete ? () => setDeleteTarget(c) : undefined}
            canDelete={canDelete}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Blog Comments" action={<RefreshButton isFetching={isFetching} onRefresh={refetch} />} />

      {isError && <Alert variant="error" message="Failed to load comments." />}
      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <PageCard padding="sm">
        <div className="mb-4 w-44">
          <Select
            options={[
              { value: "", label: "All comments" },
              { value: "false", label: "Pending" },
              { value: "true", label: "Approved" },
            ]}
            value={isActive}
            onChange={(e) => {
              setIsActive(e.target.value as "" | "true" | "false");
              setPage(1);
            }}
          />
        </div>

        <DataTable columns={columns} data={comments} isLoading={isLoading} emptyMessage="No comments yet." />

        {meta && meta.total > 0 && (
          <Pagination
            page={meta.currentPage}
            totalPages={meta.totalPages}
            total={meta.total}
            limit={meta.perPage}
            onPageChange={setPage}
            isLoading={isLoading}
          />
        )}
      </PageCard>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Comment"
        message={`Are you sure you want to delete this comment from "${deleteTarget?.commentorName}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteComment.isPending}
      />
    </div>
  );
}
