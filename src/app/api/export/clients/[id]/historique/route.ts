import { NextResponse } from "next/server";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateCourte, formatPrix } from "@/lib/utils";
import { construireHistorique, filtrerHistorique, type TypeEntreeHistorique } from "@/lib/clients/historique";

export const runtime = "nodejs";

const LABELS_TYPE: Record<TypeEntreeHistorique, string> = {
  devis: "Devis",
  facture: "Facture",
  rendez_vous: "Rendez-vous",
};

function echapperCsv(valeur: string): string {
  if (/[",\n]/.test(valeur)) return `"${valeur.replace(/"/g, '""')}"`;
  return valeur;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { entreprise } = await getEntrepriseContext();
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "La connexion à la base de données n'est pas configurée." }, { status: 501 });
  }

  const { data: client } = await admin.from("clients").select("nom").eq("id", id).eq("entreprise_id", entreprise.id).maybeSingle();
  if (!client) return NextResponse.json({ error: "Client introuvable." }, { status: 404 });

  const [{ data: documents }, { data: rendezVous }] = await Promise.all([
    admin
      .from("documents")
      .select("id, type, numero, statut, lignes, date_emission, notes")
      .eq("client_id", id)
      .eq("entreprise_id", entreprise.id),
    admin
      .from("rendez_vous")
      .select("id, debut, statut, notes, prestation:prestations(nom)")
      .eq("client_id", id)
      .eq("entreprise_id", entreprise.id),
  ]);

  const historique = construireHistorique(documents ?? [], rendezVous ?? []);
  const url = new URL(request.url);
  const filtrees = filtrerHistorique(historique, {
    q: url.searchParams.get("q") ?? undefined,
    debut: url.searchParams.get("debut") ?? undefined,
    fin: url.searchParams.get("fin") ?? undefined,
    type: (url.searchParams.get("type") as TypeEntreeHistorique | null) ?? "tous",
  });

  const entetes = ["Date", "Type", "Référence", "Statut", "Montant TTC", "Détail"];
  const lignes = filtrees.map((e) =>
    [
      formatDateCourte(e.date),
      LABELS_TYPE[e.type],
      e.reference,
      e.statutLabel,
      e.montantTTC !== null ? formatPrix(e.montantTTC) : "",
      e.detail,
    ]
      .map(echapperCsv)
      .join(","),
  );
  const csv = `﻿${[entetes.join(","), ...lignes].join("\n")}`;

  const nomFichier = client.nom.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "client";
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="historique-${nomFichier}.csv"`,
    },
  });
}
