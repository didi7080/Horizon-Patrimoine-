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

export type Plan = "solo" | "equipe" | "premium";

/** À partir de ce nombre de salariés, l'entreprise bascule sur la formule Équipe. */
export const SEUIL_SALARIES_EQUIPE = 4;

const NOMS_PLAN: Record<Plan, string> = { solo: "Solo", equipe: "Équipe", premium: "Premium" };

export function nomPlan(plan: Plan): string {
  return NOMS_PLAN[plan];
}

/** Formule suggérée selon l'effectif (ne renvoie jamais "premium" : c'est toujours un choix explicite). */
export function planPourEffectif(nbSalaries: number): "solo" | "equipe" {
  return nbSalaries >= SEUIL_SALARIES_EQUIPE ? "equipe" : "solo";
}

/** Formule effective d'une entreprise : celle choisie explicitement (abonnement), sinon celle suggérée par l'effectif. */
export function planEffectif(planAbonnement: string | null | undefined, nbSalaries: number): Plan {
  if (planAbonnement === "solo" || planAbonnement === "equipe" || planAbonnement === "premium") {
    return planAbonnement;
  }
  return planPourEffectif(nbSalaries);
}

/** Seule la formule Premium donne accès aux outils de calcul. */
export function accesOutilsCalcul(plan: Plan): boolean {
  return plan === "premium";
}

export function facturationConfiguree(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID_SOLO);
}

/** Renvoie l'ID de prix Stripe pour la formule demandée (null si cette formule n'est pas configurée). */
export function idPrixPour(plan: Plan): string | null {
  if (plan === "premium") return process.env.STRIPE_PRICE_ID_PREMIUM ?? null;
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
