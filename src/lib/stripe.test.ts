import { afterEach, describe, expect, it } from "vitest";
import {
  planPourEffectif,
  planEffectif,
  accesOutilsCalcul,
  idPrixPour,
  facturationConfiguree,
  SEUIL_SALARIES_EQUIPE,
} from "./stripe";

const ENV_ORIGINAL = { ...process.env };

afterEach(() => {
  process.env = { ...ENV_ORIGINAL };
});

describe("planPourEffectif", () => {
  it("reste en formule Solo en dessous du seuil", () => {
    expect(planPourEffectif(0)).toBe("solo");
    expect(planPourEffectif(1)).toBe("solo");
    expect(planPourEffectif(SEUIL_SALARIES_EQUIPE - 1)).toBe("solo");
  });

  it("bascule en formule Équipe à partir du seuil", () => {
    expect(planPourEffectif(SEUIL_SALARIES_EQUIPE)).toBe("equipe");
    expect(planPourEffectif(SEUIL_SALARIES_EQUIPE + 5)).toBe("equipe");
  });
});

describe("planEffectif", () => {
  it("renvoie la formule choisie explicitement si elle est valide", () => {
    expect(planEffectif("premium", 1)).toBe("premium");
    expect(planEffectif("equipe", 1)).toBe("equipe");
  });

  it("retombe sur la formule suggérée par l'effectif si aucune n'est choisie", () => {
    expect(planEffectif(null, 1)).toBe("solo");
    expect(planEffectif(undefined, SEUIL_SALARIES_EQUIPE)).toBe("equipe");
  });

  it("ignore une valeur de plan invalide en base", () => {
    expect(planEffectif("autre-chose", 1)).toBe("solo");
  });
});

describe("accesOutilsCalcul", () => {
  it("n'autorise que la formule Premium", () => {
    expect(accesOutilsCalcul("premium")).toBe(true);
    expect(accesOutilsCalcul("solo")).toBe(false);
    expect(accesOutilsCalcul("equipe")).toBe(false);
  });
});

describe("idPrixPour", () => {
  it("renvoie le prix Solo configuré pour la formule Solo", () => {
    process.env.STRIPE_PRICE_ID_SOLO = "price_solo";
    process.env.STRIPE_PRICE_ID_EQUIPE = "price_equipe";
    expect(idPrixPour("solo")).toBe("price_solo");
  });

  it("renvoie le prix Équipe quand il est configuré", () => {
    process.env.STRIPE_PRICE_ID_SOLO = "price_solo";
    process.env.STRIPE_PRICE_ID_EQUIPE = "price_equipe";
    expect(idPrixPour("equipe")).toBe("price_equipe");
  });

  it("replie sur Solo si le prix Équipe n'est pas configuré", () => {
    process.env.STRIPE_PRICE_ID_SOLO = "price_solo";
    delete process.env.STRIPE_PRICE_ID_EQUIPE;
    expect(idPrixPour("equipe")).toBe("price_solo");
  });

  it("renvoie le prix Premium quand il est configuré", () => {
    process.env.STRIPE_PRICE_ID_PREMIUM = "price_premium";
    expect(idPrixPour("premium")).toBe("price_premium");
  });

  it("ne replie jamais Premium sur une autre formule (pour ne pas sous-facturer)", () => {
    delete process.env.STRIPE_PRICE_ID_PREMIUM;
    process.env.STRIPE_PRICE_ID_SOLO = "price_solo";
    process.env.STRIPE_PRICE_ID_EQUIPE = "price_equipe";
    expect(idPrixPour("premium")).toBeNull();
  });

  it("renvoie null si aucun prix n'est configuré", () => {
    delete process.env.STRIPE_PRICE_ID_SOLO;
    delete process.env.STRIPE_PRICE_ID_EQUIPE;
    expect(idPrixPour("solo")).toBeNull();
  });
});

describe("facturationConfiguree", () => {
  it("est fausse sans clé secrète Stripe", () => {
    delete process.env.STRIPE_SECRET_KEY;
    process.env.STRIPE_PRICE_ID_SOLO = "price_solo";
    expect(facturationConfiguree()).toBe(false);
  });

  it("est fausse sans prix Solo configuré", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test";
    delete process.env.STRIPE_PRICE_ID_SOLO;
    expect(facturationConfiguree()).toBe(false);
  });

  it("est vraie quand la clé secrète et le prix Solo sont configurés", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test";
    process.env.STRIPE_PRICE_ID_SOLO = "price_solo";
    expect(facturationConfiguree()).toBe(true);
  });
});
