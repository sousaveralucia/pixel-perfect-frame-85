import { Skeleton } from "@/components/ui/skeleton";

export default function TabSkeleton() {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-72" />
        </div>
      </div>
      <Skeleton className="h-[1px] w-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
      <Skeleton className="h-48 rounded-xl" />
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
      </div>
    </div>
  );
}
