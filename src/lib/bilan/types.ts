import { calculerTotaux, type LigneDocument } from "@/lib/documents/types";

export type LigneBilanFacture = {
  id: string;
  numero: string;
  clientNom: string;
  dateEmission: string;
  statut: string;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
};

export type BilanMensuel = {
  mois: string;
  factures: LigneBilanFacture[];
  totalFactureHT: number;
  totalFactureTVA: number;
  totalFactureTTC: number;
  totalEncaisseTTC: number;
  totalEnAttenteTTC: number;
  nbDevisEmis: number;
  totalDevisTTC: number;
};

/** Première et dernière journée (bornes [debut, fin[) d'un mois au format "YYYY-MM". */
export function bornesMois(mois: string): { debut: string; fin: string } {
  const [annee, moisNum] = mois.split("-").map(Number);
  const debut = new Date(Date.UTC(annee, moisNum - 1, 1));
  const fin = new Date(Date.UTC(annee, moisNum, 1));
  return { debut: debut.toISOString().slice(0, 10), fin: fin.toISOString().slice(0, 10) };
}

export function moisCourant(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function libelleMois(mois: string): string {
  const { debut } = bornesMois(mois);
  return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(debut));
}

type DocumentBrut = {
  id: string;
  type: string;
  numero: string;
  client_nom: string;
  date_emission: string;
  statut: string;
  lignes: unknown;
};

export function calculerBilanMensuel(mois: string, documents: DocumentBrut[]): BilanMensuel {
  const factures = documents.filter((d) => d.type === "facture");
  const devis = documents.filter((d) => d.type === "devis");

  const lignesBilan: LigneBilanFacture[] = factures.map((f) => {
    const totaux = calculerTotaux((f.lignes as LigneDocument[] | null) ?? []);
    return {
      id: f.id,
      numero: f.numero,
      clientNom: f.client_nom,
      dateEmission: f.date_emission,
      statut: f.statut,
      totalHT: totaux.totalHT,
      totalTVA: totaux.totalTVA,
      totalTTC: totaux.totalTTC,
    };
  });

  const totalFactureHT = lignesBilan.reduce((s, l) => s + l.totalHT, 0);
  const totalFactureTVA = lignesBilan.reduce((s, l) => s + l.totalTVA, 0);
  const totalFactureTTC = lignesBilan.reduce((s, l) => s + l.totalTTC, 0);
  const totalEncaisseTTC = lignesBilan.filter((l) => l.statut === "payee").reduce((s, l) => s + l.totalTTC, 0);

  const totalDevisTTC = devis.reduce(
    (s, d) => s + calculerTotaux((d.lignes as LigneDocument[] | null) ?? []).totalTTC,
    0,
  );

  return {
    mois,
    factures: lignesBilan,
    totalFactureHT,
    totalFactureTVA,
    totalFactureTTC,
    totalEncaisseTTC,
    totalEnAttenteTTC: totalFactureTTC - totalEncaisseTTC,
    nbDevisEmis: devis.length,
    totalDevisTTC,
  };
}
