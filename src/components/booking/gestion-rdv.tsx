"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Clock3,
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
import { createClient } from "@/lib/supabase/client";
import { formatDateLongue, formatDuree, formatHeure, formatPrix } from "@/lib/utils";
import type { RdvDetail } from "@/app/rdv/[token]/page";

type Creneau = { debut: string; fin: string; salarie_id: string; salarie_nom: string };

export function GestionRdv({ token, initial }: { token: string; initial: RdvDetail }) {
  const supabase = useMemo(() => createClient(), []);
  const [rdv, setRdv] = useState(initial);
  const [enCours, setEnCours] = useState(false);
  const [dialogAnnulation, setDialogAnnulation] = useState(false);
  const [dialogReport, setDialogReport] = useState(false);

  const [creneaux, setCreneaux] = useState<Creneau[] | null>(null);
  const [chargementCreneaux, setChargementCreneaux] = useState(false);
  const [nouveauCreneau, setNouveauCreneau] = useState<Creneau | null>(null);

  const [note, setNote] = useState(0);
  const [commentaire, setCommentaire] = useState("");
  const [avisEnvoye, setAvisEnvoye] = useState(rdv.a_un_avis);

  const passe = new Date(rdv.debut) < new Date();

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

  async function ouvrirReport() {
    setDialogReport(true);
    if (creneaux) return;
    setChargementCreneaux(true);
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 30);
    const { data, error } = await supabase.rpc("creneaux_disponibles", {
      p_prestation: rdv.prestation_id as string,
      p_salarie: rdv.salarie_id,
      p_from: from.toISOString().slice(0, 10),
      p_to: to.toISOString().slice(0, 10),
    });
    setChargementCreneaux(false);
    if (!error) setCreneaux((data ?? []) as Creneau[]);
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

      {(rdv.statut === "confirme" || rdv.statut === "demande") && !passe && (
        <div className="flex flex-col gap-2 sm:flex-row">
          {rdv.statut === "confirme" && (
            <Button variant="outline" className="flex-1" onClick={ouvrirReport}>
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
          {chargementCreneaux && (
            <div className="flex items-center gap-2 py-6 text-sm text-muted">
              <Loader2 className="size-4 animate-spin" /> Chargement des disponibilités…
            </div>
          )}
          {!chargementCreneaux && creneaux && creneaux.length === 0 && (
            <p className="py-4 text-sm text-muted">Aucun créneau disponible actuellement.</p>
          )}
          {!chargementCreneaux && creneaux && creneaux.length > 0 && (
            <div className="grid max-h-72 grid-cols-3 gap-2 overflow-y-auto">
              {creneaux.map((c) => (
                <button
                  key={`${c.salarie_id}-${c.debut}`}
                  onClick={() => setNouveauCreneau(c)}
                  className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                    nouveauCreneau?.debut === c.debut
                      ? "border-brand bg-brand text-brand-foreground"
                      : "border-border hover:bg-surface"
                  }`}
                >
                  {new Intl.DateTimeFormat("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Europe/Paris",
                  }).format(new Date(c.debut))}
                </button>
              ))}
            </div>
          )}
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
