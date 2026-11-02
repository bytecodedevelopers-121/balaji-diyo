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
import { GlobalSettingFormDrawer } from "@/components/global-setting/GlobalSettingFormDrawer";
import { usePermission } from "@/hooks/usePermission";
import { useGlobalCategories } from "@/hooks/queries/useGlobalCategories";
import {
  useGlobalSettings,
  useCreateGlobalSetting,
  useUpdateGlobalSetting,
  useDeleteGlobalSetting,
} from "@/hooks/queries/useGlobalSettings";
import { getErrorMessage } from "@/lib/apiError";
import { getPublicUrl } from "@/lib/storage";
import { COMPANY_INFO } from "@/constants";
import type { GlobalSetting, CreateGlobalSettingDto, UpdateGlobalSettingDto } from "@/types/global-setting";

function ValuePreview({ setting }: { setting: GlobalSetting }) {
  if (setting.valueType === "JSON") {
    return <code className="line-clamp-1 max-w-xs text-xs text-gray-500">{JSON.stringify(setting.jsonValue)}</code>;
  }
  if (setting.valueType === "BOOLEAN") {
    return (
      <Badge label={setting.value === "true" ? "True" : "False"} variant={setting.value === "true" ? "green" : "gray"} size="sm" />
    );
  }
  if (setting.valueType === "IMAGE" && setting.value) {
    return <img src={getPublicUrl(setting.value)} alt="" className="h-8 w-8 rounded object-cover" />;
  }
  if (!setting.value) return <span className="text-xs text-gray-400">—</span>;
  return <span className="line-clamp-1 max-w-xs text-xs text-gray-600">{setting.value}</span>;
}

export default function GlobalSettingsPage() {
  const canCreate = usePermission("create:settings");
  const canEdit = usePermission("update:settings");
  const canDelete = usePermission("delete:settings");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isActive, setIsActive] = useState<"" | "true" | "false">("");
  const [formTarget, setFormTarget] = useState<GlobalSetting | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<GlobalSetting | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Global Settings | ${COMPANY_INFO.name} Admin`;
  }, []);

  const { data: categoriesData } = useGlobalCategories({ perPage: 200 });
  const categories = categoriesData?.data.items ?? [];

  const { data, isLoading, isError, isFetching, refetch } = useGlobalSettings({
    page,
    perPage: 15,
    search: search || undefined,
    categoryId: categoryId || undefined,
    isActive: isActive === "" ? undefined : isActive === "true",
  });
  const settings = data?.data.items ?? [];
  const meta = data?.data.meta;

  const createSetting = useCreateGlobalSetting();
  const updateSetting = useUpdateGlobalSetting(formTarget?.id ?? "");
  const deleteSetting = useDeleteGlobalSetting();

  const closeForm = () => setFormTarget(undefined);

  const handleFormSubmit = (values: CreateGlobalSettingDto | UpdateGlobalSettingDto) => {
    setError(null);
    if (formTarget) {
      updateSetting.mutate(values as UpdateGlobalSettingDto, {
        onSuccess: closeForm,
        onError: (err) => setError(getErrorMessage(err)),
      });
    } else {
      createSetting.mutate(values as CreateGlobalSettingDto, {
        onSuccess: closeForm,
        onError: (err) => setError(getErrorMessage(err)),
      });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setError(null);
    deleteSetting.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
      onError: (err) => {
        setError(getErrorMessage(err));
        setDeleteTarget(null);
      },
    });
  };

  const columns: DataTableColumn<GlobalSetting>[] = [
    {
      key: "key",
      header: "Key",
      render: (s) => (
        <div>
          <code className="text-xs">{s.key}</code>
          {s.isProtected && <Badge label="Protected" variant="orange" size="sm" />}
        </div>
      ),
    },
    { key: "label", header: "Label", render: (s) => s.label ?? <span className="text-gray-400">—</span> },
    { key: "valueType", header: "Type", render: (s) => <Badge label={s.valueType} variant="indigo" size="sm" /> },
    { key: "value", header: "Value", render: (s) => <ValuePreview setting={s} /> },
    {
      key: "category",
      header: "Category",
      render: (s) => categories.find((c) => c.id === s.categoryId)?.name ?? <span className="text-gray-400">—</span>,
    },
    {
      key: "isActive",
      header: "Status",
      render: (s) => <Badge label={s.isActive ? "Active" : "Inactive"} variant={s.isActive ? "green" : "gray"} size="sm" />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (s) => (
        <TableActions
          onEdit={canEdit ? () => setFormTarget(s) : undefined}
          onDelete={canDelete && !s.isProtected ? () => setDeleteTarget(s) : undefined}
          canEdit={canEdit}
          canDelete={canDelete && !s.isProtected}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Global Settings"
        action={
          <>
            <RefreshButton isFetching={isFetching} onRefresh={refetch} />
            {canCreate && <Button onClick={() => setFormTarget(null)}>+ Add Setting</Button>}
          </>
        }
      />

      {isError && <Alert variant="error" message="Failed to load settings." />}
      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <PageCard padding="sm">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="max-w-sm flex-1">
            <SearchInput
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              placeholder="Search by key..."
            />
          </div>
          <div className="w-52">
            <Select
              options={[{ value: "", label: "All categories" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="w-40">
            <Select
              options={[
                { value: "", label: "All statuses" },
                { value: "true", label: "Active" },
                { value: "false", label: "Inactive" },
              ]}
              value={isActive}
              onChange={(e) => {
                setIsActive(e.target.value as "" | "true" | "false");
                setPage(1);
              }}
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={settings}
          isLoading={isLoading}
          emptyMessage="No settings yet."
          emptyAction={canCreate ? <Button onClick={() => setFormTarget(null)}>+ Add Setting</Button> : undefined}
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
        <GlobalSettingFormDrawer
          key={formTarget?.id ?? "new"}
          isOpen
          onClose={closeForm}
          setting={formTarget}
          onSubmit={handleFormSubmit}
          isLoading={createSetting.isPending || updateSetting.isPending}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Setting"
        message={`Are you sure you want to delete "${deleteTarget?.key}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteSetting.isPending}
      />
    </div>
  );
}
