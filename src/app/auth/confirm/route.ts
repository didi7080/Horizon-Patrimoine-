import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Point d'entrée des liens envoyés par e-mail (réinitialisation de mot de passe,
 * etc.). Gère à la fois le format `token_hash`+`type` (verifyOtp) et le format
 * PKCE `code` (exchangeCodeForSession), selon ce que renvoie le modèle d'e-mail
 * configuré côté Supabase.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  const supabase = await createClient();

  let debugMsg = "aucun_token_ni_code";
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, request.url));
    debugMsg = `verifyOtp:${error.message}`;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, request.url));
    debugMsg = `exchangeCode:${error.message}`;
  }

  const urlErreur = new URL("/mot-de-passe-oublie?erreur=lien_invalide", request.url);
  urlErreur.searchParams.set("debug", debugMsg);
  return NextResponse.redirect(urlErreur);
}
