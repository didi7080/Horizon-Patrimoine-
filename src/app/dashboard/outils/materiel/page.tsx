import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrix } from "@/lib/utils";
import { MaterielFormDialog } from "@/components/dashboard/outils/materiel-form-dialog";
import { togglerMaterielActif } from "@/app/dashboard/outils/actions";

export const revalidate = 0;

export default async function MaterielPage() {
  const { entreprise } = await getEntrepriseContext();
  const admin = createAdminClient();

  const { data: articles } = admin
    ? await admin.from("materiel_catalogue").select("*").eq("entreprise_id", entreprise.id).order("designation")
    : { data: null };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/outils" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <ArrowLeft className="size-3.5" /> Retour aux outils de calcul
        </Link>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Catalogue matériel</h1>
          <p className="mt-1 text-muted">Vos articles, prix d’achat et coefficients, réutilisables dans vos études.</p>
        </div>
        <MaterielFormDialog />
      </div>

      <div className="space-y-3">
        {articles && articles.length > 0 ? (
          articles.map((a) => (
            <Card key={a.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">{a.designation}</p>
                  {a.famille && <Badge variant="neutral">{a.famille}</Badge>}
                  {!a.actif && <Badge variant="neutral">Masqué</Badge>}
                </div>
                <p className="text-sm text-muted">
                  {a.reference && `${a.reference} · `}
                  Achat {formatPrix(a.prix_achat_cents)} / {a.unite} · Vente conseillée{" "}
                  {formatPrix(a.prix_achat_cents !== null ? Math.round(a.prix_achat_cents * a.coefficient) : null)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <form action={togglerMaterielActif.bind(null, a.id, !a.actif)}>
                  <Button size="sm" variant="ghost" type="submit">
                    {a.actif ? "Masquer" : "Réactiver"}
                  </Button>
                </form>
                <MaterielFormDialog article={a} />
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-10 text-center text-sm text-muted">
            Aucun article pour le moment. Ajoutez vos matériaux pour les retrouver rapidement dans vos études.
          </Card>
        )}
      </div>
    </div>
  );
}
