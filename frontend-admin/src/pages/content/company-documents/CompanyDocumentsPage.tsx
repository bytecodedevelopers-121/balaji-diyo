import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Button } from "@/components/ui/Button";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { TableActions } from "@/components/table/TableActions";
import { Pagination } from "@/components/table/Pagination";
import { SearchInput } from "@/components/table/SearchInput";
import { usePermission } from "@/hooks/usePermission";
import { useCompanyDocuments, useDeleteCompanyDocument } from "@/hooks/queries/useCompanyDocuments";
import { getErrorMessage } from "@/lib/apiError";
import { PATHS } from "@/constants/PATHS";
import { COMPANY_INFO } from "@/constants";
import type { CompanyDocument } from "@/types/company-document";

export default function CompanyDocumentsPage() {
  const navigate = useNavigate();
  const canCreate = usePermission("create:document");
  const canEdit = usePermission("update:document");
  const canDelete = usePermission("delete:document");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CompanyDocument | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Company Documents | ${COMPANY_INFO.name} Admin`;
  }, []);

  const { data, isLoading, isError, isFetching, refetch } = useCompanyDocuments({ page, perPage: 10, search: search || undefined });
  const documents = data?.data.items ?? [];
  const meta = data?.data.meta;

  const deleteDocument = useDeleteCompanyDocument();

  const handleDelete = () => {
    if (!deleteTarget) return;
    setError(null);
    deleteDocument.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
      onError: (err) => {
        setError(getErrorMessage(err));
        setDeleteTarget(null);
      },
    });
  };

  const columns: DataTableColumn<CompanyDocument>[] = [
    { key: "title", header: "Title", render: (d) => <span className="font-medium text-gray-900">{d.title}</span> },
    {
      key: "category",
      header: "Type",
      render: (d) => <Badge label={d.category === "association" ? "Trade Association" : "Legal Document"} variant={d.category === "association" ? "blue" : "gray"} />,
    },
    { key: "sortOrder", header: "Sort Order", render: (d) => d.sortOrder },
    {
      key: "isActive",
      header: "Status",
      render: (d) => <Badge label={d.isActive ? "Active" : "Inactive"} variant={d.isActive ? "green" : "gray"} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (d) => (
        <TableActions
          onEdit={canEdit ? () => navigate(PATHS.COMPANY_DOCUMENT_DETAIL(d.id)) : undefined}
          onDelete={canDelete ? () => setDeleteTarget(d) : undefined}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company Documents"
        action={
          <>
            <RefreshButton isFetching={isFetching} onRefresh={refetch} />
            {canCreate && <Button onClick={() => navigate(PATHS.COMPANY_DOCUMENT_CREATE)}>+ New Document</Button>}
          </>
        }
      />

      {isError && <Alert variant="error" message="Failed to load company documents." />}
      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <PageCard padding="sm">
        <div className="mb-4 max-w-sm">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search documents..."
          />
        </div>

        <DataTable
          columns={columns}
          data={documents}
          isLoading={isLoading}
          emptyMessage="No company documents yet."
          emptyAction={canCreate ? <Button onClick={() => navigate(PATHS.COMPANY_DOCUMENT_CREATE)}>+ New Document</Button> : undefined}
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
        title="Delete Company Document"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteDocument.isPending}
      />
    </div>
  );
}
