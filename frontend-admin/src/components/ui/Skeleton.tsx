import { cn } from "@/utils";

interface SkeletonProps {
  className?: string;
  count?: number;
}

export function Skeleton({ className, count = 1 }: SkeletonProps) {
  return (
    <div className={count > 1 ? "space-y-2" : undefined}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn("animate-pulse rounded bg-gray-200", className ?? "h-4 w-full")} />
      ))}
    </div>
  );
}
