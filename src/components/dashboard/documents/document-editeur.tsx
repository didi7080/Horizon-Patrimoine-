"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { BookmarkPlus, Copy, ExternalLink, Link2, Loader2, Mail, MailWarning, Plus, Save, Trash2 } from "lucide-react";
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
  dupliquerDocument,
  supprimerDocument,
  creerLigneBibliotheque,
  relancerDocument,
  lienPublicDevis,
  envoyerLienDevisParEmail,
} from "@/app/dashboard/documents/actions";
import { calculerTotaux, TAUX_TVA, type LigneDocument, type TypeDocument } from "@/lib/documents/types";
import type { Tables } from "@/lib/types/database";

const classeSelect =
  "flex h-10 w-full rounded-lg border border-border-strong bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20";

function idAleatoire() {
  return `ligne_${Math.random().toString(36).slice(2, 8)}`;
}

const DELAIS_PAIEMENT = [
  { jours: 0, label: "À réception" },
  { jours: 15, label: "15 jours" },
  { jours: 30, label: "30 jours" },
  { jours: 45, label: "45 jours" },
  { jours: 60, label: "60 jours" },
];

function ajouterJours(dateIso: string, jours: number): string {
  const d = new Date(`${dateIso}T00:00:00`);
  d.setDate(d.getDate() + jours);
  return d.toISOString().slice(0, 10);
}

