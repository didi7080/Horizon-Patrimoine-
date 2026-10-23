import { describe, expect, it } from "vitest";
import { evaluerFormule, formuleValide, ErreurFormule } from "./evaluateur";

describe("evaluerFormule", () => {
  it("calcule les opérations de base avec la bonne précédence", () => {
    expect(evaluerFormule("2 + 3 * 4", {})).toBe(14);
    expect(evaluerFormule("(2 + 3) * 4", {})).toBe(20);
    expect(evaluerFormule("10 / 2 - 1", {})).toBe(4);
    expect(evaluerFormule("2 ^ 3", {})).toBe(8);
  });

  it("gère les nombres négatifs et l'unaire", () => {
    expect(evaluerFormule("-5 + 3", {})).toBe(-2);
    expect(evaluerFormule("3 - -2", {})).toBe(5);
  });

  it("résout les identifiants depuis la portée fournie", () => {
    expect(evaluerFormule("longueur * largeur", { longueur: 4, largeur: 2.5 })).toBe(10);
  });

  it("supporte les fonctions autorisées", () => {
    expect(evaluerFormule("max(1, 2, 3)", {})).toBe(3);
    expect(evaluerFormule("min(1, 2, 3)", {})).toBe(1);
    expect(evaluerFormule("round(3.14159, 2)", {})).toBe(3.14);
    expect(evaluerFormule("sqrt(16)", {})).toBe(4);
    expect(evaluerFormule("abs(-7)", {})).toBe(7);
  });

  it("permet de combiner formules composées (fonctions imbriquées)", () => {
    expect(evaluerFormule("surface * (hauteur + max(marge, 0.1))", { surface: 10, hauteur: 2, marge: 0.5 })).toBe(25);
  });

  it("rejette un identifiant inconnu", () => {
    expect(() => evaluerFormule("inconnu * 2", {})).toThrow(ErreurFormule);
  });

  it("rejette une fonction inconnue", () => {
    expect(() => evaluerFormule("exec(1)", {})).toThrow(ErreurFormule);
  });

  it("rejette les caractères non autorisés (pas d'injection de code)", () => {
    expect(() => evaluerFormule("process.exit()", {})).toThrow(ErreurFormule);
    expect(() => evaluerFormule("1; console.log(1)", {})).toThrow(ErreurFormule);
    expect(() => evaluerFormule("`${1}`", {})).toThrow(ErreurFormule);
  });

  it("rejette une parenthèse non fermée ou une formule incomplète", () => {
    expect(() => evaluerFormule("(1 + 2", {})).toThrow(ErreurFormule);
    expect(() => evaluerFormule("1 +", {})).toThrow(ErreurFormule);
    expect(() => evaluerFormule("", {})).toThrow(ErreurFormule);
  });

  it("rejette des éléments inattendus en fin de formule", () => {
    expect(() => evaluerFormule("1 + 2 3", {})).toThrow(ErreurFormule);
  });
});

describe("formuleValide", () => {
  it("accepte une syntaxe correcte", () => {
    expect(formuleValide("a + b * 2")).toBe(true);
  });

  it("rejette une syntaxe incorrecte", () => {
    expect(formuleValide("a + $")).toBe(false);
  });
});
