import { createAdminClient } from "@/lib/supabase/admin";
import { rafraichirJetonAcces } from "@/lib/google-calendar/client";

const STATUTS_SYNCHRONISES = new Set(["confirme", "honore"]);

type EvenementGoogle = {
  summary: string;
  location?: string;
  description?: string;
  start: { dateTime: string };
  end: { dateTime: string };
};

/** Crée, met à jour ou supprime un événement Google Calendar ; renvoie son nouvel identifiant (ou null si supprimé/échoué). */
async function pousserEvenementGoogle(
  refreshToken: string,
  googleEventIdExistant: string | null,
  annule: boolean,
  corps: EvenementGoogle,
): Promise<string | null> {
  const accessToken = await rafraichirJetonAcces(refreshToken);
  if (!accessToken) return googleEventIdExistant;

  if (annule) {
    if (googleEventIdExistant) {
      await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventIdExistant}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    }
    return null;
  }

  if (googleEventIdExistant) {
    await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventIdExistant}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(corps),
    });
    return googleEventIdExistant;
  }

  const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(corps),
  });
  const evenement = await res.json();
  return res.ok && evenement.id ? evenement.id : null;
}

/**
 * Synchronise un rendez-vous vers Google Calendar (sens unique ArtisanRDV → Google).
 * N'agit que si le salarié principal a connecté son compte Google. Échoue
 * silencieusement (journalisé) pour ne jamais bloquer un parcours de
 * réservation ou une action du tableau de bord à cause d'un souci côté Google.
 */
export async function synchroniserRdvGoogle(rdvId: string): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;

  const { data: rdv } = await admin
    .from("rendez_vous")
    .select(
      "id, debut, fin, statut, notes, adresse_client, google_event_id, salarie:salaries!rendez_vous_salarie_id_fkey(google_refresh_token), client:clients(nom), prestation:prestations(nom)",
    )
    .eq("id", rdvId)
    .maybeSingle();
  if (!rdv) return;

  const salarie = rdv.salarie as unknown as { google_refresh_token: string | null } | null;
  const refreshToken = salarie?.google_refresh_token;
  if (!refreshToken) return;

  try {
    const client = rdv.client as unknown as { nom: string } | null;
    const prestation = rdv.prestation as unknown as { nom: string } | null;
    const titre = [prestation?.nom ?? "Rendez-vous", client?.nom].filter(Boolean).join(" — ");
    const corps: EvenementGoogle = {
      summary: titre,
      location: rdv.adresse_client ?? undefined,
      description: rdv.notes ?? undefined,
      start: { dateTime: rdv.debut },
      end: { dateTime: rdv.fin },
    };
    const annule = rdv.statut === "annule" || !STATUTS_SYNCHRONISES.has(rdv.statut);

    const nouvelId = await pousserEvenementGoogle(refreshToken, rdv.google_event_id, annule, corps);
    if (nouvelId !== rdv.google_event_id) {
      await admin.from("rendez_vous").update({ google_event_id: nouvelId }).eq("id", rdvId);
    }
  } catch (err) {
    console.error("Synchronisation Google Calendar échouée:", err);
  }
}

/**
 * Synchronise un rendez-vous vers le Google Calendar d'UN collègue ajouté en
 * renfort sur l'intervention (en plus du salarié principal). Passer retire=true
 * pour supprimer son événement (ex. quand il est retiré du rendez-vous).
 */
export async function synchroniserParticipantGoogle(rdvId: string, salarieId: string, retire = false): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;

  const [{ data: rdv }, { data: salarie }, { data: participant }] = await Promise.all([
    admin
      .from("rendez_vous")
      .select("debut, fin, statut, notes, adresse_client, client:clients(nom), prestation:prestations(nom)")
      .eq("id", rdvId)
      .maybeSingle(),
    admin.from("salaries").select("google_refresh_token").eq("id", salarieId).maybeSingle(),
    admin
      .from("rendez_vous_participants")
      .select("google_event_id")
      .eq("rendez_vous_id", rdvId)
      .eq("salarie_id", salarieId)
      .maybeSingle(),
  ]);
  if (!rdv) return;
  const refreshToken = salarie?.google_refresh_token;
  if (!refreshToken) return;
  const idExistant = participant?.google_event_id ?? null;

  try {
    const client = rdv.client as unknown as { nom: string } | null;
    const prestation = rdv.prestation as unknown as { nom: string } | null;
    const titre = `${[prestation?.nom ?? "Rendez-vous", client?.nom].filter(Boolean).join(" — ")} (en renfort)`;
    const corps: EvenementGoogle = {
      summary: titre,
      location: rdv.adresse_client ?? undefined,
      description: rdv.notes ?? undefined,
      start: { dateTime: rdv.debut },
      end: { dateTime: rdv.fin },
    };
    const annule = retire || rdv.statut === "annule" || !STATUTS_SYNCHRONISES.has(rdv.statut);

    const nouvelId = await pousserEvenementGoogle(refreshToken, idExistant, annule, corps);
    if (nouvelId !== idExistant) {
      await admin
        .from("rendez_vous_participants")
        .update({ google_event_id: nouvelId })
        .eq("rendez_vous_id", rdvId)
        .eq("salarie_id", salarieId);
    }
  } catch (err) {
    console.error("Synchronisation Google Calendar (participant) échouée:", err);
  }
}

/** Synchronise le salarié principal ET tous les collègues ajoutés en renfort sur ce rendez-vous. */
export async function synchroniserRdvEtParticipantsGoogle(rdvId: string): Promise<void> {
  const admin = createAdminClient();
  await synchroniserRdvGoogle(rdvId);
  if (!admin) return;

  const { data: participants } = await admin
    .from("rendez_vous_participants")
    .select("salarie_id")
    .eq("rendez_vous_id", rdvId);
  for (const p of participants ?? []) {
    await synchroniserParticipantGoogle(rdvId, p.salarie_id);
  }
}
