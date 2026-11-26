// Révision D19, D20 de services, tâche 2 : la vérification de bout en bout (details.md, étapes 1 à 8), en local sur la
// version construite servie par `npx vite preview --port 4180` (vraies données), en bureau 1 440 × 900 (souris) et à
// 390 × 844 (toucher) ; plus l'ancien lien `services=commerce:5,medecin:10` (H203, AC-20).
// Copié de docs/plans/2026-11-24-services/captures/T4-bout-en-bout.mjs, adapté : 11 services dans la fiche, étape 5
// (urgences) ajoutée, communes choisies par la recherche (« Chercher une commune ») au lieu d'un clic sur la carte, et
// raisons lues seulement entre « Ne passe pas tes critères » et le bloc des temps (le script d'origine comptait aussi les
// lignes du bloc des temps qui disent « aucune » ou « pas de chiffre »).
// Lancer : OUT=<dossier des captures> node docs/plans/2026-11-26-services-revision/captures/T2-bout-en-bout.mjs
import { readFileSync } from 'node:fs';
import { chromium } from '/Users/mouga/git-repository/carte-ou-vivre/node_modules/playwright/index.mjs';
const BASE = process.env.BASE ?? 'http://localhost:4180';
const OUT = process.env.OUT;
const communes = JSON.parse(readFileSync('/Users/mouga/git-repository/carte-ou-vivre/public/data/communes.json', 'utf8')).communes;
const navigateur = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const journal = (...a) => console.log(new Date().toLocaleTimeString('fr-FR'), ...a);
const nbsp = (t) => (t ?? '').replace(/[  ]/g, ' ');
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
const loupe = (pg) => pg.getByRole('button', { name: 'Chercher une commune', exact: true });
const champ = (pg) => pg.getByRole('combobox', { name: 'Chercher une commune', exact: true });
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

/** Ouvre `ch` et choisit la commune `code` par la recherche ; vérifie le titre de la fiche. */
async function choisir(pg, ch, code) {
  const [, nom, dep] = communes.find((c) => c[0] === code);
  await ouvrir(pg, ch);
  await loupe(pg).click();
  await champ(pg).fill(nom);
  await pg.getByRole('listbox', { name: 'Suggestions de communes' }).getByRole('option', { name: `${nom} (${dep})`, exact: true }).click();
  await fiche(pg).waitFor({ timeout: 10000 });
  const titre = nbsp(await pg.locator('#titre-fiche').innerText()).trim();
  if (titre !== `${nom} (${dep})`) throw new Error(`fiche ${titre} au lieu de ${nom} (${dep})`);
  await fiche(pg).getByRole('heading', { level: 3, name: 'Services en voiture' }).waitFor({ timeout: 20000 });
  await pg.mouse.move(0, 0);
  await pg.waitForTimeout(1500);
  journal(`  ${nom} (${dep}) choisie par la recherche, adresse ${chemin(pg)}`);
}
/** Ce que la fiche dit : passe ou non, ses raisons, ses 11 lignes de services, ses phrases. */
async function lireFiche(pg) {
  const t = (await fiche(pg).locator('h3, p, li').allTextContents()).map((x) => nbsp(x).replace(/\s+/g, ' ').trim());
  const i = t.indexOf('Ne passe pas tes critères');
  const j = t.indexOf('Services en voiture');
  return {
    passe: i < 0,
    // Raisons : entre « Ne passe pas tes critères » et le bloc des temps, seulement.
    raisons: i < 0 ? [] : t.slice(i + 1, j > i ? j : undefined).filter((x) => x.includes('plafond') || x.includes('aucune') || x.includes('sans habitant') || x.includes('pas de chiffre')),
    services: j < 0 ? [] : t.slice(j + 1, j + 12),
    phrases: j < 0 ? [] : t.slice(j + 12).map((x) => x.slice(0, 90)),
  };
}
// Page au toucher à 390 × 844, pour les fiches : la commune y est choisie de nouveau par la recherche (une fiche choisie
// par la recherche en bureau ne passe pas dans la feuille quand la fenêtre se rétrécit, contrairement au clic sur la
// carte du script d'origine).
const mf = await (await navigateur.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 })).newPage();
/** Capture de la fiche en bureau, puis la même adresse et la même commune à 390 × 844 (bloc des temps en haut). */
async function capturesFiche(pg, nom, ch, code) {
  await cliche(pg, nom);
  await choisir(mf, ch, code);
  journal(`  à 390 × 844 : ${JSON.stringify(await lireFiche(mf))}`);
  await fiche(mf).getByRole('heading', { level: 3, name: 'Services en voiture' }).evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await mf.waitForTimeout(500);
  await mf.screenshot({ path: `${OUT}/T2-${nom}-390x844.png` });
}
const ANCIEN = '/?loyer=1200&services=commerce:5,medecin:10';
/** Capture de la page en bureau, en JPEG (une capture PNG de la carte en relief dépasse les 600 Ko du crochet de `docs/`). */
const cliche = (pg, nom) => pg.screenshot({ path: `${OUT}/T2-${nom}-1440x900.jpg`, type: 'jpeg', quality: 80 });

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
await cliche(b, 'e1-categorie');
await choisir(b, '/', '32013');
journal('étape 1 : fiche d’Auch :', JSON.stringify(await lireFiche(b)));
await capturesFiche(b, 'e1-auch', '/', '32013');

