"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarCheck2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deconnecterGoogleCalendar } from "@/app/dashboard/actions";

export function GoogleCalendarButton({ salarieId, emailConnecte }: { salarieId: string; emailConnecte: string | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (!emailConnecte) {
    return (
      <Button asChild size="sm" variant="ghost">
        <a href={`/api/google-calendar/connect?salarieId=${salarieId}`}>
          <CalendarCheck2 className="size-3.5" /> Connecter Google Calendar
        </a>
      </Button>
    );
  }

  function deconnecter() {
    startTransition(async () => {
      try {
        await deconnecterGoogleCalendar(salarieId);
        toast.success("Google Calendar déconnecté");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  return (
    <Button size="sm" variant="ghost" type="button" onClick={deconnecter} disabled={pending}>
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <CalendarCheck2 className="size-3.5 text-success" />}
      Google : {emailConnecte}
    </Button>
  );
}
