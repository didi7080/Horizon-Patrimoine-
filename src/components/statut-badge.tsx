import { Badge } from "@/components/ui/badge";
import type { Enums } from "@/lib/types/database";

const CONFIG: Record<
  Enums<"statut_rdv">,
  { label: string; variant: "success" | "warning" | "danger" | "neutral" | "info" }
> = {
  confirme: { label: "Confirmé", variant: "success" },
  demande: { label: "En attente", variant: "warning" },
  annule: { label: "Annulé", variant: "danger" },
  honore: { label: "Terminé", variant: "info" },
  absent: { label: "Absent", variant: "neutral" },
};

export function StatutBadge({ statut }: { statut: Enums<"statut_rdv"> }) {
  const config = CONFIG[statut];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
