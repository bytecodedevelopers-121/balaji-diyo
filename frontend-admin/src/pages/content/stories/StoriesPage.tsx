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
import { useStories, useDeleteStory, useRestoreStory, useHardDeleteStory } from "@/hooks/queries/useStories";
import { getErrorMessage } from "@/lib/apiError";
import { formatDate } from "@/lib/formatDate";
import { PATHS } from "@/constants/PATHS";
import { COMPANY_INFO } from "@/constants";
import type { Story } from "@/types/story";

export default function StoriesPage() {
  const navigate = useNavigate();
  const canCreate = usePermission("create:travel");
  const canEdit = usePermission("update:travel");
  const canDelete = usePermission("delete:travel");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"active" | "trash">("active");
  const [deleteTarget, setDeleteTarget] = useState<Story | null>(null);
  const [hardDeleteTarget, setHardDeleteTarget] = useState<Story | null>(null);
  const [viewTarget, setViewTarget] = useState<Story | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Stories | ${COMPANY_INFO.name} Admin`;
  }, []);

  const isTrash = tab === "trash";
  const { data, isLoading, isError, isFetching, refetch } = useStories({
    page,
    perPage: 10,
    search: search || undefined,
    includeTrashed: isTrash,
  });
  const stories = data?.data.items ?? [];
  const meta = data?.data.meta;

  const deleteStory = useDeleteStory();
  const restoreStory = useRestoreStory();
  const hardDeleteStory = useHardDeleteStory();

  const handleDelete = () => {
    if (!deleteTarget) return;
    setError(null);
    deleteStory.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
      onError: (err) => {
        setError(getErrorMessage(err));
        setDeleteTarget(null);
      },
    });
  };

  const handleRestore = (story: Story) => {
    setError(null);
    restoreStory.mutate(story.id, { onError: (err) => setError(getErrorMessage(err)) });
  };

  const handleHardDelete = () => {
    if (!hardDeleteTarget) return;
    setError(null);
    hardDeleteStory.mutate(hardDeleteTarget.id, {
      onSuccess: () => setHardDeleteTarget(null),
      onError: (err) => {
        setError(getErrorMessage(err));
        setHardDeleteTarget(null);
      },
    });
  };

  const columns: DataTableColumn<Story>[] = [
    { key: "title", header: "Title", render: (s) => <span className="font-medium text-gray-900">{s.title}</span> },
    {
      key: "authors",
      header: "Authors",
      render: (s) => s.authors.map((a) => a.name).join(", ") || "—",
    },
    { key: "storyDate", header: "Date", render: (s) => formatDate(s.storyDate) },
    {
      key: "isActive",
      header: "Status",
      render: (s) =>
        s.deletedAt ? (
          <Badge label="Deleted" variant="red" />
        ) : (
          <Badge label={s.isActive ? "Active" : "Inactive"} variant={s.isActive ? "green" : "gray"} />
        ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (s) =>
        isTrash ? (
          <TableActions
            onRestore={canDelete ? () => handleRestore(s) : undefined}
            onHardDelete={canDelete ? () => setHardDeleteTarget(s) : undefined}
            canDelete={canDelete}
            isRestoring={restoreStory.isPending}
          />
        ) : (
          <TableActions
            onView={() => setViewTarget(s)}
            onEdit={canEdit ? () => navigate(PATHS.STORY_DETAIL(s.id)) : undefined}
            onDelete={canDelete ? () => setDeleteTarget(s) : undefined}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stories"
        action={
          <>
            <RefreshButton isFetching={isFetching} onRefresh={refetch} />
            {canCreate && <Button onClick={() => navigate(PATHS.STORY_CREATE)}>+ New Story</Button>}
          </>
        }
      />

      {isError && <Alert variant="error" message="Failed to load stories." />}
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
            placeholder="Search stories..."
          />
        </div>

        <DataTable
          columns={columns}
          data={stories}
          isLoading={isLoading}
          emptyMessage={isTrash ? "Trash is empty." : "No stories yet."}
          emptyAction={!isTrash && canCreate ? <Button onClick={() => navigate(PATHS.STORY_CREATE)}>+ New Story</Button> : undefined}
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
        title="Delete Story"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? It will be moved to Trash and can be restored later.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteStory.isPending}
      />

      <TypedConfirmDialog
        isOpen={!!hardDeleteTarget}
        onClose={() => setHardDeleteTarget(null)}
        onConfirm={handleHardDelete}
        isLoading={hardDeleteStory.isPending}
        title="Delete Story Permanently"
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
