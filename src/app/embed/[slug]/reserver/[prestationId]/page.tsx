import { ReserverContenu } from "@/components/booking/reserver-contenu";
import { EmbedResizer } from "@/components/booking/embed-resizer";

export const revalidate = 0;

export default async function EmbedReserverPage({
  params,
}: PageProps<"/embed/[slug]/reserver/[prestationId]">) {
  const { slug, prestationId } = await params;

  return (
    <div className="bg-background p-5">
      <EmbedResizer />
      <ReserverContenu slug={slug} prestationId={prestationId} embed />
    </div>
  );
}
