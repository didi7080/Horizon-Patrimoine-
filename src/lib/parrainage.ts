import { getStripe, planEffectif, getPrixAbonnementCents } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

const JOURS_ESSAI_OFFERT = 30;

async function crediterCompteStripe(
  stripe: NonNullable<ReturnType<typeof getStripe>>,
  stripeCustomerId: string,
  montantCents: number,
  description: string,
) {
  await stripe.customers.createBalanceTransaction(stripeCustomerId, {
    amount: -montantCents,
    currency: "eur",
    description,
  });
}

/**
 * Récompense le parrainage entre artisans à la première facturation réelle du
 * filleul (jamais à l'inscription, pour éviter les faux parrainages) : un mois
 * offert au filleul et à son parrain. Si le parrain n'a pas encore de compte
 * Stripe (encore en essai gratuit), on prolonge son essai de 30 jours à la
 * place, le résultat étant équivalent pour lui.
 */
export async function appliquerRecompenseParrainage(entrepriseId: string, montantPayeCents: number | null): Promise<void> {
  const admin = createAdminClient();
  const stripe = getStripe();
  if (!admin || !stripe) return;

  const { data: filleul } = await admin
    .from("entreprises")
    .select("id, parraine_par_id, parrainage_recompense_le")
    .eq("id", entrepriseId)
    .maybeSingle();
  if (!filleul?.parraine_par_id || filleul.parrainage_recompense_le) return;

  const { data: abonnementFilleul } = await admin
    .from("abonnements")
    .select("stripe_customer_id")
    .eq("entreprise_id", filleul.id)
    .maybeSingle();
  if (abonnementFilleul?.stripe_customer_id && montantPayeCents) {
    await crediterCompteStripe(stripe, abonnementFilleul.stripe_customer_id, montantPayeCents, "Mois offert — parrainage ArtisanRDV");
  }

  const { data: parrain } = await admin
    .from("entreprises")
    .select("id, nb_salaries")
    .eq("id", filleul.parraine_par_id)
    .maybeSingle();
  if (parrain) {
    const { data: abonnementParrain } = await admin
      .from("abonnements")
      .select("plan, stripe_customer_id, essai_fin")
      .eq("entreprise_id", parrain.id)
      .maybeSingle();

    if (abonnementParrain?.stripe_customer_id) {
      const plan = planEffectif(abonnementParrain.plan, parrain.nb_salaries);
      const prixCents = await getPrixAbonnementCents(plan, parrain.nb_salaries);
      if (prixCents) {
        await crediterCompteStripe(stripe, abonnementParrain.stripe_customer_id, prixCents, "Mois offert — vous avez parrainé un artisan");
      }
    } else if (abonnementParrain) {
      const nouvelleDate = new Date(abonnementParrain.essai_fin);
      nouvelleDate.setDate(nouvelleDate.getDate() + JOURS_ESSAI_OFFERT);
      await admin.from("abonnements").update({ essai_fin: nouvelleDate.toISOString() }).eq("entreprise_id", parrain.id);
    }
  }

  await admin.from("entreprises").update({ parrainage_recompense_le: new Date().toISOString() }).eq("id", filleul.id);
}
