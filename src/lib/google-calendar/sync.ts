import { createAdminClient } from "@/lib/supabase/admin";
import { rafraichirJetonAcces } from "@/lib/google-calendar/client";

const STATUTS_SYNCHRONISES = new Set(["confirme", "honore"]);

/**
 * Synchronise un rendez-vous vers Google Calendar (sens unique ArtisanRDV → Google).
 * N'agit que si le salarié a connecté son compte Google. Échoue silencieusement
 * (journalisé) pour ne jamais bloquer un parcours de réservation ou une action
 * du tableau de bord à cause d'un souci côté Google.
 */
export async function synchroniserRdvGoogle(rdvId: string): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;

  const { data: rdv } = await admin
    .from("rendez_vous")
    .select(
      "id, debut, fin, statut, notes, adresse_client, google_event_id, salarie:salaries(google_refresh_token), client:clients(nom), prestation:prestations(nom)",
    )
    .eq("id", rdvId)
    .maybeSingle();
  if (!rdv) return;

  const salarie = rdv.salarie as unknown as { google_refresh_token: string | null } | null;
  const refreshToken = salarie?.google_refresh_token;
  if (!refreshToken) return;

  try {
    const accessToken = await rafraichirJetonAcces(refreshToken);
    if (!accessToken) return;

    if (rdv.statut === "annule") {
      if (rdv.google_event_id) {
        await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${rdv.google_event_id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        await admin.from("rendez_vous").update({ google_event_id: null }).eq("id", rdvId);
      }
      return;
    }

    if (!STATUTS_SYNCHRONISES.has(rdv.statut)) return;

    const client = rdv.client as unknown as { nom: string } | null;
    const prestation = rdv.prestation as unknown as { nom: string } | null;
    const titre = [prestation?.nom ?? "Rendez-vous", client?.nom].filter(Boolean).join(" — ");

    const corps = {
      summary: titre,
      location: rdv.adresse_client ?? undefined,
      description: rdv.notes ?? undefined,
      start: { dateTime: rdv.debut },
      end: { dateTime: rdv.fin },
    };

    if (rdv.google_event_id) {
      await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${rdv.google_event_id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(corps),
      });
    } else {
      const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(corps),
      });
      const evenement = await res.json();
      if (res.ok && evenement.id) {
        await admin.from("rendez_vous").update({ google_event_id: evenement.id }).eq("id", rdvId);
      }
    }
  } catch (err) {
    console.error("Synchronisation Google Calendar échouée:", err);
  }
}
