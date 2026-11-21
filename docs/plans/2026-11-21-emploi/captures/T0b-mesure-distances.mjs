// Tâche 0b d'emploi — temps du calcul des villes principales à 30 km de chaque commune dans Chromium, processeur ralenti
// 4 fois (protocole DevTools, Emulation.setCPUThrottlingRate). Même calcul qu'en Node (T0b-voisinage.mjs), avec
// `distanceKm` de src/proches/distance.ts (types retirés par `stripTypeScriptTypes` de Node, source injectée telle quelle).
// Données : les vrais fichiers servis par vite preview (port 4180). Chaque essai « à froid » est une page neuve (le calcul
// se fait une fois, après le chargement : c'est le cas réel) ; puis 10 essais « à chaud » dans la dernière page.
// Lancer : node docs/plans/2026-11-21-emploi/captures/T0b-mesure-distances.mjs
import { readFileSync } from 'node:fs';
import { loadavg } from 'node:os';
import { stripTypeScriptTypes } from 'node:module';
import { chromium } from '/Users/mouga/git-repository/carte-ou-vivre/node_modules/playwright/index.mjs';
const BASE = process.env.BASE ?? 'http://localhost:4180';
const RACINE = new URL('../../../../', import.meta.url).pathname;
const distance = stripTypeScriptTypes(readFileSync(RACINE + 'src/proches/distance.ts', 'utf8'));
const voisinage = readFileSync(new URL('./T0b-voisinage.mjs', import.meta.url), 'utf8');
const MODULE = `${distance}\n${voisinage}\nwindow.__mesure = { distanceKm, villesA30km, compterPassent };`;
const FROID = 7, CHAUD = 10;
const charge = () => loadavg().map((x) => x.toFixed(2)).join(' ');
const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const ligne = (nom, a) => `${nom} : médiane ${med(a).toFixed(0)} ms ; min ${Math.min(...a).toFixed(0)} max ${Math.max(...a).toFixed(0)} ; essais ${a.map((x) => x.toFixed(0)).join(' ')}`;

const navigateur = await chromium.launch();
console.log(`début ${new Date().toLocaleString('fr-FR')} ; charge ${charge()} ; Chromium ${navigateur.version()}`);
const preparation = [], froid = [], chaud = [];
let comptes;
for (let i = 0; i < FROID; i++) {
  const page = await navigateur.newPage();
  const cdp = await page.context().newCDPSession(page);
  await page.goto(BASE + '/version.txt');
  await page.addScriptTag({ type: 'module', content: MODULE });
  await page.waitForFunction(() => window.__mesure);
  // Chargement sans ralentissement : seul le calcul est mesuré.
  await page.evaluate(async () => {
    const lire = (u) => fetch(u).then((r) => r.json());
    const [c, r, e] = await Promise.all([lire('/data/communes.json'), lire('/data/reperes.json'), lire('/data/emploi.json')]);
    window.__donnees = { communes: c.communes, reperes: r.reperes, emploi: e };
  });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const [prep, calcul, n] = await page.evaluate((chaud) => {
    const { communes, reperes, emploi } = window.__donnees;
    const { distanceKm, villesA30km, compterPassent } = window.__mesure;
    // Préparation : points (lon, lat) dans l'ordre de communes.json, et index de la ville principale de chaque bassin.
    const t0 = performance.now();
    const indexCommune = new Map(communes.map((c, i) => [c[0], i]));
    const points = new Float64Array(communes.length * 2);
    for (let i = 0; i < reperes.length; i++) { points[2 * i] = reperes[i][0]; points[2 * i + 1] = reperes[i][1]; }
    const villes = [];
    emploi.bassins.forEach(([, ville], i) => { if (ville != null) villes.push([i, indexCommune.get(ville)]); });
    const t1 = performance.now();
    const proches = villesA30km(points, villes, distanceKm);
    const t2 = performance.now();
    // Comptes : M2X90 à « 10 % » (AC-12), et les trois métiers du tableau aux trois niveaux.
    const RANG = { '10': 0, '25': 1, tous: 2 };
    const indexBassin = new Map(emploi.bassins.map((b, i) => [b[0], i]));
    const n = {};
    for (const code of ['M2X90', 'R4X90', 'H1X91', 'V1X80']) {
      const m = emploi.metiers.find((x) => x.code === code);
      for (const niveau of ['10', '25', 'tous']) {
        const d = new Uint8Array(emploi.bassins.length);
        for (const [b, , x] of m.bassins) if (RANG[x] <= RANG[niveau]) d[indexBassin.get(b)] = 1;
        n[`${code}:${niveau}`] = compterPassent(proches, d);
      }
    }
    const t3 = performance.now();
    n.filtre_un_niveau_ms = (t3 - t2) / 12;
    const encore = [];
    for (let k = 0; k < chaud; k++) { const t = performance.now(); villesA30km(points, villes, distanceKm); encore.push(performance.now() - t); }
    window.__chaud = encore;
    return [t1 - t0, t2 - t1, n];
  }, i === FROID - 1 ? CHAUD : 0);
  preparation.push(prep); froid.push(calcul); comptes = n;
  if (i === FROID - 1) chaud.push(...(await page.evaluate(() => window.__chaud)));
  await page.close();
}
console.log(`processeur ralenti 4 fois ; fin ${new Date().toLocaleString('fr-FR')} ; charge ${charge()}`);
console.log(ligne(`préparation (points et villes principales), page neuve`, preparation));
console.log(ligne(`calcul des villes principales à 30 km, premier appel dans une page neuve (${FROID} pages)`, froid));
console.log(ligne(`même calcul, à chaud (${CHAUD} appels dans la dernière page)`, chaud));
console.log(`un filtre (compter les communes qui passent un métier à un niveau), moyenne : ${comptes.filtre_un_niveau_ms.toFixed(1)} ms`);
delete comptes.filtre_un_niveau_ms;
console.log(`communes qui passent : ${JSON.stringify(comptes)}`);
await navigateur.close();
