import { notFound } from "next/navigation";
import { MapPin, Phone, Star, BadgeCheck } from "lucide-react";
import { PrestationCard } from "@/components/booking/prestation-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { initiales } from "@/lib/utils";

export async function EntrepriseProfil({ slug, embed = false }: { slug: string; embed?: boolean }) {
  const supabase = await createClient();

  const { data: entreprise } = await supabase
    .from("entreprises")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!entreprise) notFound();

  const [{ data: prestations }, { data: salaries }, { data: avisData }] = await Promise.all([
    supabase
      .from("prestations")
      .select("*")
      .eq("entreprise_id", entreprise.id)
      .eq("actif", true)
      .order("nom"),
    supabase
      .from("salaries")
      .select("*")
      .eq("entreprise_id", entreprise.id)
      .eq("actif", true)
      .order("nom"),
    supabase.rpc("avis_entreprise", { p_slug: slug }),
  ]);

  const avis = avisData as
    | { moyenne: number | null; nombre: number; liste: { note: number; commentaire: string | null; auteur: string | null; date: string }[] }
    | null;

  return (
    <div>
      <div
        className={embed ? "rounded-xl" : "border-b border-border"}
        style={{ backgroundColor: `${entreprise.couleur}12` }}
      >
        <div
          className={
            embed
              ? "flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
              : "mx-auto flex max-w-4xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:px-6"
          }
        >
          <div
            className="flex size-20 shrink-0 items-center justify-center rounded-2xl text-2xl font-semibold text-white shadow-sm"
            style={{ backgroundColor: entreprise.couleur }}
          >
            {initiales(entreprise.nom)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-foreground">{entreprise.nom}</h1>
              {entreprise.metier && <Badge>{entreprise.metier}</Badge>}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
              {entreprise.ville && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {entreprise.ville} {entreprise.code_postal}
                </span>
              )}
              {entreprise.telephone && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="size-3.5" /> {entreprise.telephone}
                </span>
              )}
              {avis && avis.nombre > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Star className="size-3.5 fill-warning text-warning" />
                  {avis.moyenne?.toFixed(1)}{" "}
                  <span className="text-muted-foreground">({avis.nombre} avis)</span>
                </span>
              )}
            </div>
            {entreprise.description && (
              <p className="mt-2 max-w-2xl text-sm text-muted">{entreprise.description}</p>
            )}
          </div>
        </div>
      </div>

      <div className={embed ? "p-5" : "mx-auto max-w-4xl px-4 py-8 sm:px-6"}>
        <Tabs defaultValue="prestations">
          <TabsList>
            <TabsTrigger value="prestations">Prestations</TabsTrigger>
            <TabsTrigger value="equipe">Équipe ({salaries?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="avis">Avis {avis?.nombre ? `(${avis.nombre})` : ""}</TabsTrigger>
          </TabsList>

          <TabsContent value="prestations" className="space-y-3">
            {prestations && prestations.length > 0 ? (
              prestations.map((p) => (
                <PrestationCard key={p.id} prestation={p} slug={slug} embed={embed} />
              ))
            ) : (
              <p className="text-sm text-muted">
                Aucune prestation réservable en ligne pour le moment.
              </p>
            )}
          </TabsContent>

          <TabsContent value="equipe" className="grid gap-3 sm:grid-cols-2">
            {salaries?.map((s) => (
              <Card key={s.id} className="flex items-center gap-3 p-4">
                <Avatar>
                  <AvatarFallback style={{ backgroundColor: `${s.couleur}22`, color: s.couleur }}>
                    {initiales(s.nom)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">{s.nom}</p>
                  {s.fonction && <p className="text-sm text-muted">{s.fonction}</p>}
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="avis" className="space-y-3">
            {avis && avis.liste.length > 0 ? (
              avis.liste.map((a, i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground">{a.auteur ?? "Client"}</p>
                    <span className="inline-flex items-center gap-1 text-sm text-warning">
                      <Star className="size-3.5 fill-warning" /> {a.note}/5
                    </span>
                  </div>
                  {a.commentaire && <p className="mt-1.5 text-sm text-muted">{a.commentaire}</p>}
                </Card>
              ))
            ) : (
              <p className="text-sm text-muted">Pas encore d’avis publié.</p>
            )}
          </TabsContent>
        </Tabs>

        {!embed && (
          <div className="mt-8 flex items-start gap-2 rounded-lg border border-border bg-background p-4 text-sm text-muted">
            <BadgeCheck className="mt-0.5 size-4 shrink-0 text-brand" />
            Réservation directement gérée par {entreprise.nom} — confirmation immédiate ou sous
            validation selon la prestation choisie.
          </div>
        )}
      </div>
    </div>
  );
}
