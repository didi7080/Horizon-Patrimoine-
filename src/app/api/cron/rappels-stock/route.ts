import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailConfigure, envoyerEmail } from "@/lib/email/client";
import { envoyerNotificationPush } from "@/lib/push/client";

export const runtime = "nodejs";
export const maxDuration = 60;

function bornesAujourdhuiParis(): { debutIso: string; finIso: string } {
  const dateStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());
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

  const { debutIso, finIso } = bornesAujourdhuiParis();

  const { data: mouvements, error } = await admin
    .from("mouvements_stock")
    .select("salarie_id, quantite, salaries(profile_id, nom), materiel_catalogue(designation, unite)")
    .eq("type", "prise")
    .gte("created_at", debutIso)
    .lte("created_at", finIso);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  type Ligne = { designation: string; unite: string; quantite: number };
  const parSalarie = new Map<string, { profileId: string; nom: string; lignes: Ligne[] }>();

  for (const m of mouvements ?? []) {
    const salarie = m.salaries as unknown as { profile_id: string | null; nom: string } | null;
    const materiel = m.materiel_catalogue as unknown as { designation: string; unite: string } | null;
    if (!salarie?.profile_id || !materiel || !m.salarie_id) continue;

    const entree = parSalarie.get(m.salarie_id) ?? { profileId: salarie.profile_id, nom: salarie.nom, lignes: [] };
    const ligneExistante = entree.lignes.find((l) => l.designation === materiel.designation);
    if (ligneExistante) ligneExistante.quantite += m.quantite;
    else entree.lignes.push({ designation: materiel.designation, unite: materiel.unite, quantite: m.quantite });
    parSalarie.set(m.salarie_id, entree);
  }

  let envoyes = 0;
  for (const { profileId, lignes } of parSalarie.values()) {
    const texteListe = lignes.map((l) => `- ${l.quantite} ${l.unite} de ${l.designation}`).join("\n");

    await envoyerNotificationPush([profileId], {
      title: "Pièces à reprendre au dépôt",
      body: `${lignes.length} référence(s) prise(s) aujourd'hui à récupérer au dépôt.`,
      url: "/dashboard/outils/mon-camion",
    });

    if (emailConfigure()) {
      const { data: user } = await admin.auth.admin.getUserById(profileId);
      if (user?.user?.email) {
        await envoyerEmail({
          to: user.user.email,
          subject: "Pièces prises aujourd'hui à reprendre au dépôt",
          text: `Aujourd'hui vous avez pris dans votre camion :\n\n${texteListe}\n\nPensez à les reprendre au dépôt pour recharger votre camion.`,
        });
      }
    }
    envoyes++;
  }

  return NextResponse.json({ envoyes, salaries_concernes: parSalarie.size });
}
