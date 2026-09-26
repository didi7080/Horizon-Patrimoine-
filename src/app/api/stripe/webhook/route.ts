import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAnonClient } from "@/lib/supabase/anon";

export const runtime = "nodejs";

function statutDepuis(status: Stripe.Subscription.Status): "actif" | "impaye" | "annule" {
  if (status === "active" || status === "trialing") return "actif";
  if (status === "past_due" || status === "unpaid") return "impaye";
  return "annule";
}

async function marquerAcompte(rdvToken: string) {
  const secret = process.env.SUPABASE_SYNC_SECRET;
  if (!secret) {
    console.error("SUPABASE_SYNC_SECRET absent : acompte non synchronisé.");
    return;
  }
  const supabase = createAnonClient();
  const { error } = await supabase.rpc("marquer_acompte_paye", {
    p_secret: secret,
    p_token: rdvToken,
  });
  if (error) console.error("marquer_acompte_paye a échoué:", error.message);
}

async function synchroniser(
  entrepriseId: string,
  statut: string,
  customerId?: string | null,
  subscriptionId?: string | null,
  periodeFinUnix?: number | null,
) {
  const secret = process.env.SUPABASE_SYNC_SECRET;
  if (!secret) {
    console.error("SUPABASE_SYNC_SECRET absent : abonnement non synchronisé.");
    return;
  }
  const supabase = createAnonClient();
  const { error } = await supabase.rpc("sync_abonnement", {
    p_secret: secret,
    p_entreprise: entrepriseId,
    p_statut: statut,
    p_customer: customerId ?? undefined,
    p_subscription: subscriptionId ?? undefined,
    p_periode_fin: periodeFinUnix ? new Date(periodeFinUnix * 1000).toISOString() : undefined,
  });
  if (error) console.error("sync_abonnement a échoué:", error.message);
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
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

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "payment") {
        const rdvToken = session.metadata?.rdv_token;
        if (rdvToken) await marquerAcompte(rdvToken);
        break;
      }
      const entrepriseId = session.metadata?.entreprise_id ?? session.client_reference_id;
      if (entrepriseId) {
        await synchroniser(
          entrepriseId,
          "actif",
          typeof session.customer === "string" ? session.customer : session.customer?.id,
          typeof session.subscription === "string" ? session.subscription : session.subscription?.id,
        );
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const entrepriseId = subscription.metadata?.entreprise_id;
      if (entrepriseId) {
        const periodeFin = subscription.items.data[0]?.current_period_end ?? null;
        await synchroniser(
          entrepriseId,
          statutDepuis(subscription.status),
          typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
          subscription.id,
          periodeFin,
        );
      }
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const entrepriseId = subscription.metadata?.entreprise_id;
      if (entrepriseId) {
        await synchroniser(
          entrepriseId,
          "annule",
          typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
          subscription.id,
        );
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
