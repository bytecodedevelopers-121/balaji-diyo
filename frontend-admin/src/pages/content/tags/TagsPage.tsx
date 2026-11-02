import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Button } from "@/components/ui/Button";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { Alert } from "@/components/ui/Alert";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { TableActions } from "@/components/table/TableActions";
import { Pagination } from "@/components/table/Pagination";
import { SearchInput } from "@/components/table/SearchInput";
import { TagFormDrawer } from "@/components/tag/TagFormDrawer";
import { usePermission } from "@/hooks/usePermission";
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from "@/hooks/queries/useTags";
import { getErrorMessage } from "@/lib/apiError";
import { COMPANY_INFO } from "@/constants";
import type { Tag, CreateTagDto, UpdateTagDto } from "@/types/tag";

export default function TagsPage() {
  const canCreate = usePermission("create:tag");
  const canEdit = usePermission("update:tag");
  const canDelete = usePermission("delete:tag");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [formTarget, setFormTarget] = useState<Tag | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Tags | ${COMPANY_INFO.name} Admin`;
  }, []);

  const { data, isLoading, isError, isFetching, refetch } = useTags({ page, perPage: 15, search: search || undefined });
  const tags = data?.data.items ?? [];
  const meta = data?.data.meta;

  const createTag = useCreateTag();
  const updateTag = useUpdateTag(formTarget?.id ?? "");
  const deleteTag = useDeleteTag();

  const closeForm = () => setFormTarget(undefined);

  const handleFormSubmit = (values: CreateTagDto | UpdateTagDto) => {
    setError(null);
    if (formTarget) {
      updateTag.mutate(values as UpdateTagDto, { onSuccess: closeForm, onError: (err) => setError(getErrorMessage(err)) });
    } else {
      createTag.mutate(values as CreateTagDto, { onSuccess: closeForm, onError: (err) => setError(getErrorMessage(err)) });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setError(null);
    deleteTag.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
      onError: (err) => {
        setError(getErrorMessage(err));
        setDeleteTarget(null);
      },
    });
  };

  const columns: DataTableColumn<Tag>[] = [
    { key: "name", header: "Name", render: (t) => t.name },
    { key: "slug", header: "Slug", render: (t) => t.slug },
    {
      key: "actions",
      header: "Actions",
      render: (t) => (
        <TableActions
          onEdit={canEdit ? () => setFormTarget(t) : undefined}
          onDelete={canDelete ? () => setDeleteTarget(t) : undefined}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tags"
        action={
          <>
            <RefreshButton isFetching={isFetching} onRefresh={refetch} />
            {canCreate && <Button onClick={() => setFormTarget(null)}>+ Add Tag</Button>}
          </>
        }
      />

      {isError && <Alert variant="error" message="Failed to load tags." />}
      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <PageCard padding="sm">
        <div className="mb-4 max-w-sm">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search tags..."
          />
        </div>

        <DataTable
          columns={columns}
          data={tags}
          isLoading={isLoading}
          emptyMessage="No tags yet."
          emptyAction={canCreate ? <Button onClick={() => setFormTarget(null)}>+ Add Tag</Button> : undefined}
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

      {formTarget !== undefined && (
        <TagFormDrawer
          key={formTarget?.id ?? "new"}
          isOpen
          onClose={closeForm}
          tag={formTarget}
          onSubmit={handleFormSubmit}
          isLoading={createTag.isPending || updateTag.isPending}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Tag"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteTag.isPending}
      />
    </div>
  );
}
