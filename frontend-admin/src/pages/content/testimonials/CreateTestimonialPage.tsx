import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Alert } from "@/components/ui/Alert";
import { TestimonialForm } from "@/components/testimonial/TestimonialForm";
import { useCreateTestimonial } from "@/hooks/queries/useTestimonials";
import { getErrorMessage } from "@/lib/apiError";
import { PATHS } from "@/constants/PATHS";
import { COMPANY_INFO } from "@/constants";

export default function CreateTestimonialPage() {
  const navigate = useNavigate();
  const packageId = useSearchParams()[0].get("packageId");
  const createTestimonial = useCreateTestimonial();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Create Testimonial | ${COMPANY_INFO.name} Admin`;
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Create Testimonial" backHref={PATHS.TESTIMONIALS} />

      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <PageCard>
        <TestimonialForm
          presetPackageIds={packageId ? [packageId] : undefined}
          onSubmit={(data) => {
            setError(null);
            createTestimonial.mutate(data, {
              onSuccess: () => navigate(packageId ? PATHS.PACKAGE_DETAIL(packageId) : PATHS.TESTIMONIALS),
              onError: (err) => setError(getErrorMessage(err)),
            });
          }}
          isLoading={createTestimonial.isPending}
          submitLabel="Create Testimonial"
        />
      </PageCard>
    </div>
  );
}
