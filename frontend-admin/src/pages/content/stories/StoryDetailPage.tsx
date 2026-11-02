import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { StoryForm } from "@/components/story/StoryForm";
import { useStory, useUpdateStory } from "@/hooks/queries/useStories";
import { getErrorMessage, getErrorStatus } from "@/lib/apiError";
import { PATHS } from "@/constants/PATHS";
import { COMPANY_INFO } from "@/constants";

export default function StoryDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError, error: fetchError } = useStory(id);
  const updateStory = useUpdateStory(id);
  const story = data?.data;
  const status = getErrorStatus(fetchError);

  useEffect(() => {
    document.title = story ? `${story.title} | ${COMPANY_INFO.name} Admin` : `Story | ${COMPANY_INFO.name} Admin`;
  }, [story]);

  if (isError && status === 404) {
    return (
      <PageCard className="text-center">
        <p className="text-sm text-gray-600">Story not found.</p>
        <Button className="mt-4" variant="secondary" onClick={() => navigate(PATHS.STORIES)}>
          ← Back to Stories
        </Button>
      </PageCard>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={story?.title ?? "Edit Story"} isLoading={isLoading} backHref={PATHS.STORIES} />

      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <PageCard>
        {isLoading || !story ? (
          <Skeleton count={6} />
        ) : (
          <StoryForm
            defaultValues={story}
            onSubmit={(values) => {
              setError(null);
              updateStory.mutate(values, {
                onSuccess: () => navigate(PATHS.STORIES),
                onError: (err) => setError(getErrorMessage(err)),
              });
            }}
            isLoading={updateStory.isPending}
            submitLabel="Save Changes"
          />
        )}
      </PageCard>
    </div>
  );
}
