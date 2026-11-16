export const LABEL_STATUT_CHANTIER: Record<string, { label: string; variant: "success" | "warning" | "danger" | "neutral" }> = {
  en_cours: { label: "En cours", variant: "warning" },
  termine: { label: "Terminé", variant: "success" },
  annule: { label: "Annulé", variant: "neutral" },
};

export function joursRestants(dateFin: string | null): { label: string; urgent: boolean } | null {
  if (!dateFin) return null;
  const jours = Math.ceil((new Date(dateFin).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (jours < 0) return { label: "Échéance dépassée", urgent: true };
  if (jours === 0) return { label: "Échéance aujourd’hui", urgent: true };
  return { label: `Dans ${jours} j`, urgent: jours <= 7 };
}
