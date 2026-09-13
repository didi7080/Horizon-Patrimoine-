import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ReserverContenu } from "@/components/booking/reserver-contenu";

export const revalidate = 0;

export default async function ReserverPage({
  params,
}: PageProps<"/e/[slug]/reserver/[prestationId]">) {
  const { slug, prestationId } = await params;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-surface">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
          <ReserverContenu slug={slug} prestationId={prestationId} />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
