import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

/** Neutral loading placeholder. Compose width/height via className, e.g. `<Skeleton className="h-4 w-32" />`. */
export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("animate-pulse rounded-md bg-neutral-200", className)} />;
}