// Étapes 2 à 5, gestes au panneau.
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
const u3 = chemin(b);
journal('étape 3 : « École », « Collège », « 20 min » →', u3);
await temps(b, 'Gare', 30).click();
await typeGare(b, 'Régionale').click();
await b.waitForTimeout(1200);
const u4 = chemin(b);
journal('étape 4 : « 30 min » pour « Gare », « Régionale » →', u4, '· réglages :', JSON.stringify(await etatReglages(b)));
await temps(b, 'Urgences', 30).click();
await b.waitForTimeout(1200);
const u5 = chemin(b);
journal('étape 5 : « 30 min » pour « Urgences » →', u5, '· réglages :', JSON.stringify(await etatReglages(b)));
await bas(b);
await b.mouse.move(0, 0);
await b.waitForTimeout(400);
await cliche(b, 'e5-reglages');

// Étape 2 (suite) : Bordeaux et Mende restent colorées avec medecin:10.
for (const [code, nom] of [['33063', 'bordeaux'], ['48095', 'mende']]) {
  await choisir(b, u2, code);
  journal(`étape 2 : ${u2} · fiche ${nom} :`, JSON.stringify(await lireFiche(b)));
  await capturesFiche(b, `e2-${nom}`, u2, code);
}
// Étape 3 : la catégorie après les gestes (adresse seule, capture des réglages).
await ouvrir(b, u3);
await bas(b);
await b.mouse.move(0, 0);
await b.waitForTimeout(400);
await cliche(b, 'e3-reglages');
// Étape 4 (suite) : Mende et Ajaccio écartées par la gare régionale.
for (const [code, nom] of [['48095', 'mende'], ['2A004', 'ajaccio']]) {
  await choisir(b, u4, code);
  journal(`étape 4 : ${u4} · fiche ${nom} :`, JSON.stringify(await lireFiche(b)));
  await capturesFiche(b, `e4-${nom}`, u4, code);
}
// Étape 5 (suite) : Saint-Véran écartée par les urgences, Auch reste colorée.
for (const [code, nom] of [['05157', 'saint-veran'], ['32013', 'auch']]) {
  await choisir(b, u5, code);
  const lu = await lireFiche(b);
  journal(`étape 5 : ${u5} · fiche ${nom} :`, JSON.stringify(lu));
  if (code === '05157') journal('étape 5 : raison des urgences présente :', lu.raisons.includes('Urgences 55 min : au-dessus de ton plafond de 30 min'));
  await capturesFiche(b, `e5-${nom}`, u5, code);
}
// Étape 6 : L'Île-d'Yeu.
await choisir(b, u5, '85113');
journal('étape 6 : fiche de L’Île-d’Yeu :', JSON.stringify(await lireFiche(b)));
await capturesFiche(b, 'e6-ile-d-yeu', u5, '85113');

// Étape 7 : l'adresse copiée dans un nouvel onglet.
await ouvrir(b, u5);
const avant = await etatReglages(b);
const b2 = await b.context().newPage();
await ouvrir(b2, u5);
const apres = await etatReglages(b2);
journal('étape 7 : onglet 1', chemin(b), JSON.stringify(avant), '· nouvel onglet', chemin(b2), JSON.stringify(apres), '· identiques :', JSON.stringify(avant) === JSON.stringify(apres) && chemin(b) === chemin(b2));
await bas(b2);
await b2.mouse.move(0, 0);
await b2.waitForTimeout(400);
await cliche(b2, 'e7-nouvel-onglet');
await b2.close();

// Étape 8 : le pied de page (mentions en bas du panneau de réglages).
const piedB = b.getByRole('contentinfo').filter({ visible: true }).first();
await piedB.evaluate((el) => el.scrollIntoView({ block: 'end' }));
await b.waitForTimeout(400);
const mentionsB = nbsp(await piedB.innerText());
journal('étape 8 : pied de page, Insee :', mentionsB.includes("Temps d'accès aux services : Insee"), '· gares :', mentionsB.includes('Gares grandes lignes : horaires SNCF'));
await piedB.screenshot({ path: `${OUT}/T2-e8-pied-de-page-1440x900.png` });

