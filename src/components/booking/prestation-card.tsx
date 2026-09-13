import Link from "next/link";
import { Clock3, ArrowRight, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDuree, formatPrix } from "@/lib/utils";
import type { Tables } from "@/lib/types/database";

export function PrestationCard({
  prestation,
  slug,
  embed = false,
}: {
  prestation: Tables<"prestations">;
  slug: string;
  embed?: boolean;
}) {
  return (
    <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="font-medium text-foreground">{prestation.nom}</h3>
        {prestation.description && (
          <p className="mt-1 text-sm text-muted">{prestation.description}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock3 className="size-3.5" /> {formatDuree(prestation.duree_min)}
          </span>
          {prestation.acompte_cents ? (
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="size-3.5" /> Acompte {formatPrix(prestation.acompte_cents)}
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center">
        <p className="font-semibold text-foreground">{formatPrix(prestation.prix_cents)}</p>
        <Button asChild size="sm">
          <Link href={`${embed ? "/embed" : "/e"}/${slug}/reserver/${prestation.id}`}>
            Réserver <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
