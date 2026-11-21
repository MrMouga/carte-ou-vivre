// Tâche 1 d'emploi : preuve sur les vraies données, version construite servie par `npx vite preview --port 4180`, 1 440 × 900.
// /?loyer=aucun&metier=V1X80:10 puis …,M2X90:10 : captures de la carte, fiches de Bordeaux, Pau et La Rochelle (titre vérifié
// contre communes.json, leçon du 2026-10-16) ; adresses réécrites (R48). Méthode de choix d'une commune reprise de
// docs/plans/2026-10-18-mairies/captures/T4-bout-en-bout.mjs (zoom à la molette sur son point, clic au même endroit).
// Lancer : OUT=<dossier des captures> node docs/plans/2026-11-21-emploi/captures/T1-preuves-reel.mjs
import { readFileSync } from 'node:fs';
import { chromium } from '/Users/mouga/git-repository/carte-ou-vivre/node_modules/playwright/index.mjs';
const BASE = process.env.BASE ?? 'http://localhost:4180';
const OUT = process.env.OUT;
const RACINE = '/Users/mouga/git-repository/carte-ou-vivre/public/data/';
const communes = JSON.parse(readFileSync(RACINE + 'communes.json', 'utf8')).communes;
const reperes = JSON.parse(readFileSync(RACINE + 'reperes.json', 'utf8')).reperes;
const navigateur = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const journal = (...a) => console.log(new Date().toLocaleTimeString('fr-FR'), ...a);
const nbsp = (t) => (t ?? '').replace(/[  ]/g, ' ');
const W = 1440, H = 900;
const contexte = await navigateur.newContext({ viewport: { width: W, height: H } });
const p = await contexte.newPage();
const adresse = () => new URL(p.url()).pathname + new URL(p.url()).search;
const fiche = () => p.getByRole('region', { name: /\(\d+\)$/ });

async function ouvrir(chemin) {
  for (let essai = 0; essai < 3; essai++) {
    await p.goto(BASE + chemin);
    await p.locator('[data-testid="carte"][data-carte-prete="1"]').waitFor({ timeout: 60000 });
    await p.waitForTimeout(2500);
    if (!(await p.getByText('Fond de carte indisponible').isVisible())) return;
  }
  journal('  fond de secours pour', chemin);
}
const mx = (lon) => (lon + 180) / 360;
const my = (lat) => (1 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) / Math.PI) / 2;
let [w, s, e, n] = [Infinity, Infinity, -Infinity, -Infinity];
for (const r of reperes) { w = Math.min(w, r[2]); s = Math.min(s, r[3]); e = Math.max(e, r[4]); n = Math.max(n, r[5]); }
const [x0, x1, y0, y1] = [mx(w), mx(e), my(n), my(s)];
function ecran(lon, lat) {
  const pad = { top: 16, left: 16 + 340 + 16, right: 16 + 320 + 16, bottom: 32 + 16 };
  const z = Math.log2(Math.min((W - pad.left - pad.right) / ((x1 - x0) * 512), (H - pad.top - pad.bottom) / ((y1 - y0) * 512)));
  const monde = 512 * 2 ** z;
  const cx = pad.left + (W - pad.left - pad.right) / 2, cy = pad.top + (H - pad.top - pad.bottom) / 2;
  return { x: cx + (mx(lon) - (x0 + x1) / 2) * monde, y: cy + (my(lat) - (y0 + y1) / 2) * monde };
}
/** Ouvre `chemin`, choisit la commune `code` sur la carte, vérifie le titre, renvoie le texte de la fiche. */
async function choisir(chemin, code) {
  const i = communes.findIndex((c) => c[0] === code);
  const [, nom, dep] = communes[i];
  const r = reperes[i];
  const essais = [[r[0] + 0.01, r[1]], r.slice(0, 2), [(r[2] + r[4]) / 2, (r[3] + r[5]) / 2], [r[0] + 0.01, r[1] - 0.01]];
  for (const [lon, lat] of essais) {
    await ouvrir(chemin);
    const { x, y } = ecran(lon, lat);
    await p.mouse.move(x, y);
    for (let k = 0; k < 12; k++) { await p.mouse.wheel(0, -300); await p.waitForTimeout(60); }
    await p.waitForTimeout(1500);
    await p.mouse.click(x, y);
    if (!(await fiche().waitFor({ timeout: 5000 }).then(() => true, () => false))) continue;
    const titre = nbsp(await p.locator('#titre-fiche').innerText()).trim();
    if (titre === `${nom} (${dep})`) {
      await p.waitForTimeout(2500);
      return nbsp(await fiche().innerText());
    }
    journal('  essai raté pour', code, '→', titre);
  }
  throw new Error(`commune ${code} non choisie`);
}
const raisons = (t) => (/ne passe pas tes critères/i.test(t) ? t.split('\n').filter((l) => / : aucun bassin /.test(l)) : []);
const capture = (nom) => p.screenshot({ path: `${OUT}/T1-${nom}-1440x900.png` });

// 1. Infirmiers à « 10 % ».
const UN = '/?loyer=aucun&metier=V1X80:10';
await ouvrir(UN);
journal(`${UN} → ${adresse()}`);
await capture('infirmiers-10');
for (const [code, nom] of [['33063', 'bordeaux'], ['64445', 'pau'], ['17300', 'la-rochelle']]) {
  const t = await choisir(UN, code);
  journal(`  fiche ${code} : ${raisons(t).length ? 'ne passe pas' : 'passe'} ; raisons : ${JSON.stringify(raisons(t))}`);
  await capture(`fiche-${nom}-infirmiers-10`);
}

// 2. Infirmiers et ingénieurs en informatique à « 10 % ».
const DEUX = '/?loyer=aucun&metier=V1X80:10,M2X90:10';
await ouvrir(DEUX);
journal(`${DEUX} → ${adresse()}`);
await capture('deux-metiers-10');
for (const [code, nom] of [['33063', 'bordeaux'], ['64445', 'pau']]) {
  const t = await choisir(DEUX, code);
  journal(`  fiche ${code} : ${raisons(t).length ? 'ne passe pas' : 'passe'} ; raisons : ${JSON.stringify(raisons(t))}`);
  await capture(`fiche-${nom}-deux-metiers-10`);
}

// 3. Adresses réécrites (R48).
for (const chemin of ['/?metier=V1X80:10,ZZ999:25,M2X90:50,V2X90&loyer=aucun', '/?loyer=aucun&metier=M2X90:tous,M2X90:10&mairie=gauche', '/?loyer=1200']) {
  await ouvrir(chemin);
  journal(`${chemin} → ${adresse()} ; liste : ${nbsp(await p.getByRole('status').first().innerText()).trim() || '(sans plafond)'}`);
}
await navigateur.close();
