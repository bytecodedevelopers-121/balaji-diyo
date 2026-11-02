import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";

const baseClasses =
  "inline-flex items-center justify-center rounded-md px-4 py-2 text-button-m font-medium transition-colors disabled:pointer-events-none disabled:opacity-50";

const variantClasses: Record<Variant, string> = {
  primary: "bg-neutral-900 text-white hover:bg-neutral-700",
  secondary: "bg-neutral-100 text-neutral-900 hover:bg-neutral-200",
  ghost: "bg-transparent text-neutral-900 hover:bg-neutral-100",
};

interface CommonProps {
  variant?: Variant;
  className?: string;
  children: ReactNode;
}

type ButtonAsLink = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string };

type ButtonAsButton = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

export type ButtonProps = ButtonAsLink | ButtonAsButton;

/**
 * Generic button/link primitive: renders a `next/link` when `href` is
 * given, a native `<button>` otherwise.
 *
 * No "use client" directive of its own — it renders fine from a Server
 * Component as a link or a `type="submit"` button. If used inside a
 * Client Component with an `onClick`, it works normally there too, since
 * at that point the whole subtree is already client-side. What it can't
 * do is accept an `onClick` while rendered directly from a Server
 * Component — same restriction as any other host element.
 */
export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(baseClasses, variantClasses[variant], className);

  if (props.href) {
    return (
      <Link {...(props as ButtonAsLink)} className={classes}>
        {children}
      </Link>
    );
  }

  // TS can't eliminate ButtonAsLink from the union on `props.href`'s
  // truthiness alone (it's a plain `string`, not a literal discriminant),
  // so the `if` above narrows at runtime but not at the type level. The
  // cast is safe: this branch only runs when `props.href` is falsy.
  return (
    <button {...(props as ButtonAsButton)} className={classes}>
      {children}
    </button>
  );
}
