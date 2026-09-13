import { Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateCourte } from "@/lib/utils";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { createClient } from "@/lib/supabase/server";
import { togglePublieAvis } from "@/app/dashboard/actions";

export const revalidate = 0;

export default async function AvisPage() {
  const { entreprise } = await getEntrepriseContext();
  const supabase = await createClient();

  const { data: avis } = await supabase
    .from("avis")
    .select("*")
    .eq("entreprise_id", entreprise.id)
    .order("created_at", { ascending: false });

  const moyenne =
    avis && avis.length > 0
      ? (avis.reduce((acc, a) => acc + a.note, 0) / avis.length).toFixed(1)
      : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Avis clients</h1>
          <p className="mt-1 text-muted">
            {moyenne ? (
              <span className="inline-flex items-center gap-1">
                <Star className="size-4 fill-warning text-warning" /> {moyenne}/5 sur {avis?.length}{" "}
                avis
              </span>
            ) : (
              "Pas encore d'avis."
            )}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {avis && avis.length > 0 ? (
          avis.map((a) => (
            <Card key={a.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 font-medium text-foreground">
                    <Star className="size-4 fill-warning text-warning" /> {a.note}/5
                  </span>
                  <span className="text-sm text-muted-foreground">{a.auteur_nom ?? "Client"}</span>
                  <span className="text-sm text-muted-foreground">· {formatDateCourte(a.created_at)}</span>
                  {!a.publie && <Badge variant="neutral">Masqué</Badge>}
                </div>
                <form action={togglePublieAvis.bind(null, a.id, !a.publie)}>
                  <Button size="sm" variant="ghost" type="submit">
                    {a.publie ? "Masquer" : "Republier"}
                  </Button>
                </form>
              </div>
              {a.commentaire && <p className="mt-2 text-sm text-muted">{a.commentaire}</p>}
            </Card>
          ))
        ) : (
          <Card className="p-10 text-center text-sm text-muted">
            Les avis sont demandés automatiquement après chaque rendez-vous honoré.
          </Card>
        )}
      </div>
    </div>
  );
}
