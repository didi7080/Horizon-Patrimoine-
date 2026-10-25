import * as Sentry from "@sentry/nextjs";
import { createAnonClient } from "@/lib/supabase/anon";

/** Marque l'acompte d'un rendez-vous comme payé, via la fonction Postgres partagée. */
export async function marquerAcompte(rdvToken: string) {
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
  if (error) {
    console.error("marquer_acompte_paye a échoué:", error.message);
    Sentry.captureMessage("marquer_acompte_paye a échoué", { extra: { rdvToken, erreur: error.message } });
  }
}
