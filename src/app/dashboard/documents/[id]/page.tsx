import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { createAdminClient } from "@/lib/supabase/admin";
import { DocumentEditeur } from "@/components/dashboard/documents/document-editeur";
import type { LigneDocument, TypeDocument } from "@/lib/documents/types";

export const revalidate = 0;

export default async function DocumentPage({ params }: PageProps<"/dashboard/documents/[id]">) {
  const { id } = await params;
  const { entreprise } = await getEntrepriseContext();
  const admin = createAdminClient();
  if (!admin) notFound();

  const { data: document } = await admin
    .from("documents")
    .select("*")
    .eq("id", id)
    .eq("entreprise_id", entreprise.id)
    .maybeSingle();
  if (!document) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/dashboard/documents" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Retour aux devis & factures
      </Link>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {document.type === "devis" ? "Devis" : "Facture"} {document.numero}
        </h1>
        <p className="mt-1 text-muted">Client : {document.client_nom}</p>
      </div>

      <DocumentEditeur
        documentId={document.id}
        type={document.type as TypeDocument}
        statutInitial={document.statut}
        lignesInitiales={(document.lignes as LigneDocument[] | null) ?? []}
        clientNomInitial={document.client_nom}
        clientAdresseInitiale={document.client_adresse}
        clientTelephoneInitial={document.client_telephone}
        clientEmailInitial={document.client_email}
        dateEmission={document.date_emission}
        dateValiditeInitiale={document.date_validite}
        dateEcheanceInitiale={document.date_echeance}
        datePrestationInitiale={document.date_prestation}
        notesInitiales={document.notes}
        devisOrigineId={document.devis_origine_id}
      />
    </div>
  );
}
