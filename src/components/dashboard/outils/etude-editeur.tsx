"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatPrix } from "@/lib/utils";
import { evaluerFormule, ErreurFormule } from "@/lib/calculs/evaluateur";
import { enregistrerDonneesEtude, changerStatutEtude } from "@/app/dashboard/outils/actions";
import type { Champ, Formule, LigneMateriel } from "@/lib/calculs/types";

const classeSelect =
  "flex h-10 w-full rounded-lg border border-border-strong bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20";

function idAleatoire() {
  return `ligne_${Math.random().toString(36).slice(2, 8)}`;
}

export function EtudeEditeur({
  etudeId,
  statutInitial,
  moduleChamps,
  moduleFormules,
  moduleNom,
  valeursInitiales,
  materielInitial,
  syntheseInitiale,
  catalogue,
}: {
  etudeId: string;
  statutInitial: "brouillon" | "termine" | string;
  moduleChamps: Champ[];
  moduleFormules: Formule[];
  moduleNom: string | null;
  valeursInitiales: Record<string, string | number | boolean>;
  materielInitial: LigneMateriel[];
  syntheseInitiale: string;
  catalogue: { id: string; designation: string; unite: string; prix_achat_cents: number | null; coefficient: number }[];
}) {
  const router = useRouter();
  const [valeurs, setValeurs] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(valeursInitiales).map(([k, v]) => [k, String(v)])),
  );
  const [materiel, setMateriel] = useState<LigneMateriel[]>(materielInitial);
  const [synthese, setSynthese] = useState(syntheseInitiale);
  const [statut, setStatut] = useState(statutInitial);
  const [pending, startTransition] = useTransition();
  const [pendingStatut, startTransitionStatut] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  const portee: Record<string, number> = {};
  for (const champ of moduleChamps) {
    if (champ.type === "nombre") {
      portee[champ.id] = valeurs[champ.id] !== undefined && valeurs[champ.id] !== "" ? Number(valeurs[champ.id]) : 0;
    }
  }
  const resultats: { formule: Formule; valeur?: number; erreur?: string }[] = [];
  for (const formule of moduleFormules) {
    try {
      const valeur = evaluerFormule(formule.expression, portee);
      resultats.push({ formule, valeur });
      portee[formule.id] = valeur;
    } catch (err) {
      resultats.push({ formule, erreur: err instanceof ErreurFormule ? err.message : "Erreur" });
    }
  }

  const totalMateriel = useMemo(
    () => materiel.reduce((somme, ligne) => somme + ligne.quantite * ligne.prixUnitaireCents, 0),
    [materiel],
  );

  function ajouterLigne() {
    setMateriel((m) => [...m, { id: idAleatoire(), designation: "", unite: "u", quantite: 1, prixUnitaireCents: 0 }]);
  }
  function ajouterDepuisCatalogue(articleId: string) {
    const article = catalogue.find((a) => a.id === articleId);
    if (!article) return;
    const prixVenteCents = Math.round((article.prix_achat_cents ?? 0) * article.coefficient);
    setMateriel((m) => [
      ...m,
      { id: idAleatoire(), designation: article.designation, unite: article.unite, quantite: 1, prixUnitaireCents: prixVenteCents },
    ]);
  }
  function modifierLigne(index: number, patch: Partial<LigneMateriel>) {
    setMateriel((m) => m.map((ligne, i) => (i === index ? { ...ligne, ...patch } : ligne)));
  }
  function supprimerLigne(index: number) {
    setMateriel((m) => m.filter((_, i) => i !== index));
  }

  function enregistrer() {
    setErreur(null);
    const champsAEnregistrer: Record<string, string | number | boolean> = {};
    for (const champ of moduleChamps) {
      const brut = valeurs[champ.id];
      if (brut === undefined) continue;
      champsAEnregistrer[champ.id] = champ.type === "nombre" ? Number(brut) : brut;
    }
    startTransition(async () => {
      try {
        await enregistrerDonneesEtude(etudeId, { champs: champsAEnregistrer, materiel, synthese });
        toast.success("Étude enregistrée");
        router.refresh();
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  function basculerStatut() {
    const nouveauStatut = statut === "termine" ? "brouillon" : "termine";
    startTransitionStatut(async () => {
      try {
        await changerStatutEtude(etudeId, nouveauStatut);
        setStatut(nouveauStatut);
        toast.success(nouveauStatut === "termine" ? "Étude marquée comme terminée" : "Étude repassée en brouillon");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Badge variant={statut === "termine" ? "success" : "neutral"}>
          {statut === "termine" ? "Terminée" : "Brouillon"}
        </Badge>
        <Button type="button" variant="outline" size="sm" onClick={basculerStatut} disabled={pendingStatut}>
          {pendingStatut && <Loader2 className="size-3.5 animate-spin" />}
          {statut === "termine" ? "Repasser en brouillon" : "Marquer comme terminée"}
        </Button>
      </div>

      {moduleChamps.length > 0 ? (
        <Card className="space-y-4 p-4">
          <h2 className="font-medium text-foreground">{moduleNom}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {moduleChamps.map((champ) => (
              <div key={champ.id} className="space-y-1.5">
                <Label htmlFor={`champ-${champ.id}`}>
                  {champ.label} {champ.unite && <span className="text-muted">({champ.unite})</span>}
                </Label>
                {champ.type === "select" && champ.options ? (
                  <select
                    id={`champ-${champ.id}`}
                    className={classeSelect}
                    value={valeurs[champ.id] ?? ""}
                    onChange={(e) => setValeurs((v) => ({ ...v, [champ.id]: e.target.value }))}
                  >
                    <option value="">—</option>
                    {champ.options.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : champ.type === "booleen" ? (
                  <select
                    id={`champ-${champ.id}`}
                    className={classeSelect}
                    value={valeurs[champ.id] ?? "false"}
                    onChange={(e) => setValeurs((v) => ({ ...v, [champ.id]: e.target.value }))}
                  >
                    <option value="false">Non</option>
                    <option value="true">Oui</option>
                  </select>
                ) : (
                  <Input
                    id={`champ-${champ.id}`}
                    type={champ.type === "nombre" ? "number" : "text"}
                    value={valeurs[champ.id] ?? (champ.defaut !== undefined ? String(champ.defaut) : "")}
                    onChange={(e) => setValeurs((v) => ({ ...v, [champ.id]: e.target.value }))}
                  />
                )}
                {champ.aide && <p className="text-xs text-muted">{champ.aide}</p>}
              </div>
            ))}
          </div>

          {resultats.length > 0 && (
            <div className="grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-3">
              {resultats.map(({ formule, valeur, erreur: erreurFormule }) => (
                <div key={formule.id} className="rounded-lg bg-surface p-3">
                  <p className="text-xs text-muted">{formule.label}</p>
                  {erreurFormule ? (
                    <p className="text-sm text-destructive">{erreurFormule}</p>
                  ) : (
                    <p className="text-lg font-semibold text-foreground">
                      {valeur !== undefined && Number.isFinite(valeur)
                        ? valeur.toLocaleString("fr-FR", { maximumFractionDigits: formule.decimales ?? 2 })
                        : "—"}{" "}
                      <span className="text-sm font-normal text-muted">{formule.unite}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : (
        <Card className="p-6 text-sm text-muted">
          Cette étude n’a pas de module de calcul associé. Vous pouvez tout de même utiliser le catalogue
          matériel et la synthèse ci-dessous.
        </Card>
      )}

      <Card className="space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-medium text-foreground">Matériel & chiffrage</h2>
          <div className="flex items-center gap-2">
            {catalogue.length > 0 && (
              <select
                className={classeSelect}
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) ajouterDepuisCatalogue(e.target.value);
                  e.target.value = "";
                }}
              >
                <option value="">Ajouter depuis le catalogue...</option>
                {catalogue.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.designation}
                  </option>
                ))}
              </select>
            )}
            <Button type="button" variant="outline" size="sm" onClick={ajouterLigne}>
              <Plus className="size-3.5" /> Ligne libre
            </Button>
          </div>
        </div>

        {materiel.length > 0 ? (
          <div className="space-y-2">
            {materiel.map((ligne, index) => (
              <div key={ligne.id} className="grid grid-cols-1 gap-2 rounded-lg border border-border p-3 sm:grid-cols-12 sm:items-center">
                <div className="sm:col-span-5">
                  <Input
                    value={ligne.designation}
                    onChange={(e) => modifierLigne(index, { designation: e.target.value })}
                    placeholder="Désignation"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Input value={ligne.unite} onChange={(e) => modifierLigne(index, { unite: e.target.value })} placeholder="Unité" />
                </div>
                <div className="sm:col-span-2">
                  <Input
                    type="number"
                    value={ligne.quantite}
                    onChange={(e) => modifierLigne(index, { quantite: Number(e.target.value) })}
                    placeholder="Qté"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Input
                    type="number"
                    step="0.01"
                    value={(ligne.prixUnitaireCents / 100).toFixed(2)}
                    onChange={(e) => modifierLigne(index, { prixUnitaireCents: Math.round(Number(e.target.value) * 100) })}
                    placeholder="Prix unitaire €"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 sm:col-span-1">
                  <Button type="button" variant="ghost" size="sm" onClick={() => supprimerLigne(index)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            <div className="flex justify-end pt-2">
              <p className="text-base font-semibold text-foreground">Total : {formatPrix(totalMateriel)}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">Aucune ligne pour le moment.</p>
        )}
      </Card>

      <Card className="space-y-3 p-4">
        <Label htmlFor="synthese">Synthèse / notes pour le client</Label>
        <Textarea
          id="synthese"
          value={synthese}
          onChange={(e) => setSynthese(e.target.value)}
          rows={5}
          placeholder="Résumé des travaux, recommandations, conditions..."
        />
      </Card>

      {erreur && <p className="text-sm text-destructive">{erreur}</p>}

      <Button type="button" onClick={enregistrer} disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        Enregistrer l’étude
      </Button>
    </div>
  );
}
