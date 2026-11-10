"use server";

import { headers } from "next/headers";
import { getStripe, facturationConfiguree, idPrixPour, planPourEffectif, type Plan, type Intervalle } from "@/lib/stripe";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { createClient } from "@/lib/supabase/server";

async function origine(): Promise<string> {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (site) return site;
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
}

type ResultatUrl = { ok: true; url: string } | { ok: false; erreur: string };

export async function demarrerAbonnement(planChoisi?: Plan, intervalle: Intervalle = "mois"): Promise<ResultatUrl> {
  const { entreprise } = await getEntrepriseContext();
  try {
    if (!facturationConfiguree()) {
      throw new Error("La facturation en ligne n'est pas encore configurée par ArtisanRDV.");
    }
    const stripe = getStripe()!;
    const plan = planChoisi ?? planPourEffectif(entreprise.nb_salaries);
    const priceId = idPrixPour(plan, entreprise.nb_salaries, intervalle);
    if (!priceId) {
      throw new Error(
        plan === "premium"
          ? "La formule Premium (outils de calcul) n'est pas encore configurée par ArtisanRDV."
          : "La facturation en ligne n'est pas encore configurée par ArtisanRDV.",
      );
    }
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: abonnement } = await supabase
      .from("abonnements")
      .select("stripe_customer_id, stripe_subscription_id")
      .eq("entreprise_id", entreprise.id)
      .maybeSingle();

    const base = await origine();

    // Un changement de formule met à jour l'abonnement Stripe existant au lieu
    // d'en créer un second en parallèle, qui facturerait les deux à la fois.
    if (abonnement?.stripe_subscription_id) {
      const abonnementStripe = await stripe.subscriptions
        .retrieve(abonnement.stripe_subscription_id)
        .catch(() => null);
      if (abonnementStripe && abonnementStripe.status !== "canceled") {
        await stripe.subscriptions.update(abonnement.stripe_subscription_id, {
          items: [{ id: abonnementStripe.items.data[0].id, price: priceId }],
          metadata: { entreprise_id: entreprise.id, plan },
        });
        return { ok: true, url: `${base}/dashboard/reglages?abonnement=succes` };
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer: abonnement?.stripe_customer_id ?? undefined,
      customer_email: abonnement?.stripe_customer_id ? undefined : (user?.email ?? undefined),
      client_reference_id: entreprise.id,
      subscription_data: { metadata: { entreprise_id: entreprise.id, plan } },
      metadata: { entreprise_id: entreprise.id, plan },
      success_url: `${base}/dashboard/reglages?abonnement=succes`,
      cancel_url: `${base}/dashboard/reglages?abonnement=annule`,
    });

    if (!session.url) throw new Error("Impossible de créer la session de paiement.");
    return { ok: true, url: session.url };
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : "Une erreur est survenue." };
  }
}

export async function ouvrirPortailFacturation(): Promise<ResultatUrl> {
  const { entreprise } = await getEntrepriseContext();
  try {
    if (!facturationConfiguree()) {
      throw new Error("La facturation en ligne n'est pas encore configurée par ArtisanRDV.");
    }
    const stripe = getStripe()!;
    const supabase = await createClient();
    const { data: abonnement } = await supabase
      .from("abonnements")
      .select("stripe_customer_id")
      .eq("entreprise_id", entreprise.id)
      .maybeSingle();

    if (!abonnement?.stripe_customer_id) {
      throw new Error("Aucun abonnement à gérer pour le moment.");
    }

    const base = await origine();
    const session = await stripe.billingPortal.sessions.create({
      customer: abonnement.stripe_customer_id,
      return_url: `${base}/dashboard/reglages`,
    });

    return { ok: true, url: session.url };
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : "Une erreur est survenue." };
  }
}
