import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ActualiteClientsForm } from "@/components/dashboard/clients/actualite-clients-form";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 0;

export default async function ActualiteClientsPage() {
  const { entreprise } = await getEntrepriseContext();
  const supabase = await createClient();

  const { count } = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("entreprise_id", entreprise.id)
    .eq("desabonne_communications", false)
    .not("email", "is", null);

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/dashboard/clients" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Retour aux clients
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-foreground">Envoyer une actualité à mes clients</h1>
        <p className="mt-1 text-muted">
          Prévenez vos clients d&apos;un événement, d&apos;une promotion ou d&apos;une actualité. Un lien de désabonnement est
          ajouté automatiquement à chaque e-mail.
        </p>
      </div>

      <ActualiteClientsForm nbClientsEligibles={count ?? 0} />
    </div>
  );
}
