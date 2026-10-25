import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { marquerAcompte } from "@/lib/stripe-acompte";

export const runtime = "nodejs";

/**
 * Webhook dédié aux événements des comptes Stripe connectés (artisans).
 * Les acomptes clients sont des charges directes sur leur propre compte ;
 * ce point de terminaison confirme leur paiement côté ArtisanRDV.
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Facturation Stripe non configurée." }, { status: 501 });
  }

  const signature = request.headers.get("stripe-signature");
  const corps = await request.text();
  if (!signature) {
    return NextResponse.json({ error: "Signature manquante." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(corps, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Signature invalide." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const rdvToken = session.metadata?.rdv_token;
    if (rdvToken) await marquerAcompte(rdvToken);
  }

  return NextResponse.json({ received: true });
}
