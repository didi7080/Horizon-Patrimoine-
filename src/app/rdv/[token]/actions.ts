"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getStripe, facturationConfiguree } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RdvDetail } from "@/app/rdv/[token]/page";

async function origine(): Promise<string> {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (site) return site;
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
}

export async function payerAcompteAction(token: string) {
  if (!facturationConfiguree()) {
    throw new Error("Le paiement en ligne n'est pas encore configuré.");
  }
  const stripe = getStripe()!;
  const supabase = await createClient();
  const { data } = await supabase.rpc("rdv_par_token", { p_token: token });
  const rdv = data as RdvDetail | null;

  if (!rdv || !rdv.acompte_cents || rdv.acompte_cents <= 0 || rdv.acompte_paye) {
    throw new Error("Aucun acompte à régler pour ce rendez-vous.");
  }

  const admin = createAdminClient();
  const { data: entreprise } = admin
    ? await admin
        .from("entreprises")
        .select("stripe_connect_account_id")
        .eq("id", rdv.entreprise_id)
        .maybeSingle()
    : { data: null };
  const compteConnecte = entreprise?.stripe_connect_account_id;
  if (!compteConnecte) {
    throw new Error("Cet artisan n'a pas encore activé le paiement en ligne des acomptes.");
  }

  const base = await origine();

  // Charge directe sur le compte Stripe connecté de l'artisan : l'argent lui
  // revient intégralement (pas de commission ArtisanRDV), et c'est lui qui
  // gère ses propres remboursements/litiges depuis son tableau de bord Stripe.
  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: rdv.acompte_cents,
            product_data: {
              name: `Acompte — ${rdv.prestation_nom ?? "rendez-vous"} chez ${rdv.entreprise_nom}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: { rdv_token: token },
      success_url: `${base}/rdv/${token}?acompte=succes`,
      cancel_url: `${base}/rdv/${token}?acompte=annule`,
    },
    { stripeAccount: compteConnecte },
  );

  if (!session.url) throw new Error("Impossible de créer la session de paiement.");
  redirect(session.url);
}
