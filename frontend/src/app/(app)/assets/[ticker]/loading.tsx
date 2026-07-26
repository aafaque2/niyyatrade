import { Skeleton } from "@/components/ui/skeleton";

export default function AssetLoading() {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
          <Skeleton className="h-8 w-48 rounded" />
          <Skeleton className="h-[360px] w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
