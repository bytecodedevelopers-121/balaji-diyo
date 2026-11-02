import { useEffect, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Tabs } from "@/components/layout/Tabs";
import { Button } from "@/components/ui/Button";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TypedConfirmDialog } from "@/components/ui/TypedConfirmDialog";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { TableActions } from "@/components/table/TableActions";
import { Pagination } from "@/components/table/Pagination";
import { SearchInput } from "@/components/table/SearchInput";
import { CategoryFormDrawer } from "@/components/category/CategoryFormDrawer";
import { CategoryPackagesReorderDrawer } from "@/components/category/CategoryPackagesReorderDrawer";
import { usePermission } from "@/hooks/usePermission";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useRestoreCategory,
  useHardDeleteCategory,
} from "@/hooks/queries/useCategories";
import { useCategoryTypes } from "@/hooks/queries/useCategoryTypes";
import { getErrorMessage } from "@/lib/apiError";
import { COMPANY_INFO } from "@/constants";
import type { Category, CreateCategoryDto, UpdateCategoryDto } from "@/types/category";

export default function CategoriesPage() {
  const canCreate = usePermission("create:category");
  const canEdit = usePermission("update:category");
  const canDelete = usePermission("delete:category");
  // The package order lives on packages, so it follows the travel permission.
  const canReorderPackages = usePermission("update:travel");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeId, setTypeId] = useState<string>("");
  const [withPackagesOnly, setWithPackagesOnly] = useState(false);
  const [tab, setTab] = useState<"active" | "trash">("active");
  const [formTarget, setFormTarget] = useState<Category | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [hardDeleteTarget, setHardDeleteTarget] = useState<Category | null>(null);
  const [reorderTarget, setReorderTarget] = useState<Category | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Categories | ${COMPANY_INFO.name} Admin`;
  }, []);

  const { data: typesData } = useCategoryTypes({ perPage: 100 });
  const categoryTypes = typesData?.data.items ?? [];

  // Default to the "Destination" type — it holds every category that has
  // packages (the /nepal-tour-packages, /everest-region-treks, ... pages),
  // unlike the alphabetically-first type (Accommodation). Falls back to the
  // first available type. Derived during render rather than via an effect +
  // setState (avoids a cascading render).
  const effectiveTypeId =
    typeId || categoryTypes.find((t) => t.key === "destination")?.id || categoryTypes[0]?.id || "";

  const isTrash = tab === "trash";
  const { data, isLoading, isError, isFetching, refetch } = useCategories({
    page,
    perPage: 10,
    search: search || undefined,
    typeId: effectiveTypeId || undefined,
    includeTrashed: isTrash,
    hasPackages: withPackagesOnly || undefined,
  });
  const categories = data?.data.items ?? [];
  const meta = data?.data.meta;

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory(formTarget?.id ?? "");
  const deleteCategory = useDeleteCategory();
  const restoreCategory = useRestoreCategory();
  const hardDeleteCategory = useHardDeleteCategory();

  const closeForm = () => setFormTarget(undefined);

  const handleFormSubmit = (values: CreateCategoryDto | UpdateCategoryDto) => {
    setError(null);
    if (formTarget) {
      updateCategory.mutate(values as UpdateCategoryDto, {
        onSuccess: closeForm,
        onError: (err) => setError(getErrorMessage(err)),
      });
    } else {
      createCategory.mutate(values as CreateCategoryDto, {
        onSuccess: closeForm,
        onError: (err) => setError(getErrorMessage(err)),
      });
    }
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

  const handleRestore = (category: Category) => {
    setError(null);
    restoreCategory.mutate(category.id, { onError: (err) => setError(getErrorMessage(err)) });
  };

  const handleHardDelete = () => {
    if (!hardDeleteTarget) return;
    setError(null);
    hardDeleteCategory.mutate(hardDeleteTarget.id, {
      onSuccess: () => setHardDeleteTarget(null),
      onError: (err) => {
        setError(getErrorMessage(err));
        setHardDeleteTarget(null);
      },
    });
  };

  const columns: DataTableColumn<Category>[] = [
    { key: "title", header: "Title", render: (c) => c.title },
    { key: "slug", header: "Slug", render: (c) => c.slug ?? "—" },
    {
      key: "parent",
      header: "Parent",
      render: (c) => categories.find((p) => p.id === c.parentId)?.title ?? "—",
    },
    {
      key: "packages",
      header: "Packages",
      render: (c) => {
        const count = c.packageCount ?? 0;
        if (count === 0) return <span className="text-gray-400">—</span>;
        return (
          <div className="flex items-center gap-2">
            <span className="tabular-nums text-gray-700">{count}</span>
            {!isTrash && canReorderPackages && count > 1 && (
              <Button variant="ghost" size="sm" leftIcon={<ArrowUpDown className="h-3.5 w-3.5" />} onClick={() => setReorderTarget(c)}>
                Reorder
              </Button>
            )}
          </div>
        );
      },
    },
    {
      key: "isActive",
      header: "Status",
      render: (c) =>
        c.deletedAt ? (
          <Badge label="Deleted" variant="red" />
        ) : (
          <Badge variant={c.isActive ? "green" : "gray"} label={c.isActive ? "Active" : "Inactive"} />
        ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (c) =>
        isTrash ? (
          <TableActions
            onRestore={canDelete ? () => handleRestore(c) : undefined}
            onHardDelete={canDelete ? () => setHardDeleteTarget(c) : undefined}
            canDelete={canDelete}
            isRestoring={restoreCategory.isPending}
          />
        ) : (
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
        title="Categories"
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

        <div className="mb-4 flex flex-wrap gap-3">
          <div className="w-56">
            <Select
              options={categoryTypes.map((t) => ({ value: t.id, label: t.name }))}
              value={effectiveTypeId}
              onChange={(e) => {
                setTypeId(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Checkbox
            label="With packages only"
            checked={withPackagesOnly}
            onChange={(e) => {
              setWithPackagesOnly(e.target.checked);
              setPage(1);
            }}
          />
          <div className="max-w-sm flex-1">
            <SearchInput
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              placeholder="Search categories..."
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={categories}
          isLoading={isLoading}
          emptyMessage={isTrash ? "Trash is empty." : "No categories yet for this type."}
          emptyAction={!isTrash && canCreate ? <Button onClick={() => setFormTarget(null)}>+ Add Category</Button> : undefined}
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
        <CategoryFormDrawer
          key={formTarget?.id ?? "new"}
          isOpen
          onClose={closeForm}
          category={formTarget}
          categoryTypes={categoryTypes}
          parentOptionsSource={categories}
          defaultTypeId={effectiveTypeId}
          onSubmit={handleFormSubmit}
          isLoading={createCategory.isPending || updateCategory.isPending}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? It will be moved to Trash and can be restored later.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteCategory.isPending}
      />

      <TypedConfirmDialog
        isOpen={!!hardDeleteTarget}
        onClose={() => setHardDeleteTarget(null)}
        onConfirm={handleHardDelete}
        isLoading={hardDeleteCategory.isPending}
        title="Delete Category Permanently"
        message={`"${hardDeleteTarget?.title}" and its SEO data and image links will be erased for good. This cannot be restored.`}
        confirmText="DELETE"
      />
      {reorderTarget && (
        <CategoryPackagesReorderDrawer key={reorderTarget.id} category={reorderTarget} onClose={() => setReorderTarget(null)} />
      )}
    </div>
  );
}
