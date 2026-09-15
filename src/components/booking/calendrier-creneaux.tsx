"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isBefore,
  isSameDay,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export type Creneau = { debut: string; fin: string; salarie_id: string; salarie_nom: string };

const JOURS_SEMAINE = ["L", "M", "M", "J", "V", "S", "D"];

function cleJour(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function cleJourCreneau(iso: string): string {
  // Le créneau est un instant UTC ; on le classe selon le jour civil à Paris.
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
}

function periodeDuJour(iso: string): "Matin" | "Après-midi" | "Soir" {
  const heure = Number(
    new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", hour12: false, timeZone: "Europe/Paris" }).format(
      new Date(iso),
    ),
  );
  if (heure < 12) return "Matin";
  if (heure < 18) return "Après-midi";
  return "Soir";
}

function labelHeure(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).format(
    new Date(iso),
  );
}

export function CalendrierCreneaux({
  prestationId,
  salarieId,
  fenetreMaxJours,
  creneauChoisi,
  onChoisir,
}: {
  prestationId: string;
  salarieId: string | null;
  fenetreMaxJours: number;
  creneauChoisi: Creneau | null;
  onChoisir: (creneau: Creneau) => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const aujourdhui = useMemo(() => startOfDay(new Date()), []);
  const dateLimite = useMemo(() => addDays(aujourdhui, fenetreMaxJours), [aujourdhui, fenetreMaxJours]);

  const [moisAffiche, setMoisAffiche] = useState(() => startOfMonth(aujourdhui));
  const [creneauxParMois, setCreneauxParMois] = useState<Map<string, Creneau[]>>(new Map());
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [dateChoisie, setDateChoisie] = useState<string | null>(null);

  useEffect(() => {
    let annule = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- indicateur de chargement pour la requête ci-dessous
    setChargement(true);
    setErreur(null);

    const from = moisAffiche < aujourdhui ? aujourdhui : moisAffiche;
    const to = endOfMonth(moisAffiche);

    supabase
      .rpc("creneaux_disponibles", {
        p_prestation: prestationId,
        p_salarie: salarieId as string,
        p_from: format(from, "yyyy-MM-dd"),
        p_to: format(to, "yyyy-MM-dd"),
      })
      .then(({ data, error }) => {
        if (annule) return;
        if (error) {
          setErreur("Impossible de charger les disponibilités pour le moment.");
          setCreneauxParMois(new Map());
        } else {
          const map = new Map<string, Creneau[]>();
          for (const c of (data ?? []) as Creneau[]) {
            const cle = cleJourCreneau(c.debut);
            if (!map.has(cle)) map.set(cle, []);
            map.get(cle)!.push(c);
          }
          setCreneauxParMois(map);
          setDateChoisie((precedente) =>
            precedente && map.has(precedente) ? precedente : (Array.from(map.keys()).sort()[0] ?? null),
          );
        }
        setChargement(false);
      });

    return () => {
      annule = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moisAffiche, salarieId, prestationId]);

  const joursDuMois = useMemo(() => {
    const debut = startOfMonth(moisAffiche);
    const fin = endOfMonth(moisAffiche);
    return eachDayOfInterval({ start: debut, end: fin });
  }, [moisAffiche]);

  // Décalage pour démarrer la grille un lundi (date-fns getDay : 0 = dimanche).
  const decalageDebut = (getDay(joursDuMois[0]) + 6) % 7;

  const peutReculer = startOfMonth(moisAffiche) > startOfMonth(aujourdhui);
  const peutAvancer = startOfMonth(moisAffiche) < startOfMonth(dateLimite);

  const creneauxDuJour = dateChoisie ? (creneauxParMois.get(dateChoisie) ?? []) : [];
  const groupes: { label: "Matin" | "Après-midi" | "Soir"; creneaux: Creneau[] }[] = (
    ["Matin", "Après-midi", "Soir"] as const
  )
    .map((label) => ({ label, creneaux: creneauxDuJour.filter((c) => periodeDuJour(c.debut) === label) }))
    .filter((g) => g.creneaux.length > 0);

  const auMoinsUnJourDisponible = Array.from(creneauxParMois.keys()).length > 0;

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="font-medium capitalize text-foreground">
          {format(moisAffiche, "MMMM yyyy", { locale: fr })}
        </p>
        <div className="flex gap-1">
          <button
            type="button"
            aria-label="Mois précédent"
            disabled={!peutReculer}
            onClick={() => setMoisAffiche((m) => addMonths(m, -1))}
            className="flex size-8 items-center justify-center rounded-md border border-border-strong text-muted transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Mois suivant"
            disabled={!peutAvancer}
            onClick={() => setMoisAffiche((m) => addMonths(m, 1))}
            className="flex size-8 items-center justify-center rounded-md border border-border-strong text-muted transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase text-muted-foreground">
        {JOURS_SEMAINE.map((j, i) => (
          <span key={i}>{j}</span>
        ))}
      </div>

      <div className="relative mt-1 grid grid-cols-7 gap-1">
        {chargement && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
            <Loader2 className="size-5 animate-spin text-brand" />
          </div>
        )}
        {Array.from({ length: decalageDebut }).map((_, i) => (
          <span key={`vide-${i}`} />
        ))}
        {joursDuMois.map((jour) => {
          const cle = cleJour(jour);
          const disponible = (creneauxParMois.get(cle)?.length ?? 0) > 0;
          const horsPlage = isBefore(jour, aujourdhui) || jour > dateLimite;
          const selectionne = dateChoisie === cle;
          const estAujourdhui = isSameDay(jour, aujourdhui);

          return (
            <button
              key={cle}
              type="button"
              disabled={!disponible || horsPlage}
              onClick={() => setDateChoisie(cle)}
              className={cn(
                "relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition-colors",
                selectionne && "bg-brand text-brand-foreground font-semibold",
                !selectionne && disponible && !horsPlage && "text-foreground hover:bg-brand-light/60 cursor-pointer",
                (!disponible || horsPlage) && "text-muted-foreground/40 cursor-not-allowed",
                estAujourdhui && !selectionne && "ring-1 ring-inset ring-brand/40",
              )}
            >
              {format(jour, "d")}
              {disponible && !horsPlage && !selectionne && (
                <span className="absolute bottom-1 size-1 rounded-full bg-brand" />
              )}
            </button>
          );
        })}
      </div>

      {erreur && <p className="mt-4 text-sm text-danger">{erreur}</p>}

      {!chargement && !erreur && !auMoinsUnJourDisponible && (
        <p className="mt-4 text-sm text-muted">Aucun créneau disponible ce mois-ci.</p>
      )}

      {dateChoisie && groupes.length > 0 && (
        <div className="mt-5 space-y-4 border-t border-border pt-4">
          {groupes.map((groupe) => (
            <div key={groupe.label}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {groupe.label}
              </p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {groupe.creneaux.map((c) => (
                  <button
                    key={`${c.salarie_id}-${c.debut}`}
                    type="button"
                    onClick={() => onChoisir(c)}
                    className={cn(
                      "rounded-lg border px-2 py-2 text-sm font-medium transition-colors",
                      creneauChoisi?.debut === c.debut && creneauChoisi.salarie_id === c.salarie_id
                        ? "border-brand bg-brand text-brand-foreground"
                        : "border-border hover:bg-surface",
                    )}
                  >
                    {labelHeure(c.debut)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
