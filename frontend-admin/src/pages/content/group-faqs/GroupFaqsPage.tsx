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
import { GroupFaqFormDrawer } from "@/components/group-faq/GroupFaqFormDrawer";
import { usePermission } from "@/hooks/usePermission";
import { useGroupFaqs, useCreateGroupFaq, useUpdateGroupFaq, useDeleteGroupFaq } from "@/hooks/queries/useGroupFaqs";
import { getErrorMessage } from "@/lib/apiError";
import { COMPANY_INFO } from "@/constants";
import type { GroupFaq, CreateGroupFaqDto, UpdateGroupFaqDto } from "@/types/group-faq";

export default function GroupFaqsPage() {
  const canCreate = usePermission("create:faq");
  const canEdit = usePermission("update:faq");
  const canDelete = usePermission("delete:faq");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [formTarget, setFormTarget] = useState<GroupFaq | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<GroupFaq | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Group FAQs | ${COMPANY_INFO.name} Admin`;
  }, []);

  const { data, isLoading, isError, isFetching, refetch } = useGroupFaqs({ page, perPage: 15, search: search || undefined });
  const groupFaqs = data?.data.items ?? [];
  const meta = data?.data.meta;

  const createGroupFaq = useCreateGroupFaq();
  const updateGroupFaq = useUpdateGroupFaq(formTarget?.id ?? "");
  const deleteGroupFaq = useDeleteGroupFaq();

  const closeForm = () => setFormTarget(undefined);

  const handleFormSubmit = (values: CreateGroupFaqDto | UpdateGroupFaqDto) => {
    setError(null);
    if (formTarget) {
      updateGroupFaq.mutate(values as UpdateGroupFaqDto, {
        onSuccess: closeForm,
        onError: (err) => setError(getErrorMessage(err)),
      });
    } else {
      createGroupFaq.mutate(values as CreateGroupFaqDto, {
        onSuccess: closeForm,
        onError: (err) => setError(getErrorMessage(err)),
      });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setError(null);
    deleteGroupFaq.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
      onError: (err) => {
        setError(getErrorMessage(err));
        setDeleteTarget(null);
      },
    });
  };

  const columns: DataTableColumn<GroupFaq>[] = [
    { key: "question", header: "Question", render: (f) => <span className="font-medium text-gray-900">{f.question}</span> },
    {
      key: "categories",
      header: "Categories",
      render: (f) => f.categories.map((c) => c.title).join(", ") || "—",
    },
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
        title="Group FAQs"
        action={
          <>
            <RefreshButton isFetching={isFetching} onRefresh={refetch} />
            {canCreate && <Button onClick={() => setFormTarget(null)}>+ Add Group FAQ</Button>}
          </>
        }
      />

      {isError && <Alert variant="error" message="Failed to load group FAQs." />}
      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <PageCard padding="sm">
        <div className="mb-4 max-w-sm">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search group FAQs..."
          />
        </div>

        <DataTable
          columns={columns}
          data={groupFaqs}
          isLoading={isLoading}
          emptyMessage="No group FAQs yet."
          emptyAction={canCreate ? <Button onClick={() => setFormTarget(null)}>+ Add Group FAQ</Button> : undefined}
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
        <GroupFaqFormDrawer
          key={formTarget?.id ?? "new"}
          isOpen
          onClose={closeForm}
          groupFaq={formTarget}
          onSubmit={handleFormSubmit}
          isLoading={createGroupFaq.isPending || updateGroupFaq.isPending}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Group FAQ"
        message={`Are you sure you want to delete "${deleteTarget?.question}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteGroupFaq.isPending}
      />
    </div>
  );
}
