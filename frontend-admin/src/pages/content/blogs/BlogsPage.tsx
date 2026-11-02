import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Tabs } from "@/components/layout/Tabs";
import { Button } from "@/components/ui/Button";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TypedConfirmDialog } from "@/components/ui/TypedConfirmDialog";
import { Drawer } from "@/components/ui/Drawer";
import { RichTextView } from "@/components/form/RichTextView";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { TableActions } from "@/components/table/TableActions";
import { Pagination } from "@/components/table/Pagination";
import { SearchInput } from "@/components/table/SearchInput";
import { usePermission } from "@/hooks/usePermission";
import { useBlogs, useDeleteBlog, useRestoreBlog, useHardDeleteBlog } from "@/hooks/queries/useBlogs";
import { getErrorMessage } from "@/lib/apiError";
import { formatDate } from "@/lib/formatDate";
import { PATHS } from "@/constants/PATHS";
import { COMPANY_INFO } from "@/constants";
import type { Blog } from "@/types/blog";

export default function BlogsPage() {
  const navigate = useNavigate();
  const canCreate = usePermission("create:blog");
  const canEdit = usePermission("update:blog");
  const canDelete = usePermission("delete:blog");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"active" | "trash">("active");
  const [deleteTarget, setDeleteTarget] = useState<Blog | null>(null);
  const [hardDeleteTarget, setHardDeleteTarget] = useState<Blog | null>(null);
  const [viewTarget, setViewTarget] = useState<Blog | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Blogs | ${COMPANY_INFO.name} Admin`;
  }, []);

  const isTrash = tab === "trash";
  const { data, isLoading, isError, isFetching, refetch } = useBlogs({
    page,
    perPage: 10,
    search: search || undefined,
    includeTrashed: isTrash,
  });
  const blogs = data?.data.items ?? [];
  const meta = data?.data.meta;

  const deleteBlog = useDeleteBlog();
  const restoreBlog = useRestoreBlog();
  const hardDeleteBlog = useHardDeleteBlog();

  const handleDelete = () => {
    if (!deleteTarget) return;
    setError(null);
    deleteBlog.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
      onError: (err) => {
        setError(getErrorMessage(err));
        setDeleteTarget(null);
      },
    });
  };

  const handleRestore = (blog: Blog) => {
    setError(null);
    restoreBlog.mutate(blog.id, { onError: (err) => setError(getErrorMessage(err)) });
  };

  const handleHardDelete = () => {
    if (!hardDeleteTarget) return;
    setError(null);
    hardDeleteBlog.mutate(hardDeleteTarget.id, {
      onSuccess: () => setHardDeleteTarget(null),
      onError: (err) => {
        setError(getErrorMessage(err));
        setHardDeleteTarget(null);
      },
    });
  };

  const columns: DataTableColumn<Blog>[] = [
    { key: "title", header: "Title", render: (b) => <span className="font-medium text-gray-900">{b.title}</span> },
    {
      key: "authors",
      header: "Authors",
      render: (b) => b.authors.map((a) => a.name).join(", ") || "—",
    },
    { key: "blogDate", header: "Date", render: (b) => formatDate(b.blogDate) },
    {
      key: "isActive",
      header: "Status",
      render: (b) =>
        b.deletedAt ? (
          <Badge label="Deleted" variant="red" />
        ) : (
          <Badge label={b.isActive ? "Active" : "Inactive"} variant={b.isActive ? "green" : "gray"} />
        ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (b) =>
        isTrash ? (
          <TableActions
            onRestore={canDelete ? () => handleRestore(b) : undefined}
            onHardDelete={canDelete ? () => setHardDeleteTarget(b) : undefined}
            canDelete={canDelete}
            isRestoring={restoreBlog.isPending}
          />
        ) : (
          <TableActions
            onView={() => setViewTarget(b)}
            onEdit={canEdit ? () => navigate(`/blogs/${b.id}`) : undefined}
            onDelete={canDelete ? () => setDeleteTarget(b) : undefined}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blogs"
        action={
          <>
            <RefreshButton isFetching={isFetching} onRefresh={refetch} />
            {canCreate && <Button onClick={() => navigate(PATHS.BLOG_CREATE)}>+ New Blog</Button>}
          </>
        }
      />

      {isError && <Alert variant="error" message="Failed to load blogs." />}
      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <PageCard padding="sm">
        <div className="mb-4">
          <Tabs
            tabs={[
              { value: "active", label: "Active" },
              { value: "trash", label: "Trash" },
            ]}
            value={tab}
            onChange={(v) => {
              setTab(v as "active" | "trash");
              setPage(1);
            }}
          />
        </div>

        <div className="mb-4 max-w-sm">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search blogs..."
          />
        </div>

        <DataTable
          columns={columns}
          data={blogs}
          isLoading={isLoading}
          emptyMessage={isTrash ? "Trash is empty." : "No blogs yet."}
          emptyAction={!isTrash && canCreate ? <Button onClick={() => navigate(PATHS.BLOG_CREATE)}>+ New Blog</Button> : undefined}
        />

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
        title="Delete Blog"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? It will be moved to Trash and can be restored later.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteBlog.isPending}
      />

      <TypedConfirmDialog
        isOpen={!!hardDeleteTarget}
        onClose={() => setHardDeleteTarget(null)}
        onConfirm={handleHardDelete}
        isLoading={hardDeleteBlog.isPending}
        title="Delete Blog Permanently"
        message={`"${hardDeleteTarget?.title}" and its SEO data and image links will be erased for good. This cannot be restored.`}
        confirmText="DELETE"
      />

      <Drawer isOpen={!!viewTarget} onClose={() => setViewTarget(null)} title={viewTarget?.title} size="lg">
        {viewTarget && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge label={viewTarget.isActive ? "Active" : "Inactive"} variant={viewTarget.isActive ? "green" : "gray"} />
              {viewTarget.slug && <span className="text-sm text-gray-500">/{viewTarget.slug}</span>}
            </div>
            {viewTarget.abstract && <p className="text-sm italic text-gray-600">{viewTarget.abstract}</p>}
            <RichTextView html={viewTarget.content} />
          </div>
        )}
      </Drawer>
    </div>
  );
}
