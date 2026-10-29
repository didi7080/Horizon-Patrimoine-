import { describe, expect, it } from "vitest";
import { calculerTotaux, type LigneDocument } from "./types";

function ligne(partial: Partial<LigneDocument>): LigneDocument {
  return { id: "x", designation: "Test", unite: "u", quantite: 1, prixUnitaireCents: 0, tauxTva: 20, ...partial };
}

describe("calculerTotaux", () => {
  it("calcule le total HT/TTC pour un seul taux de TVA", () => {
    const totaux = calculerTotaux([ligne({ quantite: 2, prixUnitaireCents: 10000, tauxTva: 20 })]);
    expect(totaux.totalHT).toBe(20000);
    expect(totaux.totalTVA).toBe(4000);
    expect(totaux.totalTTC).toBe(24000);
    expect(totaux.parTaux).toEqual([{ taux: 20, baseHT: 20000, montantTva: 4000 }]);
  });

  it("regroupe les lignes par taux de TVA", () => {
    const totaux = calculerTotaux([
      ligne({ quantite: 1, prixUnitaireCents: 10000, tauxTva: 20 }),
      ligne({ quantite: 1, prixUnitaireCents: 5000, tauxTva: 10 }),
      ligne({ quantite: 1, prixUnitaireCents: 2000, tauxTva: 20 }),
    ]);
    expect(totaux.totalHT).toBe(17000);
    expect(totaux.parTaux).toEqual([
      { taux: 10, baseHT: 5000, montantTva: 500 },
      { taux: 20, baseHT: 12000, montantTva: 2400 },
    ]);
    expect(totaux.totalTVA).toBe(2900);
    expect(totaux.totalTTC).toBe(19900);
  });

  it("renvoie des totaux nuls sans lignes", () => {
    const totaux = calculerTotaux([]);
    expect(totaux).toEqual({ totalHT: 0, totalTVA: 0, totalTTC: 0, parTaux: [] });
  });

  it("gère une TVA non applicable (franchise en base)", () => {
    const totaux = calculerTotaux([ligne({ quantite: 3, prixUnitaireCents: 1500, tauxTva: 0 })]);
    expect(totaux.totalTVA).toBe(0);
    expect(totaux.totalTTC).toBe(totaux.totalHT);
  });
});
