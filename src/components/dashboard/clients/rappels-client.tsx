"use client";

import { useState, useTransition } from "react";
import { Bell, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { programmerRappel, annulerRappel } from "@/app/dashboard/clients/actions";
import { formatDateCourte } from "@/lib/utils";

export type RappelAffiche = {
  id: string;
  titre: string;
  message: string | null;
  date_prevue: string;
  destinataire: "client" | "artisan";
  statut: "a_envoyer" | "envoye" | "annule";
};

const LABEL_STATUT: Record<string, string> = { a_envoyer: "À envoyer", envoye: "Envoyé", annule: "Annulé" };

export function RappelsClient({ clientId, rappels }: { clientId: string; rappels: RappelAffiche[] }) {
  const [ouvert, setOuvert] = useState(false);
  const [titre, setTitre] = useState("");
  const [message, setMessage] = useState("");
  const [date, setDate] = useState("");
  const [destinataire, setDestinataire] = useState<"client" | "artisan">("client");
  const [pending, startTransition] = useTransition();

  function soumettre() {
    startTransition(async () => {
      const resultat = await programmerRappel({ clientId, titre, message, datePrevue: date, destinataire });
      if (!resultat.ok) {
        toast.error(resultat.erreur);
        return;
      }
      toast.success("Rappel programmé");
      setTitre("");
      setMessage("");
      setDate("");
      setOuvert(false);
    });
  }

  function annuler(rappelId: string) {
    startTransition(async () => {
      const resultat = await annulerRappel(rappelId, clientId);
      if (!resultat.ok) toast.error(resultat.erreur);
    });
  }

  return (
    <div className="space-y-3">
      {rappels.length > 0 && (
        <ul className="space-y-2">
          {rappels.map((r) => (
            <li key={r.id} className="flex items-start justify-between gap-3 rounded-lg bg-surface px-3 py-2 text-sm">
              <div>
                <p className="font-medium text-foreground">
                  {r.titre} <span className="font-normal text-muted">— {formatDateCourte(r.date_prevue)}</span>
                </p>
                {r.message && <p className="mt-0.5 text-muted">{r.message}</p>}
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {LABEL_STATUT[r.statut]} · {r.destinataire === "client" ? "au client" : "à moi-même"}
                </p>
              </div>
              {r.statut === "a_envoyer" && (
                <button type="button" onClick={() => annuler(r.id)} disabled={pending} className="shrink-0 text-muted hover:text-foreground">
                  <X className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {ouvert ? (
        <div className="space-y-3 rounded-lg border border-border p-3">
          <div className="space-y-1.5">
            <Label htmlFor="rappel-titre">Titre</Label>
            <Input
              id="rappel-titre"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex. Entretien annuel de la haie"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="rappel-date">Date du rappel</Label>
              <Input id="rappel-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rappel-destinataire">Destinataire</Label>
              <select
                id="rappel-destinataire"
                value={destinataire}
                onChange={(e) => setDestinataire(e.target.value as "client" | "artisan")}
                className="h-9 w-full rounded-md border border-border-strong bg-background px-3 text-sm text-foreground"
              >
                <option value="client">Le client</option>
                <option value="artisan">Moi-même</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rappel-message">Message (optionnel)</Label>
            <Textarea
              id="rappel-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Le texte envoyé par e-mail à l'échéance…"
              className="min-h-16 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={soumettre} disabled={pending || !titre.trim() || !date}>
              {pending && <Loader2 className="size-3.5 animate-spin" />} Programmer
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setOuvert(false)} disabled={pending}>
              Annuler
            </Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setOuvert(true)}>
          <Bell className="size-3.5" /> Programmer un rappel
        </Button>
      )}
    </div>
  );
}
