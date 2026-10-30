import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { createAdminClient } from "@/lib/supabase/admin";
import { echangerCodeContreJetons, emailDuCompteGoogle } from "@/lib/google-calendar/client";

export const runtime = "nodejs";

async function origine(): Promise<string> {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (site) return site;
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
}

export async function GET(request: Request) {
  const base = await origine();
  const redirection = (statut: string) => {
    const response = NextResponse.redirect(`${base}/dashboard/equipe?google=${statut}`);
    response.cookies.delete("google_oauth_state");
    return response;
  };

  const { entreprise } = await getEntrepriseContext();
  const { searchParams } = new URL(request.url);
  if (searchParams.get("error")) return redirection("refuse");

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const [etat, salarieId] = (state ?? "").split(":");
  const etatAttendu = request.headers
    .get("cookie")
    ?.split("; ")
    .find((c) => c.startsWith("google_oauth_state="))
    ?.split("=")[1];

  if (!code || !etat || !salarieId || etat !== etatAttendu) return redirection("erreur");

  const admin = createAdminClient();
  if (!admin) return redirection("erreur");
  const { data: salarie } = await admin
    .from("salaries")
    .select("id")
    .eq("id", salarieId)
    .eq("entreprise_id", entreprise.id)
    .maybeSingle();
  if (!salarie) return redirection("erreur");

  const jetons = await echangerCodeContreJetons(code, `${base}/api/google-calendar/callback`);
  if (!jetons) return redirection("erreur");

  const email = await emailDuCompteGoogle(jetons.accessToken);

  const { error } = await admin
    .from("salaries")
    .update({ google_refresh_token: jetons.refreshToken, google_email: email })
    .eq("id", salarieId);
  if (error) return redirection("erreur");

  return redirection("connecte");
}
