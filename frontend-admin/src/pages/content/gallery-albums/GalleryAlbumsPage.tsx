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
import { useGalleryAlbums, useDeleteGalleryAlbum } from "@/hooks/queries/useGalleryAlbums";
import { getErrorMessage } from "@/lib/apiError";
import { PATHS } from "@/constants/PATHS";
import { COMPANY_INFO } from "@/constants";
import type { GalleryAlbum } from "@/types/gallery-album";

export default function GalleryAlbumsPage() {
  const navigate = useNavigate();
  const canCreate = usePermission("create:gallery");
  const canEdit = usePermission("update:gallery");
  const canDelete = usePermission("delete:gallery");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<GalleryAlbum | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Gallery Albums | ${COMPANY_INFO.name} Admin`;
  }, []);

  const { data, isLoading, isError, isFetching, refetch } = useGalleryAlbums({ page, perPage: 10, search: search || undefined });
  const albums = data?.data.items ?? [];
  const meta = data?.data.meta;

  const deleteAlbum = useDeleteGalleryAlbum();

  const handleDelete = () => {
    if (!deleteTarget) return;
    setError(null);
    deleteAlbum.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
      onError: (err) => {
        setError(getErrorMessage(err));
        setDeleteTarget(null);
      },
    });
  };

  const columns: DataTableColumn<GalleryAlbum>[] = [
    { key: "title", header: "Title", render: (a) => <span className="font-medium text-gray-900">{a.title}</span> },
    { key: "destination", header: "Destination", render: (a) => a.destination?.title ?? "—" },
    {
      key: "isFeatured",
      header: "Featured",
      render: (a) => <Badge label={a.isFeatured ? "Featured" : "—"} variant={a.isFeatured ? "indigo" : "gray"} />,
    },
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
          onEdit={canEdit ? () => navigate(PATHS.GALLERY_ALBUM_DETAIL(a.id)) : undefined}
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
        title="Gallery Albums"
        action={
          <>
            <RefreshButton isFetching={isFetching} onRefresh={refetch} />
            {canCreate && <Button onClick={() => navigate(PATHS.GALLERY_ALBUM_CREATE)}>+ New Album</Button>}
          </>
        }
      />

      {isError && <Alert variant="error" message="Failed to load gallery albums." />}
      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <PageCard padding="sm">
        <div className="mb-4 max-w-sm">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search albums..."
          />
        </div>

        <DataTable
          columns={columns}
          data={albums}
          isLoading={isLoading}
          emptyMessage="No gallery albums yet."
          emptyAction={canCreate ? <Button onClick={() => navigate(PATHS.GALLERY_ALBUM_CREATE)}>+ New Album</Button> : undefined}
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
        title="Delete Gallery Album"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteAlbum.isPending}
      />
    </div>
  );
}
