import { describe, expect, it } from "vitest";
import { parisVersIso, validerChampsEtFormules } from "./outils";

describe("parisVersIso", () => {
  it("applique le décalage hiver (UTC+1)", () => {
    const iso = parisVersIso("2026-01-15", "14:00");
    expect(iso).toBe("2026-01-15T14:00:00+01:00");
    expect(new Date(iso).toISOString()).toBe("2026-01-15T13:00:00.000Z");
  });

  it("applique le décalage été (UTC+2)", () => {
    const iso = parisVersIso("2026-07-15", "14:00");
    expect(iso).toBe("2026-07-15T14:00:00+02:00");
    expect(new Date(iso).toISOString()).toBe("2026-07-15T12:00:00.000Z");
  });
});

describe("validerChampsEtFormules", () => {
  const champNombre = (id: string) => ({ id, label: id, type: "nombre" });

  it("accepte des formules chaînées dans le bon ordre", () => {
    const resultat = validerChampsEtFormules(
      [champNombre("longueur"), champNombre("prix_metre")],
      [
        { id: "cout_total", label: "Coût total", expression: "longueur * prix_metre" },
        { id: "cout_marge", label: "Coût avec marge", expression: "cout_total * 1.2" },
      ],
    );
    expect("erreur" in resultat).toBe(false);
  });

  it("rejette une formule qui référence une formule placée après elle", () => {
    const resultat = validerChampsEtFormules(
      [champNombre("longueur")],
      [
        { id: "a", label: "A", expression: "b * 2" },
        { id: "b", label: "B", expression: "longueur" },
      ],
    );
    expect("erreur" in resultat).toBe(true);
  });

  it("rejette un identifiant avec accent ou espace", () => {
    const resultat = validerChampsEtFormules([{ id: "longueur tuyau", label: "x", type: "nombre" }], []);
    expect("erreur" in resultat).toBe(true);
  });

  it("rejette un identifiant dupliqué entre un champ et une formule", () => {
    const resultat = validerChampsEtFormules(
      [champNombre("cout")],
      [{ id: "cout", label: "Coût", expression: "cout * 2" }],
    );
    expect("erreur" in resultat).toBe(true);
  });

  it("rejette un type de champ invalide", () => {
    const resultat = validerChampsEtFormules([{ id: "x", label: "X", type: "flottant" }], []);
    expect("erreur" in resultat).toBe(true);
  });
});
