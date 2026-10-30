"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

const MESSAGES: Record<string, { type: "success" | "error"; texte: string }> = {
  connecte: { type: "success", texte: "Google Calendar connecté" },
  refuse: { type: "error", texte: "Connexion annulée" },
  erreur: { type: "error", texte: "La connexion à Google Calendar a échoué, réessayez." },
};

export function GoogleCalendarStatut() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statut = searchParams.get("google");

  useEffect(() => {
    if (!statut) return;
    const message = MESSAGES[statut];
    if (message) {
      if (message.type === "success") toast.success(message.texte);
      else toast.error(message.texte);
    }
    router.replace("/dashboard/equipe");
  }, [statut, router]);

  return null;
}
