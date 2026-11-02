import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Alert } from "@/components/ui/Alert";
import { GalleryAlbumForm } from "@/components/gallery-album/GalleryAlbumForm";
import { useCreateGalleryAlbum } from "@/hooks/queries/useGalleryAlbums";
import { getErrorMessage } from "@/lib/apiError";
import { PATHS } from "@/constants/PATHS";
import { COMPANY_INFO } from "@/constants";

export default function CreateGalleryAlbumPage() {
  const navigate = useNavigate();
  const createAlbum = useCreateGalleryAlbum();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Create Gallery Album | ${COMPANY_INFO.name} Admin`;
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Create Gallery Album" backHref={PATHS.GALLERY_ALBUMS} />

      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <PageCard>
        <GalleryAlbumForm
          onSubmit={(data) => {
            setError(null);
            createAlbum.mutate(data, {
              onSuccess: () => navigate(PATHS.GALLERY_ALBUMS),
              onError: (err) => setError(getErrorMessage(err)),
            });
          }}
          isLoading={createAlbum.isPending}
          submitLabel="Create Album"
        />
      </PageCard>
    </div>
  );
}
