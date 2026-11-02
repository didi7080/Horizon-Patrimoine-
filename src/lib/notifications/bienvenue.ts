import { createAdminClient } from "@/lib/supabase/admin";
import { emailConfigure, envoyerEmail } from "@/lib/email/client";
import { baseUrl, codeBoutonWidget, lienReservation } from "@/lib/widget";

/**
 * Envoie l'e-mail de bienvenue (lien de réservation + code d'intégration site) au propriétaire
 * de l'entreprise dès son premier abonnement payant. Idempotent via email_bienvenue_envoye.
 */
export async function envoyerBienvenue(entrepriseId: string): Promise<void> {
  if (!emailConfigure()) return;
  const admin = createAdminClient();
  if (!admin) return;

  const { data: entreprise } = await admin
    .from("entreprises")
    .select("nom, slug, couleur, email_bienvenue_envoye")
    .eq("id", entrepriseId)
    .maybeSingle();
  if (!entreprise || entreprise.email_bienvenue_envoye) return;

  const { data: owner } = await admin
    .from("memberships")
    .select("profile_id")
    .eq("entreprise_id", entrepriseId)
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();
  if (!owner?.profile_id) return;

  const { data: userData } = await admin.auth.admin.getUserById(owner.profile_id);
  const email = userData.user?.email;
  if (!email) return;

  const origine = baseUrl();
  const lien = lienReservation(origine, entreprise.slug);
  const code = codeBoutonWidget(origine, entreprise.slug, entreprise.couleur);

  const message = [
    `Bonjour,`,
    "",
    `Votre abonnement ArtisanRDV pour ${entreprise.nom} est maintenant actif. Bienvenue !`,
    "",
    `Votre page de réservation en ligne est prête : ${lien}`,
    "Partagez ce lien dans votre fiche Google, votre page Facebook/Instagram, ou par SMS à vos clients.",
    "",
    "Pour l'ajouter directement sur votre site internet, voici un bouton \"Prendre rendez-vous\" prêt à coller (demandez à la personne qui gère votre site de l'ajouter avant la balise </body> si vous ne savez pas le faire vous-même) :",
    "",
    code,
    "",
    `D'autres façons de l'intégrer (QR code à imprimer, bloc intégré, iframe, envoi direct par e-mail à votre webmaster) sont disponibles depuis votre tableau de bord : ${origine}/dashboard/widget`,
    "",
    "Bonne prise de rendez-vous !",
    "L'équipe ArtisanRDV",
  ].join("\n");

  const resultat = await envoyerEmail({
    to: email,
    subject: `Bienvenue sur ArtisanRDV — votre page de réservation est prête`,
    text: message,
  });
  if (resultat.ok) {
    await admin.from("entreprises").update({ email_bienvenue_envoye: true }).eq("id", entrepriseId);
  }
}
