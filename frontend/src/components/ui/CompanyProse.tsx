import { CmsProse } from "@/components/ui/CmsProse";
import { cn } from "@/lib/utils";

/** Bookmark-star bullets, as used on the Company pages. */
const STAR_LIST =
  "[&_ul]:list-none [&_ul]:pl-0 [&_ul>li]:relative [&_ul>li]:pl-10 [&_ul>li]:before:absolute [&_ul>li]:before:top-0.5 [&_ul>li]:before:left-0 [&_ul>li]:before:size-6 [&_ul>li]:before:bg-[url('/icons/star-bookmark.svg')] [&_ul>li]:before:bg-contain [&_ul>li]:before:bg-no-repeat [&_ul>li]:before:content-['']";

/** Rich-text body of a Company page (admin text editor output) in the site's article style. */
export function CompanyProse({ html, className }: { html: string; className?: string }) {
  return (
    <CmsProse
      html={html}
      className={cn(
        "mt-6 !text-[16px] !leading-[1.85] !text-brand-neutral-800 [&_h2]:!font-poppins [&_h2]:!text-[clamp(20px,3.2vw,26px)] [&_h2]:!font-semibold [&_h2]:!text-brand-neutral-900 [&_h3]:!text-[20px] [&_ul]:!space-y-3",
        STAR_LIST,
        className,
      )}
    />
  );
}
