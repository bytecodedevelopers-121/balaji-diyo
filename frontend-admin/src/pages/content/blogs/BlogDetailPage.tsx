import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { BlogForm } from "@/components/blog/BlogForm";
import { useBlog, useUpdateBlog } from "@/hooks/queries/useBlogs";
import { getErrorMessage, getErrorStatus } from "@/lib/apiError";
import { PATHS } from "@/constants/PATHS";
import { COMPANY_INFO } from "@/constants";

export default function BlogDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError, error: fetchError } = useBlog(id);
  const updateBlog = useUpdateBlog(id);
  const blog = data?.data;
  const status = getErrorStatus(fetchError);

  useEffect(() => {
    document.title = blog ? `${blog.title} | ${COMPANY_INFO.name} Admin` : `Blog | ${COMPANY_INFO.name} Admin`;
  }, [blog]);

  if (isError && status === 404) {
    return (
      <PageCard className="text-center">
        <p className="text-sm text-gray-600">Blog not found.</p>
        <Button className="mt-4" variant="secondary" onClick={() => navigate(PATHS.BLOGS)}>
          ← Back to Blogs
        </Button>
      </PageCard>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={blog?.title ?? "Edit Blog"} isLoading={isLoading} backHref={PATHS.BLOGS} />

      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <PageCard>
        {isLoading || !blog ? (
          <Skeleton count={6} />
        ) : (
          <BlogForm
            defaultValues={blog}
            onSubmit={(values) => {
              setError(null);
              updateBlog.mutate(values, {
                onSuccess: () => navigate(PATHS.BLOGS),
                onError: (err) => setError(getErrorMessage(err)),
              });
            }}
            isLoading={updateBlog.isPending}
            submitLabel="Save Changes"
          />
        )}
      </PageCard>
    </div>
  );
}
