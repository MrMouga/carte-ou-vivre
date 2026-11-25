// Tâche 4 de services : la vérification de bout en bout (details.md, étapes 1 à 7), en local sur la version construite
// servie par `npx vite preview --port 4180` (vraies données), en bureau 1 440 × 900 (souris) et à 390 × 844 (toucher) ;
// puis l'état d'erreur du fichier des temps (catégorie et fiche) et l'ouverture à 375 × 548 (H48).
// Choix d'une commune sur la carte repris de T2-preuves-reel.mjs (bureau : zoom à la molette, clic, titre vérifié) ; à
// 390 px, la fiche choisie en bureau passe dans la feuille quand la fenêtre se rétrécit (comme T1-preuves-reel.mjs).
// Lancer : OUT=<dossier des captures> node docs/plans/2026-11-24-services/captures/T4-bout-en-bout.mjs
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

// ---------------------------------------------------------------------------------------------------------------------
// Bureau, à la souris.
const b = await (await navigateur.newContext({ viewport: { width: W, height: H } })).newPage();
journal('=== Bureau 1 440 × 900 ===');
// Étape 1.
await ouvrir(b, '/');
const titresB = (await reglagesZone(b).getByRole('heading', { level: 2 }).allTextContents()).map((x) => nbsp(x).trim());
journal('étape 1 : / →', chemin(b), '· catégories :', titresB.join(' > '), '· réglages :', JSON.stringify(await etatReglages(b)));
await bas(b);
await b.mouse.move(0, 0);
await b.waitForTimeout(400);
await b.screenshot({ path: `${OUT}/T4-e1-categorie-1440x900.png` });
await choisir(b, '/?loyer=1200', '32013');
journal('étape 1 : fiche d’Auch :', JSON.stringify(await lireFiche(b)));
await capturesFiche(b, 'e1-auch');

// Étapes 2 à 4, gestes au panneau.
await ouvrir(b, '/?loyer=1200');
await curseur(b).focus();
await b.keyboard.press('End');
await b.waitForTimeout(500);
await temps(b, 'Médecin', 10).click();
await b.waitForTimeout(800);
const u2 = chemin(b);
journal('étape 2 : loyer', await curseur(b).getAttribute('aria-valuetext'), '+ « 10 min » pour « Médecin » →', u2);
await niveau(b, 'École').click();
await niveau(b, 'Collège').click();
await temps(b, 'Scolarité', 20).click();
await b.waitForTimeout(800);
journal('étape 3 : « École », « Collège », « 20 min » →', chemin(b));
await temps(b, 'Gare', 30).click();
await typeGare(b, 'Régionale').click();
await b.waitForTimeout(1200);
const u4 = chemin(b);
journal('étape 4 : « 30 min » pour « Gare », « Régionale » →', u4, '· réglages :', JSON.stringify(await etatReglages(b)));
await bas(b);
await b.mouse.move(0, 0);
await b.waitForTimeout(400);
await b.screenshot({ path: `${OUT}/T4-e4-reglages-1440x900.png` });

// Étape 2 (suite) : Bordeaux et Mende restent colorées avec medecin:10.
for (const [code, nom] of [['33063', 'bordeaux'], ['48095', 'mende']]) {
  await choisir(b, u2, code);
  journal(`étape 2 : ${u2} · fiche ${nom} :`, JSON.stringify(await lireFiche(b)));
  await capturesFiche(b, `e2-${nom}`);
}
// Étape 4 (suite) : Mende et Ajaccio écartées par la gare régionale.
for (const [code, nom] of [['48095', 'mende'], ['2A004', 'ajaccio']]) {
  await choisir(b, u4, code);
  journal(`étape 4 : ${u4} · fiche ${nom} :`, JSON.stringify(await lireFiche(b)));
  await capturesFiche(b, `e4-${nom}`);
}
// Étape 5 : L'Île-d'Yeu.
await choisir(b, u4, '85113');
journal('étape 5 : fiche de L’Île-d’Yeu :', JSON.stringify(await lireFiche(b)));
await capturesFiche(b, 'e5-ile-d-yeu');

