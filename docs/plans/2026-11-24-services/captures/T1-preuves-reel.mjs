// Tâche 1 de services : preuve sur les vraies données, version construite servie par `npx vite preview --port 4180`.
// /?loyer=1200 (rien de coché) : fiches d'Auch, Mende, L'Île-d'Yeu et Ajaccio, en bureau (page entière) et à 390 px (le bloc
// « Services en voiture », comme les captures F-fiche-*-390 du prototype) ; relevé du réseau (services.json demandé après la
// carte prête) ; pied de page ; une fiche avec un proche (vrai service IGN, comme le site). Choix d'une commune repris de
// docs/plans/2026-11-21-emploi/captures/T2-preuves-reel.mjs (zoom à la molette, clic, titre vérifié) ; à 390 px, la fiche
// choisie en bureau est gardée quand la fenêtre se rétrécit (même page, même état).
// Lancer : OUT=<dossier des captures> node docs/plans/2026-11-24-services/captures/T1-preuves-reel.mjs
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
// Relevé : l'instant où la carte devient prête (attribut data-carte-prete), en temps de la page.
await p.addInitScript(() => {
  const w = window;
  w.cartePreteA = null;
  new MutationObserver(() => {
    const c = document.querySelector('[data-testid="carte"][data-carte-prete="1"]');
    if (c && w.cartePreteA == null) w.cartePreteA = performance.now();
  }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-carte-prete'] });
});
const fiche = () => p.getByRole('region', { name: /\(\w+\)$/ }); // \w : départements 2A et 2B
const bloc = () => fiche().locator('div').filter({ has: p.getByRole('heading', { name: 'Services en voiture' }) }).last();

async function ouvrir(chemin) {
  for (let essai = 0; essai < 3; essai++) {
    await p.setViewportSize({ width: W, height: H });
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
/** Ouvre `chemin`, choisit la commune `code` sur la carte, vérifie le titre. */
async function choisir(chemin, code) {
  // Ajaccio : la Corse tombe derrière les mentions du bas ; on la prend dans la liste d'une adresse qui ne garde que
  // quelques villes moyennes denses au bord de la mer et près de la montagne (vérifié sur le titre comme les autres).
  if (code === '2A004') {
    await ouvrir('/?loyer=1200&mer=10&montagne=10&taille=ville-moyenne&env=ville-dense');
    journal('  liste pour Ajaccio :', nbsp(await p.getByRole('region', { name: 'Les 10 premières' }).innerText()).replace(/\n/g, ' | ').slice(0, 300));
    await p.getByRole('region', { name: 'Les 10 premières' }).getByRole('listitem').first().getByRole('button').first().click();
    await fiche().waitFor({ timeout: 20000 });
    journal('  titre :', nbsp(await p.locator('#titre-fiche').innerText()));
    await fiche().getByText(/^Temps en voiture/).waitFor({ timeout: 20000 });
    await p.mouse.move(0, 0);
    await p.waitForTimeout(1500);
    return;
  }
  const i = communes.findIndex((c) => c[0] === code);
  const [, nom, dep] = communes[i];
  const r = reperes[i];
  const essais = [r.slice(0, 2), [r[0] + 0.01, r[1]], [(r[2] + r[4]) / 2, (r[3] + r[5]) / 2], [r[0] + 0.01, r[1] - 0.01]];
  for (const [lon, lat] of essais) {
    await ouvrir(chemin);
    let { x, y } = ecran(lon, lat);
    // La Corse tombe derrière les mentions du bas : la carte est d'abord glissée de 300 px vers le haut, lentement.
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
/** Les lignes du bloc, lues comme un lecteur d'écran (texte de chaque élément, sans les retours de la mise en page). */
const lignesBloc = async () => (await bloc().locator('h3, li, p').allTextContents()).map((t) => nbsp(t).replace(/\s+/g, ' ').trim());

const CHEMIN = '/?loyer=1200';
await ouvrir(CHEMIN);
journal(`${CHEMIN} → ${new URL(p.url()).search}`);
// Relevé réseau de la première ouverture : début de chaque demande de données et instant de la carte prête.
const releve = await p.evaluate(() => ({
  cartePreteA: window.cartePreteA,
  demandes: performance.getEntriesByType('resource').filter((r) => r.name.includes('/data/')).map((r) => ({ nom: new URL(r.name).pathname, debut: r.startTime, fin: r.responseEnd, octets: r.transferSize })),
}));
journal(`carte prête à ${releve.cartePreteA?.toFixed(0)} ms`);
for (const d of releve.demandes) journal(`  ${d.nom} : demandé à ${d.debut.toFixed(0)} ms, reçu à ${d.fin.toFixed(0)} ms (${d.octets} octets transférés)`);
const pied = p.getByRole('contentinfo').filter({ visible: true }).first();
journal('pied de page :', nbsp(await pied.innerText()));
await pied.screenshot({ path: `${OUT}/T1-pied-de-page-${W}x${H}.png` });

for (const [code, nom] of [['32013', 'auch'], ['48095', 'mende'], ['85113', 'ile-d-yeu'], ['2A004', 'ajaccio']]) {
  await choisir(CHEMIN, code);
  journal(`fiche ${code} (${nom}) :`, JSON.stringify(await lignesBloc()));
  await p.screenshot({ path: `${OUT}/T1-fiche-${nom}-${W}x${H}.png` });
  // 390 px : même page, la fiche passe dans la feuille ; capture du bloc seul, fenêtre haute (leçon 2026-11-21).
  await p.setViewportSize({ width: 390, height: 844 });
  await p.waitForTimeout(1500);
  await bloc().scrollIntoViewIfNeeded();
  await p.screenshot({ path: `${OUT}/T1-fiche-${nom}-390x844.png` });
  await p.setViewportSize({ width: 390, height: 2400 });
  await p.waitForTimeout(800);
  await bloc().screenshot({ path: `${OUT}/T1-bloc-${nom}-390.png` });
}

// Une fiche avec un proche (bureau) : « Toulouse », première suggestion, « Ajouter », prêt ; puis la fiche d'Auch.
await ouvrir(CHEMIN);
const zone = p.getByRole('region', { name: 'Tes proches' });
const champ = zone.getByRole('textbox', { name: 'Adresse ou ville' });
if (!(await champ.isVisible())) await zone.getByRole('button', { name: '+ Ajouter un proche' }).click();
await champ.fill('Toulouse');
const suggestion = zone.getByRole('button', { name: /Toulouse/ }).first();
await suggestion.waitFor({ timeout: 20000 });
await suggestion.click();
await zone.getByRole('button', { name: 'Ajouter', exact: true }).click();
await p.getByRole('slider', { name: /^Plafond de / }).waitFor({ timeout: 120000 });
journal('proche prêt');
await choisir(CHEMIN, '32013');
const t = (await fiche().locator('h3, p, li').allTextContents()).map((x) => nbsp(x).replace(/\s+/g, ' ').trim());
journal('fiche avec un proche, sous le chômage :', JSON.stringify(t.slice(t.findIndex((x) => x.startsWith('Chômage :')) + 1, t.findIndex((x) => x.startsWith('Chômage :')) + 6)));
await fiche().getByRole('heading', { name: 'Tes proches' }).scrollIntoViewIfNeeded();
await p.screenshot({ path: `${OUT}/T1-fiche-auch-proche-${W}x${H}.png` });
await navigateur.close();
