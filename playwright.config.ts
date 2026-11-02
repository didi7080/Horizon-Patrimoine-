import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 45_000,
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    // En sandbox de développement, réutilise le Chromium déjà installé plutôt que
    // d'en télécharger un ; en CI, laisse Playwright utiliser celui qu'il installe.
    launchOptions: process.env.CI ? {} : { executablePath: "/opt/pw-browsers/chromium" },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
