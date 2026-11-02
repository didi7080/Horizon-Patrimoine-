import { test, expect } from "@playwright/test";

// Entreprise de démonstration réelle (Plomberie, Lyon) utilisée pour les tests manuels
// tout au long du développement — cf. /dashboard pour la retrouver si elle est renommée.
const SLUG_ENTREPRISE = "bati-pro";
const ID_PRESTATION = "f5f5a282-dab9-4224-b068-932dc610db26";

test.describe("Réservation publique", () => {
  test("un client peut réserver puis annuler son rendez-vous", async ({ page }) => {
    await page.goto(`/e/${SLUG_ENTREPRISE}/reserver/${ID_PRESTATION}`);

    // Étape « professionnel » optionnelle (sautée s'il n'y a qu'un seul salarié).
    const continuerProfessionnel = page.getByRole("button", { name: "Continuer", exact: false }).first();
    if (await page.getByText("Peu importe, le premier disponible").isVisible().catch(() => false)) {
      await continuerProfessionnel.click();
    }

    // Étape « créneau » : premier jour disponible, puis premier horaire proposé.
    await expect(page.getByText("Aucun créneau disponible ce mois-ci")).toHaveCount(0, { timeout: 15_000 });
    const premierJourDisponible = page
      .locator("button:not([disabled])")
      .filter({ hasText: /^\d{1,2}$/ })
      .first();
    await premierJourDisponible.click();

    const premierCreneau = page
      .locator("button")
      .filter({ hasText: /^\d{1,2}:\d{2}$/ })
      .first();
    await expect(premierCreneau).toBeVisible({ timeout: 10_000 });
    await premierCreneau.click();

    await page.getByRole("button", { name: "Continuer" }).click();

    // Étape « coordonnées ».
    await page.getByLabel(/Nom complet/).fill("Client Test E2E");
    await page.getByLabel(/Téléphone/).fill("0600000000");
    await page.getByLabel(/^E-mail$/).fill("e2e-test@example.com");

    await page.getByRole("button", { name: /Confirmer le rendez-vous/ }).click();

    await expect(page.getByRole("heading", { name: /confirmé|envoyé/ })).toBeVisible({ timeout: 15_000 });

    // Nettoyage : annule le rendez-vous créé pour ne pas accumuler de réservations de test.
    await page.getByRole("link", { name: "Gérer mon rendez-vous" }).click();
    await expect(page).toHaveURL(/\/rdv\//);
    await page.getByRole("button", { name: "Annuler" }).click();
    await page.getByRole("button", { name: "Confirmer l’annulation" }).click();
    await expect(page.getByText("Annulé")).toBeVisible();
  });
});
