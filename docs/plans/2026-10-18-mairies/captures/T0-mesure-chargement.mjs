// Chargement ajouté par mairies.json + nuances.json, réseau « Fast 4G » de Chromium (DevTools : 9 Mbit/s × 0,9 en
// descente, 1,5 Mbit/s × 0,9 en montée, latence 60 ms × 2,75 = 165 ms), cache coupé, version construite (vite preview,
// gzip). Mesure dans la page : fetch + .json(), comme `lire` d'App.tsx. Médiane de 7 essais, en alternance.
import { chromium } from '/Users/mouga/git-repository/carte-ou-vivre/node_modules/playwright/index.mjs';
const BASE = 'http://localhost:4180';
const FAST4G = { offline: false, downloadThroughput: (9e6 / 8) * 0.9, uploadThroughput: (1.5e6 / 8) * 0.9, latency: 60 * 2.75 };
const JEUX = {
  'achat.json seul': ['/data/achat.json'],
  'mairies.json seul': ['/data/mairies.json'],
  'nuances.json seul': ['/data/nuances.json'],
  'mairies.json + nuances.json': ['/data/mairies.json', '/data/nuances.json'],
  'chargement actuel (communes + reperes + achat)': ['/data/communes.json', '/data/reperes.json', '/data/achat.json'],
  'chargement avec mairies (communes + reperes + achat + mairies + nuances)': ['/data/communes.json', '/data/reperes.json', '/data/achat.json', '/data/mairies.json', '/data/nuances.json'],
};
const N = 7;
const navigateur = await chromium.launch();
const page = await navigateur.newPage();
const cdp = await page.context().newCDPSession(page);
await cdp.send('Network.enable');
await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
await page.goto(BASE + '/version.txt');
await cdp.send('Network.emulateNetworkConditions', FAST4G);
const essais = Object.fromEntries(Object.keys(JEUX).map((k) => [k, []]));
for (let i = 0; i < N; i++) {
  for (const [nom, urls] of Object.entries(JEUX)) {
    const ms = await page.evaluate(async (urls) => {
      const t = performance.now();
      await Promise.all(urls.map((u) => fetch(u, { cache: 'no-store' }).then((r) => r.json())));
      return performance.now() - t;
    }, urls);
    essais[nom].push(Math.round(ms));
  }
}
// Octets reçus (compressés) : relevés par l'API Resource Timing.
const octets = await page.evaluate(() => Object.fromEntries(performance.getEntriesByType('resource').map((e) => [new URL(e.name).pathname, [e.transferSize, e.encodedBodySize, e.decodedBodySize]])));
const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
console.log(`Fast 4G : ${JSON.stringify(FAST4G)} ; ${N} essais par jeu, en alternance ; ${new Date().toLocaleString('fr-FR')}`);
for (const [nom, a] of Object.entries(essais)) console.log(`${nom} : médiane ${med(a)} ms ; essais ${a.join(' ')}`);
const avant = med(essais['chargement actuel (communes + reperes + achat)']), apres = med(essais['chargement avec mairies (communes + reperes + achat + mairies + nuances)']);
console.log(`chargement ajouté (médianes) : ${apres - avant} ms`);
console.log('octets [transférés, corps compressé, corps décompressé] :', JSON.stringify(octets));
await navigateur.close();
