// Tâche 4 de services : la vérification de bout en bout (details.md, étapes 1 à 7), en local sur la version construite
// servie par `npx vite preview --port 4180` (vraies données), en bureau 1 440 × 900 (souris) et à 390 × 844 (toucher) ;
// puis l'état d'erreur du fichier des temps (catégorie et fiche) et l'ouverture à 375 × 548 (H48).
// Choix d'une commune sur la carte repris de T2-preuves-reel.mjs (bureau : zoom à la molette, clic, titre vérifié) ; à
// 390 px, la fiche choisie en bureau passe dans la feuille quand la fenêtre se rétrécit (comme T1-preuves-reel.mjs).
// Lancer : OUT=<dossier des captures> node docs/plans/2026-11-24-services/captures/T4-bout-en-bout.mjs
import { readFileSync } from 'node:fs';
import { chromium } from '/Users/mouga/git-repository/carte-ou-vivre/node_modules/playwright/index.mjs';
const BASE = process.env.BASE ?? 'http://localhost:4180';
const OUT = "/Users/mouga/git-repository/carte-ou-vivre/docs/plans/2026-11-24-services/captures/qa";
const RACINE = '/Users/mouga/git-repository/carte-ou-vivre/public/data/';
const communes = JSON.parse(readFileSync(RACINE + 'communes.json', 'utf8')).communes;
const reperes = JSON.parse(readFileSync(RACINE + 'reperes.json', 'utf8')).reperes;
const navigateur = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const journal = (...a) => console.log(new Date().toLocaleTimeString('fr-FR'), ...a);
const nbsp = (t) => (t ?? '').replace(/[  ]/g, ' ');
const W = 1440, H = 900;
const chemin = (pg) => new URL(pg.url()).pathname + new URL(pg.url()).search;
const fiche = (pg) => pg.getByRole('region', { name: /\(\w+\)$/ });
const reglagesZone = (pg) => pg.getByRole('region', { name: 'Réglages' });
const temps = (pg, ligne, m) => reglagesZone(pg).getByRole('group', { name: ligne, exact: true }).getByRole('button', { name: new RegExp(`^${m}\\smin$`) });
const niveau = (pg, nom) => reglagesZone(pg).getByRole('group', { name: 'Niveaux de scolarité', exact: true }).getByRole('button', { name: nom, exact: true });
const typeGare = (pg, nom) => reglagesZone(pg).getByRole('group', { name: 'Type de gare', exact: true }).getByRole('button', { name: nom, exact: true });
const titreServices = (pg) => reglagesZone(pg).getByRole('heading', { level: 2, name: /^Services/ });
const categorie = (pg) => titreServices(pg).locator('xpath=../..');
const curseur = (pg) => pg.getByRole('slider', { name: 'Loyer maximum' });
/** Ce que règle le panneau : le curseur du loyer et les boutons cochés de « Services ». */
const etatReglages = async (pg) => ({
  loyer: await curseur(pg).getAttribute('aria-valuetext'),
  services: (await categorie(pg).getByRole('button', { pressed: true }).allTextContents()).map(nbsp),
});
/** Bureau : le panneau des réglages défilé jusqu'en bas (« Services », dernière catégorie). */
const bas = (pg) => pg.locator('section[aria-label="Réglages"]').evaluate((el) => (el.scrollTop = el.scrollHeight));

async function ouvrir(pg, ch) {
  for (let essai = 0; essai < 3; essai++) {
    await pg.goto(BASE + ch);
    await pg.locator('[data-testid="carte"][data-carte-prete="1"]').waitFor({ timeout: 60000 });
    // Temps arrivés : la catégorie est active.
    await pg.waitForFunction(() => {
      const b = document.querySelector('[aria-label="Type de gare"] button');
      return b && !b.disabled;
    }, null, { timeout: 30000 });
    await pg.waitForTimeout(2500);
    if (!(await pg.getByText('Fond de carte indisponible').isVisible())) return;
  }
  journal('  fond de secours pour', ch);
}