// Ancien lien `commerce` (H203, AC-20).
await ouvrir(b, ANCIEN);
await b.waitForTimeout(800);
journal('ancien lien :', ANCIEN, '→', chemin(b), '· réglages :', JSON.stringify(await etatReglages(b)), '· alertes :', JSON.stringify((await b.getByRole('alert').allTextContents()).map(nbsp)));
await bas(b);
await b.mouse.move(0, 0);
await b.waitForTimeout(400);
await cliche(b, 'ancien-lien-commerce');
await b.context().close();
await mf.context().close();

// ---------------------------------------------------------------------------------------------------------------------
// 390 × 844, au toucher.
journal('=== Téléphone 390 × 844, au toucher ===');
const m = await (await navigateur.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 })).newPage();
const dansEcran = async (loc) => {
  const x = await loc.boundingBox();
  return x && x.y >= 0 && x.y + x.height <= 844 && x.x >= 0 && x.x + x.width <= 390;
};
await ouvrir(m, '/');
const titresM = (await reglagesZone(m).getByRole('heading', { level: 2 }).allTextContents()).map((x) => nbsp(x).trim());
journal('étape 1 : / →', chemin(m), '· catégories :', titresM.join(' > '), '· réglages :', JSON.stringify(await etatReglages(m)));
await titreServices(m).evaluate((el) => el.scrollIntoView({ block: 'start' }));
await m.waitForTimeout(500);
await m.screenshot({ path: `${OUT}/T2-e1-categorie-390x844.png` });

// Étape 2 : le pouce du curseur du loyer glissé au doigt jusqu'au bord droit (« Sans limite »), puis les gestes.
await curseur(m).evaluate((el) => el.scrollIntoView({ block: 'center' }));
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
const gestes = [['Médecin 10', temps(m, 'Médecin', 10)], ['École', niveau(m, 'École')], ['Collège', niveau(m, 'Collège')],
  ['Scolarité 20', temps(m, 'Scolarité', 20)], ['Gare 30', temps(m, 'Gare', 30)], ['Régionale', typeGare(m, 'Régionale')],
  ['Urgences 30', temps(m, 'Urgences', 30)]];
for (const [nom, loc] of gestes) {
  await loc.scrollIntoViewIfNeeded();
  await loc.tap();
  await m.waitForTimeout(600);
  journal(`  toucher « ${nom} » : coché ${await loc.getAttribute('aria-pressed')}, entier à l'écran ${await dansEcran(loc)} → ${chemin(m)}`);
  if (nom === 'Médecin 10') journal('étape 2 : loyer', await curseur(m).getAttribute('aria-valuetext'), '→', chemin(m), '· même adresse qu’en bureau :', chemin(m) === u2);
  if (nom === 'Scolarité 20') journal('étape 3 →', chemin(m), '· même adresse qu’en bureau :', chemin(m) === u3);
  if (nom === 'Régionale') journal('étape 4 →', chemin(m), '· même adresse qu’en bureau :', chemin(m) === u4);
}
const u5m = chemin(m);
journal('étape 5 →', u5m, '· réglages :', JSON.stringify(await etatReglages(m)), '· même adresse qu’en bureau :', u5m === u5);
await titreServices(m).evaluate((el) => el.scrollIntoView({ block: 'start' }));
await m.waitForTimeout(500);
await m.screenshot({ path: `${OUT}/T2-e5-categorie-390x844.png` });

// Étape 7 : nouvel onglet à 390.
const m2 = await m.context().newPage();
await ouvrir(m2, u5m);
const avantM = await etatReglages(m);
const apresM = await etatReglages(m2);
journal('étape 7 : nouvel onglet', chemin(m2), JSON.stringify(apresM), '· identiques :', JSON.stringify(avantM) === JSON.stringify(apresM) && chemin(m2) === u5m);
await titreServices(m2).evaluate((el) => el.scrollIntoView({ block: 'start' }));
await m2.waitForTimeout(500);
await m2.screenshot({ path: `${OUT}/T2-e7-nouvel-onglet-390x844.png` });
await m2.close();

// Étape 8 : le pied de page à 390.
const piedM = m.getByRole('contentinfo').filter({ visible: true }).first();
await piedM.evaluate((el) => el.scrollIntoView({ block: 'end' }));
await m.waitForTimeout(400);
const mentionsM = nbsp(await piedM.innerText());
journal('étape 8 : pied de page, Insee :', mentionsM.includes("Temps d'accès aux services : Insee"), '· gares :', mentionsM.includes('Gares grandes lignes : horaires SNCF'));
await m.screenshot({ path: `${OUT}/T2-e8-pied-de-page-390x844.png` });

// Ancien lien `commerce` à 390.
await ouvrir(m, ANCIEN);
await m.waitForTimeout(800);
journal('ancien lien :', ANCIEN, '→', chemin(m), '· réglages :', JSON.stringify(await etatReglages(m)));
await titreServices(m).evaluate((el) => el.scrollIntoView({ block: 'start' }));
await m.waitForTimeout(500);
await m.screenshot({ path: `${OUT}/T2-ancien-lien-commerce-390x844.png` });
await m.context().close();
await navigateur.close();