// Étape 6 : l'adresse copiée dans un nouvel onglet.
await ouvrir(b, u4);
const avant = await etatReglages(b);
const b2 = await b.context().newPage();
await ouvrir(b2, u4);
const apres = await etatReglages(b2);
journal('étape 6 : onglet 1', chemin(b), JSON.stringify(avant), '· nouvel onglet', chemin(b2), JSON.stringify(apres), '· identiques :', JSON.stringify(avant) === JSON.stringify(apres) && chemin(b) === chemin(b2));
await b2.mouse.move(0, 0);
await b2.screenshot({ path: `${OUT}/T4-e6-nouvel-onglet-1440x900.png` });
await b2.close();

// Étape 7 : le pied de page.
const piedB = b.getByRole('contentinfo').filter({ visible: true }).first();
const mentionsB = nbsp(await piedB.innerText());
journal('étape 7 : pied de page, Insee :', mentionsB.includes("Temps d'accès aux services : Insee"), '· gares :', mentionsB.includes('Gares grandes lignes : horaires SNCF'));
await piedB.screenshot({ path: `${OUT}/T4-e7-pied-de-page-1440x900.png` });

// Erreur du fichier des temps (R57) : catégorie et fiche.
await b.route('**/data/services.json', (r) => r.fulfill({ status: 500, body: '' }));
await b.goto(BASE + '/?loyer=1200');
await b.locator('[data-testid="carte"][data-carte-prete="1"]').waitFor({ timeout: 60000 });
await reglagesZone(b).getByRole('alert').waitFor({ timeout: 20000 });
await b.waitForTimeout(1500);
await bas(b);
await b.mouse.move(0, 0);
await b.waitForTimeout(400);
journal('erreur : alertes', JSON.stringify((await b.getByRole('alert').allTextContents()).map(nbsp)));
await b.screenshot({ path: `${OUT}/T4-erreur-categorie-1440x900.png` });
await b.getByRole('region', { name: 'Les 10 premières' }).getByRole('listitem').first().getByRole('button').first().click();
await fiche(b).getByRole('alert').waitFor({ timeout: 10000 });
await b.mouse.move(0, 0);
await b.waitForTimeout(500);
journal('erreur : fiche', nbsp(await b.locator('#titre-fiche').innerText()), '· alertes', JSON.stringify((await b.getByRole('alert').allTextContents()).map(nbsp)));
await b.screenshot({ path: `${OUT}/T4-erreur-fiche-1440x900.png` });
await b.unroute('**/data/services.json');
await categorie(b).getByRole('button', { name: 'Réessayer' }).click();
await b.waitForFunction(() => {
  const x = document.querySelector('[aria-label="Type de gare"] button');
  return x && !x.disabled;
}, null, { timeout: 30000 });
journal('erreur : après « Réessayer » de la catégorie, alertes', (await b.getByRole('alert').count()), '· focus sur', await b.evaluate(() => document.activeElement?.textContent?.trim()));
await b.context().close();

// ---------------------------------------------------------------------------------------------------------------------
// 390 × 844, au toucher.
journal('=== Téléphone 390 × 844, au toucher ===');
const m = await (await navigateur.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 })).newPage();
const dansEcran = async (loc) => {
  const x = await loc.boundingBox();
  return x && x.y >= 0 && x.y + x.height <= 844 && x.x >= 0 && x.x + x.width <= 390;
};
await ouvrir(m, '/');
const titresM = (await reglagesZone(m).getByRole('heading', { level: 2 }).allTextContents()).map((x) => nbsp(x).trim());
journal('étape 1 : / →', chemin(m), '· catégories :', titresM.join(' > '), '· réglages :', JSON.stringify(await etatReglages(m)));
await titreServices(m).evaluate((el) => el.scrollIntoView({ block: 'start' }));
await m.waitForTimeout(500);
await m.screenshot({ path: `${OUT}/T4-e1-categorie-390x844.png` });

