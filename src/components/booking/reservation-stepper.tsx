"use client";

import { useEffect, useMemo, useState } from "react";
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
import { createClient } from "@/lib/supabase/client";
import { formatDuree, formatPrix, initiales } from "@/lib/utils";
import type { Tables } from "@/lib/types/database";

type Salarie = Pick<Tables<"salaries">, "id" | "nom" | "fonction" | "couleur">;
type Creneau = { debut: string; fin: string; salarie_id: string; salarie_nom: string };

const ETAPES = ["Professionnel", "Créneau", "Coordonnées", "Confirmation"] as const;

export function ReservationStepper({
  entreprise,
  prestation,
  salaries,
}: {
  entreprise: Tables<"entreprises">;
  prestation: Tables<"prestations">;
  salaries: Salarie[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const skipSalarieStep = salaries.length <= 1;
  const [step, setStep] = useState(skipSalarieStep ? 1 : 0);

  const [salarieId, setSalarieId] = useState<string | null>(salaries[0]?.id ?? null);
  const [creneaux, setCreneaux] = useState<Creneau[] | null>(null);
  const [chargementCreneaux, setChargementCreneaux] = useState(false);
  const [erreurCreneaux, setErreurCreneaux] = useState<string | null>(null);
  const [dateChoisie, setDateChoisie] = useState<string | null>(null);
  const [creneauChoisi, setCreneauChoisi] = useState<Creneau | null>(null);

  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [tel, setTel] = useState("");
  const [adresse, setAdresse] = useState("");
  const [codePostal, setCodePostal] = useState("");
  const [notes, setNotes] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [erreurReservation, setErreurReservation] = useState<string | null>(null);

  useEffect(() => {
    if (step !== 1) return;
    let annule = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading flag for the async fetch below
    setChargementCreneaux(true);
    setErreurCreneaux(null);
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + Math.min(entreprise.fenetre_max_jours, 30));

    supabase
      .rpc("creneaux_disponibles", {
        p_prestation: prestation.id,
        p_salarie: salarieId as string,
        p_from: from.toISOString().slice(0, 10),
        p_to: to.toISOString().slice(0, 10),
      })
      .then(({ data, error }) => {
        if (annule) return;
        if (error) {
          setErreurCreneaux("Impossible de charger les disponibilités pour le moment.");
          setCreneaux([]);
        } else {
          const liste = (data ?? []) as Creneau[];
          setCreneaux(liste);
          const premiereDate = liste[0] ? dateISO(liste[0].debut) : null;
          setDateChoisie(premiereDate);
        }
        setChargementCreneaux(false);
      });

    return () => {
      annule = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, salarieId]);

  const creneauxParDate = useMemo(() => {
    const map = new Map<string, Creneau[]>();
    for (const c of creneaux ?? []) {
      const d = dateISO(c.debut);
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(c);
    }
    return map;
  }, [creneaux]);

  const datesDisponibles = useMemo(() => Array.from(creneauxParDate.keys()).sort(), [creneauxParDate]);

  async function envoyerReservation() {
    if (!creneauChoisi || !nom.trim() || !tel.trim()) return;
    setEnvoi(true);
    setErreurReservation(null);
    const { data, error } = await supabase.rpc("reserver_rdv", {
      p_entreprise: entreprise.id,
      p_prestation: prestation.id,
      p_salarie: creneauChoisi.salarie_id,
      p_debut: creneauChoisi.debut,
      p_nom: nom.trim(),
      p_email: email.trim() || "",
      p_tel: tel.trim(),
      p_notes: notes.trim() || "",
      p_adresse: adresse.trim() || undefined,
      p_code_postal: codePostal.trim() || undefined,
    });
    setEnvoi(false);
    if (error) {
      setErreurReservation(error.message);
      toast.error("La réservation a échoué", { description: error.message });
      return;
    }
    setToken(data as string);
    setStep(3);
  }

  return (
    <div>
      <Link
        href={`/e/${entreprise.slug}`}
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
              onClick={() => setSalarieId(s.id)}
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
            onClick={() => setSalarieId(null)}
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
          {chargementCreneaux && (
            <div className="flex items-center gap-2 py-10 text-sm text-muted">
              <Loader2 className="size-4 animate-spin" /> Recherche des créneaux disponibles…
            </div>
          )}
          {!chargementCreneaux && erreurCreneaux && (
            <p className="py-6 text-sm text-danger">{erreurCreneaux}</p>
          )}
          {!chargementCreneaux && !erreurCreneaux && datesDisponibles.length === 0 && (
            <p className="py-6 text-sm text-muted">
              Aucun créneau disponible dans les prochaines semaines. Contactez directement{" "}
              {entreprise.nom} au {entreprise.telephone ?? "numéro non renseigné"}.
            </p>
          )}
          {!chargementCreneaux && datesDisponibles.length > 0 && (
            <>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {datesDisponibles.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDateChoisie(d)}
                    className={`flex shrink-0 flex-col items-center rounded-lg border px-3 py-2 text-sm transition-colors ${
                      dateChoisie === d
                        ? "border-brand bg-brand text-brand-foreground"
                        : "border-border hover:bg-surface"
                    }`}
                  >
                    <span className="text-[11px] uppercase opacity-80">{labelJourCourt(d)}</span>
                    <span className="font-semibold">{labelJourNumero(d)}</span>
                  </button>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {(dateChoisie ? creneauxParDate.get(dateChoisie) ?? [] : []).map((c) => (
                  <button
                    key={`${c.salarie_id}-${c.debut}`}
                    onClick={() => setCreneauChoisi(c)}
                    className={`rounded-lg border px-2 py-2 text-sm font-medium transition-colors ${
                      creneauChoisi?.debut === c.debut && creneauChoisi.salarie_id === c.salarie_id
                        ? "border-brand bg-brand text-brand-foreground"
                        : "border-border hover:bg-surface"
                    }`}
                  >
                    {labelHeure(c.debut)}
                  </button>
                ))}
              </div>

              {salarieId === null && creneauChoisi && (
                <p className="mt-3 text-sm text-muted">
                  Avec <span className="font-medium text-foreground">{creneauChoisi.salarie_nom}</span>
                </p>
              )}

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
            </>
          )}
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
              <Link href={`/rdv/${token}`}>Gérer mon rendez-vous</Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/rdv/${token}`);
                toast.success("Lien copié");
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

function dateISO(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
}
function labelJourCourt(dateIso: string) {
  return new Intl.DateTimeFormat("fr-FR", { weekday: "short", timeZone: "Europe/Paris" }).format(
    new Date(dateIso),
  );
}
function labelJourNumero(dateIso: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", timeZone: "Europe/Paris" }).format(
    new Date(dateIso),
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
