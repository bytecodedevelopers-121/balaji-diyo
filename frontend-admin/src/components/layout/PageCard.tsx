import type { ReactNode } from "react";
import { cn } from "@/utils";

export type PageCardPadding = "sm" | "md" | "lg";

interface PageCardProps {
  children: ReactNode;
  className?: string;
  padding?: PageCardPadding;
}

const PADDING_MAP: Record<PageCardPadding, string> = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function PageCard({ children, className, padding = "md" }: PageCardProps) {
  return (
    <div className={cn("rounded-2xl border border-[#efe6da] bg-white shadow-[0_6px_24px_rgba(6,74,112,0.06)]", PADDING_MAP[padding], className)}>
      {children}
    </div>
  );
}
