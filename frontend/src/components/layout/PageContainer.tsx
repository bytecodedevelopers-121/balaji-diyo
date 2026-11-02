import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * `<main>` wrapper used by the root layout, between Header and Footer.
 * Deliberately unopinionated about max-width/padding so full-bleed
 * sections (e.g. a hero) can render edge-to-edge — pages/sections that
 * want the standard content width use `components/ui/Container`
 * internally instead of relying on this wrapper for it.
 */
export function PageContainer({ children, className }: PageContainerProps) {
  return <main className={cn("flex-1", className)}>{children}</main>;
}
