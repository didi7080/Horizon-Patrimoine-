import * as webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

let configure = false;

export function pushConfigure(): boolean {
  const clePublique = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const clePrivee = process.env.VAPID_PRIVATE_KEY;
  if (!clePublique || !clePrivee) return false;
  if (!configure) {
    webpush.setVapidDetails("mailto:contact@artisanrdv.com", clePublique, clePrivee);
    configure = true;
  }
  return true;
}

type PayloadPush = { title: string; body: string; url?: string };

/** Envoie une notification push à un ensemble de membres (par profile_id). Échecs ignorés individuellement. */
export async function envoyerNotificationPush(profileIds: string[], payload: PayloadPush): Promise<void> {
  if (!pushConfigure() || profileIds.length === 0) return;
  const admin = createAdminClient();
  if (!admin) return;

  const { data: abonnements } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, cle_auth")
    .in("profile_id", profileIds);
  if (!abonnements || abonnements.length === 0) return;

  const corps = JSON.stringify(payload);

  await Promise.all(
    abonnements.map(async (abonnement) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: abonnement.endpoint,
            keys: { p256dh: abonnement.p256dh, auth: abonnement.cle_auth },
          },
          corps,
        );
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await admin.from("push_subscriptions").delete().eq("id", abonnement.id);
        }
      }
    }),
  );
}
