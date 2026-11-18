import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/layout/Tabs";
import { PackageForm } from "@/components/package/PackageForm";
import { PackageHero } from "@/components/package/PackageHero";
import { PACKAGE_FORM_TABS, PACKAGE_FORM_ID, PACKAGE_ALL_TABS, ITINERARY_TAB, AVAILABILITY_TAB, TRIP_MAP_TAB } from "@/components/package/packageFormTabs";
import { DeparturesTab } from "@/components/package/DeparturesTab";
import { ItineraryTab } from "@/components/package/ItineraryTab";
import { TripMapTab } from "@/components/package/TripMapTab";
import { usePackage, useUpdatePackage } from "@/hooks/queries/usePackages";
import { getDetailedErrorMessage, getErrorStatus } from "@/lib/apiError";
import { PATHS } from "@/constants/PATHS";
import { COMPANY_INFO } from "@/constants";


const TABS = PACKAGE_ALL_TABS;

export default function PackageDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState(PACKAGE_FORM_TABS[0].value);

  const { data, isLoading, isError, error: fetchError } = usePackage(id);
  const updatePackage = useUpdatePackage(id);
  const pkg = data?.data;
  const status = getErrorStatus(fetchError);

  const isPackageFormTab = PACKAGE_FORM_TABS.some((t) => t.value === tab);

  useEffect(() => {
    document.title = pkg ? `${pkg.title} | ${COMPANY_INFO.name} Admin` : `Package | ${COMPANY_INFO.name} Admin`;
  }, [pkg]);

  if (isError && status === 404) {
    return (
      <PageCard className="text-center">
        <p className="text-sm text-gray-600">Package not found.</p>
        <Button className="mt-4" variant="secondary" onClick={() => navigate(PATHS.PACKAGES)}>
          ← Back to Packages
        </Button>
      </PageCard>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={pkg?.title ?? "Edit Package"}
        isLoading={isLoading}
        backHref={PATHS.PACKAGES}
        action={
          isPackageFormTab && pkg ? (
            // Submits the form rendered below via the HTML form-owner
            // attribute, so the header button matches the footer one.
            <Button type="submit" form={PACKAGE_FORM_ID} isLoading={updatePackage.isPending}>
              Update Package
            </Button>
          ) : undefined
        }
      />

      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      {pkg && <PackageHero pkg={pkg} />}

      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      <PageCard>
        {isLoading || !pkg ? (
          <Skeleton count={6} />
        ) : tab === ITINERARY_TAB ? (
          <ItineraryTab packageId={pkg.id} />
        ) : tab === TRIP_MAP_TAB ? (
          <TripMapTab packageId={pkg.id} />
        ) : tab === AVAILABILITY_TAB ? (
          <DeparturesTab packageId={pkg.id} />
        ) : (
          <PackageForm
            activeTab={tab}
            defaultValues={pkg}
            onSubmit={(values) => {
              setError(null);
              updatePackage.mutate(values, {
                onSuccess: () => navigate(PATHS.PACKAGES),
                onError: (err) => setError(getDetailedErrorMessage(err)),
              });
            }}
            isLoading={updatePackage.isPending}
            submitLabel="Update Package"
          />
        )}
      </PageCard>
    </div>
  );
}
