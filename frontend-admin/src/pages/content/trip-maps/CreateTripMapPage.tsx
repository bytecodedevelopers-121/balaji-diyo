import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Alert } from "@/components/ui/Alert";
import { TripMapForm } from "@/components/package/TripMapForm";
import { usePackages } from "@/hooks/queries/usePackages";
import { useCreatePackageMap } from "@/hooks/queries/usePackageMaps";
import { getErrorMessage } from "@/lib/apiError";
import { PATHS } from "@/constants/PATHS";
import { COMPANY_INFO } from "@/constants";

export default function CreateTripMapPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Present when navigated from a package's own "Trip Map" tab — preselects
  // and locks the package picker, and sends the admin back to that package
  // (rather than the flat top-level list) once done.
  const fixedPackageId = searchParams.get("packageId") ?? undefined;
  const [error, setError] = useState<string | null>(null);

  const createTripMap = useCreatePackageMap();
  const { data: packagesData } = usePackages({ perPage: 200 });
  const packageOptions = (packagesData?.data.items ?? []).map((p) => ({ value: p.id, label: p.title }));

  const backHref = fixedPackageId ? PATHS.PACKAGE_DETAIL(fixedPackageId) : PATHS.TRIP_MAPS;

  useEffect(() => {
    document.title = `Create Trip Map | ${COMPANY_INFO.name} Admin`;
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Create Trip Map" backHref={backHref} />

      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <PageCard>
        <TripMapForm
          packageOptions={packageOptions}
          fixedPackageId={fixedPackageId}
          onSubmit={(data) => {
            setError(null);
            createTripMap.mutate(data, {
              onSuccess: (res) => navigate(PATHS.TRIP_MAP_DETAIL(res.data.id)),
              onError: (err) => setError(getErrorMessage(err)),
            });
          }}
          isLoading={createTripMap.isPending}
          submitLabel="Create Trip Map"
        />
      </PageCard>
    </div>
  );
}
