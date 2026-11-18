import { Link } from "react-router-dom";
import { Star, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useTestimonials } from "@/hooks/queries/useTestimonials";
import { PATHS } from "@/constants/PATHS";

/**
 * The written reviews linked to one package (testimonials whose Packages field
 * includes it), with links to add a new one for this trip or edit an existing one.
 */
export function PackageWrittenReviews({ packageId }: { packageId: string }) {
  const { data, isLoading } = useTestimonials({ packageId, perPage: 50 });
  const reviews = data?.data.items ?? [];

  return (
    <div className="sm:col-span-2">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          {isLoading ? "Loading…" : `${reviews.length} written review${reviews.length === 1 ? "" : "s"} for this trip`}
        </p>
        <Link to={`${PATHS.TESTIMONIAL_CREATE}?packageId=${packageId}`}>
          <Button type="button" size="sm" leftIcon={<Plus className="size-4" />}>
            Add review
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <Skeleton count={3} />
      ) : reviews.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#e6dccd] px-4 py-8 text-center text-sm text-on-surface-variant">
          No written reviews for this trip yet.
        </p>
      ) : (
        <ul className="divide-y divide-[#efe6da] rounded-xl border border-[#efe6da] bg-white">
          {reviews.map((review) => (
            <li key={review.id} className="flex items-start justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-logo-navy-dark">{review.reviewTitle || review.fullName}</p>
                <p className="mt-0.5 text-xs text-on-surface-variant">
                  {review.fullName}
                  {review.countryName ? `, ${review.countryName}` : ""}
                  {review.reviewDate ? ` · ${review.reviewDate.slice(0, 10)}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-logo-navy-dark">
                  <Star className="size-4 fill-logo-sun text-logo-sun" />
                  {Number(review.reviewRating) || "–"}
                </span>
                <Link to={PATHS.TESTIMONIAL_DETAIL(review.id)} className="text-sm font-medium text-logo-navy hover:underline">
                  Edit
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
