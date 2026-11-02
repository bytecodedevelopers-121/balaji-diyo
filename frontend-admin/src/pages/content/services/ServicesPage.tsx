import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageCard } from "@/components/layout/PageCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { Pagination } from "@/components/table/Pagination";
import { SearchInput } from "@/components/table/SearchInput";
import { TableActions } from "@/components/table/TableActions";
import { ServiceSectionConfigForm } from "@/components/service/ServiceSectionConfigForm";
import { Skeleton } from "@/components/ui/Skeleton";
import { COMPANY_INFO } from "@/constants";
import { PATHS } from "@/constants/PATHS";
import { usePermission } from "@/hooks/usePermission";
import {
  useDeleteService,
  useServices,
  useServiceSectionConfig,
  useUpdateServiceSectionConfig,
} from "@/hooks/queries/useServices";
import { getErrorMessage } from "@/lib/apiError";
import type { Service } from "@/types/service";

export default function ServicesPage() {
  const navigate = useNavigate();
  const canCreate = usePermission("create:service");
  const canEdit = usePermission("update:service");
  const canDelete = usePermission("delete:service");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Services | ${COMPANY_INFO.name} Admin`;
  }, []);

  const { data, isLoading, isError, isFetching, refetch } = useServices({ page, perPage: 10, search: search || undefined });
  const { data: configData, isLoading: isConfigLoading, isError: isConfigError } = useServiceSectionConfig();
  const services = data?.data.items ?? [];
  const meta = data?.data.meta;
  const deleteService = useDeleteService();
  const updateConfig = useUpdateServiceSectionConfig();

  const columns: DataTableColumn<Service>[] = [
    {
      key: "title",
      header: "Service",
      render: (service) => <span className="font-medium text-gray-900">{service.title}</span>,
    },
    { key: "sortOrder", header: "Order", render: (service) => service.sortOrder },
    {
      key: "isActive",
      header: "Status",
      render: (service) => (
        <Badge label={service.isActive ? "Active" : "Inactive"} variant={service.isActive ? "green" : "gray"} />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (service) => (
        <TableActions
          onEdit={canEdit ? () => navigate(PATHS.SERVICE_DETAIL(service.id)) : undefined}
          onDelete={canDelete ? () => setDeleteTarget(service) : undefined}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      ),
    },
  ];

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setError(null);
    deleteService.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
      onError: (mutationError) => {
        setError(getErrorMessage(mutationError));
        setDeleteTarget(null);
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Services"
        action={
          <>
            <RefreshButton isFetching={isFetching} onRefresh={refetch} />
            {canCreate && <Button onClick={() => navigate(PATHS.SERVICE_CREATE)}>+ New Service</Button>}
          </>
        }
      />

      {isError && <Alert variant="error" message="Failed to load services." />}
      {isConfigError && <Alert variant="error" message="Failed to load the homepage section content." />}
      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <PageCard>
        {isConfigLoading || !configData?.data ? (
          <Skeleton count={3} />
        ) : (
          <ServiceSectionConfigForm
            config={configData.data}
            canEdit={canEdit}
            isLoading={updateConfig.isPending}
            onSubmit={(values) => {
              setError(null);
              updateConfig.mutate(values, {
                onError: (mutationError) => setError(getErrorMessage(mutationError)),
              });
            }}
          />
        )}
      </PageCard>

      <PageCard padding="sm">
        <div className="mb-4 max-w-sm">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Search services..."
          />
        </div>

        <DataTable
          columns={columns}
          data={services}
          isLoading={isLoading}
          emptyMessage="No services yet."
          emptyAction={canCreate ? <Button onClick={() => navigate(PATHS.SERVICE_CREATE)}>+ New Service</Button> : undefined}
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
        isOpen={Boolean(deleteTarget)}
        title="Delete Service"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? It will be removed from the homepage.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteService.isPending}
      />
    </div>
  );
}
