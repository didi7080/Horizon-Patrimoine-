"use server";

import { getEntrepriseContext } from "@/lib/dashboard/context";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailConfigure, envoyerEmail } from "@/lib/email/client";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function envoyerCodeWidgetParEmail(destinataire: string, titre: string, code: string): Promise<void> {
  const { entreprise, userId } = await getEntrepriseContext();

  const email = destinataire.trim();
  if (!EMAIL_REGEX.test(email)) throw new Error("Adresse e-mail invalide.");
  if (!emailConfigure()) throw new Error("L'envoi d'e-mails n'est pas configuré sur cette instance.");

  let replyTo: string | null = null;
  const admin = createAdminClient();
  if (admin) {
    const { data } = await admin.auth.admin.getUserById(userId);
    replyTo = data.user?.email ?? null;
  }

  const message = [
    `Bonjour,`,
    "",
    `${entreprise.nom} utilise ArtisanRDV pour la prise de rendez-vous en ligne, et souhaite ajouter "${titre}" sur son site internet.`,
    "",
    "Voici le code à ajouter sur le site (copier-coller) :",
    "",
    code,
    "",
    "Si vous n'êtes pas la bonne personne pour cela, merci de transférer cet e-mail à qui gère le site.",
    "Merci !",
  ].join("\n");

  const resultat = await envoyerEmail({
    to: email,
    subject: `Code à ajouter sur le site de ${entreprise.nom} (ArtisanRDV)`,
    text: message,
    replyTo,
  });
  if (!resultat.ok) throw new Error(resultat.erreur);
}
