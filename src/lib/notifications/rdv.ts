import { createAdminClient } from "@/lib/supabase/admin";
import { emailConfigure, envoyerEmail } from "@/lib/email/client";
import { baseUrl } from "@/lib/widget";

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;

async function emailParProfileId(admin: AdminClient, profileId: string): Promise<string | null> {
  const { data } = await admin.auth.admin.getUserById(profileId);
  return data.user?.email ?? null;
}

function labelDateHeure(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  }).format(new Date(iso));
}

/** Prévient l'artisan (propriétaire + salarié concerné s'il a son propre accès) d'un nouveau rendez-vous public. */
export async function notifierNouveauRdv(rdvId: string): Promise<void> {
  if (!emailConfigure()) return;
  const admin = createAdminClient();
  if (!admin) return;

  const { data: rdv } = await admin
    .from("rendez_vous")
    .select(
      "debut, statut, adresse_client, entreprise:entreprises(id, nom), salarie:salaries(nom, profile_id), prestation:prestations(nom), client:clients(nom, telephone)",
    )
    .eq("id", rdvId)
    .maybeSingle();
  if (!rdv) return;

  const entreprise = rdv.entreprise as unknown as { id: string; nom: string } | null;
  const salarie = rdv.salarie as unknown as { nom: string; profile_id: string | null } | null;
  const prestation = rdv.prestation as unknown as { nom: string } | null;
  const client = rdv.client as unknown as { nom: string; telephone: string | null } | null;
  if (!entreprise) return;

  const { data: owner } = await admin
    .from("memberships")
    .select("profile_id")
    .eq("entreprise_id", entreprise.id)
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();

  const destinataires = new Set<string>();
  if (owner?.profile_id) {
    const email = await emailParProfileId(admin, owner.profile_id);
    if (email) destinataires.add(email);
  }
  if (salarie?.profile_id) {
    const email = await emailParProfileId(admin, salarie.profile_id);
    if (email) destinataires.add(email);
  }
  if (destinataires.size === 0) return;

  const demandeValidation = rdv.statut === "demande";
  const sujet = `${demandeValidation ? "Nouvelle demande de rendez-vous" : "Nouveau rendez-vous confirmé"} — ${entreprise.nom}`;
  const message = [
    client?.nom ? `Client : ${client.nom}${client.telephone ? ` (${client.telephone})` : ""}` : "Client : non renseigné",
    `Prestation : ${prestation?.nom ?? "non renseignée"}`,
    `Avec : ${salarie?.nom ?? "non assigné"}`,
    `Quand : ${labelDateHeure(rdv.debut)}`,
    ...(rdv.adresse_client ? [`Adresse : ${rdv.adresse_client}`] : []),
    "",
    demandeValidation
      ? "Cette demande nécessite votre validation depuis le tableau de bord ArtisanRDV."
      : "Ce rendez-vous est automatiquement confirmé.",
  ].join("\n");

  for (const email of destinataires) {
    await envoyerEmail({ to: email, subject: sujet, text: message });
  }
}

/** Confirme au client, par e-mail, que sa demande de rendez-vous a bien été prise en compte. */
export async function notifierConfirmationClient(rdvId: string): Promise<void> {
  if (!emailConfigure()) return;
  const admin = createAdminClient();
  if (!admin) return;

  const { data: rdv } = await admin
    .from("rendez_vous")
    .select(
      "token, debut, statut, adresse_client, entreprise:entreprises(nom, telephone), salarie:salaries(nom), prestation:prestations(nom), client:clients(nom, email)",
    )
    .eq("id", rdvId)
    .maybeSingle();
  if (!rdv) return;

  const entreprise = rdv.entreprise as unknown as { nom: string; telephone: string | null } | null;
  const salarie = rdv.salarie as unknown as { nom: string } | null;
  const prestation = rdv.prestation as unknown as { nom: string } | null;
  const client = rdv.client as unknown as { nom: string; email: string | null } | null;
  if (!entreprise || !client?.email) return;

  const demandeValidation = rdv.statut === "demande";
  const lien = `${baseUrl()}/rdv/${rdv.token}`;
  const sujet = `${demandeValidation ? "Votre demande de rendez-vous est bien reçue" : "Votre rendez-vous est confirmé"} — ${entreprise.nom}`;
  const message = [
    `Bonjour ${client.nom},`,
    "",
    demandeValidation
      ? `Votre demande de rendez-vous avec ${entreprise.nom}${prestation ? ` pour "${prestation.nom}"` : ""} a bien été reçue et est en attente de confirmation.`
      : `Votre rendez-vous avec ${entreprise.nom}${prestation ? ` pour "${prestation.nom}"` : ""} est confirmé.`,
    `Quand : ${labelDateHeure(rdv.debut)}`,
    ...(salarie ? [`Avec : ${salarie.nom}`] : []),
    ...(rdv.adresse_client ? [`Adresse : ${rdv.adresse_client}`] : []),
    ...(entreprise.telephone ? [`Pour toute question : ${entreprise.telephone}`] : []),
    "",
    `Vous pouvez consulter ou annuler ce rendez-vous à tout moment ici : ${lien}`,
  ].join("\n");

  await envoyerEmail({ to: client.email, subject: sujet, text: message });
}
