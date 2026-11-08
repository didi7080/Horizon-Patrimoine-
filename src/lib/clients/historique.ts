import { calculerTotaux, type LigneDocument } from "@/lib/documents/types";
import { formatHeure } from "@/lib/utils";
import type { Enums, Tables } from "@/lib/types/database";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

export type TypeEntreeHistorique = "devis" | "facture" | "rendez_vous";

export type EntreeHistorique = {
  id: string;
  date: string;
  type: TypeEntreeHistorique;
  reference: string;
  statutLabel: string;
  statutVariant: BadgeVariant;
  montantTTC: number | null;
  detail: string;
  lienHref: string | null;
};

export const LABELS_STATUT_DOCUMENT: Record<string, { label: string; variant: BadgeVariant }> = {
  brouillon: { label: "Brouillon", variant: "neutral" },
  envoye: { label: "Envoyé", variant: "info" },
  envoyee: { label: "Envoyée", variant: "info" },
  accepte: { label: "Accepté", variant: "success" },
  refuse: { label: "Refusé", variant: "danger" },
  payee: { label: "Payée", variant: "success" },
};

export const LABELS_STATUT_RDV: Record<Enums<"statut_rdv">, { label: string; variant: BadgeVariant }> = {
  confirme: { label: "Confirmé", variant: "success" },
  demande: { label: "En attente", variant: "warning" },
  annule: { label: "Annulé", variant: "danger" },
  honore: { label: "Terminé", variant: "info" },
  absent: { label: "Absent", variant: "neutral" },
};

type DocumentPourHistorique = Pick<Tables<"documents">, "id" | "type" | "numero" | "statut" | "lignes" | "date_emission" | "notes">;
type RdvPourHistorique = Pick<Tables<"rendez_vous">, "id" | "debut" | "statut" | "notes"> & {
  prestation: { nom: string } | null;
};

/** Combine devis/factures et rendez-vous d'un client en une seule chronologie triée par date décroissante. */
export function construireHistorique(documents: DocumentPourHistorique[], rendezVous: RdvPourHistorique[]): EntreeHistorique[] {
  const docs: EntreeHistorique[] = documents.map((d) => {
    const lignes = (d.lignes as LigneDocument[] | null) ?? [];
    const totaux = calculerTotaux(lignes);
    const label = LABELS_STATUT_DOCUMENT[d.statut] ?? { label: d.statut, variant: "neutral" as const };
    return {
      id: d.id,
      date: d.date_emission,
      type: d.type as "devis" | "facture",
      reference: `${d.type === "devis" ? "Devis" : "Facture"} ${d.numero}`,
      statutLabel: label.label,
      statutVariant: label.variant,
      montantTTC: totaux.totalTTC,
      detail: lignes.map((l) => l.designation).filter(Boolean).join(", ") || d.notes || "",
      lienHref: `/dashboard/documents/${d.id}`,
    };
  });

  const rdvs: EntreeHistorique[] = rendezVous.map((r) => {
    const label = LABELS_STATUT_RDV[r.statut];
    const heure = formatHeure(r.debut);
    return {
      id: r.id,
      date: r.debut,
      type: "rendez_vous",
      reference: r.prestation?.nom ?? "Rendez-vous",
      statutLabel: label.label,
      statutVariant: label.variant,
      montantTTC: null,
      detail: r.notes ? `${heure} · ${r.notes}` : heure,
      lienHref: null,
    };
  });

  return [...docs, ...rdvs].sort((a, b) => b.date.localeCompare(a.date));
}

export type FiltresHistorique = {
  q?: string;
  debut?: string;
  fin?: string;
  type?: "tous" | TypeEntreeHistorique;
};

/** Filtre texte libre (référence + détail), plage de dates et type — partagé entre l'affichage et l'export CSV. */
export function filtrerHistorique(entrees: EntreeHistorique[], filtres: FiltresHistorique): EntreeHistorique[] {
  const q = filtres.q?.trim().toLowerCase();
  return entrees.filter((e) => {
    if (filtres.type && filtres.type !== "tous" && e.type !== filtres.type) return false;
    const jour = e.date.slice(0, 10);
    if (filtres.debut && jour < filtres.debut) return false;
    if (filtres.fin && jour > filtres.fin) return false;
    if (q && !`${e.reference} ${e.detail}`.toLowerCase().includes(q)) return false;
    return true;
  });
}
