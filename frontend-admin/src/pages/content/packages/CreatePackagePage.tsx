import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Alert } from "@/components/ui/Alert";
import { Tabs } from "@/components/layout/Tabs";
import { PackageForm } from "@/components/package/PackageForm";
import { PACKAGE_FORM_TABS } from "@/components/package/packageFormTabs";
import { useCreatePackage } from "@/hooks/queries/usePackages";
import { getErrorMessage } from "@/lib/apiError";
import { PATHS } from "@/constants/PATHS";
import { COMPANY_INFO } from "@/constants";

export default function CreatePackagePage() {
  const navigate = useNavigate();
  const createPackage = useCreatePackage();
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState(PACKAGE_FORM_TABS[0].value);

  useEffect(() => {
    document.title = `Create Package | ${COMPANY_INFO.name} Admin`;
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Create Package" backHref={PATHS.PACKAGES} />

      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <Tabs tabs={PACKAGE_FORM_TABS} value={tab} onChange={setTab} />

      <PageCard>
        <PackageForm
          activeTab={tab}
          onSubmit={(data) => {
            setError(null);
            createPackage.mutate(data, {
              onSuccess: (res) => navigate(PATHS.PACKAGE_DETAIL(res.data.id)),
              onError: (err) => setError(getErrorMessage(err)),
            });
          }}
          isLoading={createPackage.isPending}
          submitLabel="Create Package"
        />
      </PageCard>
    </div>
  );
}
