import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

export function PageLegale({
  titre,
  maj,
  children,
}: {
  titre: string;
  maj: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">{titre}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Dernière mise à jour : {maj}</p>
          <div className="prose-legal mt-8 space-y-6 rounded-2xl border border-border bg-background p-6 text-sm leading-relaxed text-foreground sm:p-8 [&_h2]:mt-8 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:first:mt-0 [&_p]:text-muted [&_li]:text-muted [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
            {children}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
