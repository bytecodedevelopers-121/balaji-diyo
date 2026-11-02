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
import { usePages, useDeletePage, useRestorePage, useHardDeletePage } from "@/hooks/queries/usePages";
import { getErrorMessage } from "@/lib/apiError";
import { PATHS } from "@/constants/PATHS";
import { COMPANY_INFO } from "@/constants";
import type { Page } from "@/types/page";

export default function PagesPage() {
  const navigate = useNavigate();
  const canCreate = usePermission("create:page");
  const canEdit = usePermission("update:page");
  const canDelete = usePermission("delete:page");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"active" | "trash">("active");
  const [deleteTarget, setDeleteTarget] = useState<Page | null>(null);
  const [hardDeleteTarget, setHardDeleteTarget] = useState<Page | null>(null);
  const [viewTarget, setViewTarget] = useState<Page | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Pages | ${COMPANY_INFO.name} Admin`;
  }, []);

  const isTrash = tab === "trash";
  const { data, isLoading, isError, isFetching, refetch } = usePages({
    page,
    perPage: 10,
    search: search || undefined,
    includeTrashed: isTrash,
  });
  const pages = data?.data.items ?? [];
  const meta = data?.data.meta;

  const deletePage = useDeletePage();
  const restorePage = useRestorePage();
  const hardDeletePage = useHardDeletePage();

  const handleDelete = () => {
    if (!deleteTarget) return;
    setError(null);
    deletePage.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
      onError: (err) => {
        setError(getErrorMessage(err));
        setDeleteTarget(null);
      },
    });
  };

  const handleRestore = (p: Page) => {
    setError(null);
    restorePage.mutate(p.id, { onError: (err) => setError(getErrorMessage(err)) });
  };

  const handleHardDelete = () => {
    if (!hardDeleteTarget) return;
    setError(null);
    hardDeletePage.mutate(hardDeleteTarget.id, {
      onSuccess: () => setHardDeleteTarget(null),
      onError: (err) => {
        setError(getErrorMessage(err));
        setHardDeleteTarget(null);
      },
    });
  };

  const columns: DataTableColumn<Page>[] = [
    { key: "title", header: "Title", render: (p) => <span className="font-medium text-gray-900">{p.title}</span> },
    { key: "slug", header: "Slug", render: (p) => p.slug ?? "—" },
    {
      key: "isActive",
      header: "Status",
      render: (p) =>
        p.deletedAt ? (
          <Badge label="Deleted" variant="red" />
        ) : (
          <Badge label={p.isActive ? "Active" : "Inactive"} variant={p.isActive ? "green" : "gray"} />
        ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (p) =>
        isTrash ? (
          <TableActions
            onRestore={canDelete ? () => handleRestore(p) : undefined}
            onHardDelete={canDelete ? () => setHardDeleteTarget(p) : undefined}
            canDelete={canDelete}
            isRestoring={restorePage.isPending}
          />
        ) : (
          <TableActions
            onView={() => setViewTarget(p)}
            onEdit={canEdit ? () => navigate(PATHS.PAGE_DETAIL(p.id)) : undefined}
            onDelete={canDelete ? () => setDeleteTarget(p) : undefined}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pages"
        action={
          <>
            <RefreshButton isFetching={isFetching} onRefresh={refetch} />
            {canCreate && <Button onClick={() => navigate(PATHS.PAGE_CREATE)}>+ New Page</Button>}
          </>
        }
      />

      {isError && <Alert variant="error" message="Failed to load pages." />}
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
            placeholder="Search pages..."
          />
        </div>

        <DataTable
          columns={columns}
          data={pages}
          isLoading={isLoading}
          emptyMessage={isTrash ? "Trash is empty." : "No pages yet."}
          emptyAction={!isTrash && canCreate ? <Button onClick={() => navigate(PATHS.PAGE_CREATE)}>+ New Page</Button> : undefined}
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
        title="Delete Page"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? It will be moved to Trash and can be restored later.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deletePage.isPending}
      />

      <TypedConfirmDialog
        isOpen={!!hardDeleteTarget}
        onClose={() => setHardDeleteTarget(null)}
        onConfirm={handleHardDelete}
        isLoading={hardDeletePage.isPending}
        title="Delete Page Permanently"
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

            <RichTextView html={viewTarget.content} />
          </div>
        )}
      </Drawer>
    </div>
  );
}
