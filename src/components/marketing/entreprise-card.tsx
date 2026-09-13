import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrix, initiales } from "@/lib/utils";

export function EntrepriseCard({
  entreprise,
}: {
  entreprise: {
    slug: string;
    nom: string;
    metier: string | null;
    ville: string | null;
    couleur: string;
    logo_url: string | null;
    note?: number | null;
    nbAvis?: number;
    prixMin?: number | null;
  };
}) {
  return (
    <Card className="flex flex-col gap-4 p-5 transition-shadow hover:shadow-md sm:flex-row sm:items-center">
      <div
        className="flex size-14 shrink-0 items-center justify-center rounded-xl text-lg font-semibold text-white"
        style={{ backgroundColor: entreprise.couleur }}
      >
        {initiales(entreprise.nom)}
      </div>
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-foreground">{entreprise.nom}</h3>
          {entreprise.metier && <Badge>{entreprise.metier}</Badge>}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
          {entreprise.ville && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" /> {entreprise.ville}
            </span>
          )}
          {typeof entreprise.note === "number" && (
            <span className="inline-flex items-center gap-1">
              <Star className="size-3.5 fill-warning text-warning" />
              {entreprise.note.toFixed(1)}{" "}
              <span className="text-muted-foreground">({entreprise.nbAvis} avis)</span>
            </span>
          )}
          {entreprise.prixMin !== undefined && entreprise.prixMin !== null && (
            <span>À partir de {formatPrix(entreprise.prixMin)}</span>
          )}
        </div>
      </div>
      <Button asChild className="w-full sm:w-auto">
        <Link href={`/e/${entreprise.slug}`}>Voir les disponibilités</Link>
      </Button>
    </Card>
  );
}
