// Tâche 2 d'emploi : preuve sur les vraies données, version construite servie par `npx vite preview --port 4180`.
// /?loyer=1200&metier=V1X80:10,M2X90 : fiches de Bordeaux, La Rochelle, Pau, Saint-Selve (à quelques km d'une ville
// principale) et d'un village (Allarmont, 214 hab.) ; lignes de R47 lues sous « Mairie » ; pied de page (R49) ; une fiche à
// 390 × 844. Méthode de choix d'une commune reprise de captures/T1-preuves-reel.mjs (zoom à la molette, clic, titre vérifié).
// Lancer : OUT=<dossier des captures> node docs/plans/2026-11-21-emploi/captures/T2-preuves-reel.mjs
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
let W = 1440, H = 900;
let contexte = await navigateur.newContext({ viewport: { width: W, height: H } });
let p = await contexte.newPage();
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
/** Les lignes après « Mairie », et les raisons d'un métier. */
const lignes = (t) => {
  const l = t.split('\n').map((x) => x.trim()).filter(Boolean);
  const m = l.findIndex((x) => x.startsWith('Mairie :'));
  return { raisons: l.filter((x) => / : aucun bassin /.test(x)), sous: l.slice(m + 1) };
};
const capture = (nom) => p.screenshot({ path: `${OUT}/T2-${nom}-${W}x${H}.png` });

const CHEMIN = '/?loyer=1200&metier=V1X80:10,M2X90';
await ouvrir(CHEMIN);
journal(`${CHEMIN} → ${new URL(p.url()).search}`);
for (const [code, nom] of [['33063', 'bordeaux'], ['17300', 'la-rochelle'], ['64445', 'pau'], ['33474', 'saint-selve'], ['88005', 'allarmont']]) {
  const t = await choisir(CHEMIN, code);
  const { raisons, sous } = lignes(t);
  journal(`fiche ${code} (${nom})`);
  for (const r of raisons) journal('  raison :', r);
  for (const x of sous) journal('  sous « Mairie » :', x);
  await capture(`fiche-${nom}`);
}

// Pied de page (bureau) : les mentions, avec le trimestre lu dans emploi.json.
await ouvrir(CHEMIN);
const pied = p.getByRole('contentinfo').filter({ visible: true }).first();
journal('pied de page :', nbsp(await pied.innerText()));
await pied.screenshot({ path: `${OUT}/T2-pied-de-page-${W}x${H}.png` });

// Une fiche à 390 × 844, par la liste (la vue de la carte diffère au téléphone, `ecran()` ne vaut que pour le bureau) :
// onglet « Les 10 premières », fiche de la 1re commune, défilée jusqu'à la ligne du chômage.
await contexte.close();
W = 390; H = 844;
contexte = await navigateur.newContext({ viewport: { width: W, height: H }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
p = await contexte.newPage();
await ouvrir(CHEMIN);
await p.getByRole('tab', { name: 'Les 10 premières' }).click();
const premiere = p.getByRole('region', { name: 'Les 10 premières' }).getByRole('button').first();
journal('390 : première de la liste :', nbsp(await premiere.innerText()).replace(/\n/g, ' '));
await premiere.click();
await fiche().waitFor();
await p.waitForTimeout(1500);
await fiche().getByText(/^Chômage : /).scrollIntoViewIfNeeded();
await p.waitForTimeout(500);
journal('390 : sous « Mairie » :', JSON.stringify(lignes(nbsp(await fiche().innerText())).sous));
await capture('fiche-premiere');
await navigateur.close();
