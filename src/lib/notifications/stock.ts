import { createAdminClient } from "@/lib/supabase/admin";
import { emailConfigure, envoyerEmail } from "@/lib/email/client";
import { envoyerNotificationPush } from "@/lib/push/client";

/** Prévient le gérant quand le stock dépôt d'un article vient de passer sous son seuil d'alerte. */
export async function notifierAlerteStock(materielId: string, nouvelleQuantite: number): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;

  const { data: article } = await admin
    .from("materiel_catalogue")
    .select("entreprise_id, designation, unite")
    .eq("id", materielId)
    .maybeSingle();
  if (!article) return;

  const { data: owner } = await admin
    .from("memberships")
    .select("profile_id")
    .eq("entreprise_id", article.entreprise_id)
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();
  if (!owner?.profile_id) return;

  await envoyerNotificationPush([owner.profile_id], {
    title: "Stock bas au dépôt",
    body: `${article.designation} : il ne reste que ${nouvelleQuantite} ${article.unite} au dépôt.`,
    url: "/dashboard/outils/materiel",
  });

  if (emailConfigure()) {
    const { data: user } = await admin.auth.admin.getUserById(owner.profile_id);
    if (user?.user?.email) {
      await envoyerEmail({
        to: user.user.email,
        subject: `Stock bas : ${article.designation}`,
        text: `Le stock dépôt de "${article.designation}" vient de passer sous votre seuil d'alerte : il ne reste que ${nouvelleQuantite} ${article.unite}.\n\nPensez à en recommander.`,
      });
    }
  }
}
