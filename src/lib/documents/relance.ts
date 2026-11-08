import type { createAdminClient } from "@/lib/supabase/admin";
import { calculerTotaux, type LigneDocument } from "@/lib/documents/types";
import { emailConfigure, envoyerEmail } from "@/lib/email/client";

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;

type DocumentPourRelance = {
  type: string;
  numero: string;
  client_nom: string;
  date_echeance: string | null;
  lignes: unknown;
};

export async function emailArtisan(admin: AdminClient, userId: string): Promise<string | null> {
  const { data } = await admin.auth.admin.getUserById(userId);
  return data.user?.email ?? null;
}

/** Objet + corps d'un e-mail de relance pour un devis sans réponse ou une facture impayée. */
export function construireRelance(document: DocumentPourRelance): { objet: string; message: string } {
  const totaux = calculerTotaux((document.lignes as LigneDocument[] | null) ?? []);
  const totalEuros = (totaux.totalTTC / 100).toFixed(2);
  const estDevis = document.type === "devis";
  const objet = estDevis
    ? `Relance : votre devis ${document.numero}`
    : `Relance : facture ${document.numero} en attente de règlement`;
  const message = estDevis
    ? `Bonjour ${document.client_nom},\n\nNous revenons vers vous au sujet du devis ${document.numero} (${totalEuros} € TTC) que nous vous avons transmis. Souhaitez-vous donner suite ? N'hésitez pas à nous contacter pour toute question.\n\nCordialement.`
    : `Bonjour ${document.client_nom},\n\nNous vous rappelons que la facture ${document.numero} (${totalEuros} € TTC)${document.date_echeance ? ` arrivée à échéance le ${document.date_echeance}` : ""} reste à régler à ce jour. Merci de bien vouloir procéder au paiement dans les meilleurs délais.\n\nCordialement.`;
  return { objet, message };
}

export async function envoyerRelanceDocument(
  admin: AdminClient,
  userId: string,
  clientEmail: string | null,
  document: DocumentPourRelance,
): Promise<{ ok: true } | { ok: false; erreur: string }> {
  if (!clientEmail) return { ok: false, erreur: "Ce client n'a pas d'adresse e-mail enregistrée." };
  if (!emailConfigure()) return { ok: false, erreur: "L'envoi automatique par e-mail n'est pas configuré sur cette instance." };

  const { objet, message } = construireRelance(document);
  const replyTo = await emailArtisan(admin, userId);
  const resultat = await envoyerEmail({ to: clientEmail, subject: objet, text: message, replyTo });
  if (!resultat.ok) return { ok: false, erreur: resultat.erreur };
  return { ok: true };
}
