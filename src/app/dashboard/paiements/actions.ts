"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getStripe, facturationConfiguree } from "@/lib/stripe";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { createAdminClient } from "@/lib/supabase/admin";

async function origine(): Promise<string> {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (site) return site;
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
}

/**
 * Crée (si besoin) le compte Stripe connecté de l'entreprise et redirige vers
 * l'onboarding hébergé par Stripe. Compte v2 (API Accounts v2, requise par
 * Stripe pour toute nouvelle plateforme Connect) avec la configuration
 * "merchant" et le risque géré par Stripe (losses_collector: "stripe") :
 * l'artisan garde son propre tableau de bord Stripe et gère lui-même ses
 * remboursements et litiges, sans qu'ArtisanRDV n'ait à accepter de
 * responsabilité sur les pertes. Les acomptes clients lui sont versés
 * directement, sans commission ArtisanRDV (voir payerAcompteAction).
 */
export async function demarrerConnexionStripe() {
  if (!facturationConfiguree()) {
    throw new Error("Le paiement en ligne n'est pas encore configuré par ArtisanRDV.");
  }
  const stripe = getStripe()!;
  const { entreprise } = await getEntrepriseContext();
  const admin = createAdminClient();
  if (!admin) throw new Error("La connexion à la base de données n'est pas configurée.");

  let compteId = entreprise.stripe_connect_account_id;
  if (!compteId) {
    const compte = await stripe.v2.core.accounts.create({
      // display_name (et les autres infos d'identité) ne peuvent pas être
      // pré-remplis par une plateforme Connect basée en France sans passer
      // par un "account token" signé : Stripe les collecte directement
      // auprès de l'artisan pendant l'onboarding hébergé (accountLinks).
      contact_email: entreprise.email ?? undefined,
      dashboard: "full",
      identity: { country: "FR" },
      defaults: {
        responsibilities: { fees_collector: "stripe", losses_collector: "stripe" },
      },
      configuration: {
        merchant: { capabilities: { card_payments: { requested: true } } },
      },
    });
    compteId = compte.id;
    const { error } = await admin
      .from("entreprises")
      .update({ stripe_connect_account_id: compteId })
      .eq("id", entreprise.id);
    if (error) throw new Error(error.message);
  }

  const base = await origine();
  const lien = await stripe.v2.core.accountLinks.create({
    account: compteId,
    use_case: {
      type: "account_onboarding",
      account_onboarding: {
        configurations: ["merchant"],
        refresh_url: `${base}/dashboard/paiements?connect=refresh`,
        return_url: `${base}/dashboard/paiements?connect=retour`,
      },
    },
  });

  redirect(lien.url);
}

export type StatutConnexionStripe = {
  connecte: boolean;
  actif: boolean;
};

export async function etatConnexionStripe(): Promise<StatutConnexionStripe> {
  const { entreprise } = await getEntrepriseContext();
  if (!entreprise.stripe_connect_account_id) return { connecte: false, actif: false };

  const stripe = getStripe();
  if (!stripe) return { connecte: true, actif: false };

  try {
    const compte = await stripe.v2.core.accounts.retrieve(entreprise.stripe_connect_account_id, {
      include: ["configuration.merchant"],
    });
    const actif = compte.configuration?.merchant?.capabilities?.card_payments?.status === "active";
    return { connecte: true, actif };
  } catch {
    return { connecte: true, actif: false };
  }
}
