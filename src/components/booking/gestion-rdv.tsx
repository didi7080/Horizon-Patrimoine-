"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Clock3,
  CreditCard,
  Loader2,
  MapPin,
  Phone,
  Star,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { StatutBadge } from "@/components/statut-badge";
import { CalendrierCreneaux, type Creneau } from "@/components/booking/calendrier-creneaux";
import { createClient } from "@/lib/supabase/client";
import { formatDateLongue, formatDuree, formatHeure, formatPrix } from "@/lib/utils";
import { payerAcompteAction } from "@/app/rdv/[token]/actions";
import type { RdvDetail } from "@/app/rdv/[token]/page";

const FENETRE_REPORT_JOURS = 30;

export function GestionRdv({
  token,
  initial,
  facturationPrete,
}: {
  token: string;
  initial: RdvDetail;
  facturationPrete: boolean;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [rdv, setRdv] = useState(initial);
  const [enCours, setEnCours] = useState(false);
  const [dialogAnnulation, setDialogAnnulation] = useState(false);
  const [dialogReport, setDialogReport] = useState(false);
  const [nouveauCreneau, setNouveauCreneau] = useState<Creneau | null>(null);

  const [note, setNote] = useState(0);
  const [commentaire, setCommentaire] = useState("");
  const [avisEnvoye, setAvisEnvoye] = useState(rdv.a_un_avis);

  const passe = new Date(rdv.debut) < new Date();

  async function payerAcompte() {
    setEnCours(true);
    try {
      await payerAcompteAction(token);
    } catch (e) {
      setEnCours(false);
      toast.error("Impossible de lancer le paiement", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  async function annuler() {
    setEnCours(true);
    const { error } = await supabase.rpc("annuler_rdv_public", { p_token: token });
    setEnCours(false);
    setDialogAnnulation(false);
    if (error) {
      toast.error("Impossible d'annuler", { description: error.message });
      return;
    }
    setRdv((r) => ({ ...r, statut: "annule" }));
    toast.success("Rendez-vous annulé");
  }

  async function confirmerReport() {
    if (!nouveauCreneau) return;
    setEnCours(true);
    const { error } = await supabase.rpc("reporter_rdv_public", {
      p_token: token,
      p_nouveau_debut: nouveauCreneau.debut,
    });
    setEnCours(false);
    if (error) {
      toast.error("Impossible de reporter", { description: error.message });
      return;
    }
    setRdv((r) => ({ ...r, debut: nouveauCreneau.debut, fin: nouveauCreneau.fin }));
    setDialogReport(false);
    setNouveauCreneau(null);
    toast.success("Rendez-vous reporté");
  }

  async function envoyerAvis() {
    if (note < 1) return;
    setEnCours(true);
    const { error } = await supabase.rpc("laisser_avis", {
      p_token: token,
      p_note: note,
      p_commentaire: commentaire.trim() || "",
    });
    setEnCours(false);
    if (error) {
      toast.error("Impossible d'envoyer l'avis", { description: error.message });
      return;
    }
    setAvisEnvoye(true);
    toast.success("Merci pour votre avis !");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link href={`/e/${rdv.entreprise_slug}`} className="font-semibold text-foreground">
          {rdv.entreprise_nom}
        </Link>
        <StatutBadge statut={rdv.statut} />
      </div>

      <Card className="space-y-3 p-5">
        <p className="flex items-center gap-2 text-foreground">
          <CalendarDays className="size-4 text-brand" /> {formatDateLongue(rdv.debut)}
        </p>
        <p className="flex items-center gap-2 text-foreground">
          <Clock3 className="size-4 text-brand" />
          {formatHeure(rdv.debut)}
          {rdv.prestation_duree ? ` · ${formatDuree(rdv.prestation_duree)}` : ""}
        </p>
        {rdv.prestation_nom && (
          <p className="text-sm text-muted">
            Prestation : <span className="text-foreground">{rdv.prestation_nom}</span>
          </p>
        )}
        {rdv.salarie_nom && (
          <p className="text-sm text-muted">
            Avec : <span className="text-foreground">{rdv.salarie_nom}</span>
          </p>
        )}
        {rdv.adresse_client && (
          <p className="flex items-center gap-2 text-sm text-muted">
            <MapPin className="size-3.5" /> {rdv.adresse_client}
          </p>
        )}
        {rdv.entreprise_tel && (
          <p className="flex items-center gap-2 text-sm text-muted">
            <Phone className="size-3.5" /> {rdv.entreprise_tel}
          </p>
        )}
        {rdv.acompte_cents ? (
          <p className="text-sm text-muted">
            Acompte : {formatPrix(rdv.acompte_cents)} —{" "}
            {rdv.acompte_paye ? "réglé" : "à régler avant le rendez-vous"}
          </p>
        ) : null}
      </Card>

      {rdv.acompte_cents && !rdv.acompte_paye && !passe && rdv.statut !== "annule" && (
        <Card className="p-5">
          {facturationPrete ? (
            <Button className="w-full" onClick={payerAcompte} disabled={enCours}>
              {enCours ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
              Payer l’acompte de {formatPrix(rdv.acompte_cents)}
            </Button>
          ) : (
            <p className="text-sm text-muted">
              Le paiement en ligne de l’acompte n’est pas encore disponible. Merci de contacter{" "}
              {rdv.entreprise_nom} directement.
            </p>
          )}
        </Card>
      )}

      {(rdv.statut === "confirme" || rdv.statut === "demande") && !passe && (
        <div className="flex flex-col gap-2 sm:flex-row">
          {rdv.statut === "confirme" && (
            <Button variant="outline" className="flex-1" onClick={() => setDialogReport(true)}>
              Reporter le rendez-vous
            </Button>
          )}
          <Button variant="danger" className="flex-1" onClick={() => setDialogAnnulation(true)}>
            <XCircle className="size-4" /> Annuler
          </Button>
        </div>
      )}

      {rdv.statut === "honore" && rdv.avis_actif && !avisEnvoye && (
        <Card className="space-y-3 p-5">
          <p className="font-medium text-foreground">Comment s’est passé ce rendez-vous ?</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setNote(n)} aria-label={`${n} étoiles`}>
                <Star
                  className={`size-7 transition-colors ${
                    n <= note ? "fill-warning text-warning" : "text-border-strong"
                  }`}
                />
              </button>
            ))}
          </div>
          <Textarea
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            placeholder="Un commentaire (optionnel)"
          />
          <Button disabled={note < 1 || enCours} onClick={envoyerAvis}>
            {enCours && <Loader2 className="size-4 animate-spin" />}
            Envoyer mon avis
          </Button>
        </Card>
      )}
      {rdv.statut === "honore" && avisEnvoye && (
        <p className="text-sm text-muted">Merci, votre avis a bien été enregistré.</p>
      )}

      {/* Dialog annulation */}
      <Dialog open={dialogAnnulation} onOpenChange={setDialogAnnulation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Annuler ce rendez-vous ?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted">Cette action est définitive.</p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Retour</Button>
            </DialogClose>
            <Button variant="danger" onClick={annuler} disabled={enCours}>
              {enCours && <Loader2 className="size-4 animate-spin" />} Confirmer l’annulation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog report */}
      <Dialog open={dialogReport} onOpenChange={setDialogReport}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choisir un nouveau créneau</DialogTitle>
          </DialogHeader>
          <CalendrierCreneaux
            prestationId={rdv.prestation_id as string}
            salarieId={rdv.salarie_id}
            fenetreMaxJours={FENETRE_REPORT_JOURS}
            creneauChoisi={nouveauCreneau}
            onChoisir={setNouveauCreneau}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button disabled={!nouveauCreneau || enCours} onClick={confirmerReport}>
              {enCours && <Loader2 className="size-4 animate-spin" />} Valider le nouveau créneau
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
