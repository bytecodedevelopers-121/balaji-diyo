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
import { CategoryTypeFormDrawer } from "@/components/category-type/CategoryTypeFormDrawer";
import { usePermission } from "@/hooks/usePermission";
import {
  useCategoryTypes,
  useCreateCategoryType,
  useUpdateCategoryType,
  useDeleteCategoryType,
} from "@/hooks/queries/useCategoryTypes";
import { getErrorMessage } from "@/lib/apiError";
import { COMPANY_INFO } from "@/constants";
import type { CategoryType, CreateCategoryTypeDto, UpdateCategoryTypeDto } from "@/types/category-type";

export default function CategoryTypesPage() {
  const canCreate = usePermission("create:category");
  const canEdit = usePermission("update:category");
  const canDelete = usePermission("delete:category");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [formTarget, setFormTarget] = useState<CategoryType | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<CategoryType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Category Types | ${COMPANY_INFO.name} Admin`;
  }, []);

  const { data, isLoading, isError, isFetching, refetch } = useCategoryTypes({ page, perPage: 15, search: search || undefined });
  const categoryTypes = data?.data.items ?? [];
  const meta = data?.data.meta;

  const createType = useCreateCategoryType();
  const updateType = useUpdateCategoryType(formTarget?.id ?? "");
  const deleteType = useDeleteCategoryType();

  const closeForm = () => setFormTarget(undefined);

  const handleFormSubmit = (values: CreateCategoryTypeDto | UpdateCategoryTypeDto) => {
    setError(null);
    if (formTarget) {
      updateType.mutate(values as UpdateCategoryTypeDto, { onSuccess: closeForm, onError: (err) => setError(getErrorMessage(err)) });
    } else {
      createType.mutate(values as CreateCategoryTypeDto, { onSuccess: closeForm, onError: (err) => setError(getErrorMessage(err)) });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setError(null);
    deleteType.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
      onError: (err) => {
        setError(getErrorMessage(err));
        setDeleteTarget(null);
      },
    });
  };

  const columns: DataTableColumn<CategoryType>[] = [
    { key: "key", header: "Key", render: (t) => <code className="text-xs">{t.key}</code> },
    { key: "name", header: "Name", render: (t) => t.name },
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
        title="Category Types"
        action={
          <>
            <RefreshButton isFetching={isFetching} onRefresh={refetch} />
            {canCreate && <Button onClick={() => setFormTarget(null)}>+ Add Type</Button>}
          </>
        }
      />

      {isError && <Alert variant="error" message="Failed to load category types." />}
      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <PageCard padding="sm">
        <div className="mb-4 max-w-sm">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search category types..."
          />
        </div>

        <DataTable
          columns={columns}
          data={categoryTypes}
          isLoading={isLoading}
          emptyMessage="No category types yet."
          emptyAction={canCreate ? <Button onClick={() => setFormTarget(null)}>+ Add Type</Button> : undefined}
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
        <CategoryTypeFormDrawer
          key={formTarget?.id ?? "new"}
          isOpen
          onClose={closeForm}
          categoryType={formTarget}
          onSubmit={handleFormSubmit}
          isLoading={createType.isPending || updateType.isPending}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Category Type"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteType.isPending}
      />
    </div>
  );
}
