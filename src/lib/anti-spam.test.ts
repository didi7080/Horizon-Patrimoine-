import { describe, expect, it } from "vitest";
import { estBot } from "./anti-spam";

function formulaire(valeurs: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [cle, valeur] of Object.entries(valeurs)) fd.set(cle, valeur);
  return fd;
}

describe("estBot", () => {
  it("détecte un bot qui remplit le champ piège (honeypot)", () => {
    const fd = formulaire({ site_web: "https://spam.example", rendu_a: String(Date.now() - 2000) });
    expect(estBot(fd)).toBe(true);
  });

  it("détecte une soumission trop rapide (bot)", () => {
    const fd = formulaire({ site_web: "", rendu_a: String(Date.now()) });
    expect(estBot(fd)).toBe(true);
  });

  it("détecte l'absence de l'horodatage de rendu", () => {
    const fd = formulaire({ site_web: "" });
    expect(estBot(fd)).toBe(true);
  });

  it("laisse passer une soumission humaine normale", () => {
    const fd = formulaire({ site_web: "", rendu_a: String(Date.now() - 5000) });
    expect(estBot(fd)).toBe(false);
  });
});
