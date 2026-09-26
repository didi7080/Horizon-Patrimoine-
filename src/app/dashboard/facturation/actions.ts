"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getStripe, facturationConfiguree, idPrixPour, planPourEffectif } from "@/lib/stripe";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { createClient } from "@/lib/supabase/server";

async function origine(): Promise<string> {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (site) return site;
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
}

export async function demarrerAbonnement() {
  if (!facturationConfiguree()) {
    throw new Error("La facturation en ligne n'est pas encore configurée par ArtisanRDV.");
  }
  const stripe = getStripe()!;
  const { entreprise } = await getEntrepriseContext();
  const plan = planPourEffectif(entreprise.nb_salaries);
  const priceId = idPrixPour(plan);
  if (!priceId) {
    throw new Error("La facturation en ligne n'est pas encore configurée par ArtisanRDV.");
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: abonnement } = await supabase
    .from("abonnements")
    .select("stripe_customer_id")
    .eq("entreprise_id", entreprise.id)
    .maybeSingle();

  const base = await origine();

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
  redirect(session.url);
}

export async function ouvrirPortailFacturation() {
  if (!facturationConfiguree()) {
    throw new Error("La facturation en ligne n'est pas encore configurée par ArtisanRDV.");
  }
  const stripe = getStripe()!;
  const { entreprise } = await getEntrepriseContext();
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

  redirect(session.url);
}
