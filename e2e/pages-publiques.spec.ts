import { test, expect } from "@playwright/test";

test.describe("Pages publiques", () => {
  test("la page d'accueil affiche la recherche", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: "Rechercher" })).toBeVisible();
  });

  test("la page de recherche liste des artisans", async ({ page }) => {
    await page.goto("/recherche");
    await expect(page.getByText(/artisan(s)? trouvé/)).toBeVisible({ timeout: 10_000 });
  });

  test("la page SEO par métier affiche le contenu attendu", async ({ page }) => {
    await page.goto("/artisans/plombier");
    await expect(page.getByRole("heading", { name: /Plomberie/ })).toBeVisible();
    await expect(page.getByText("Quand faire appel à un plombier")).toBeVisible();
  });

  test("une page métier inconnue renvoie une 404", async ({ page }) => {
    const reponse = await page.goto("/artisans/metier-qui-n-existe-pas");
    expect(reponse?.status()).toBe(404);
  });
});
