// Tâche 1 d'emploi : temps du calcul des villes principales à 30 km de chaque commune, relevé dans la page elle-même
// (`performance.measure('emploi : villes principales à 30 km')` de src/domain/emploi.ts, lecture et index compris), sur la
// version construite servie par `npx vite preview --port 4180`, vraies données, Chromium de Playwright, processeur ralenti
// 4 fois dès l'ouverture (protocole DevTools). À comparer à la tâche 0b : 154 ms (calcul) + 14 ms (préparation).
// 7 pages neuves, médiane. Lancer : node docs/plans/2026-11-21-emploi/captures/T1-mesure-distances.mjs
import { loadavg } from 'node:os';
import { chromium } from '/Users/mouga/git-repository/carte-ou-vivre/node_modules/playwright/index.mjs';
const BASE = process.env.BASE ?? 'http://localhost:4180';
const NOM = 'emploi : villes principales à 30 km';
const charge = () => loadavg().map((x) => x.toFixed(2)).join(' ');
const navigateur = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
console.log(`début ${new Date().toLocaleString('fr-FR')} ; charge ${charge()} ; Chromium ${navigateur.version()}`);
const mesures = [];
for (const ralenti of [1, 4]) {
  const essais = [];
  for (let i = 0; i < 7; i++) {
    const page = await navigateur.newPage({ viewport: { width: 1440, height: 900 } });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: ralenti });
    await page.goto(BASE + '/?loyer=aucun&metier=V1X80:10');
    await page.waitForFunction((nom) => performance.getEntriesByName(nom).length > 0, NOM, { timeout: 60000 });
    essais.push(await page.evaluate((nom) => performance.getEntriesByName(nom)[0].duration, NOM));
    await page.close();
  }
  const med = [...essais].sort((a, b) => a - b)[3];
  mesures.push(`processeur ralenti ${ralenti} fois : médiane ${med.toFixed(0)} ms ; essais ${essais.map((x) => x.toFixed(0)).join(' ')}`);
}
console.log(mesures.join('\n'));
console.log(`fin ${new Date().toLocaleString('fr-FR')} ; charge ${charge()}`);
await navigateur.close();
