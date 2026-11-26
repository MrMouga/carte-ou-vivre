// Révision D19, D20 de services, tâche 1 : captures sur la fixture « 6 communes · services » (comme tests/e2e/services.spec.ts).
// Lancer : npx playwright test --config docs/plans/2026-11-26-services-revision/captures/T1-captures.config.ts
import { defineConfig, devices } from '@playwright/test';
import base from '../../../../playwright.config';

export default defineConfig({
  ...base,
  testDir: '.',
  testMatch: 'T1-captures.spec.ts',
  workers: 1,
  // Le serveur part de la racine du projet (par défaut, du dossier de cette config).
  webServer: { ...(base.webServer as object), cwd: new URL('../../../../', import.meta.url).pathname } as typeof base.webServer,
  projects: [
    { name: 'bureau', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } } },
  ],
});