function delaiInitial(dateEmission: string, dateEcheance: string): string {
  if (!dateEcheance) return "0";
  const correspondance = DELAIS_PAIEMENT.find((d) => ajouterJours(dateEmission, d.jours) === dateEcheance);
  return correspondance ? String(correspondance.jours) : "personnalise";
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
  dateEmission,
  dateValiditeInitiale,
  dateEcheanceInitiale,
  datePrestationInitiale,
  notesInitiales,
  devisOrigineId,
  bibliotheque,
}: {
  documentId: string;
  type: TypeDocument;
  statutInitial: string;
  lignesInitiales: LigneDocument[];
  clientNomInitial: string;
  clientAdresseInitiale: string | null;
  clientTelephoneInitial: string | null;
  clientEmailInitial: string | null;
  dateEmission: string;
  dateValiditeInitiale: string | null;
  dateEcheanceInitiale: string | null;
  datePrestationInitiale: string | null;
  notesInitiales: string | null;
  devisOrigineId: string | null;
  bibliotheque: Tables<"lignes_bibliotheque">[];
}) {
  const router = useRouter();
  const [lignes, setLignes] = useState<LigneDocument[]>(lignesInitiales);
  const [clientNom, setClientNom] = useState(clientNomInitial);
  const [clientAdresse, setClientAdresse] = useState(clientAdresseInitiale ?? "");
  const [clientTelephone, setClientTelephone] = useState(clientTelephoneInitial ?? "");
  const [clientEmail, setClientEmail] = useState(clientEmailInitial ?? "");
  const [dateValidite, setDateValidite] = useState(dateValiditeInitiale ?? "");
  const [delaiPaiement, setDelaiPaiement] = useState(() => delaiInitial(dateEmission, dateEcheanceInitiale ?? ""));
  const [dateEcheance, setDateEcheance] = useState(
    dateEcheanceInitiale ?? (delaiPaiement !== "personnalise" ? ajouterJours(dateEmission, Number(delaiPaiement)) : ""),
  );
  const [datePrestation, setDatePrestation] = useState(datePrestationInitiale ?? "");
  const [notes, setNotes] = useState(notesInitiales ?? "");
  const [statut, setStatut] = useState(statutInitial);
  const [pending, startTransition] = useTransition();
  const [pendingStatut, startTransitionStatut] = useTransition();
  const [pendingConversion, startTransitionConversion] = useTransition();
  const [pendingDuplication, startTransitionDuplication] = useTransition();
  const [pendingBibliotheque, startTransitionBibliotheque] = useTransition();
  const [choixBibliotheque, setChoixBibliotheque] = useState("");
  const [pendingRelance, startTransitionRelance] = useTransition();
  const [pendingLien, startTransitionLien] = useTransition();
  const [pendingEnvoiLien, startTransitionEnvoiLien] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  const totaux = useMemo(() => calculerTotaux(lignes), [lignes]);
  const estFactureEnRetard =
    type === "facture" && statut === "envoyee" && Boolean(dateEcheance) && dateEcheance < new Date().toISOString().slice(0, 10);

  function changerDelaiPaiement(valeur: string) {
    setDelaiPaiement(valeur);
    if (valeur !== "personnalise") {
      setDateEcheance(ajouterJours(dateEmission, Number(valeur)));
    }
  }

  function ajouterLigne() {
    setLignes((l) => [...l, { id: idAleatoire(), designation: "", unite: "heure", quantite: 1, prixUnitaireCents: 0, tauxTva: 20 }]);
  }
  function modifierLigne(index: number, patch: Partial<LigneDocument>) {
    setLignes((l) => l.map((ligne, i) => (i === index ? { ...ligne, ...patch } : ligne)));
  }
  function supprimerLigne(index: number) {
    setLignes((l) => l.filter((_, i) => i !== index));
  }

  function ajouterDepuisBibliotheque(id: string) {
    const entree = bibliotheque.find((b) => b.id === id);
    if (!entree) return;
    setLignes((l) => [
      ...l,
      {
        id: idAleatoire(),
        designation: entree.designation,
        unite: entree.unite,
        quantite: 1,
        prixUnitaireCents: entree.prix_unitaire_cents,
        tauxTva: entree.taux_tva,
      },
    ]);
    setChoixBibliotheque("");
  }

  function enregistrerDansBibliotheque(ligne: LigneDocument) {
    if (!ligne.designation.trim()) {
      toast.error("Ajoute une désignation à cette ligne avant de l'enregistrer dans la bibliothèque.");
      return;
    }
    startTransitionBibliotheque(async () => {
      const resultat = await creerLigneBibliotheque({
        designation: ligne.designation,
        unite: ligne.unite,
        prixUnitaireCents: ligne.prixUnitaireCents,
        tauxTva: ligne.tauxTva,
      });
      if (!resultat.ok) {
        toast.error(resultat.erreur);
        return;
      }
      toast.success("Ligne enregistrée dans la bibliothèque");
      router.refresh();
    });
  }

  function enregistrer() {
    setErreur(null);
    startTransition(async () => {
      const resultat = await enregistrerLignesDocument(documentId, JSON.stringify(lignes), {
        clientNom,
        clientAdresse,
        clientTelephone,
        clientEmail,
        dateValidite,
        dateEcheance,
        datePrestation,
        notes,
      });
      if (!resultat.ok) {
        setErreur(resultat.erreur);
        return;
      }
      toast.success("Document enregistré");
      router.refresh();
    });
  }

  function changerStatut(nouveauStatut: string) {
    startTransitionStatut(async () => {
      const resultat = await changerStatutDocument(documentId, nouveauStatut);
      if (!resultat.ok) {
        toast.error(resultat.erreur);
        return;
      }
      setStatut(nouveauStatut);
      toast.success("Statut mis à jour");
    });
  }

  function convertir() {
    startTransitionConversion(async () => {
      const resultat = await convertirDevisEnFacture(documentId);
      if (!resultat.ok) {
        toast.error(resultat.erreur);
        return;
      }
      toast.success("Facture créée à partir du devis");
      router.push(`/dashboard/documents/${resultat.id}`);
    });
  }

  function dupliquer() {
    startTransitionDuplication(async () => {
      const resultat = await dupliquerDocument(documentId);
      if (!resultat.ok) {
        toast.error(resultat.erreur);
        return;
      }
      toast.success(type === "devis" ? "Devis dupliqué" : "Facture dupliquée");
      router.push(`/dashboard/documents/${resultat.id}`);
    });
  }

  function relancer() {
    startTransitionRelance(async () => {
      const resultat = await relancerDocument(documentId);
      if (!resultat.ok) {
        toast.error(resultat.erreur);
        return;
      }
      toast.success("E-mail de relance envoyé au client");
    });
  }

  function copierLien() {
    startTransitionLien(async () => {
      const resultat = await lienPublicDevis(documentId);
      if (!resultat.ok) {
        toast.error(resultat.erreur);
        return;
      }
      await navigator.clipboard.writeText(resultat.lien);
      toast.success("Lien copié — le client peut l'ouvrir pour consulter et accepter le devis.");
    });
  }

  function envoyerLienParEmail() {
    startTransitionEnvoiLien(async () => {
      const resultat = await envoyerLienDevisParEmail(documentId);
      if (!resultat.ok) {
        toast.error(resultat.erreur);
        return;
      }
      toast.success("Devis envoyé par e-mail au client");
      if (statut === "brouillon") setStatut("envoye");
    });
  }

  function supprimer() {
    if (!confirm("Supprimer ce document ? Cette action est irréversible.")) return;
    startTransition(async () => {
      const resultat = await supprimerDocument(documentId);
      if (!resultat.ok) {
        toast.error(resultat.erreur);
        return;
      }
      toast.success("Document supprimé");
      router.push("/dashboard/documents");
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
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/documents/${documentId}/presentation`} target="_blank">
              <ExternalLink className="size-3.5" /> Aperçu / Imprimer
            </Link>
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={dupliquer} disabled={pendingDuplication}>
            {pendingDuplication ? <Loader2 className="size-3.5 animate-spin" /> : <Copy className="size-3.5" />}
            Dupliquer
          </Button>
          {type === "devis" && (
            <>
              <Button type="button" variant="outline" size="sm" onClick={copierLien} disabled={pendingLien}>
                {pendingLien ? <Loader2 className="size-3.5 animate-spin" /> : <Link2 className="size-3.5" />}
                Copier le lien client
              </Button>
              {clientEmail && (
                <Button type="button" variant="outline" size="sm" onClick={envoyerLienParEmail} disabled={pendingEnvoiLien}>
                  {pendingEnvoiLien ? <Loader2 className="size-3.5 animate-spin" /> : <Mail className="size-3.5" />}
                  Envoyer au client
                </Button>
              )}
              <Button type="button" size="sm" onClick={convertir} disabled={pendingConversion}>
                {pendingConversion && <Loader2 className="size-3.5 animate-spin" />}
                Convertir en facture
              </Button>
            </>
          )}
          {estFactureEnRetard && (
            <Button type="button" variant="outline" size="sm" onClick={relancer} disabled={pendingRelance}>
              {pendingRelance ? <Loader2 className="size-3.5 animate-spin" /> : <MailWarning className="size-3.5" />}
              Relancer le client
            </Button>
          )}
        </div>
      </div>

      {estFactureEnRetard && (
        <p className="text-sm text-danger">Cette facture est en retard de paiement.</p>
      )}

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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-medium text-foreground">Lignes</h2>
          <div className="flex flex-wrap items-center gap-2">
            {bibliotheque.length > 0 && (
              <select
                value={choixBibliotheque}
                onChange={(e) => ajouterDepuisBibliotheque(e.target.value)}
                className="h-10 w-full rounded-lg border border-border-strong bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20 sm:w-64"
              >
                <option value="">+ Depuis ma bibliothèque…</option>
                {bibliotheque.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.designation} · {formatPrix(b.prix_unitaire_cents)}
                  </option>
                ))}
              </select>
            )}
            <Button type="button" variant="outline" size="sm" onClick={ajouterLigne}>
              <Plus className="size-3.5" /> Ajouter une ligne
            </Button>
          </div>
        </div>

        {lignes.length > 0 ? (
          <div className="space-y-2">
            {lignes.map((ligne, index) => (
              <div
                key={ligne.id}
                className="grid grid-cols-1 gap-2 rounded-lg border border-border p-3 sm:grid-cols-12 sm:items-center"
              >
                <div className="sm:col-span-3">
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
                <div className="flex items-center justify-end gap-1 sm:col-span-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => enregistrerDansBibliotheque(ligne)}
                    disabled={pendingBibliotheque}
                    title="Enregistrer dans ma bibliothèque"
                  >
                    {pendingBibliotheque ? <Loader2 className="size-4 animate-spin" /> : <BookmarkPlus className="size-4 text-muted" />}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => supprimerLigne(index)} title="Supprimer cette ligne">
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
              <Label htmlFor="delai-paiement">Délai de paiement</Label>
              <select
                id="delai-paiement"
                className={classeSelect}
                value={delaiPaiement}
                onChange={(e) => changerDelaiPaiement(e.target.value)}
              >
                {DELAIS_PAIEMENT.map((d) => (
                  <option key={d.jours} value={d.jours}>
                    {d.label}
                  </option>
                ))}
                <option value="personnalise">Date personnalisée</option>
              </select>
              {delaiPaiement === "personnalise" ? (
                <Input
                  type="date"
                  value={dateEcheance}
                  onChange={(e) => setDateEcheance(e.target.value)}
                  className="mt-2"
                />
              ) : (
                dateEcheance && (
                  <p className="text-xs text-muted">
                    Échéance le {new Date(`${dateEcheance}T00:00:00`).toLocaleDateString("fr-FR")}
                  </p>
                )
              )}
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
