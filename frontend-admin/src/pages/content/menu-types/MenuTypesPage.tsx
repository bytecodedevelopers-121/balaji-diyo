import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
import { MenuTypeFormDrawer } from "@/components/menu-type/MenuTypeFormDrawer";
import { usePermission } from "@/hooks/usePermission";
import { useMenuTypes, useCreateMenuType, useUpdateMenuType, useDeleteMenuType } from "@/hooks/queries/useMenuTypes";
import { getErrorMessage } from "@/lib/apiError";
import { COMPANY_INFO } from "@/constants";
import { PATHS } from "@/constants/PATHS";
import type { MenuType, CreateMenuTypeDto, UpdateMenuTypeDto } from "@/types/menu-type";

export default function MenuTypesPage() {
  const canCreate = usePermission("create:menu");
  const canEdit = usePermission("update:menu");
  const canDelete = usePermission("delete:menu");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [formTarget, setFormTarget] = useState<MenuType | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<MenuType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Menus | ${COMPANY_INFO.name} Admin`;
  }, []);

  const { data, isLoading, isError, isFetching, refetch } = useMenuTypes({ page, perPage: 15, search: search || undefined });
  const menuTypes = data?.data.items ?? [];
  const meta = data?.data.meta;

  const createType = useCreateMenuType();
  const updateType = useUpdateMenuType(formTarget?.id ?? "");
  const deleteType = useDeleteMenuType();

  const closeForm = () => setFormTarget(undefined);

  const handleFormSubmit = (values: CreateMenuTypeDto | UpdateMenuTypeDto) => {
    setError(null);
    if (formTarget) {
      updateType.mutate(values as UpdateMenuTypeDto, { onSuccess: closeForm, onError: (err) => setError(getErrorMessage(err)) });
    } else {
      createType.mutate(values as CreateMenuTypeDto, { onSuccess: closeForm, onError: (err) => setError(getErrorMessage(err)) });
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

  const columns: DataTableColumn<MenuType>[] = [
    { key: "key", header: "Key", render: (t) => <code className="text-xs">{t.key}</code> },
    { key: "name", header: "Name", render: (t) => t.name },
    {
      key: "items",
      header: "Items",
      render: (t) => (
        <Link to={PATHS.MENU_ITEMS(t.id)} className="text-sm font-medium text-indigo-600 hover:underline">
          Manage items →
        </Link>
      ),
    },
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
        title="Menus"
        action={
          <>
            <RefreshButton isFetching={isFetching} onRefresh={refetch} />
            {canCreate && <Button onClick={() => setFormTarget(null)}>+ Add Menu</Button>}
          </>
        }
      />

      {isError && <Alert variant="error" message="Failed to load menus." />}
      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <PageCard padding="sm">
        <div className="mb-4 max-w-sm">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search menus..."
          />
        </div>

        <DataTable
          columns={columns}
          data={menuTypes}
          isLoading={isLoading}
          emptyMessage="No menus yet."
          emptyAction={canCreate ? <Button onClick={() => setFormTarget(null)}>+ Add Menu</Button> : undefined}
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
        <MenuTypeFormDrawer
          key={formTarget?.id ?? "new"}
          isOpen
          onClose={closeForm}
          menuType={formTarget}
          onSubmit={handleFormSubmit}
          isLoading={createType.isPending || updateType.isPending}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Menu"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteType.isPending}
      />
    </div>
  );
}
