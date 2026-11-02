import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailConfigure, envoyerEmail } from "@/lib/email/client";

export const runtime = "nodejs";
export const maxDuration = 60;

function demainDateParis(): string {
  const dansUnJour = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(dansUnJour);
}

/** Bornes UTC d'une journée civile donnée (AAAA-MM-JJ) à Paris, DST géré comme pour parisVersIso. */
function bornesJourParis(dateStr: string): { debutIso: string; finIso: string } {
  const reference = new Date(`${dateStr}T12:00:00Z`);
  const partie = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Paris", timeZoneName: "shortOffset" })
    .formatToParts(reference)
    .find((p) => p.type === "timeZoneName");
  const correspondance = partie?.value.match(/GMT([+-]\d+)/);
  const decalage = correspondance ? Number(correspondance[1]) : 1;
  const signe = decalage >= 0 ? "+" : "-";
  const offset = `${signe}${String(Math.abs(decalage)).padStart(2, "0")}:00`;
  return { debutIso: `${dateStr}T00:00:00${offset}`, finIso: `${dateStr}T23:59:59${offset}` };
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const autorisation = request.headers.get("authorization");
    if (autorisation !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ envoyes: 0, raison: "Base de données non configurée." });
  if (!emailConfigure()) return NextResponse.json({ envoyes: 0, raison: "Envoi d'e-mails non configuré." });

  const { debutIso, finIso } = bornesJourParis(demainDateParis());

  const { data: rdvs, error } = await admin
    .from("rendez_vous")
    .select(
      "id, debut, adresse_client, client:clients(nom, email), prestation:prestations(nom), salarie:salaries(nom), entreprise:entreprises(nom, telephone)",
    )
    .eq("statut", "confirme")
    .eq("rappel_envoye", false)
    .gte("debut", debutIso)
    .lte("debut", finIso);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let envoyes = 0;
  for (const rdv of rdvs ?? []) {
    const client = rdv.client as unknown as { nom: string; email: string | null } | null;
    const prestation = rdv.prestation as unknown as { nom: string } | null;
    const salarie = rdv.salarie as unknown as { nom: string } | null;
    const entreprise = rdv.entreprise as unknown as { nom: string; telephone: string | null } | null;
    if (!client?.email || !entreprise) continue;

    const heure = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).format(
      new Date(rdv.debut),
    );
    const message = [
      `Bonjour ${client.nom},`,
      "",
      `Petit rappel : vous avez rendez-vous demain à ${heure} avec ${entreprise.nom}${prestation ? ` pour "${prestation.nom}"` : ""}${salarie ? ` (${salarie.nom})` : ""}.`,
      ...(rdv.adresse_client ? [`Lieu : ${rdv.adresse_client}`] : []),
      ...(entreprise.telephone ? [`Pour toute question : ${entreprise.telephone}`] : []),
      "",
      "À demain !",
    ].join("\n");

    const resultat = await envoyerEmail({
      to: client.email,
      subject: `Rappel : rendez-vous demain avec ${entreprise.nom}`,
      text: message,
    });
    if (resultat.ok) {
      await admin.from("rendez_vous").update({ rappel_envoye: true }).eq("id", rdv.id);
      envoyes++;
    }
  }

  return NextResponse.json({ envoyes, total: (rdvs ?? []).length });
}
