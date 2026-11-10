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
export const SEUIL_SALARIES_EQUIPE = 2;

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

/**
 * Inviter d'autres membres dans le tableau de bord est réservé à la formule
 * Équipe (seule ou avec Premium) : un compte Solo+Premium reste un compte à
 * 1 personne, Premium n'ajoutant que les outils de calcul et l'assistant IA.
 */
export function accesInvitationMembres(plan: Plan, nbSalaries: number): boolean {
  if (plan === "equipe") return true;
  if (plan === "premium" && nbSalaries >= SEUIL_SALARIES_EQUIPE) return true;
  return false;
}

export function facturationConfiguree(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID_SOLO);
}

export type Intervalle = "mois" | "annee";

/** Réduction affichée pour un engagement annuel (2 mois offerts, soit environ -17%). */
export const REDUCTION_ANNUELLE_POURCENT = 17;

function idPrixEnv(nomBase: string, intervalle: Intervalle): string | undefined {
  return process.env[intervalle === "annee" ? `${nomBase}_ANNUEL` : nomBase];
}

/**
 * Renvoie l'ID de prix Stripe pour la formule et l'intervalle demandés (null si
 * non configuré). Premium est une option ajoutée à Solo ou Équipe : son prix
 * dépend donc aussi de l'effectif (STRIPE_PRICE_ID_PREMIUM_SOLO ou
 * STRIPE_PRICE_ID_PREMIUM selon le seuil), exactement comme Solo/Équipe. Pour
 * l'annuel, chaque variable a un équivalent suffixé _ANNUEL (ex.
 * STRIPE_PRICE_ID_EQUIPE_ANNUEL).
 */
export function idPrixPour(plan: Plan, nbSalaries: number, intervalle: Intervalle = "mois"): string | null {
  if (plan === "premium") {
    const nomBase = nbSalaries >= SEUIL_SALARIES_EQUIPE ? "STRIPE_PRICE_ID_PREMIUM" : "STRIPE_PRICE_ID_PREMIUM_SOLO";
    return idPrixEnv(nomBase, intervalle) ?? null;
  }
  if (plan === "equipe") {
    const prixEquipe = idPrixEnv("STRIPE_PRICE_ID_EQUIPE", intervalle);
    if (prixEquipe) return prixEquipe;
  }
  return idPrixEnv("STRIPE_PRICE_ID_SOLO", intervalle) ?? null;
}

/** Récupère le prix (en centimes) de la formule et de l'intervalle demandés, ou null si non configuré/indisponible. */
export async function getPrixAbonnementCents(
  plan: Plan,
  nbSalaries: number,
  intervalle: Intervalle = "mois",
): Promise<number | null> {
  const stripe = getStripe();
  const priceId = idPrixPour(plan, nbSalaries, intervalle);
  if (!stripe || !priceId) return null;
  try {
    const prix = await stripe.prices.retrieve(priceId);
    return prix.unit_amount ?? null;
  } catch {
    return null;
  }
}
