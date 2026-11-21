"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type EtatFormulaire = { envoye?: boolean; error?: string } | null;

async function origine(): Promise<string> {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (site) return site;
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
}

export async function motDePasseOublieAction(
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "Merci de renseigner votre e-mail." };
  }

  const supabase = await createClient();
  const base = await origine();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${base}/auth/confirm?next=/reinitialiser-mot-de-passe`,
  });

  if (error) {
    return { error: error.message };
  }

  return { envoye: true };
}
