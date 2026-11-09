"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { envoyerActualiteClients } from "@/app/dashboard/clients/actions";

export function ActualiteClientsForm({ nbClientsEligibles }: { nbClientsEligibles: number }) {
  const [sujet, setSujet] = useState("");
  const [message, setMessage] = useState("");
  const [filtreAdresse, setFiltreAdresse] = useState("");
  const [pending, startTransition] = useTransition();

  function envoyer() {
    if (!sujet.trim() || !message.trim()) return;
    if (!window.confirm(`Envoyer cet e-mail à vos clients${filtreAdresse.trim() ? ` dont l'adresse contient « ${filtreAdresse.trim()} »` : ""} ? Cette action ne peut pas être annulée.`)) {
      return;
    }
    startTransition(async () => {
      try {
        const { nbEnvoyes, nbEchecs } = await envoyerActualiteClients(sujet, message, filtreAdresse);
        toast.success(`${nbEnvoyes} e-mail${nbEnvoyes > 1 ? "s" : ""} envoyé${nbEnvoyes > 1 ? "s" : ""}${nbEchecs > 0 ? `, ${nbEchecs} échec(s)` : ""}.`);
        setSujet("");
        setMessage("");
        setFiltreAdresse("");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  return (
    <Card className="space-y-4 p-6">
      <p className="text-sm text-muted">
        {nbClientsEligibles} client{nbClientsEligibles > 1 ? "s" : ""} avec une adresse e-mail enregistrée recevra
        {nbClientsEligibles > 1 ? "ont" : ""} ce message (hors clients désabonnés).
      </p>

      <div className="space-y-1.5">
        <label htmlFor="sujet" className="text-sm font-medium text-foreground">
          Objet
        </label>
        <Input id="sujet" value={sujet} onChange={(e) => setSujet(e.target.value)} placeholder="Ex. : Journée portes ouvertes le 12 décembre" />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="message" className="text-sm font-medium text-foreground">
          Message
        </label>
        <Textarea
          id="message"
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Bonjour, nous organisons..."
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="filtreAdresse" className="text-sm font-medium text-foreground">
          Limiter à une ville ou une adresse (optionnel)
        </label>
        <Input
          id="filtreAdresse"
          value={filtreAdresse}
          onChange={(e) => setFiltreAdresse(e.target.value)}
          placeholder="Ex. : Mélisey"
        />
        <p className="text-xs text-muted">Recherche dans l&apos;adresse enregistrée de chaque client.</p>
      </div>

      <Button type="button" onClick={envoyer} disabled={pending || !sujet.trim() || !message.trim()}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-3.5" />}
        Envoyer
      </Button>
    </Card>
  );
}
