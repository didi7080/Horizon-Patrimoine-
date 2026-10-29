import { NextResponse } from "next/server";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateCourte } from "@/lib/utils";

export const runtime = "nodejs";

function echapperCsv(valeur: string): string {
  if (/[",\n]/.test(valeur)) return `"${valeur.replace(/"/g, '""')}"`;
  return valeur;
}

export async function GET() {
  const { entreprise } = await getEntrepriseContext();
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "La connexion à la base de données n'est pas configurée." }, { status: 501 });
  }

  const { data: clients, error } = await admin
    .from("clients")
    .select("nom, email, telephone, adresse, created_at")
    .eq("entreprise_id", entreprise.id)
    .order("nom");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const entetes = ["Nom", "E-mail", "Téléphone", "Adresse", "Client depuis"];
  const lignes = (clients ?? []).map((c) =>
    [c.nom, c.email ?? "", c.telephone ?? "", c.adresse ?? "", formatDateCourte(c.created_at)].map(echapperCsv).join(","),
  );
  const csv = `﻿${[entetes.join(","), ...lignes].join("\n")}`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clients-${entreprise.slug}.csv"`,
    },
  });
}
