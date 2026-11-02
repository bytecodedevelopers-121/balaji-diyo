import Image, { type ImageProps } from "next/image";

type FillImageProps = Omit<ImageProps, "src" | "fill" | "width" | "height" | "alt"> & {
  src: string | null | undefined;
  alt: string;
};

// Read straight from process.env (not lib/env, which is server-only) so
// this also works inside Client Components.
// Only the API's own /files/public/** host is allow-listed for the
// optimizer (see next.config.ts). Any other absolute URL (e.g. a legacy
// external link stored in the DB) would make next/image throw at render
// time, so those fall back to a plain, unoptimized request instead.
const apiOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL ?? "").origin;
  } catch {
    return null;
  }
})();

function canOptimize(src: string): boolean {
  if (src.startsWith("/")) return !src.endsWith(".svg");
  try {
    const url = new URL(src);
    return url.origin === apiOrigin && url.pathname.startsWith("/files/public/") && !src.endsWith(".svg");
  } catch {
    return false;
  }
}

/**
 * Drop-in for the `absolute inset-0 size-full object-cover` photo pattern:
 * renders via next/image (`fill`) so it is resized and served as WebP.
 * The parent must be positioned (`relative`/`absolute`) and sized, as
 * with any `fill` image. Renders nothing for an empty `src`.
 */
export function FillImage({ src, alt, sizes = "100vw", ...rest }: FillImageProps) {
  if (!src) return null;
  return <Image src={src} alt={alt} fill sizes={sizes} unoptimized={!canOptimize(src)} {...rest} />;
}
