import { describe, expect, it } from "vitest";
import { formatDuree, formatPrix, initiales, nomJour, slugify } from "./utils";

describe("formatPrix", () => {
  it("affiche « Sur devis » pour un prix nul", () => {
    expect(formatPrix(null)).toBe("Sur devis");
  });

  it("affiche « Gratuit » pour un prix à zéro", () => {
    expect(formatPrix(0)).toBe("Gratuit");
  });

  it("formate un montant rond sans décimales", () => {
    expect(formatPrix(9000)).toBe("90 €");
  });

  it("formate un montant avec décimales", () => {
    expect(formatPrix(9050)).toBe("90,50 €");
  });
});

describe("formatDuree", () => {
  it("affiche uniquement les minutes sous l'heure", () => {
    expect(formatDuree(45)).toBe("45 min");
  });

  it("affiche uniquement les heures rondes", () => {
    expect(formatDuree(120)).toBe("2 h");
  });

  it("combine heures et minutes", () => {
    expect(formatDuree(90)).toBe("1 h 30");
  });
});

describe("slugify", () => {
  it("retire les accents et met en minuscules", () => {
    expect(slugify("Électricité Générale")).toBe("electricite-generale");
  });

  it("remplace les caractères spéciaux par des tirets", () => {
    expect(slugify("Plomberie & Chauffage !")).toBe("plomberie-chauffage");
  });

  it("retire les tirets en début et fin de chaîne", () => {
    expect(slugify("--Test--")).toBe("test");
  });
});

describe("initiales", () => {
  it("prend la première lettre de deux mots", () => {
    expect(initiales("Bâti Pro")).toBe("BP");
  });

  it("se limite à deux initiales", () => {
    expect(initiales("Jean Paul Dupont")).toBe("JP");
  });
});

describe("nomJour", () => {
  it("retourne le nom du jour ISO (1 = lundi)", () => {
    expect(nomJour(1)).toBe("Lundi");
    expect(nomJour(7)).toBe("Dimanche");
  });
});
