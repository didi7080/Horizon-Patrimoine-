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

export function facturationConfiguree(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);
}

/** Récupère le prix (en centimes) de l'abonnement configuré, ou null si non configuré/indisponible. */
export async function getPrixAbonnementCents(): Promise<number | null> {
  const stripe = getStripe();
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!stripe || !priceId) return null;
  try {
    const prix = await stripe.prices.retrieve(priceId);
    return prix.unit_amount ?? null;
  } catch {
    return null;
  }
}
