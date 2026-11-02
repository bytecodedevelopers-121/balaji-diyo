import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { TestimonialForm } from "@/components/testimonial/TestimonialForm";
import { useTestimonial, useUpdateTestimonial } from "@/hooks/queries/useTestimonials";
import { getErrorMessage, getErrorStatus } from "@/lib/apiError";
import { PATHS } from "@/constants/PATHS";
import { COMPANY_INFO } from "@/constants";

export default function TestimonialDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError, error: fetchError } = useTestimonial(id);
  const updateTestimonial = useUpdateTestimonial(id);
  const testimonial = data?.data;
  const status = getErrorStatus(fetchError);

  useEffect(() => {
    document.title = testimonial
      ? `${testimonial.fullName} | ${COMPANY_INFO.name} Admin`
      : `Testimonial | ${COMPANY_INFO.name} Admin`;
  }, [testimonial]);

  if (isError && status === 404) {
    return (
      <PageCard className="text-center">
        <p className="text-sm text-gray-600">Testimonial not found.</p>
        <Button className="mt-4" variant="secondary" onClick={() => navigate(PATHS.TESTIMONIALS)}>
          ← Back to Testimonials
        </Button>
      </PageCard>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={testimonial?.fullName ?? "Edit Testimonial"} isLoading={isLoading} backHref={PATHS.TESTIMONIALS} />

      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <PageCard>
        {isLoading || !testimonial ? (
          <Skeleton count={6} />
        ) : (
          <TestimonialForm
            defaultValues={testimonial}
            onSubmit={(values) => {
              setError(null);
              updateTestimonial.mutate(values, {
                onSuccess: () => navigate(PATHS.TESTIMONIALS),
                onError: (err) => setError(getErrorMessage(err)),
              });
            }}
            isLoading={updateTestimonial.isPending}
            submitLabel="Save Changes"
          />
        )}
      </PageCard>
    </div>
  );
}
