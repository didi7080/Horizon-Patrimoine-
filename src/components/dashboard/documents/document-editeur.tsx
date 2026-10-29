"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ExternalLink, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatPrix } from "@/lib/utils";
import {
  enregistrerLignesDocument,
  changerStatutDocument,
  convertirDevisEnFacture,
  supprimerDocument,
} from "@/app/dashboard/documents/actions";
import { calculerTotaux, TAUX_TVA, type LigneDocument, type TypeDocument } from "@/lib/documents/types";

const classeSelect =
  "flex h-10 w-full rounded-lg border border-border-strong bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20";

function idAleatoire() {
  return `ligne_${Math.random().toString(36).slice(2, 8)}`;
}

const STATUTS_PAR_TYPE: Record<TypeDocument, { valeur: string; label: string }[]> = {
  devis: [
    { valeur: "brouillon", label: "Brouillon" },
    { valeur: "envoye", label: "Envoyé" },
    { valeur: "accepte", label: "Accepté" },
    { valeur: "refuse", label: "Refusé" },
  ],
  facture: [
    { valeur: "brouillon", label: "Brouillon" },
    { valeur: "envoyee", label: "Envoyée" },
    { valeur: "payee", label: "Payée" },
  ],
};

export function DocumentEditeur({
  documentId,
  type,
  statutInitial,
  lignesInitiales,
  clientNomInitial,
  clientAdresseInitiale,
  clientTelephoneInitial,
  clientEmailInitial,
  dateValiditeInitiale,
  dateEcheanceInitiale,
  datePrestationInitiale,
  notesInitiales,
  devisOrigineId,
}: {
  documentId: string;
  type: TypeDocument;
  statutInitial: string;
  lignesInitiales: LigneDocument[];
  clientNomInitial: string;
  clientAdresseInitiale: string | null;
  clientTelephoneInitial: string | null;
  clientEmailInitial: string | null;
  dateValiditeInitiale: string | null;
  dateEcheanceInitiale: string | null;
  datePrestationInitiale: string | null;
  notesInitiales: string | null;
  devisOrigineId: string | null;
}) {
  const router = useRouter();
  const [lignes, setLignes] = useState<LigneDocument[]>(lignesInitiales);
  const [clientNom, setClientNom] = useState(clientNomInitial);
  const [clientAdresse, setClientAdresse] = useState(clientAdresseInitiale ?? "");
  const [clientTelephone, setClientTelephone] = useState(clientTelephoneInitial ?? "");
  const [clientEmail, setClientEmail] = useState(clientEmailInitial ?? "");
  const [dateValidite, setDateValidite] = useState(dateValiditeInitiale ?? "");
  const [dateEcheance, setDateEcheance] = useState(dateEcheanceInitiale ?? "");
  const [datePrestation, setDatePrestation] = useState(datePrestationInitiale ?? "");
  const [notes, setNotes] = useState(notesInitiales ?? "");
  const [statut, setStatut] = useState(statutInitial);
  const [pending, startTransition] = useTransition();
  const [pendingStatut, startTransitionStatut] = useTransition();
  const [pendingConversion, startTransitionConversion] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  const totaux = useMemo(() => calculerTotaux(lignes), [lignes]);

  function ajouterLigne() {
    setLignes((l) => [...l, { id: idAleatoire(), designation: "", unite: "heure", quantite: 1, prixUnitaireCents: 0, tauxTva: 20 }]);
  }
  function modifierLigne(index: number, patch: Partial<LigneDocument>) {
    setLignes((l) => l.map((ligne, i) => (i === index ? { ...ligne, ...patch } : ligne)));
  }
  function supprimerLigne(index: number) {
    setLignes((l) => l.filter((_, i) => i !== index));
  }

  function enregistrer() {
    setErreur(null);
    startTransition(async () => {
      try {
        await enregistrerLignesDocument(documentId, JSON.stringify(lignes), {
          clientNom,
          clientAdresse,
          clientTelephone,
          clientEmail,
          dateValidite,
          dateEcheance,
          datePrestation,
          notes,
        });
        toast.success("Document enregistré");
        router.refresh();
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  function changerStatut(nouveauStatut: string) {
    startTransitionStatut(async () => {
      try {
        await changerStatutDocument(documentId, nouveauStatut);
        setStatut(nouveauStatut);
        toast.success("Statut mis à jour");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  function convertir() {
    startTransitionConversion(async () => {
      try {
        const factureId = await convertirDevisEnFacture(documentId);
        toast.success("Facture créée à partir du devis");
        router.push(`/dashboard/documents/${factureId}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  function supprimer() {
    if (!confirm("Supprimer ce document ? Cette action est irréversible.")) return;
    startTransition(async () => {
      try {
        await supprimerDocument(documentId);
        toast.success("Document supprimé");
        router.push("/dashboard/documents");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {STATUTS_PAR_TYPE[type].map((s) => (
            <Button
              key={s.valeur}
              type="button"
              size="sm"
              variant={statut === s.valeur ? "default" : "outline"}
              disabled={pendingStatut}
              onClick={() => changerStatut(s.valeur)}
            >
              {s.label}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/documents/${documentId}/presentation`} target="_blank">
              <ExternalLink className="size-3.5" /> Aperçu / Imprimer
            </Link>
          </Button>
          {type === "devis" && (
            <Button type="button" size="sm" onClick={convertir} disabled={pendingConversion}>
              {pendingConversion && <Loader2 className="size-3.5 animate-spin" />}
              Convertir en facture
            </Button>
          )}
        </div>
      </div>

      {devisOrigineId && (
        <p className="text-sm text-muted">
          Facture issue du devis{" "}
          <Link href={`/dashboard/documents/${devisOrigineId}`} className="text-brand underline">
            correspondant
          </Link>
          .
        </p>
      )}

      <Card className="space-y-4 p-4">
        <h2 className="font-medium text-foreground">Client</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="client-nom">Nom</Label>
            <Input id="client-nom" value={clientNom} onChange={(e) => setClientNom(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="client-adresse">Adresse</Label>
            <Input id="client-adresse" value={clientAdresse} onChange={(e) => setClientAdresse(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="client-telephone">Téléphone</Label>
            <Input id="client-telephone" value={clientTelephone} onChange={(e) => setClientTelephone(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="client-email">E-mail</Label>
            <Input id="client-email" type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
          </div>
        </div>
      </Card>

      <Card className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-foreground">Lignes</h2>
          <Button type="button" variant="outline" size="sm" onClick={ajouterLigne}>
            <Plus className="size-3.5" /> Ajouter une ligne
          </Button>
        </div>

        {lignes.length > 0 ? (
          <div className="space-y-2">
            {lignes.map((ligne, index) => (
              <div
                key={ligne.id}
                className="grid grid-cols-1 gap-2 rounded-lg border border-border p-3 sm:grid-cols-12 sm:items-center"
              >
                <div className="sm:col-span-4">
                  <Input
                    value={ligne.designation}
                    onChange={(e) => modifierLigne(index, { designation: e.target.value })}
                    placeholder="Désignation"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Input
                    value={ligne.unite}
                    onChange={(e) => modifierLigne(index, { unite: e.target.value })}
                    placeholder="Unité (h, forfait...)"
                  />
                </div>
                <div className="sm:col-span-1">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
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
                    placeholder="Prix unit. HT €"
                  />
                </div>
                <div className="sm:col-span-2">
                  <select
                    className={classeSelect}
                    value={ligne.tauxTva}
                    onChange={(e) => modifierLigne(index, { tauxTva: Number(e.target.value) })}
                  >
                    {TAUX_TVA.map((t) => (
                      <option key={t} value={t}>
                        TVA {t}%
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-end gap-2 sm:col-span-1">
                  <Button type="button" variant="ghost" size="sm" onClick={() => supprimerLigne(index)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            <div className="flex flex-col items-end gap-1 pt-2 text-sm">
              <p className="text-muted">Total HT : {formatPrix(totaux.totalHT)}</p>
              {totaux.parTaux.map((t) => (
                <p key={t.taux} className="text-muted">
                  TVA {t.taux}% : {formatPrix(t.montantTva)}
                </p>
              ))}
              <p className="text-base font-semibold text-foreground">Total TTC : {formatPrix(totaux.totalTTC)}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">Aucune ligne pour le moment.</p>
        )}
      </Card>

      <Card className="space-y-4 p-4">
        <h2 className="font-medium text-foreground">Dates</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {type === "devis" ? (
            <div className="space-y-1.5">
              <Label htmlFor="date-validite">Validité du devis jusqu’au</Label>
              <Input id="date-validite" type="date" value={dateValidite} onChange={(e) => setDateValidite(e.target.value)} />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="date-echeance">Date d’échéance</Label>
              <Input id="date-echeance" type="date" value={dateEcheance} onChange={(e) => setDateEcheance(e.target.value)} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="date-prestation">Date de début des travaux</Label>
            <Input id="date-prestation" type="date" value={datePrestation} onChange={(e) => setDatePrestation(e.target.value)} />
          </div>
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <Label htmlFor="notes">Conditions particulières / notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Modalités de paiement, acompte demandé, précisions sur les travaux..."
        />
      </Card>

      {erreur && <p className="text-sm text-destructive">{erreur}</p>}

      <div className="flex items-center justify-between">
        <Button type="button" onClick={enregistrer} disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Enregistrer
        </Button>
        <Button type="button" variant="ghost" onClick={supprimer} disabled={pending} className="text-destructive">
          Supprimer ce document
        </Button>
      </div>
    </div>
  );
}
