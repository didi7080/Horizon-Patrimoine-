import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createAdminClient } from "@/lib/supabase/admin";

/** Sert la page de réservation d'une entreprise sous son propre domaine (voir Dashboard > Widget). */
async function reecrireDomainePersonnalise(request: NextRequest): Promise<NextResponse | null> {
  const host = request.headers.get("host")?.toLowerCase();
  if (!host) return null;
  if (host === "artisanrdv.com" || host.endsWith(".vercel.app") || host.startsWith("localhost")) return null;
  if (request.nextUrl.pathname.startsWith("/api") || request.nextUrl.pathname.startsWith("/_next")) return null;

  const admin = createAdminClient();
  if (!admin) return null;

  const { data: entreprise } = await admin
    .from("entreprises")
    .select("slug")
    .eq("domaine_personnalise", host)
    .maybeSingle();
  if (!entreprise) return null;

  const url = request.nextUrl.clone();
  url.pathname = `/e/${entreprise.slug}${request.nextUrl.pathname === "/" ? "" : request.nextUrl.pathname}`;
  return NextResponse.rewrite(url);
}

export async function middleware(request: NextRequest) {
  const reecriture = await reecrireDomainePersonnalise(request);
  if (reecriture) return reecriture;
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
