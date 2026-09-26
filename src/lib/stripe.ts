import Stripe from "stripe";

let instance: Stripe | null = null;

/** Renvoie le client Stripe si la facturation est configurée, sinon null. */
export function getStripe(): Stripe | null {
  const cle = process.env.STRIPE_SECRET_KEY;
  if (!cle) return null;
  if (!instance) {
    instance = new Stripe(cle, { apiVersion: "2026-08-26.dahlia" });
  }
  return instance;
}

export type Plan = "solo" | "equipe";

/** À partir de ce nombre de salariés, l'entreprise bascule sur la formule Équipe. */
export const SEUIL_SALARIES_EQUIPE = 4;

export function planPourEffectif(nbSalaries: number): Plan {
  return nbSalaries >= SEUIL_SALARIES_EQUIPE ? "equipe" : "solo";
}

export function facturationConfiguree(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID_SOLO);
}

/** Renvoie l'ID de prix Stripe pour la formule demandée, avec repli sur Solo si Équipe n'est pas configuré. */
export function idPrixPour(plan: Plan): string | null {
  if (plan === "equipe" && process.env.STRIPE_PRICE_ID_EQUIPE) {
    return process.env.STRIPE_PRICE_ID_EQUIPE;
  }
  return process.env.STRIPE_PRICE_ID_SOLO ?? null;
}

/** Récupère le prix (en centimes) de la formule demandée, ou null si non configuré/indisponible. */
export async function getPrixAbonnementCents(plan: Plan): Promise<number | null> {
  const stripe = getStripe();
  const priceId = idPrixPour(plan);
  if (!stripe || !priceId) return null;
  try {
    const prix = await stripe.prices.retrieve(priceId);
    return prix.unit_amount ?? null;
  } catch {
    return null;
  }
}
