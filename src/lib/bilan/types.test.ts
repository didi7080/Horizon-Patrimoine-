import { describe, expect, it } from "vitest";
import { calculerBilanMensuel, bornesMois } from "./types";
import type { LigneDocument } from "@/lib/documents/types";

function ligne(prixUnitaireCents: number, quantite = 1, tauxTva = 20): LigneDocument {
  return { id: "x", designation: "Test", unite: "u", quantite, prixUnitaireCents, tauxTva };
}

describe("bornesMois", () => {
  it("calcule les bornes [début, fin[ d'un mois", () => {
    expect(bornesMois("2026-09")).toEqual({ debut: "2026-09-01", fin: "2026-10-01" });
    expect(bornesMois("2026-12")).toEqual({ debut: "2026-12-01", fin: "2027-01-01" });
  });
});

describe("calculerBilanMensuel", () => {
  it("additionne les factures et distingue encaissé / en attente", () => {
    const documents = [
      {
        id: "f1",
        type: "facture",
        numero: "F-2026-0001",
        client_nom: "Dupont",
        date_emission: "2026-09-05",
        statut: "payee",
        lignes: [ligne(10000)],
      },
      {
        id: "f2",
        type: "facture",
        numero: "F-2026-0002",
        client_nom: "Martin",
        date_emission: "2026-09-10",
        statut: "envoyee",
        lignes: [ligne(5000)],
      },
      {
        id: "d1",
        type: "devis",
        numero: "D-2026-0001",
        client_nom: "Durand",
        date_emission: "2026-09-12",
        statut: "envoye",
        lignes: [ligne(20000)],
      },
    ];

    const bilan = calculerBilanMensuel("2026-09", documents);

    expect(bilan.factures).toHaveLength(2);
    expect(bilan.totalFactureHT).toBe(15000);
    expect(bilan.totalFactureTVA).toBe(3000);
    expect(bilan.totalFactureTTC).toBe(18000);
    expect(bilan.totalEncaisseTTC).toBe(12000);
    expect(bilan.totalEnAttenteTTC).toBe(6000);
    expect(bilan.nbDevisEmis).toBe(1);
    expect(bilan.totalDevisTTC).toBe(24000);
  });

  it("renvoie un bilan nul sans documents", () => {
    const bilan = calculerBilanMensuel("2026-09", []);
    expect(bilan.totalFactureTTC).toBe(0);
    expect(bilan.totalEncaisseTTC).toBe(0);
    expect(bilan.factures).toEqual([]);
  });
});
