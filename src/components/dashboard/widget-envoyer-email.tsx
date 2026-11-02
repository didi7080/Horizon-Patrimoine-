"use client";

import { useState, useTransition } from "react";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { envoyerCodeWidgetParEmail } from "@/app/dashboard/widget/actions";

export function WidgetEnvoyerEmail({ titre, code }: { titre: string; code: string }) {
  const [ouvert, setOuvert] = useState(false);
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();

  if (!ouvert) {
    return (
      <Button type="button" size="sm" variant="ghost" onClick={() => setOuvert(true)}>
        <Mail className="size-3.5" /> Envoyer ce code par e-mail à qui gère mon site
      </Button>
    );
  }

  function envoyer() {
    if (!email.trim()) return;
    startTransition(async () => {
      try {
        await envoyerCodeWidgetParEmail(email.trim(), titre, code);
        toast.success(`E-mail envoyé à ${email.trim()}`);
        setOuvert(false);
        setEmail("");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        type="email"
        placeholder="email@exemple.fr"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="h-9 w-56"
      />
      <Button type="button" size="sm" onClick={envoyer} disabled={pending || !email.trim()}>
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Mail className="size-3.5" />}
        Envoyer
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => setOuvert(false)}>
        Annuler
      </Button>
    </div>
  );
}
