import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { WishlistGrid } from "./_components/WishlistGrid";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ title: "Wishlist", path: "/wishlist", noIndex: true });
}

export default function WishlistPage() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-6 py-20">
      <h1 className="mb-10 text-center font-display text-display-section font-medium">Your Wishlist</h1>
      <WishlistGrid />
    </div>
  );
}
