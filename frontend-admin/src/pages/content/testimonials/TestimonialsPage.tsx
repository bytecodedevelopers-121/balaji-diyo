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
import { useTestimonials, useDeleteTestimonial } from "@/hooks/queries/useTestimonials";
import { getErrorMessage } from "@/lib/apiError";
import { toNumber } from "@/lib/decimal";
import { PATHS } from "@/constants/PATHS";
import { COMPANY_INFO } from "@/constants";
import type { Testimonial } from "@/types/testimonial";

export default function TestimonialsPage() {
  const navigate = useNavigate();
  const canCreate = usePermission("create:testimonial");
  const canEdit = usePermission("update:testimonial");
  const canDelete = usePermission("delete:testimonial");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Testimonial | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Testimonials | ${COMPANY_INFO.name} Admin`;
  }, []);

  const { data, isLoading, isError, isFetching, refetch } = useTestimonials({ page, perPage: 10, search: search || undefined });
  const testimonials = data?.data.items ?? [];
  const meta = data?.data.meta;

  const deleteTestimonial = useDeleteTestimonial();

  const handleDelete = () => {
    if (!deleteTarget) return;
    setError(null);
    deleteTestimonial.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
      onError: (err) => {
        setError(getErrorMessage(err));
        setDeleteTarget(null);
      },
    });
  };

  const columns: DataTableColumn<Testimonial>[] = [
    { key: "fullName", header: "Name", render: (t) => <span className="font-medium text-gray-900">{t.fullName}</span> },
    { key: "countryName", header: "Country", render: (t) => t.countryName },
    {
      key: "packages",
      header: "Packages",
      render: (t) => t.packages.map((p) => p.title).join(", ") || "—",
    },
    {
      key: "reviewRating",
      header: "Rating",
      render: (t) => (toNumber(t.reviewRating) != null ? `${toNumber(t.reviewRating)}/10` : "—"),
    },
    {
      key: "isFeatured",
      header: "Featured",
      render: (t) => <Badge label={t.isFeatured ? "Featured" : "—"} variant={t.isFeatured ? "indigo" : "gray"} />,
    },
    {
      key: "isActive",
      header: "Status",
      render: (t) => <Badge label={t.isActive ? "Active" : "Inactive"} variant={t.isActive ? "green" : "gray"} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (t) => (
        <TableActions
          onEdit={canEdit ? () => navigate(PATHS.TESTIMONIAL_DETAIL(t.id)) : undefined}
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
        title="Testimonials"
        action={
          <>
            <RefreshButton isFetching={isFetching} onRefresh={refetch} />
            {canCreate && <Button onClick={() => navigate(PATHS.TESTIMONIAL_CREATE)}>+ New Testimonial</Button>}
          </>
        }
      />

      {isError && <Alert variant="error" message="Failed to load testimonials." />}
      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <PageCard padding="sm">
        <div className="mb-4 max-w-sm">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search testimonials..."
          />
        </div>

        <DataTable
          columns={columns}
          data={testimonials}
          isLoading={isLoading}
          emptyMessage="No testimonials yet."
          emptyAction={canCreate ? <Button onClick={() => navigate(PATHS.TESTIMONIAL_CREATE)}>+ New Testimonial</Button> : undefined}
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
        title="Delete Testimonial"
        message={`Are you sure you want to delete "${deleteTarget?.fullName}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteTestimonial.isPending}
      />
    </div>
  );
}
