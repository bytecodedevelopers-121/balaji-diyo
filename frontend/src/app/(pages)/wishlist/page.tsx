import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { getPageSections, resolveSection } from "@/features/page-content/api";
import { WISHLIST_DEFAULTS } from "@/features/page-content/wishlist-defaults";
import { WishlistGrid } from "./_components/WishlistGrid";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ title: "Wishlist", path: "/wishlist", noIndex: true });
}

export default async function WishlistPage() {
  // Heading and empty-state text are editable in the admin (Page Content → Wishlist).
  const { content } = resolveSection(await getPageSections("wishlist"), "content", WISHLIST_DEFAULTS.content);
  return (
    <div className="mx-auto w-full max-w-[1200px] px-6 py-20">
      <h1 className="mb-10 text-center font-display text-display-section font-medium">{content.title}</h1>
      <WishlistGrid content={content} />
    </div>
  );
}
