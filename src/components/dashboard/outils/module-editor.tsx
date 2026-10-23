"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Save, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { enregistrerModule } from "@/app/dashboard/outils/actions";
import { evaluerFormule, ErreurFormule } from "@/lib/calculs/evaluateur";
import type { Champ, Formule, TypeChamp } from "@/lib/calculs/types";

const classeChampSelect =
  "flex h-10 w-full rounded-lg border border-border-strong bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20";

function idAleatoire(prefixe: string) {
  return `${prefixe}_${Math.random().toString(36).slice(2, 8)}`;
}

const LIBELLES_TYPE: Record<TypeChamp, string> = {
  nombre: "Nombre",
  texte: "Texte",
  select: "Liste de choix",
  booleen: "Oui / Non",
};

export function ModuleEditor({
  moduleId,
  nomInitial,
  champsInitiaux,
  formulesInitiales,
}: {
  moduleId: string | null;
  nomInitial: string;
  champsInitiaux: Champ[];
  formulesInitiales: Formule[];
}) {
  const router = useRouter();
  const [nom, setNom] = useState(nomInitial);
  const [champs, setChamps] = useState<Champ[]>(champsInitiaux);
  const [formules, setFormules] = useState<Formule[]>(formulesInitiales);
  const [valeursTest, setValeursTest] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  function ajouterChamp() {
    setChamps((c) => [...c, { id: idAleatoire("champ"), label: "", type: "nombre" }]);
  }
  function modifierChamp(index: number, patch: Partial<Champ>) {
    setChamps((c) => c.map((champ, i) => (i === index ? { ...champ, ...patch } : champ)));
  }
  function supprimerChamp(index: number) {
    setChamps((c) => c.filter((_, i) => i !== index));
  }

  function ajouterFormule() {
    setFormules((f) => [...f, { id: idAleatoire("formule"), label: "", expression: "" }]);
  }
  function modifierFormule(index: number, patch: Partial<Formule>) {
    setFormules((f) => f.map((formule, i) => (i === index ? { ...formule, ...patch } : formule)));
  }
  function supprimerFormule(index: number) {
    setFormules((f) => f.filter((_, i) => i !== index));
  }

  const portee: Record<string, number> = {};
  for (const champ of champs) {
    if (champ.type === "nombre") {
      const brut = valeursTest[champ.id];
      portee[champ.id] = brut !== undefined && brut !== "" ? Number(brut) : Number(champ.defaut ?? 0);
    }
  }
  const resultatsTest: { formule: Formule; valeur?: number; erreur?: string }[] = [];
  for (const formule of formules) {
    if (!formule.expression.trim()) continue;
    try {
      const valeur = evaluerFormule(formule.expression, portee);
      resultatsTest.push({ formule, valeur });
      portee[formule.id] = valeur;
    } catch (err) {
      resultatsTest.push({ formule, erreur: err instanceof ErreurFormule ? err.message : "Erreur" });
    }
  }

  function enregistrer() {
    setErreur(null);
    if (!nom.trim()) {
      setErreur("Le nom du module est requis.");
      return;
    }
    for (const champ of champs) {
      if (!champ.id.trim() || !champ.label.trim()) {
        setErreur("Chaque champ doit avoir un identifiant et un libellé.");
        return;
      }
    }
    for (const formule of formules) {
      if (!formule.id.trim() || !formule.label.trim() || !formule.expression.trim()) {
        setErreur("Chaque formule doit avoir un identifiant, un libellé et une expression.");
        return;
      }
    }
    const formData = new FormData();
    if (moduleId) formData.set("id", moduleId);
    formData.set("nom", nom);
    formData.set("champs", JSON.stringify(champs));
    formData.set("formules", JSON.stringify(formules));
    startTransition(async () => {
      try {
        const idFinal = await enregistrerModule(formData);
        toast.success("Module enregistré");
        if (!moduleId) router.replace(`/dashboard/outils/modules/${idFinal}`);
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-3 p-4">
        <Label htmlFor="nom-module">Nom du module</Label>
        <Input
          id="nom-module"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Ex. Dosage béton, Métré carrelage..."
        />
      </Card>

      <Card className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-medium text-foreground">Champs à saisir</h2>
            <p className="text-sm text-muted">Les informations que vous (ou votre salarié) renseignez sur le terrain.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={ajouterChamp}>
            <Plus className="size-3.5" /> Ajouter un champ
          </Button>
        </div>

        {champs.length === 0 && <p className="text-sm text-muted">Aucun champ pour le moment.</p>}

        <div className="space-y-3">
          {champs.map((champ, index) => (
            <div key={index} className="grid grid-cols-1 gap-2 rounded-lg border border-border p-3 sm:grid-cols-12 sm:items-start sm:gap-3">
              <div className="sm:col-span-3">
                <Label className="text-xs text-muted">Identifiant (sans espace)</Label>
                <Input
                  value={champ.id}
                  onChange={(e) => modifierChamp(index, { id: e.target.value.replace(/\s+/g, "_") })}
                  className="font-mono text-xs"
                />
              </div>
              <div className="sm:col-span-4">
                <Label className="text-xs text-muted">Libellé affiché</Label>
                <Input value={champ.label} onChange={(e) => modifierChamp(index, { label: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs text-muted">Type</Label>
                <select
                  className={classeChampSelect}
                  value={champ.type}
                  onChange={(e) => modifierChamp(index, { type: e.target.value as TypeChamp })}
                >
                  {Object.entries(LIBELLES_TYPE).map(([valeur, libelle]) => (
                    <option key={valeur} value={valeur}>
                      {libelle}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs text-muted">Unité</Label>
                <Input value={champ.unite ?? ""} onChange={(e) => modifierChamp(index, { unite: e.target.value })} placeholder="m², kg..." />
              </div>
              <div className="flex items-end justify-end sm:col-span-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => supprimerChamp(index)}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
              {champ.type === "nombre" && (
                <div className="sm:col-span-3">
                  <Label className="text-xs text-muted">Valeur par défaut</Label>
                  <Input
                    type="number"
                    value={champ.defaut === undefined ? "" : String(champ.defaut)}
                    onChange={(e) => modifierChamp(index, { defaut: e.target.value === "" ? undefined : Number(e.target.value) })}
                  />
                </div>
              )}
              <div className="sm:col-span-9">
                <Label className="text-xs text-muted">Aide (optionnel)</Label>
                <Input value={champ.aide ?? ""} onChange={(e) => modifierChamp(index, { aide: e.target.value })} placeholder="Explication, valeurs usuelles..." />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-medium text-foreground">Vos formules</h2>
            <p className="text-sm text-muted">
              Utilisez les identifiants des champs ci-dessus. Opérateurs : + − × (*) ÷ (/) puissance (^) et parenthèses.
              Fonctions : min, max, round, abs, sqrt, pow, floor, ceil.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={ajouterFormule}>
            <Plus className="size-3.5" /> Ajouter une formule
          </Button>
        </div>

        {formules.length === 0 && <p className="text-sm text-muted">Aucune formule pour le moment.</p>}

        <div className="space-y-3">
          {formules.map((formule, index) => {
            const resultat = resultatsTest.find((r) => r.formule === formule);
            return (
              <div key={index} className="grid grid-cols-1 gap-2 rounded-lg border border-border p-3 sm:grid-cols-12 sm:items-start sm:gap-3">
                <div className="sm:col-span-3">
                  <Label className="text-xs text-muted">Identifiant</Label>
                  <Input
                    value={formule.id}
                    onChange={(e) => modifierFormule(index, { id: e.target.value.replace(/\s+/g, "_") })}
                    className="font-mono text-xs"
                  />
                </div>
                <div className="sm:col-span-3">
                  <Label className="text-xs text-muted">Libellé affiché</Label>
                  <Input value={formule.label} onChange={(e) => modifierFormule(index, { label: e.target.value })} />
                </div>
                <div className="sm:col-span-4">
                  <Label className="text-xs text-muted">Expression</Label>
                  <Input
                    value={formule.expression}
                    onChange={(e) => modifierFormule(index, { expression: e.target.value })}
                    className="font-mono text-xs"
                    placeholder="longueur * largeur"
                  />
                </div>
                <div className="sm:col-span-1">
                  <Label className="text-xs text-muted">Unité</Label>
                  <Input value={formule.unite ?? ""} onChange={(e) => modifierFormule(index, { unite: e.target.value })} />
                </div>
                <div className="flex items-end justify-end sm:col-span-1">
                  <Button type="button" variant="ghost" size="sm" onClick={() => supprimerFormule(index)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
                <div className="sm:col-span-12">
                  {resultat?.erreur ? (
                    <p className="text-xs text-destructive">{resultat.erreur}</p>
                  ) : resultat?.valeur !== undefined ? (
                    <p className="text-xs text-muted">
                      Résultat avec les valeurs de test : <span className="font-medium text-foreground">{arrondir(resultat.valeur, formule.decimales)}</span>{" "}
                      {formule.unite}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {champs.some((c) => c.type === "nombre") && (
        <Card className="space-y-3 p-4">
          <div className="flex items-center gap-2">
            <FlaskConical className="size-4 text-brand" />
            <h2 className="font-medium text-foreground">Tester avec des valeurs</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {champs
              .filter((c) => c.type === "nombre")
              .map((champ) => (
                <div key={champ.id}>
                  <Label className="text-xs text-muted">{champ.label || champ.id}</Label>
                  <Input
                    type="number"
                    value={valeursTest[champ.id] ?? (champ.defaut !== undefined ? String(champ.defaut) : "")}
                    onChange={(e) => setValeursTest((v) => ({ ...v, [champ.id]: e.target.value }))}
                  />
                </div>
              ))}
          </div>
        </Card>
      )}

      {erreur && <p className="text-sm text-destructive">{erreur}</p>}

      <Button type="button" onClick={enregistrer} disabled={pending} className={cn(pending && "opacity-80")}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        Enregistrer le module
      </Button>
    </div>
  );
}

function arrondir(valeur: number, decimales?: number): string {
  if (!Number.isFinite(valeur)) return "—";
  return valeur.toLocaleString("fr-FR", { maximumFractionDigits: decimales ?? 2 });
}
