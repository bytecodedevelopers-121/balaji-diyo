import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/layout/Tabs";
import { PackageForm } from "@/components/package/PackageForm";
import { PACKAGE_FORM_TABS, PACKAGE_ALL_TABS } from "@/components/package/packageFormTabs";
import { useCreatePackage } from "@/hooks/queries/usePackages";
import { getDetailedErrorMessage } from "@/lib/apiError";
import { PATHS } from "@/constants/PATHS";
import { COMPANY_INFO } from "@/constants";

export default function CreatePackagePage() {
  const navigate = useNavigate();
  const createPackage = useCreatePackage();
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState(PACKAGE_FORM_TABS[0].value);
  const isFormTab = PACKAGE_FORM_TABS.some((t) => t.value === tab);

  useEffect(() => {
    document.title = `Create Package | ${COMPANY_INFO.name} Admin`;
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Create Package" backHref={PATHS.PACKAGES} />

      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <Tabs tabs={PACKAGE_ALL_TABS} value={tab} onChange={setTab} />

      <PageCard>
        {!isFormTab && (
          <div className="rounded-2xl border border-dashed border-[#e6dccd] bg-site-row px-6 py-14 text-center">
            <p className="font-display text-lg font-bold text-logo-navy-dark">
              {PACKAGE_ALL_TABS.find((t) => t.value === tab)?.label} is added after the package is created
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-on-surface-variant">
              Fill in the Overview, price and other details, then click Create Package. The package opens right away so you can add its
              itinerary, route map and departures.
            </p>
            <Button className="mt-5" variant="secondary" onClick={() => setTab(PACKAGE_FORM_TABS[0].value)}>
              Back to Overview
            </Button>
          </div>
        )}
        <PackageForm
          activeTab={tab}
          onSubmit={(data) => {
            setError(null);
            createPackage.mutate(data, {
              onSuccess: (res) => navigate(PATHS.PACKAGE_DETAIL(res.data.id)),
              onError: (err) => setError(getDetailedErrorMessage(err)),
            });
          }}
          isLoading={createPackage.isPending}
          submitLabel="Create Package"
        />
      </PageCard>
    </div>
  );
}
