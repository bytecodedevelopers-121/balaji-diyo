import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Button } from "@/components/ui/Button";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { TableActions } from "@/components/table/TableActions";
import { Pagination } from "@/components/table/Pagination";
import { SearchInput } from "@/components/table/SearchInput";
import { CostCategoryFormDrawer } from "@/components/cost-category/CostCategoryFormDrawer";
import { usePermission } from "@/hooks/usePermission";
import {
  useCostCategories,
  useCreateCostCategory,
  useUpdateCostCategory,
  useDeleteCostCategory,
} from "@/hooks/queries/useCostCategories";
import { getErrorMessage } from "@/lib/apiError";
import { COMPANY_INFO } from "@/constants";
import type { CostCategory, CostCategoryFormValues, CostCategoryType } from "@/types/cost-category";

export default function CostCategoriesPage() {
  const canCreate = usePermission("create:travel");
  const canEdit = usePermission("update:travel");
  const canDelete = usePermission("delete:travel");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<CostCategoryType | "">("");
  const [formTarget, setFormTarget] = useState<CostCategory | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<CostCategory | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Include / Exclude Categories | ${COMPANY_INFO.name} Admin`;
  }, []);

  const { data, isLoading, isError, isFetching, refetch } = useCostCategories({
    page,
    perPage: 15,
    search: search || undefined,
    type: type || undefined,
  });
  const categories = data?.data.items ?? [];
  const meta = data?.data.meta;

  const createCategory = useCreateCostCategory();
  const updateCategory = useUpdateCostCategory(formTarget?.id ?? "");
  const deleteCategory = useDeleteCostCategory();

  const closeForm = () => setFormTarget(undefined);

  const handleFormSubmit = (values: CostCategoryFormValues) => {
    setError(null);
    const handlers = { onSuccess: closeForm, onError: (err: unknown) => setError(getErrorMessage(err)) };
    if (formTarget) updateCategory.mutate(values, handlers);
    else createCategory.mutate(values, handlers);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setError(null);
    deleteCategory.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
      onError: (err) => {
        setError(getErrorMessage(err));
        setDeleteTarget(null);
      },
    });
  };

  const columns: DataTableColumn<CostCategory>[] = [
    { key: "name", header: "Name", render: (c) => c.name },
    {
      key: "type",
      header: "Type",
      render: (c) => <Badge variant={c.type === "INCLUDE" ? "green" : "red"} label={c.type === "INCLUDE" ? "Include" : "Exclude"} />,
    },
    { key: "icon", header: "Icon", render: (c) => c.icon ?? "—" },
    { key: "sortOrder", header: "Order", render: (c) => c.sortOrder },
    { key: "status", header: "Status", render: (c) => <Badge variant={c.isActive ? "green" : "gray"} label={c.isActive ? "Active" : "Inactive"} /> },
    {
      key: "actions",
      header: "Actions",
      render: (c) => (
        <TableActions
          onEdit={canEdit ? () => setFormTarget(c) : undefined}
          onDelete={canDelete ? () => setDeleteTarget(c) : undefined}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Include / Exclude Categories"
        action={
          <>
            <RefreshButton isFetching={isFetching} onRefresh={refetch} />
            {canCreate && <Button onClick={() => setFormTarget(null)}>+ Add Category</Button>}
          </>
        }
      />

      {isError && <Alert variant="error" message="Failed to load categories." />}
      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <PageCard padding="sm">
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="w-full max-w-sm">
            <SearchInput
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              placeholder="Search categories..."
            />
          </div>
          <div className="w-40">
            <Select
              aria-label="Filter by type"
              value={type}
              onChange={(e) => {
                setType(e.target.value as CostCategoryType | "");
                setPage(1);
              }}
              placeholder="All types"
              options={[
                { value: "INCLUDE", label: "Include" },
                { value: "EXCLUDE", label: "Exclude" },
              ]}
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={categories}
          isLoading={isLoading}
          emptyMessage="No categories yet."
          emptyAction={canCreate ? <Button onClick={() => setFormTarget(null)}>+ Add Category</Button> : undefined}
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
        <CostCategoryFormDrawer
          key={formTarget?.id ?? "new"}
          isOpen
          onClose={closeForm}
          category={formTarget}
          onSubmit={handleFormSubmit}
          isLoading={createCategory.isPending || updateCategory.isPending}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Category"
        message={`Delete "${deleteTarget?.name}"? Packages already using it keep their items, shown under the old name.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteCategory.isPending}
      />
    </div>
  );
}
