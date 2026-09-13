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
