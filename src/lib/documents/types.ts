export type TypeDocument = "devis" | "facture";

export type StatutDevis = "brouillon" | "envoye" | "accepte" | "refuse";
export type StatutFacture = "brouillon" | "envoyee" | "payee";

export const TAUX_TVA = [0, 5.5, 10, 20] as const;

export type LigneDocument = {
  id: string;
  designation: string;
  unite: string;
  quantite: number;
  prixUnitaireCents: number;
  tauxTva: number;
};

export type Totaux = {
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  parTaux: { taux: number; baseHT: number; montantTva: number }[];
};

export function calculerTotaux(lignes: LigneDocument[]): Totaux {
  const parTauxMap = new Map<number, number>();
  let totalHT = 0;
  for (const ligne of lignes) {
    const montantHT = Math.round(ligne.quantite * ligne.prixUnitaireCents);
    totalHT += montantHT;
    parTauxMap.set(ligne.tauxTva, (parTauxMap.get(ligne.tauxTva) ?? 0) + montantHT);
  }
  const parTaux = [...parTauxMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([taux, baseHT]) => ({ taux, baseHT, montantTva: Math.round(baseHT * (taux / 100)) }));
  const totalTVA = parTaux.reduce((s, l) => s + l.montantTva, 0);
  return { totalHT, totalTVA, totalTTC: totalHT + totalTVA, parTaux };
}
