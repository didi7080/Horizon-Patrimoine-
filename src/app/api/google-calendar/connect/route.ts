import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { createAdminClient } from "@/lib/supabase/admin";
import { googleCalendarConfigure, urlAutorisationGoogle } from "@/lib/google-calendar/client";

export const runtime = "nodejs";

async function origine(): Promise<string> {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (site) return site;
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
}

export async function GET(request: Request) {
  if (!googleCalendarConfigure()) {
    return NextResponse.json({ error: "Google Calendar n'est pas configuré sur cette instance ArtisanRDV." }, { status: 501 });
  }

  const { entreprise } = await getEntrepriseContext();
  const { searchParams } = new URL(request.url);
  const salarieId = searchParams.get("salarieId");
  if (!salarieId) return NextResponse.json({ error: "salarieId manquant." }, { status: 400 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Base de données non configurée." }, { status: 501 });
  const { data: salarie } = await admin
    .from("salaries")
    .select("id")
    .eq("id", salarieId)
    .eq("entreprise_id", entreprise.id)
    .maybeSingle();
  if (!salarie) return NextResponse.json({ error: "Salarié introuvable." }, { status: 404 });

  const base = await origine();
  const etat = crypto.randomUUID();
  const url = urlAutorisationGoogle(`${base}/api/google-calendar/callback`, `${etat}:${salarieId}`);

  const response = NextResponse.redirect(url);
  response.cookies.set("google_oauth_state", etat, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" });
  return response;
}
