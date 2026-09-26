"use client";

import { CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function IcalLinkButton({ token }: { token: string }) {
  async function copierLien() {
    const lien = `${window.location.origin}/ical/${token}`;
    try {
      await navigator.clipboard.writeText(lien);
      toast.success("Lien calendrier copié", {
        description: "À coller dans Google Calendar, Outlook ou Apple Calendar (« ajouter un agenda par URL »).",
      });
    } catch {
      toast.error("Impossible de copier le lien");
    }
  }

  return (
    <Button size="sm" variant="ghost" type="button" onClick={copierLien}>
      <CalendarPlus className="size-3.5" /> Lien calendrier
    </Button>
  );
}
