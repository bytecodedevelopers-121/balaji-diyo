import { useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Button } from "@/components/ui/Button";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { Pagination } from "@/components/table/Pagination";
import { SearchInput } from "@/components/table/SearchInput";
import { MediaCard } from "@/components/media/MediaCard";
import { MediaDetailDrawer } from "@/components/media/MediaDetailDrawer";
import { usePermission } from "@/hooks/usePermission";
import {
  useMediaList,
  useUploadMedia,
  useUpdateMedia,
  useDeleteMedia,
} from "@/hooks/queries/useMedia";
import { getErrorMessage } from "@/lib/apiError";
import { COMPANY_INFO } from "@/constants";
import type { Media } from "@/types/media";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export default function MediaLibraryPage() {
  const canCreate = usePermission("create:media");
  const canEdit = usePermission("update:media");
  const canDelete = usePermission("delete:media");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Media | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = `Media Library | ${COMPANY_INFO.name} Admin`;
  }, []);

  const { data, isLoading, isError, isFetching, refetch } = useMediaList({
    page,
    perPage: 24,
    search: search || undefined,
  });
  const items = data?.data.items ?? [];
  const meta = data?.data.meta;

  const uploadMedia = useUploadMedia();
  const updateMedia = useUpdateMedia(selected?.id ?? "");
  const deleteMedia = useDeleteMedia();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only JPG, PNG or WebP images are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be under 5MB.");
      return;
    }

    uploadMedia.mutate(
      { file },
      { onError: (err) => setError(getErrorMessage(err)) },
    );
  };

  const handleSave = (altText: string) => {
    if (!selected) return;
    setError(null);
    updateMedia.mutate(
      { altText },
      {
        onSuccess: () => setSelected(null),
        onError: (err) => setError(getErrorMessage(err)),
      },
    );
  };

  const handleDelete = () => {
    if (!selected) return;
    setError(null);
    deleteMedia.mutate(selected.id, {
      onSuccess: () => setSelected(null),
      onError: (err) => setError(getErrorMessage(err)),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Media Library"
        action={
          <>
            <RefreshButton isFetching={isFetching} onRefresh={refetch} />
            {canCreate && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ALLOWED_TYPES.join(",")}
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  isLoading={uploadMedia.isPending}
                  leftIcon={<Upload className="h-4 w-4" />}
                >
                  Upload Image
                </Button>
              </>
            )}
          </>
        }
      />

      {isError && <Alert variant="error" message="Failed to load media." />}
      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <PageCard padding="sm">
        <div className="mb-4 max-w-sm">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search by filename..."
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-lg" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-gray-500">No media uploaded yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {items.map((media) => (
              <MediaCard key={media.id} media={media} onClick={() => setSelected(media)} />
            ))}
          </div>
        )}

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

      <MediaDetailDrawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        media={selected}
        onSave={handleSave}
        onDelete={handleDelete}
        isSaving={updateMedia.isPending}
        isDeleting={deleteMedia.isPending}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    </div>
  );
}
