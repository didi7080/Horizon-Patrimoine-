"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { enregistrerAbonnementPush, supprimerAbonnementPush, envoyerNotificationTestPush } from "@/app/dashboard/actions";

function urlBase64VersUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Normalise = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const brut = window.atob(base64Normalise);
  const tableau = new Uint8Array(brut.length);
  for (let i = 0; i < brut.length; i++) tableau[i] = brut.charCodeAt(i);
  return tableau;
}

type Etat = "verification" | "non_supporte" | "inactif" | "actif";

export function NotificationsPush() {
  const [etat, setEtat] = useState<Etat>("verification");
  const [pending, setPending] = useState(false);
  const [testEnvoi, setTestEnvoi] = useState(false);

  useEffect(() => {
    let annule = false;
    async function verifier() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        if (!annule) setEtat("non_supporte");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const abonnement = await registration.pushManager.getSubscription();
      if (!annule) setEtat(abonnement ? "actif" : "inactif");
    }
    verifier().catch(() => setEtat("non_supporte"));
    return () => {
      annule = true;
    };
  }, []);

  async function activer() {
    const clePublique = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!clePublique) {
      toast.error("Les notifications push ne sont pas encore configurées sur ce serveur.");
      return;
    }
    setPending(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Autorisation refusée. Vous pouvez l'activer plus tard dans les réglages du navigateur.");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const abonnement = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64VersUint8Array(clePublique) as BufferSource,
      });
      const resultat = await enregistrerAbonnementPush(JSON.parse(JSON.stringify(abonnement)));
      if (!resultat.ok) {
        toast.error(resultat.erreur);
        return;
      }
      setEtat("actif");
      toast.success("Notifications activées sur cet appareil.");
    } catch (err) {
      const detail = err instanceof Error ? `${err.name} : ${err.message}` : String(err);
      toast.error(`Impossible d'activer les notifications : ${detail}`, { duration: 15000 });
    } finally {
      setPending(false);
    }
  }

  async function envoyerTest() {
    setTestEnvoi(true);
    try {
      const resultat = await envoyerNotificationTestPush();
      if (!resultat.ok) toast.error(resultat.erreur);
      else toast.success("Notification de test envoyée.");
    } finally {
      setTestEnvoi(false);
    }
  }

  async function desactiver() {
    setPending(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const abonnement = await registration.pushManager.getSubscription();
      if (abonnement) {
        await supprimerAbonnementPush(abonnement.endpoint);
        await abonnement.unsubscribe();
      }
      setEtat("inactif");
    } catch {
      toast.error("Impossible de désactiver les notifications.");
    } finally {
      setPending(false);
    }
  }

  if (etat === "verification") return null;
  if (etat === "non_supporte") {
    return <p className="text-xs text-muted-foreground">Non disponible sur ce navigateur.</p>;
  }

  return etat === "actif" ? (
    <div className="flex flex-wrap gap-2">
      <Button type="button" size="sm" variant="outline" disabled={testEnvoi} onClick={envoyerTest}>
        {testEnvoi ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
        Envoyer un test
      </Button>
      <Button type="button" size="sm" variant="outline" disabled={pending} onClick={desactiver}>
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : <BellOff className="size-3.5" />}
        Désactiver sur cet appareil
      </Button>
    </div>
  ) : (
    <Button type="button" size="sm" disabled={pending} onClick={activer}>
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Bell className="size-3.5" />}
      Activer sur cet appareil
    </Button>
  );
}
