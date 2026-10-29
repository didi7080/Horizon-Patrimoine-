import Link from "next/link";
import { FileText, Receipt } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { createAdminClient } from "@/lib/supabase/admin";
import { DocumentFormDialog } from "@/components/dashboard/documents/document-form-dialog";
import { calculerTotaux, type LigneDocument } from "@/lib/documents/types";
import { formatPrix, formatDateCourte } from "@/lib/utils";

export const revalidate = 0;

const LABELS_STATUT: Record<string, { label: string; variant: "success" | "warning" | "danger" | "info" | "neutral" }> = {
  brouillon: { label: "Brouillon", variant: "neutral" },
  envoye: { label: "Envoyé", variant: "info" },
  envoyee: { label: "Envoyée", variant: "info" },
  accepte: { label: "Accepté", variant: "success" },
  refuse: { label: "Refusé", variant: "danger" },
  payee: { label: "Payée", variant: "success" },
};

export default async function DocumentsPage() {
  const { entreprise } = await getEntrepriseContext();
  const admin = createAdminClient();

  const { data: documents } = admin
    ? await admin
        .from("documents")
        .select("*")
        .eq("entreprise_id", entreprise.id)
        .order("created_at", { ascending: false })
    : { data: null };

  const devis = (documents ?? []).filter((d) => d.type === "devis");
  const factures = (documents ?? []).filter((d) => d.type === "facture");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Devis & factures</h1>
        <p className="mt-1 text-muted">
          Vos documents commerciaux, avec les mentions légales obligatoires et une numérotation continue.
        </p>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-foreground">Devis</h2>
          <DocumentFormDialog type="devis" />
        </div>
        <ListeDocuments documents={devis} />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-foreground">Factures</h2>
          <DocumentFormDialog type="facture" />
        </div>
        <ListeDocuments documents={factures} />
      </section>
    </div>
  );
}

function ListeDocuments({
  documents,
}: {
  documents: { id: string; type: string; numero: string; statut: string; client_nom: string; date_emission: string; lignes: unknown }[];
}) {
  if (documents.length === 0) {
    return <Card className="p-8 text-center text-sm text-muted">Aucun document pour le moment.</Card>;
  }
  return (
    <div className="space-y-2">
      {documents.map((d) => {
        const totaux = calculerTotaux((d.lignes as LigneDocument[] | null) ?? []);
        const statut = LABELS_STATUT[d.statut] ?? { label: d.statut, variant: "neutral" as const };
        return (
          <Link key={d.id} href={`/dashboard/documents/${d.id}`}>
            <Card className="flex items-center justify-between gap-3 p-4 transition-colors hover:border-brand">
              <div className="flex items-center gap-3">
                {d.type === "devis" ? (
                  <FileText className="size-5 text-brand" />
                ) : (
                  <Receipt className="size-5 text-brand" />
                )}
                <div>
                  <p className="font-medium text-foreground">
                    {d.numero} · {d.client_nom}
                  </p>
                  <p className="text-sm text-muted">
                    {formatDateCourte(d.date_emission)} · {formatPrix(totaux.totalTTC)} TTC
                  </p>
                </div>
              </div>
              <Badge variant={statut.variant}>{statut.label}</Badge>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
