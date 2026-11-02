import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { GalleryAlbumForm } from "@/components/gallery-album/GalleryAlbumForm";
import { useGalleryAlbum, useUpdateGalleryAlbum } from "@/hooks/queries/useGalleryAlbums";
import { getErrorMessage, getErrorStatus } from "@/lib/apiError";
import { PATHS } from "@/constants/PATHS";
import { COMPANY_INFO } from "@/constants";

export default function GalleryAlbumDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError, error: fetchError } = useGalleryAlbum(id);
  const updateAlbum = useUpdateGalleryAlbum(id);
  const album = data?.data;
  const status = getErrorStatus(fetchError);

  useEffect(() => {
    document.title = album ? `${album.title} | ${COMPANY_INFO.name} Admin` : `Gallery Album | ${COMPANY_INFO.name} Admin`;
  }, [album]);

  if (isError && status === 404) {
    return (
      <PageCard className="text-center">
        <p className="text-sm text-gray-600">Gallery album not found.</p>
        <Button className="mt-4" variant="secondary" onClick={() => navigate(PATHS.GALLERY_ALBUMS)}>
          ← Back to Gallery Albums
        </Button>
      </PageCard>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={album?.title ?? "Edit Gallery Album"} isLoading={isLoading} backHref={PATHS.GALLERY_ALBUMS} />

      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <PageCard>
        {isLoading || !album ? (
          <Skeleton count={6} />
        ) : (
          <GalleryAlbumForm
            defaultValues={album}
            onSubmit={(values) => {
              setError(null);
              updateAlbum.mutate(values, {
                onSuccess: () => navigate(PATHS.GALLERY_ALBUMS),
                onError: (err) => setError(getErrorMessage(err)),
              });
            }}
            isLoading={updateAlbum.isPending}
            submitLabel="Save Changes"
          />
        )}
      </PageCard>
    </div>
  );
}
