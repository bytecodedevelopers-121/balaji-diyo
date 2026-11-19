import Link from "next/link";
import { FillImage } from "@/components/ui/FillImage";
import type { CustomSectionsContent } from "@/features/page-content/home-defaults";

/**
 * Free-form blocks an admin adds to the homepage (heading, text, photo and a button that can point at
 * any page, including one created under Admin → Pages). Image and text sides alternate down the page.
 */
export function CustomSections({ content }: { content: CustomSectionsContent }) {
  const items = content.items.filter((item) => item.title || item.text);
  if (items.length === 0) return null;

  return (
    <>
      {items.map((item, index) => (
        <section key={`${item.title}-${index}`} className="bg-brand-neutral-000 px-4 py-14 min-[768px]:px-10 min-[1120px]:px-[72px]">
          <div
            className={`mx-auto flex w-full max-w-[1280px] flex-col items-center gap-8 min-[900px]:gap-14 ${
              item.image ? (index % 2 === 0 ? "min-[900px]:flex-row" : "min-[900px]:flex-row-reverse") : ""
            }`}
          >
            {item.image ? (
              <div className="relative aspect-[3/2] w-full overflow-hidden rounded-[10px] shadow-[0_10px_30px_rgba(6,74,112,0.2)] min-[900px]:w-1/2">
                <FillImage src={item.image} alt={item.imageAlt || item.title} className="object-cover" sizes="(min-width:900px) 50vw, 100vw" />
              </div>
            ) : null}
            <div className={item.image ? "min-[900px]:w-1/2" : "max-w-[860px] text-center"}>
              {item.title ? (
                <h2 className="text-[28px] leading-tight font-bold text-brand-neutral-1000 min-[900px]:text-[36px]">{item.title}</h2>
              ) : null}
              {item.text ? (
                <p className="mt-4 text-[16px] leading-[1.8] whitespace-pre-line text-brand-neutral-800">{item.text}</p>
              ) : null}
              {item.buttonLabel && item.buttonHref ? (
                <Link
                  href={item.buttonHref}
                  className="mt-6 inline-flex h-12 items-center justify-center rounded-pill bg-logo-sun px-8 text-[16px] font-bold text-logo-navy-dark transition-opacity hover:opacity-90"
                >
                  {item.buttonLabel}
                </Link>
              ) : null}
            </div>
          </div>
        </section>
      ))}
    </>
  );
}
