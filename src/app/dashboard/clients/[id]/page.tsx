import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { createAdminClient } from "@/lib/supabase/admin";
import { ClientNotes } from "@/components/dashboard/client-notes";
import { SupprimerClientBouton } from "@/components/dashboard/clients/supprimer-client-bouton";
import { HistoriqueClient } from "@/components/dashboard/clients/historique-client";
import { construireHistorique } from "@/lib/clients/historique";

export const revalidate = 0;

export default async function ClientDetailPage({ params }: PageProps<"/dashboard/clients/[id]">) {
  const { id } = await params;
  const { entreprise } = await getEntrepriseContext();
  const admin = createAdminClient();
  if (!admin) notFound();

  const { data: client } = await admin.from("clients").select("*").eq("id", id).eq("entreprise_id", entreprise.id).maybeSingle();
  if (!client) notFound();

  const [{ data: documents }, { data: rendezVous }] = await Promise.all([
    admin
      .from("documents")
      .select("id, type, numero, statut, lignes, date_emission, notes")
      .eq("client_id", id)
      .eq("entreprise_id", entreprise.id)
      .order("date_emission", { ascending: false }),
    admin
      .from("rendez_vous")
      .select("id, debut, statut, notes, prestation:prestations(nom)")
      .eq("client_id", id)
      .eq("entreprise_id", entreprise.id)
      .order("debut", { ascending: false }),
  ]);

  const historique = construireHistorique(documents ?? [], rendezVous ?? []);

  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/dashboard/clients" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Retour aux clients
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{client.nom}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            {client.email && (
              <span className="inline-flex items-center gap-1.5">
                <Mail className="size-3.5" /> {client.email}
              </span>
            )}
            {client.telephone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="size-3.5" /> {client.telephone}
              </span>
            )}
            {client.adresse && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5" /> {client.adresse}
              </span>
            )}
          </div>
        </div>
        <SupprimerClientBouton clientId={client.id} clientNom={client.nom} />
      </div>

      <Card className="space-y-2 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes internes</p>
        <ClientNotes clientId={client.id} notes={client.notes} />
      </Card>

      <div>
        <h2 className="mb-3 font-medium text-foreground">Historique</h2>
        <HistoriqueClient clientId={client.id} entrees={historique} />
      </div>
    </div>
  );
}
