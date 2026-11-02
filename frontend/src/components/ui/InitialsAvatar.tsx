import { cn } from "@/lib/utils";

interface InitialsAvatarProps {
  /** Reviewer's full name — only the first letter is shown. */
  name: string;
  /**
   * `md` (44px, `primary-200` ring) for a standard review card; `stack`
   * (56px, white ring) for the overlapping avatar row — a white
   * separator is what actually distinguishes each circle once they're
   * overlapped by negative margin, regardless of what's inside them.
   */
  size?: "md" | "stack";
  className?: string;
}

// Each entry is a complete, non-overlapping border spec (not "base +
// override") — `cn` here is a plain join, not tailwind-merge, so two
// classes touching the same property (e.g. `border` and `border-2`)
// would leave which one wins up to Tailwind's generated stylesheet
// order, not this file's.
const SIZE_CLASSES: Record<NonNullable<InitialsAvatarProps["size"]>, string> = {
  md: "size-11 border border-primary-200 text-body-l",
  stack: "size-14 border-2 border-white text-heading-xl",
};

/**
 * A reviewer-initial circle — no photo. `Testimonial` has no photo field
 * on the backend (confirmed against the schema), so every real review
 * card was reusing one hardcoded stock-photo stand-in for every single
 * reviewer regardless of who they were (see the components that used to
 * render `/images/testimonials/avatar-*.jpg` directly). Reported as
 * "dummy reviews" against the real legacy site
 * (boundlessadventure.com/reviews), which never had reviewer photos
 * either — it renders exactly this: a `w-12 h-12` circle,
 * `bg-primary/5 text-primary`, `font-bold`, the first letter of the
 * name, nothing else. This is that same treatment on this site's own
 * primary-100/500 tokens instead of arbitrary opacity values.
 */
export function InitialsAvatar({ name, size = "md", className }: InitialsAvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary-100 font-poppins font-bold text-primary-500",
        SIZE_CLASSES[size],
        className,
      )}
    >
      {initial}
    </span>
  );
}
