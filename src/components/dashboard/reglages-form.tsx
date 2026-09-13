"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { mettreAJourReglages } from "@/app/dashboard/actions";
import type { Tables } from "@/lib/types/database";

const COULEURS = ["#2563eb", "#1d6f5c", "#db2777", "#f59e0b", "#7c3aed", "#dc2626"];

function Interrupteur({
  name,
  label,
  description,
  defaultChecked,
}: {
  name: string;
  label: string;
  description: string;
  defaultChecked: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <label className="flex items-start justify-between gap-4 py-3">
      <span>
        <span className="block text-sm font-medium text-foreground">{label}</span>
        <span className="block text-sm text-muted">{description}</span>
      </span>
      <span className="relative inline-flex shrink-0 items-center">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="peer sr-only"
        />
        <span
          onClick={() => setChecked((c) => !c)}
          className="h-6 w-11 cursor-pointer rounded-full bg-border-strong transition-colors peer-checked:bg-brand"
        />
        <span
          onClick={() => setChecked((c) => !c)}
          className="pointer-events-none absolute left-0.5 top-0.5 size-5 cursor-pointer rounded-full bg-white shadow transition-transform peer-checked:translate-x-5"
        />
      </span>
    </label>
  );
}

export function ReglagesForm({ entreprise }: { entreprise: Tables<"entreprises"> }) {
  const [couleur, setCouleur] = useState(entreprise.couleur);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("couleur", couleur);
    startTransition(async () => {
      try {
        await mettreAJourReglages(formData);
        toast.success("Réglages enregistrés");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erreur");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Fiche publique
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="nom">Nom affiché</Label>
            <Input id="nom" name="nom" defaultValue={entreprise.nom} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="telephone">Téléphone</Label>
            <Input id="telephone" name="telephone" defaultValue={entreprise.telephone ?? ""} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" defaultValue={entreprise.description ?? ""} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="adresse">Adresse</Label>
            <Input id="adresse" name="adresse" defaultValue={entreprise.adresse ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ville">Ville</Label>
            <Input id="ville" name="ville" defaultValue={entreprise.ville ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="codePostal">Code postal</Label>
            <Input id="codePostal" name="codePostal" defaultValue={entreprise.code_postal ?? ""} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail de contact (reçoit les notifications)</Label>
          <Input id="email" name="email" type="email" defaultValue={entreprise.email ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label>Couleur de marque</Label>
          <div className="flex gap-2">
            {COULEURS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCouleur(c)}
                className="size-7 rounded-full"
                style={{ backgroundColor: c, boxShadow: couleur === c ? `0 0 0 2px ${c}` : undefined }}
                aria-label={c}
              />
            ))}
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Règles de réservation
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="delaiMinHeures">Délai minimum (heures)</Label>
            <Input
              id="delaiMinHeures"
              name="delaiMinHeures"
              type="number"
              min={0}
              defaultValue={entreprise.delai_min_heures}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fenetreMaxJours">Réservable jusqu’à (jours)</Label>
            <Input
              id="fenetreMaxJours"
              name="fenetreMaxJours"
              type="number"
              min={1}
              max={365}
              defaultValue={entreprise.fenetre_max_jours}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="battementMin">Battement entre rendez-vous (min)</Label>
            <Input
              id="battementMin"
              name="battementMin"
              type="number"
              min={0}
              defaultValue={entreprise.battement_min}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="zoneCodes">Zone d’intervention (codes postaux, séparés par virgule)</Label>
          <Input
            id="zoneCodes"
            name="zoneCodes"
            defaultValue={entreprise.zone_codes.join(", ")}
            placeholder="Laisser vide pour ne pas restreindre"
          />
        </div>
        <div className="divide-y divide-border">
          <Interrupteur
            name="validationManuelle"
            label="Validation manuelle des rendez-vous"
            description="Chaque demande doit être acceptée avant confirmation."
            defaultChecked={entreprise.validation_manuelle}
          />
          <Interrupteur
            name="avisActif"
            label="Demander un avis après le rendez-vous"
            description="Un e-mail est envoyé automatiquement une fois le rendez-vous honoré."
            defaultChecked={entreprise.avis_actif}
          />
          <Interrupteur
            name="smsActif"
            label="Rappels par SMS"
            description="En plus du rappel par e-mail."
            defaultChecked={entreprise.sms_actif}
          />
          <Interrupteur
            name="recapActif"
            label="Récapitulatif quotidien par e-mail"
            description="Le programme du lendemain, envoyé chaque soir."
            defaultChecked={entreprise.recap_actif}
          />
        </div>
      </section>

      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Enregistrer les réglages
      </Button>
    </form>
  );
}
