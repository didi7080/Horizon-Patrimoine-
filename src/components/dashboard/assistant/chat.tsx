"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Quel est mon chiffre d'affaires de ce mois-ci ?",
  "Quelles sont les mentions obligatoires sur une facture ?",
  "Crée un devis de 3h de prestation à 45€/h pour M. Dupont",
  "Quel taux de TVA pour des travaux de rénovation ?",
];

export function AssistantChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [saisie, setSaisie] = useState("");
  const [pending, setPending] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  async function envoyer(texte: string) {
    const contenu = texte.trim();
    if (!contenu || pending) return;
    const nouveauxMessages: Message[] = [...messages, { role: "user", content: contenu }];
    setMessages(nouveauxMessages);
    setSaisie("");
    setPending(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nouveauxMessages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Une erreur est survenue.");
      setMessages((m) => [...m, { role: "assistant", content: data.reply as string }]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Une erreur est survenue.");
      setMessages((m) => m.slice(0, -1));
      setSaisie(contenu);
    } finally {
      setPending(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    envoyer(saisie);
  }

  return (
    <div className="flex h-[70vh] flex-col gap-4">
      <Card className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-brand-light text-brand">
              <Sparkles className="size-6" />
            </div>
            <div>
              <p className="font-medium text-foreground">Posez une question, ou demandez une action</p>
              <p className="mt-1 text-sm text-muted">
                Administratif, juridique, technique, réglementaire — ou directement « crée-moi un devis ».
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => envoyer(s)}
                  className="rounded-full border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:border-brand hover:text-brand"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm",
                    m.role === "user" ? "bg-brand text-white" : "bg-surface text-foreground",
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {pending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl bg-surface px-4 py-2.5 text-sm text-muted">
                  <Loader2 className="size-3.5 animate-spin" /> L’assistant réfléchit...
                </div>
              </div>
            )}
            <div ref={finRef} />
          </div>
        )}
      </Card>

      <form onSubmit={onSubmit} className="flex items-center gap-2">
        <input
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          placeholder="Posez votre question ou décrivez l'action à faire..."
          className="h-11 flex-1 rounded-lg border border-border-strong bg-background px-3 text-sm text-foreground outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20"
        />
        <Button type="submit" disabled={pending || !saisie.trim()}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </Button>
      </form>
    </div>
  );
}
