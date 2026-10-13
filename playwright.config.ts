import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  // 2 tests à la fois : au-delà (5 par défaut sur un Mac à 10 cœurs), la carte WebGL logicielle de tests plus anciens
  // n'est pas prête dans les 5 s et `npm test` échoue sans défaut (relecture proches, 2026-10-13). ≈ 4 min la suite.
  workers: 2,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1440, height: 900 },
    launchOptions: {
      // Rendu WebGL logiciel autorisé (pas de carte graphique dans le navigateur de test).
      args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
    },
  },
  // Tâche 6 : chaque test passe en bureau et à 390 px (feuille mobile).
  // `chrome.spec.ts` (limite de réécriture de l'adresse, propre à Chrome et sensible à la charge) tourne seul, après les autres.
  projects: [
    { name: 'bureau', testIgnore: 'chrome.spec.ts', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', testIgnore: 'chrome.spec.ts', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } } },
    { name: 'limites', testMatch: 'chrome.spec.ts', dependencies: ['bureau', 'mobile'], use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
});
