/**
 * Template brand emblem (public/images/brand/logo.png, generated from logo.svg, 500×500, transparent
 * corners) — reads the same on light and dark surfaces, so there's no
 * on-light variant. `onLight` is kept for existing callers and ignored.
 * 48px below 1120px, 78px above.
 */
export function Logo({ size = "md", compact = false }: { onLight?: boolean; size?: "md" | "lg"; compact?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/brand/logo.png"
      alt=""
      aria-hidden="true"
      width={500}
      height={500}
      className={
        compact
          ? "block rounded-full object-cover size-10 min-[1120px]:size-[52px]"
          : size === "lg"
          ? "block rounded-full object-cover size-14 min-[1120px]:size-[78px]"
          : "block rounded-full object-cover size-11 min-[1120px]:size-[78px]"
      }
    />
  );
}
