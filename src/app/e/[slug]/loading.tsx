import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Skeleton } from "@/components/ui/skeleton";

export default function EntrepriseLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-surface">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-10 sm:px-6">
          <Skeleton className="size-20 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="mx-auto max-w-4xl space-y-3 px-4 pb-10 sm:px-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
