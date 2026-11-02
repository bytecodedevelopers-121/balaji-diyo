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
import { BlogAuthorFormDrawer } from "@/components/blog-author/BlogAuthorFormDrawer";
import { usePermission } from "@/hooks/usePermission";
import {
  useBlogAuthors,
  useCreateBlogAuthor,
  useUpdateBlogAuthor,
  useDeleteBlogAuthor,
} from "@/hooks/queries/useBlogAuthors";
import { getErrorMessage } from "@/lib/apiError";
import { COMPANY_INFO } from "@/constants";
import type { BlogAuthor, CreateBlogAuthorDto, UpdateBlogAuthorDto } from "@/types/blog-author";

export default function BlogAuthorsPage() {
  const canCreate = usePermission("create:blog");
  const canEdit = usePermission("update:blog");
  const canDelete = usePermission("delete:blog");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [formTarget, setFormTarget] = useState<BlogAuthor | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<BlogAuthor | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Blog Authors | ${COMPANY_INFO.name} Admin`;
  }, []);

  const { data, isLoading, isError, isFetching, refetch } = useBlogAuthors({ page, perPage: 15, search: search || undefined });
  const authors = data?.data.items ?? [];
  const meta = data?.data.meta;

  const createAuthor = useCreateBlogAuthor();
  const updateAuthor = useUpdateBlogAuthor(formTarget?.id ?? "");
  const deleteAuthor = useDeleteBlogAuthor();

  const closeForm = () => setFormTarget(undefined);

  const handleFormSubmit = (values: CreateBlogAuthorDto | UpdateBlogAuthorDto) => {
    setError(null);
    if (formTarget) {
      updateAuthor.mutate(values as UpdateBlogAuthorDto, { onSuccess: closeForm, onError: (err) => setError(getErrorMessage(err)) });
    } else {
      createAuthor.mutate(values as CreateBlogAuthorDto, { onSuccess: closeForm, onError: (err) => setError(getErrorMessage(err)) });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setError(null);
    deleteAuthor.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
      onError: (err) => {
        setError(getErrorMessage(err));
        setDeleteTarget(null);
      },
    });
  };

  const columns: DataTableColumn<BlogAuthor>[] = [
    {
      key: "name",
      header: "Name",
      render: (a) => (
        <span>
          {a.salutation ? `${a.salutation} ` : ""}
          {a.name}
        </span>
      ),
    },
    { key: "email", header: "Email", render: (a) => a.email },
    {
      key: "isActive",
      header: "Status",
      render: (a) => <Badge label={a.isActive ? "Active" : "Inactive"} variant={a.isActive ? "green" : "gray"} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (a) => (
        <TableActions
          onEdit={canEdit ? () => setFormTarget(a) : undefined}
          onDelete={canDelete ? () => setDeleteTarget(a) : undefined}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blog Authors"
        action={
          <>
            <RefreshButton isFetching={isFetching} onRefresh={refetch} />
            {canCreate && <Button onClick={() => setFormTarget(null)}>+ Add Author</Button>}
          </>
        }
      />

      {isError && <Alert variant="error" message="Failed to load blog authors." />}
      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <PageCard padding="sm">
        <div className="mb-4 max-w-sm">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search authors..."
          />
        </div>

        <DataTable
          columns={columns}
          data={authors}
          isLoading={isLoading}
          emptyMessage="No blog authors yet."
          emptyAction={canCreate ? <Button onClick={() => setFormTarget(null)}>+ Add Author</Button> : undefined}
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
        <BlogAuthorFormDrawer
          key={formTarget?.id ?? "new"}
          isOpen
          onClose={closeForm}
          author={formTarget}
          onSubmit={handleFormSubmit}
          isLoading={createAuthor.isPending || updateAuthor.isPending}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Blog Author"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteAuthor.isPending}
      />
    </div>
  );
}
