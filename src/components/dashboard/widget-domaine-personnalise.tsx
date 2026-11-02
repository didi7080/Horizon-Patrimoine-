"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Globe, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  connecterDomainePersonnalise,
  deconnecterDomainePersonnalise,
  verifierDomainePersonnalise,
} from "@/app/dashboard/widget/domaine-actions";

export function WidgetDomainePersonnalise({ domaineActuel }: { domaineActuel: string | null }) {
  const [domaine, setDomaine] = useState("");
  const [pending, startTransition] = useTransition();
  const [statut, setStatut] = useState<"inconnu" | "verifie" | "en_attente">("inconnu");

  function connecter() {
    if (!domaine.trim()) return;
    startTransition(async () => {
      try {
        await connecterDomainePersonnalise(domaine.trim());
        toast.success("Domaine ajouté. Configurez le DNS indiqué ci-dessous.");
        setDomaine("");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  function verifier() {
    startTransition(async () => {
      try {
        const resultat = await verifierDomainePersonnalise();
        if (!resultat) return;
        setStatut(resultat.verifie ? "verifie" : "en_attente");
        if (resultat.verifie) toast.success("Domaine actif !");
        else toast.info("DNS pas encore propagé, réessayez dans quelques minutes.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  function deconnecter() {
    startTransition(async () => {
      try {
        await deconnecterDomainePersonnalise();
        toast.success("Domaine retiré.");
        setStatut("inconnu");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  if (!domaineActuel) {
    return (
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex-1 space-y-1.5" style={{ minWidth: 220 }}>
          <label htmlFor="domaine-perso" className="text-sm font-medium text-foreground">
            Votre sous-domaine
          </label>
          <Input
            id="domaine-perso"
            placeholder="rdv.mon-site.fr"
            value={domaine}
            onChange={(e) => setDomaine(e.target.value)}
          />
        </div>
        <Button type="button" onClick={connecter} disabled={pending || !domaine.trim()}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Globe className="size-4" />}
          Connecter
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-sm font-medium text-foreground">
          <Globe className="size-3.5 text-brand" /> {domaineActuel}
        </span>
        {statut === "verifie" && (
          <span className="inline-flex items-center gap-1 text-sm text-success">
            <CheckCircle2 className="size-3.5" /> Actif
          </span>
        )}
        {statut === "en_attente" && (
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <XCircle className="size-3.5" /> DNS pas encore détecté
          </span>
        )}
      </div>

      <div className="rounded-lg border border-border bg-surface p-3 text-sm">
        <p className="text-muted-foreground">
          Chez votre hébergeur de domaine, ajoutez un enregistrement :
        </p>
        <p className="mt-1.5 font-mono text-xs">
          CNAME&nbsp;&nbsp;{domaineActuel.split(".")[0]}&nbsp;&nbsp;→&nbsp;&nbsp;cname.vercel-dns.com
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={verifier} disabled={pending}>
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
          Vérifier
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={deconnecter} disabled={pending}>
          Retirer ce domaine
        </Button>
      </div>
    </div>
  );
}
