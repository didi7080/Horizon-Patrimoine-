import { EntrepriseProfil } from "@/components/booking/entreprise-profil";
import { EmbedResizer } from "@/components/booking/embed-resizer";

export const revalidate = 0;

export default async function EmbedEntreprisePage({ params }: PageProps<"/embed/[slug]">) {
  const { slug } = await params;

  return (
    <div className="bg-background">
      <EmbedResizer />
      <EntrepriseProfil slug={slug} embed />
    </div>
  );
}
