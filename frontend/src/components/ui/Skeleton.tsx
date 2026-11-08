import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton-shimmer rounded-xl", className)} />;
}

export function SkeletonRail({ count = 4 }: { count?: number }) {
  return (
    <div className="rail-scroll">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-44 w-56 shrink-0" />
      ))}
    </div>
  );
}

export function SkeletonRows({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}