// Choix d'une commune sur la carte, en bureau (T2-preuves-reel.mjs).
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
async function choisir(pg, ch, code) {
  const i = communes.findIndex((c) => c[0] === code);
  const [, nom, dep] = communes[i];
  const r = reperes[i];
  const essais = [r.slice(0, 2), [r[0] + 0.01, r[1]], [(r[2] + r[4]) / 2, (r[3] + r[5]) / 2], [r[0] + 0.01, r[1] - 0.01]];
  if (r[1] < 43) essais.unshift([r[0] + 0.05, r[1] - 0.17], [r[0] + 0.08, r[1] - 0.15], [r[0] + 0.03, r[1] - 0.15], [r[0] + 0.06, r[1] - 0.2]);
  for (const [lon, lat] of essais) {
    await ouvrir(pg, ch);
    let { x, y } = ecran(lon, lat);
    if (lat < 43) {
      await pg.mouse.move(W / 2, 600);
      await pg.mouse.down();
      await pg.mouse.move(W / 2, 300, { steps: 30 });
      await pg.waitForTimeout(500);
      await pg.mouse.up();
      await pg.waitForTimeout(1000);
      y -= 300;
    }
    await pg.mouse.move(x, y);
    for (let k = 0; k < 12; k++) { await pg.mouse.wheel(0, -300); await pg.waitForTimeout(60); }
    await pg.waitForTimeout(1500);
    await pg.mouse.click(x, y);
    if (!(await fiche(pg).waitFor({ timeout: 5000 }).then(() => true, () => false))) continue;
    const titre = nbsp(await pg.locator('#titre-fiche').innerText()).trim();
    if (titre === `${nom} (${dep})`) {
      await fiche(pg).getByText(/^Temps en voiture/).waitFor({ timeout: 20000 });
      await pg.mouse.move(0, 0);
      await pg.waitForTimeout(1500);
      return;
    }
    journal('  essai raté pour', code, '→', titre);
  }
  throw new Error(`commune ${code} non choisie`);
}
/** Ce que la fiche dit : passe ou non, ses raisons, ses lignes de services, ses phrases. */
async function lireFiche(pg) {
  const t = (await fiche(pg).locator('h3, p, li').allTextContents()).map((x) => nbsp(x).replace(/\s+/g, ' ').trim());
  const i = t.indexOf('Ne passe pas tes critères');
  const j = t.indexOf('Services en voiture');
  return {
    passe: i < 0,
    raisons: i < 0 ? [] : t.slice(i + 1).filter((x) => x.includes('plafond') || x.includes('aucune') || x.includes('sans habitant') || x.includes('pas de chiffre')),
    services: j < 0 ? [] : t.slice(j + 1, j + 11),
    phrases: j < 0 ? [] : t.slice(j + 11).map((x) => x.slice(0, 60)),
  };
}
/** Capture de la fiche en bureau, puis à 390 × 844 (la fiche passe dans la feuille) et son bloc seul en fenêtre haute. */
async function capturesFiche(pg, nom) {
  await pg.screenshot({ path: `${OUT}/T4-${nom}-1440x900.png` });
  await pg.setViewportSize({ width: 390, height: 844 });
  await pg.waitForTimeout(1200);
  await fiche(pg).getByRole('heading', { level: 3, name: 'Services en voiture' }).evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await pg.waitForTimeout(500);
  await pg.screenshot({ path: `${OUT}/T4-${nom}-390x844.png` });
  await pg.setViewportSize({ width: W, height: H });
  await pg.waitForTimeout(800);
}

export { navigateur, journal, nbsp, W, H, chemin, fiche, reglagesZone, temps, niveau, typeGare, titreServices, categorie, curseur, etatReglages, bas, ouvrir, choisir, lireFiche, OUT, BASE };
