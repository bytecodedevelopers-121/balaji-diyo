import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { EmptyState } from "@/components/ui/EmptyState";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ title: "Wishlist", path: "/wishlist", noIndex: true });
}

export default function WishlistPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-20">
      <h1 className="mb-6 text-center font-display text-display-section font-medium">Your Wishlist</h1>
      <EmptyState
        title="No saved trips yet"
        description="Trips you save will appear here."
        action={
          <Link href="/nepal-tour-packages" className="mt-2 font-semibold text-logo-navy underline">
            Explore trips
          </Link>
        }
      />
    </div>
  );
}
