// Tâche 2 de services : preuve sur les vraies données, version construite servie par `npx vite preview --port 4180`.
// /?loyer=aucun&services=medecin:10 (Bordeaux et Mende passent : colorées, sans raison) puis services=gare-regionale:30
// (Mende et Ajaccio écartées, leurs raisons) ; l'adresse réécrite comme R55. Choix d'une commune repris de
// T1-preuves-reel.mjs (zoom à la molette au-dessus de la commune, clic, titre vérifié ; la Corse : carte glissée d'abord).
// Lancer : OUT=<dossier des captures> node docs/plans/2026-11-24-services/captures/T2-preuves-reel.mjs
import { readFileSync } from 'node:fs';
import { chromium } from '/Users/mouga/git-repository/carte-ou-vivre/node_modules/playwright/index.mjs';
const BASE = process.env.BASE ?? 'http://localhost:4180';
const OUT = process.env.OUT;
const RACINE = '/Users/mouga/git-repository/carte-ou-vivre/public/data/';
const communes = JSON.parse(readFileSync(RACINE + 'communes.json', 'utf8')).communes;
const reperes = JSON.parse(readFileSync(RACINE + 'reperes.json', 'utf8')).reperes;
const navigateur = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const journal = (...a) => console.log(new Date().toLocaleTimeString('fr-FR'), ...a);
const nbsp = (t) => (t ?? '').replace(/[  ]/g, ' ');
const W = 1440, H = 900;
const p = await (await navigateur.newContext({ viewport: { width: W, height: H } })).newPage();
const fiche = () => p.getByRole('region', { name: /\(\w+\)$/ });

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
async function choisir(chemin, code) {
  const i = communes.findIndex((c) => c[0] === code);
  const [, nom, dep] = communes[i];
  const r = reperes[i];
  const essais = [r.slice(0, 2), [r[0] + 0.01, r[1]], [(r[2] + r[4]) / 2, (r[3] + r[5]) / 2], [r[0] + 0.01, r[1] - 0.01]];
  // Corse : la carte glissée ne revient pas exactement de 300 px (premier passage : Coggia, 20 km au nord d'Ajaccio).
  // Deuxième passage : -0,3 → Coti-Chiavari (au sud), -0,1 → Alata (au nord), -0,2 → la mer (mairie au bord du golfe).
  if (r[1] < 43) essais.unshift([r[0] + 0.05, r[1] - 0.17], [r[0] + 0.08, r[1] - 0.15], [r[0] + 0.03, r[1] - 0.15], [r[0] + 0.06, r[1] - 0.2]);
  for (const [lon, lat] of essais) {
    await ouvrir(chemin);
    let { x, y } = ecran(lon, lat);
    if (lat < 43) {
      await p.mouse.move(W / 2, 600);
      await p.mouse.down();
      await p.mouse.move(W / 2, 300, { steps: 30 });
      await p.waitForTimeout(500);
      await p.mouse.up();
      await p.waitForTimeout(1000);
      y -= 300;
    }
    await p.mouse.move(x, y);
    for (let k = 0; k < 12; k++) { await p.mouse.wheel(0, -300); await p.waitForTimeout(60); }
    await p.waitForTimeout(1500);
    await p.mouse.click(x, y);
    if (!(await fiche().waitFor({ timeout: 5000 }).then(() => true, () => false))) continue;
    const titre = nbsp(await p.locator('#titre-fiche').innerText()).trim();
    if (titre === `${nom} (${dep})`) {
      await fiche().getByText(/^Temps en voiture/).waitFor({ timeout: 20000 });
      await p.mouse.move(0, 0);
      await p.waitForTimeout(1500);
      return;
    }
    journal('  essai raté pour', code, '→', titre);
  }
  throw new Error(`commune ${code} non choisie`);
}
/** Ce que la fiche dit : passe ou non, ses raisons, sa ligne du service. */
async function lireFiche(service) {
  const t = (await fiche().locator('h3, p, li').allTextContents()).map((x) => nbsp(x).replace(/\s+/g, ' ').trim());
  const i = t.indexOf('Ne passe pas tes critères');
  return { titre: t[0] ?? nbsp(await p.locator('#titre-fiche').innerText()), passe: i < 0, raisons: i < 0 ? [] : t.slice(i + 1).filter((x) => x.includes('plafond') || x.includes('aucune') || x.includes('sans habitant')).slice(0, 4), ligne: t.find((x) => x.startsWith(`${service} :`)) };
}

// R55 : l'adresse réécrite à l'ouverture.
for (const a of ['/?loyer=aucun&services=medecin:10', '/?services=medecin:10,zzz:5,medecin:5,gare:10,gare-regionale:20,lycee:10,ecole:5&loyer=aucun', '/?loyer=aucun&services=gare-regionale:30']) {
  await ouvrir(a);
  journal(`adresse ${a} → réécrite ${new URL(p.url()).pathname}${new URL(p.url()).search}`);
}

const MED = '/?loyer=aucun&services=medecin:10';
await ouvrir(MED);
await p.screenshot({ path: `${OUT}/T2-carte-medecin-10-${W}x${H}.png` });
for (const [code, nom] of [['33063', 'bordeaux'], ['48095', 'mende']]) {
  await choisir(MED, code);
  journal(`${MED} · fiche ${nom} :`, JSON.stringify(await lireFiche('Médecin')));
  await p.screenshot({ path: `${OUT}/T2-medecin-10-${nom}-${W}x${H}.png` });
}

const GARE = '/?loyer=aucun&services=gare-regionale:30';
await ouvrir(GARE);
await p.screenshot({ path: `${OUT}/T2-carte-gare-regionale-30-${W}x${H}.png` });
for (const [code, nom] of [['48095', 'mende'], ['2A004', 'ajaccio']]) {
  await choisir(GARE, code);
  journal(`${GARE} · fiche ${nom} :`, JSON.stringify(await lireFiche('Gare régionale')));
  await p.screenshot({ path: `${OUT}/T2-gare-regionale-30-${nom}-${W}x${H}.png` });
}
await navigateur.close();
