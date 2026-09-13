import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Skeleton } from "@/components/ui/skeleton";

export default function RechercheLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-surface">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-96" />
          <Skeleton className="mt-6 h-16 w-full rounded-2xl" />
          <div className="mt-8 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
