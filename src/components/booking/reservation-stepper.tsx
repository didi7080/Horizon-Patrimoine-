"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  Loader2,
  MapPin,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDuree, formatPrix, initiales } from "@/lib/utils";
import type { Tables } from "@/lib/types/database";
import { reserverRdvAction } from "@/app/e/[slug]/reserver/[prestationId]/actions";
import { ListeAttenteForm } from "@/components/booking/liste-attente-form";
import { CalendrierCreneaux, type Creneau } from "@/components/booking/calendrier-creneaux";

type Salarie = Pick<Tables<"salaries">, "id" | "nom" | "fonction" | "couleur">;

const ETAPES = ["Professionnel", "Créneau", "Coordonnées", "Confirmation"] as const;

export function ReservationStepper({
  entreprise,
  prestation,
  salaries,
  embed = false,
}: {
  entreprise: Tables<"entreprises">;
  prestation: Tables<"prestations">;
  salaries: Salarie[];
  embed?: boolean;
}) {
  const [montageA] = useState(() => Date.now());
  const skipSalarieStep = salaries.length <= 1;
  const [step, setStep] = useState(skipSalarieStep ? 1 : 0);

  const [salarieId, setSalarieId] = useState<string | null>(salaries[0]?.id ?? null);
  const [creneauChoisi, setCreneauChoisi] = useState<Creneau | null>(null);

  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [tel, setTel] = useState("");
  const [adresse, setAdresse] = useState("");
  const [codePostal, setCodePostal] = useState("");
  const [notes, setNotes] = useState("");
  const [siteWeb, setSiteWeb] = useState(""); // piège anti-bot, doit rester vide
  const [envoi, setEnvoi] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [erreurReservation, setErreurReservation] = useState<string | null>(null);

  async function envoyerReservation() {
    if (!creneauChoisi || !nom.trim() || !tel.trim()) return;
    setEnvoi(true);
    setErreurReservation(null);

    const formData = new FormData();
    formData.set("entreprise_id", entreprise.id);
    formData.set("prestation_id", prestation.id);
    formData.set("salarie_id", creneauChoisi.salarie_id);
    formData.set("debut", creneauChoisi.debut);
    formData.set("nom", nom.trim());
    formData.set("email", email.trim());
    formData.set("tel", tel.trim());
    formData.set("notes", notes.trim());
    formData.set("adresse", adresse.trim());
    formData.set("code_postal", codePostal.trim());
    formData.set("site_web", siteWeb);
    formData.set("rendu_a", String(montageA));

    const resultat = await reserverRdvAction(null, formData);
    setEnvoi(false);
    if (resultat?.error) {
      setErreurReservation(resultat.error);
      toast.error("La réservation a échoué", { description: resultat.error });
      return;
    }
    setToken(resultat!.token!);
    setStep(3);
  }

  return (
    <div>
      <Link
        href={`${embed ? "/embed" : "/e"}/${entreprise.slug}`}
        target={embed ? "_blank" : undefined}
        rel={embed ? "noopener" : undefined}
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Retour à {entreprise.nom}
      </Link>

      {/* Récap prestation */}
      <Card className="mt-4 flex items-center justify-between gap-3 p-4">
        <div>
          <p className="font-medium text-foreground">{prestation.nom}</p>
          <p className="text-sm text-muted">
            {formatDuree(prestation.duree_min)} · chez {entreprise.nom}
          </p>
        </div>
        <p className="font-semibold text-foreground">{formatPrix(prestation.prix_cents)}</p>
      </Card>

      {/* Progression */}
      {step < 3 && (
        <ol className="mt-6 flex items-center gap-2 text-xs font-medium text-muted-foreground">
          {ETAPES.slice(0, 3).map((etape, i) => (
            <li key={etape} className="flex items-center gap-2">
              <span
                className={`flex size-5 items-center justify-center rounded-full ${
                  i === step
                    ? "bg-brand text-brand-foreground"
                    : i < step
                      ? "bg-brand-light text-brand-dark"
                      : "bg-surface text-muted-foreground"
                }`}
              >
                {i + 1}
              </span>
              <span className={i === step ? "text-foreground" : ""}>{etape}</span>
              {i < 2 && <span className="mx-1 h-px w-4 bg-border" />}
            </li>
          ))}
        </ol>
      )}

      {/* Étape 0 : professionnel */}
      {step === 0 && (
        <div className="mt-6 space-y-2">
          {salaries.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setSalarieId(s.id);
                setCreneauChoisi(null);
              }}
              className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                salarieId === s.id ? "border-brand bg-brand-light/40" : "border-border hover:bg-surface"
              }`}
            >
              <Avatar>
                <AvatarFallback style={{ backgroundColor: `${s.couleur}22`, color: s.couleur }}>
                  {initiales(s.nom)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">{s.nom}</p>
                {s.fonction && <p className="text-sm text-muted">{s.fonction}</p>}
              </div>
            </button>
          ))}
          <button
            onClick={() => {
              setSalarieId(null);
              setCreneauChoisi(null);
            }}
            className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
              salarieId === null ? "border-brand bg-brand-light/40" : "border-border hover:bg-surface"
            }`}
          >
            <Avatar>
              <AvatarFallback>
                <User className="size-4" />
              </AvatarFallback>
            </Avatar>
            <p className="font-medium text-foreground">Peu importe, le premier disponible</p>
          </button>
          <Button className="mt-4 w-full" onClick={() => setStep(1)}>
            Continuer <ArrowRight className="size-4" />
          </Button>
        </div>
      )}

      {/* Étape 1 : créneau */}
      {step === 1 && (
        <div className="mt-6">
          <CalendrierCreneaux
            prestationId={prestation.id}
            salarieId={salarieId}
            fenetreMaxJours={entreprise.fenetre_max_jours}
            creneauChoisi={creneauChoisi}
            onChoisir={setCreneauChoisi}
          />

          {salarieId === null && creneauChoisi && (
            <p className="mt-3 text-sm text-muted">
              Avec <span className="font-medium text-foreground">{creneauChoisi.salarie_nom}</span>
            </p>
          )}

          <div className="mt-4">
            <ListeAttenteForm entrepriseId={entreprise.id} prestationId={prestation.id} />
          </div>

          <div className="mt-6 flex gap-2">
            {!skipSalarieStep && (
              <Button variant="outline" onClick={() => setStep(0)}>
                <ArrowLeft className="size-4" /> Retour
              </Button>
            )}
            <Button className="flex-1" disabled={!creneauChoisi} onClick={() => setStep(2)}>
              Continuer <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Étape 2 : coordonnées */}
      {step === 2 && creneauChoisi && (
        <div className="mt-6 space-y-4">
          <Card className="flex items-center gap-3 p-4 text-sm">
            <CalendarDays className="size-4 text-brand" />
            <span className="text-foreground">
              {labelDateComplete(creneauChoisi.debut)} à {labelHeure(creneauChoisi.debut)}
            </span>
          </Card>

          {/* Piège anti-bot : invisible et ignoré par les humains, jamais affiché */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label htmlFor="site_web">Ne pas remplir ce champ</label>
            <input
              id="site_web"
              name="site_web"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={siteWeb}
              onChange={(e) => setSiteWeb(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="nom">Nom complet *</Label>
              <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tel">Téléphone *</Label>
              <Input id="tel" value={tel} onChange={(e) => setTel(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              Pour recevoir la confirmation et le rappel de rendez-vous.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <div className="space-y-1.5">
              <Label htmlFor="adresse">Adresse d’intervention</Label>
              <Input id="adresse" value={adresse} onChange={(e) => setAdresse(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cp">Code postal</Label>
              <Input id="cp" value={codePostal} onChange={(e) => setCodePostal(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Précisions (optionnel)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Décrivez brièvement votre besoin…"
            />
          </div>

          {erreurReservation && <p className="text-sm text-danger">{erreurReservation}</p>}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="size-4" /> Retour
            </Button>
            <Button
              className="flex-1"
              disabled={!nom.trim() || !tel.trim() || envoi}
              onClick={envoyerReservation}
            >
              {envoi ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              Confirmer le rendez-vous
            </Button>
          </div>
        </div>
      )}

      {/* Étape 3 : confirmation */}
      {step === 3 && token && creneauChoisi && (
        <div className="mt-8 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success-light text-success">
            <CheckCircle2 className="size-7" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-foreground">
            Rendez-vous {entreprise.validation_manuelle ? "envoyé" : "confirmé"} !
          </h2>
          <p className="mt-1 text-muted">
            {entreprise.validation_manuelle
              ? `${entreprise.nom} va valider votre demande rapidement.`
              : `C'est noté chez ${entreprise.nom}.`}
          </p>

          <Card className="mx-auto mt-6 max-w-sm space-y-2 p-5 text-left text-sm">
            <p className="flex items-center gap-2 text-foreground">
              <CalendarDays className="size-4 text-brand" />
              {labelDateComplete(creneauChoisi.debut)}
            </p>
            <p className="flex items-center gap-2 text-foreground">
              <Clock3 className="size-4 text-brand" />
              {labelHeure(creneauChoisi.debut)} · {formatDuree(prestation.duree_min)}
            </p>
            {adresse && (
              <p className="flex items-center gap-2 text-foreground">
                <MapPin className="size-4 text-brand" /> {adresse} {codePostal}
              </p>
            )}
          </Card>

          <div className="mx-auto mt-6 flex max-w-sm flex-col gap-2">
            <Button asChild>
              <Link href={`/rdv/${token}`} target={embed ? "_blank" : undefined} rel={embed ? "noopener" : undefined}>
                Gérer mon rendez-vous
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                const lien = `${window.location.origin}/rdv/${token}`;
                try {
                  await navigator.clipboard.writeText(lien);
                  toast.success("Lien copié");
                } catch {
                  toast.info("Voici votre lien de suivi", { description: lien });
                }
              }}
            >
              <Copy className="size-4" /> Copier le lien de suivi
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function labelHeure(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).format(
    new Date(iso),
  );
}
function labelDateComplete(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Paris",
  }).format(new Date(iso));
}
