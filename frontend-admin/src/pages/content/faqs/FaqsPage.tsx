import { useEffect, useState } from "react";
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
import { FaqFormDrawer } from "@/components/faq/FaqFormDrawer";
import { usePermission } from "@/hooks/usePermission";
import { useFaqs, useCreateFaq, useUpdateFaq, useDeleteFaq } from "@/hooks/queries/useFaqs";
import { getErrorMessage } from "@/lib/apiError";
import { COMPANY_INFO } from "@/constants";
import type { Faq, CreateFaqDto, UpdateFaqDto } from "@/types/faq";

export default function FaqsPage() {
  const canCreate = usePermission("create:faq");
  const canEdit = usePermission("update:faq");
  const canDelete = usePermission("delete:faq");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [formTarget, setFormTarget] = useState<Faq | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Faq | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `FAQs | ${COMPANY_INFO.name} Admin`;
  }, []);

  const { data, isLoading, isError, isFetching, refetch } = useFaqs({ page, perPage: 15, search: search || undefined });
  const faqs = data?.data.items ?? [];
  const meta = data?.data.meta;

  const createFaq = useCreateFaq();
  const updateFaq = useUpdateFaq(formTarget?.id ?? "");
  const deleteFaq = useDeleteFaq();

  const closeForm = () => setFormTarget(undefined);

  const handleFormSubmit = (values: CreateFaqDto | UpdateFaqDto) => {
    setError(null);
    if (formTarget) {
      updateFaq.mutate(values as UpdateFaqDto, { onSuccess: closeForm, onError: (err) => setError(getErrorMessage(err)) });
    } else {
      createFaq.mutate(values as CreateFaqDto, { onSuccess: closeForm, onError: (err) => setError(getErrorMessage(err)) });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setError(null);
    deleteFaq.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
      onError: (err) => {
        setError(getErrorMessage(err));
        setDeleteTarget(null);
      },
    });
  };

  const columns: DataTableColumn<Faq>[] = [
    { key: "question", header: "Question", render: (f) => <span className="font-medium text-gray-900">{f.question}</span> },
    {
      key: "isActive",
      header: "Status",
      render: (f) => <Badge label={f.isActive ? "Active" : "Inactive"} variant={f.isActive ? "green" : "gray"} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (f) => (
        <TableActions
          onEdit={canEdit ? () => setFormTarget(f) : undefined}
          onDelete={canDelete ? () => setDeleteTarget(f) : undefined}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="FAQs"
        action={
          <>
            <RefreshButton isFetching={isFetching} onRefresh={refetch} />
            {canCreate && <Button onClick={() => setFormTarget(null)}>+ Add FAQ</Button>}
          </>
        }
      />

      {isError && <Alert variant="error" message="Failed to load FAQs." />}
      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <PageCard padding="sm">
        <div className="mb-4 max-w-sm">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search FAQs..."
          />
        </div>

        <DataTable
          columns={columns}
          data={faqs}
          isLoading={isLoading}
          emptyMessage="No FAQs yet."
          emptyAction={canCreate ? <Button onClick={() => setFormTarget(null)}>+ Add FAQ</Button> : undefined}
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
        <FaqFormDrawer
          key={formTarget?.id ?? "new"}
          isOpen
          onClose={closeForm}
          faq={formTarget}
          onSubmit={handleFormSubmit}
          isLoading={createFaq.isPending || updateFaq.isPending}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete FAQ"
        message={`Are you sure you want to delete "${deleteTarget?.question}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteFaq.isPending}
      />
    </div>
  );
}