// Étape 2 : le pouce du curseur du loyer glissé au doigt jusqu'au bord droit (« Sans limite » ; CDP, comme la leçon
// 2026-10-15-rangee-qui-defile-focus-clavier, sonde scripts/sonde-curseur-toucher.mjs), puis « 10 min » pour « Médecin ».
await curseur(m).evaluate((el) => el.scrollIntoView({ block: 'center' })); // l'onglet était défilé jusqu'à « Services »
await m.waitForTimeout(400);
const pouce = await curseur(m).boundingBox();
const cdp = await m.context().newCDPSession(m);
const doigt = (x) => [{ x, y: pouce.y + pouce.height / 2, id: 1 }];
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: doigt(pouce.x + pouce.width / 2) });
for (let x = pouce.x + pouce.width / 2; x < 386; x += 15) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: doigt(x) });
  await m.waitForTimeout(16);
}
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
await m.waitForTimeout(800);
for (const [nom, loc] of [['Médecin 10', temps(m, 'Médecin', 10)], ['École', niveau(m, 'École')], ['Collège', niveau(m, 'Collège')], ['Scolarité 20', temps(m, 'Scolarité', 20)], ['Gare 30', temps(m, 'Gare', 30)], ['Régionale', typeGare(m, 'Régionale')]]) {
  await loc.tap();
  await m.waitForTimeout(600);
  journal(`  toucher « ${nom} » : coché ${await loc.getAttribute('aria-pressed')}, entier à l'écran ${await dansEcran(loc)} → ${chemin(m)}`);
  if (nom === 'Médecin 10') journal('étape 2 : loyer', await curseur(m).getAttribute('aria-valuetext'), '→', chemin(m));
  if (nom === 'Scolarité 20') journal('étape 3 →', chemin(m));
}
const u4m = chemin(m);
journal('étape 4 →', u4m, '· réglages :', JSON.stringify(await etatReglages(m)), '· même adresse qu’en bureau :', u4m === u4);
await titreServices(m).evaluate((el) => el.scrollIntoView({ block: 'start' }));
await m.waitForTimeout(500);
await m.screenshot({ path: `${OUT}/T4-e4-categorie-390x844.png` });
// Repliée : le résumé.
await titreServices(m).getByRole('button').tap();
await m.waitForTimeout(400);
journal('  « Services » repliée :', nbsp(await titreServices(m).innerText()).replace(/\n/g, ' · '));
await titreServices(m).getByRole('button').tap();

// Étape 6 : nouvel onglet à 390.
const m2 = await m.context().newPage();
await ouvrir(m2, u4m);
const avantM = await etatReglages(m);
const apresM = await etatReglages(m2);
journal('étape 6 : nouvel onglet', chemin(m2), JSON.stringify(apresM), '· identiques :', JSON.stringify(avantM) === JSON.stringify(apresM) && chemin(m2) === u4m);
await titreServices(m2).evaluate((el) => el.scrollIntoView({ block: 'start' }));
await m2.waitForTimeout(500);
await m2.screenshot({ path: `${OUT}/T4-e6-nouvel-onglet-390x844.png` });
await m2.close();

// Étape 7 : le pied de page à 390.
const piedM = m.getByRole('contentinfo').filter({ visible: true }).first();
await piedM.evaluate((el) => el.scrollIntoView({ block: 'end' }));
await m.waitForTimeout(400);
const mentionsM = nbsp(await piedM.innerText());
journal('étape 7 : pied de page, Insee :', mentionsM.includes("Temps d'accès aux services : Insee"), '· gares :', mentionsM.includes('Gares grandes lignes : horaires SNCF'));
await m.screenshot({ path: `${OUT}/T4-e7-pied-de-page-390x844.png` });

// Erreur à 390 : la catégorie.
await m.route('**/data/services.json', (r) => r.fulfill({ status: 500, body: '' }));
await m.goto(BASE + '/?loyer=1200');
await m.locator('[data-testid="carte"][data-carte-prete="1"]').waitFor({ timeout: 60000 });
await reglagesZone(m).getByRole('alert').waitFor({ timeout: 20000 });
await m.waitForTimeout(1500);
await titreServices(m).evaluate((el) => el.scrollIntoView({ block: 'start' }));
await m.waitForTimeout(400);
await m.screenshot({ path: `${OUT}/T4-erreur-categorie-390x844.png` });
await m.context().close();

// 375 × 548 (H48) : le curseur du loyer visible à l'ouverture.
const t = await (await navigateur.newContext({ viewport: { width: 375, height: 548 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 })).newPage();
await ouvrir(t, '/');
const f = await t.getByTestId('feuille').boundingBox();
const c = await curseur(t).boundingBox();
journal('375 × 548 : feuille y', f.y.toFixed(0), '· curseur', c.y.toFixed(0), 'à', (c.y + c.height).toFixed(0), '· entier dans la feuille et l’écran :', c.y >= f.y && c.y + c.height <= 548);
await t.screenshot({ path: `${OUT}/T4-375x548-ouverture.png` });
await t.context().close();
await navigateur.close();
