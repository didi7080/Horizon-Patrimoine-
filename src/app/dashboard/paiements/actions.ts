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
 * l'onboarding hébergé par Stripe. Compte "standard" : l'artisan garde son
 * propre tableau de bord Stripe et gère lui-même ses remboursements et
 * litiges. Les acomptes clients lui sont versés directement, sans commission
 * ArtisanRDV (voir payerAcompteAction).
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
    const compte = await stripe.accounts.create({
      type: "standard",
      country: "FR",
      email: entreprise.email ?? undefined,
      business_profile: { name: entreprise.nom, url: `${await origine()}/e/${entreprise.slug}` },
    });
    compteId = compte.id;
    const { error } = await admin
      .from("entreprises")
      .update({ stripe_connect_account_id: compteId })
      .eq("id", entreprise.id);
    if (error) throw new Error(error.message);
  }

  const base = await origine();
  const lien = await stripe.accountLinks.create({
    account: compteId,
    refresh_url: `${base}/dashboard/paiements?connect=refresh`,
    return_url: `${base}/dashboard/paiements?connect=retour`,
    type: "account_onboarding",
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
    const compte = await stripe.accounts.retrieve(entreprise.stripe_connect_account_id);
    return { connecte: true, actif: Boolean(compte.charges_enabled) };
  } catch {
    return { connecte: true, actif: false };
  }
}
