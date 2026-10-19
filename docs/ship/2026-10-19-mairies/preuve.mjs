// /ship de mairies (2026-10-19), repris de captures/T4-bout-en-bout.mjs du plan : vérification de bout en bout de details.md
// (étapes 1 à 5) SUR LE SITE EN LIGNE (vraies données, vrai fond Plan IGN), après D2 amendée (LFI à gauche, 6 pastilles) ;
// étape 1 comparée à la liste d'avant la tranche relevée en ligne par T4 (T4-bout-en-bout-sortie.txt) ; en 1 440 × 900 et à 390 × 844 ; puis les 10 villes de
// mesure-tache-0.md relues sur leur fiche, les 10 premières de chaque bloc relues dans la liste, et l'ouverture à 375 × 548.
// Chromium de Playwright avec rendu WebGL logiciel (comme les tests). Captures écrites dans OUT ; repris de T2/T3-captures.mjs.
// Étape 1 : la liste de départ est comparée à celle de la version en ligne (LIVE, commit 3f9f616, d'avant la tranche ;
// lecture seule, aucune requête autre que GET).
// Choisir une commune : la page est rouverte, la carte zoomée à la molette sur le point de la commune (le zoom garde le point
// sous le pointeur), puis on clique au même endroit et on vérifie le titre de la fiche contre la ligne de communes.json du code
// INSEE visé (leçon du 2026-10-16) ; sinon, point d'essai suivant.
import { readFileSync } from 'node:fs';
import { chromium } from '/Users/mouga/git-repository/carte-ou-vivre/node_modules/playwright/index.mjs';
const BASE = process.env.BASE ?? 'https://ou-vivre-en-france.narnia-assistant.workers.dev';
const LIVE = process.env.LIVE ?? 'https://ou-vivre-en-france.narnia-assistant.workers.dev';
const OUT = process.env.OUT;
const RACINE = '/Users/mouga/git-repository/carte-ou-vivre/public/data/';
const communes = JSON.parse(readFileSync(RACINE + 'communes.json', 'utf8')).communes;
const reperes = JSON.parse(readFileSync(RACINE + 'reperes.json', 'utf8')).reperes;
const navigateur = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const journal = (...a) => console.log(new Date().toLocaleTimeString('fr-FR'), ...a);
const nbsp = (t) => (t ?? '').replace(/[  ]/g, ' ');
const verdict = (ok) => (ok ? 'OK' : 'ÉCART');

// Le style Plan IGN répond en 1,5 à 10 s ce soir (curl) ; au-delà de 8 s, la page prend le fond de secours (R8). Une page
// rouverte dans le même contexte trouve le style en cache : on rouvre jusqu'à deux fois, et on note le fond de chaque capture.
async function ouvrir(p, chemin, base = BASE) {
  for (let essai = 0; essai < 3; essai++) {
    await p.goto(base + chemin);
    await p.locator('[data-testid="carte"][data-carte-prete="1"]').waitFor({ timeout: 60000 });
    await p.waitForTimeout(2500); // tuiles du fond et des communes
    if (!(await p.getByText('Fond de carte indisponible').isVisible())) return;
  }
  journal('  fond de secours (IGN sans réponse en 8 s) pour', chemin);
}
/** Une page dans un contexte partagé par largeur (cache HTTP commun). */
const contextes = new Map();
async function nouvellePage(W, H) {
  const k = `${W}x${H}`;
  if (!contextes.has(k)) contextes.set(k, await navigateur.newContext({ viewport: { width: W, height: H } }));
  return contextes.get(k).newPage();
}
const mobile = (p) => p.viewportSize().width < 1024;
const adresse = (p) => new URL(p.url()).pathname + new URL(p.url()).search;
const groupe = (p) => p.getByRole('group', { name: 'Mairie élue en 2026' });
const pastille = (p, nom) => groupe(p).getByRole('button', { name: nom, exact: true });
const fiche = (p) => p.getByRole('region', { name: /\(\d+\)$/ });
const liste = (p) => p.getByRole('region', { name: 'Les 10 premières' });
const onglet = (p, nom) => p.getByRole('tab', { name: nom, exact: true });
const lignes = async (p) => (await liste(p).getByRole('button').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')))).map(nbsp);
const voirListe = async (p) => { if (mobile(p)) { await onglet(p, 'Les 10 premières').click(); await p.waitForTimeout(300); } };
const voirCriteres = async (p) => { if (mobile(p)) { await onglet(p, 'Critères').click(); await p.waitForTimeout(300); } };
async function cocher(p, nom) {
  await voirCriteres(p);
  await pastille(p, nom).evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await pastille(p, nom).click();
  await p.waitForTimeout(2000);
}
async function sansLimite(p) {
  await voirCriteres(p);
  await p.getByRole('slider', { name: 'Loyer maximum' }).focus();
  await p.keyboard.press('End');
  await p.waitForTimeout(500);
}

// Place d'ouverture d'un point : fitBounds de l'emprise des repères, avec le cadrage de la largeur (src/map/view.ts).
const mx = (lon) => (lon + 180) / 360;
const my = (lat) => (1 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) / Math.PI) / 2;
let [w, s, e, n] = [Infinity, Infinity, -Infinity, -Infinity];
for (const r of reperes) { w = Math.min(w, r[2]); s = Math.min(s, r[3]); e = Math.max(e, r[4]); n = Math.max(n, r[5]); }
const [x0, x1, y0, y1] = [mx(w), mx(e), my(n), my(s)];
function ecran(W, H, lon, lat) {
  const pad = W >= 1024
    ? { top: 16, left: 16 + 340 + 16, right: 16 + 320 + 16, bottom: 32 + 16 }
    : { top: 16, left: 16, right: 16, bottom: Math.max(H * 0.45, 338) + 16 };
  const z = Math.log2(Math.min((W - pad.left - pad.right) / ((x1 - x0) * 512), (H - pad.top - pad.bottom) / ((y1 - y0) * 512)));
  const monde = 512 * 2 ** z;
  const cx = pad.left + (W - pad.left - pad.right) / 2, cy = pad.top + (H - pad.top - pad.bottom) / 2;
  return { x: cx + (mx(lon) - (x0 + x1) / 2) * monde, y: cy + (my(lat) - (y0 + y1) / 2) * monde };
}
// Marseille et Nice : le point de la mairie est au bord de l'eau ; un point un peu à l'intérieur des terres d'abord.
const POINT = { '13055': [5.43, 43.33], '06088': [7.25, 43.72] };
/** Ouvre `chemin`, choisit la commune `code` sur la carte et renvoie le texte de sa fiche (titre vérifié). */
async function choisir(p, chemin, code) {
  const i = communes.findIndex((c) => c[0] === code);
  const [, nom, dep] = communes[i];
  const r = reperes[i];
  const essais = [POINT[code], r.slice(0, 2), [(r[2] + r[4]) / 2, (r[3] + r[5]) / 2], [r[0] + 0.01, r[1] - 0.01]].filter(Boolean);
  const { width: W, height: H } = p.viewportSize();
  for (const [lon, lat] of essais) {
    await ouvrir(p, chemin);
    await voirListe(p); // à 390 px, la feuille à sa hauteur de repos, sur la liste (leçon du 2026-10-16)
    const { x, y } = ecran(W, H, lon, lat);
    await p.mouse.move(x, y);
    for (let k = 0; k < 12; k++) { await p.mouse.wheel(0, -300); await p.waitForTimeout(60); }
    await p.waitForTimeout(1500);
    await p.mouse.click(x, y);
    const ok = await fiche(p).waitFor({ timeout: 5000 }).then(() => true, () => false);
    if (!ok) continue;
    const titre = nbsp(await p.locator('#titre-fiche').innerText());
    if (titre.trim() === `${nom} (${dep})`) {
      await p.waitForTimeout(2500); // zoom et tuiles
      return { titre, texte: nbsp(await fiche(p).innerText()) };
    }
    journal('  essai raté pour', code, '→', titre);
  }
  throw new Error(`commune ${code} non choisie`);
}
// Le titre « Ne passe pas tes critères » est en capitales par le style : innerText le rend en capitales.
const nePassePas = (t) => /ne passe pas tes critères/i.test(t);
const ligneMairie = (t) => t.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('Mairie :'));

// ---------------------------------------------------------------------------------------------------------------------
// Étapes 1 à 5, aux deux largeurs.
for (const [W, H] of [[1440, 900], [390, 844]]) {
  const p = await nouvellePage(W, H);
  const tag = `${W}x${H}`;
  journal(`===== ${tag}`);

  // 1. Ouverture.
  await ouvrir(p, '/');
  const titres = (await p.getByRole('region', { name: 'Réglages' }).getByRole('heading', { level: 2 }).allTextContents()).map((t) => nbsp(t).trim());
  const presses = await groupe(p).getByRole('button', { pressed: true }).count();
  journal('1. adresse', adresse(p), '·', verdict(adresse(p) === '/?loyer=1200'));
  journal('1. titres', titres.join(' > '), '·', verdict(titres.indexOf('Vie locale') === titres.indexOf('Cadre de vie') + 1));
  journal('1. pastilles cochées', presses, '·', verdict(presses === 0));
  await p.getByRole('heading', { level: 2, name: /^Vie locale/ }).evaluate((el, bureau) => el.scrollIntoView({ block: bureau ? 'center' : 'start' }), W >= 1024);
  await p.waitForTimeout(400);
  await p.screenshot({ path: `${OUT}/etape1-depart-${tag}.png` });
  await voirListe(p);
  const ici = await lignes(p);
  if (mobile(p)) await p.screenshot({ path: `${OUT}/etape1-liste-${tag}.png` });
  const avant = readFileSync('/Users/mouga/git-repository/carte-ou-vivre/docs/plans/2026-10-18-mairies/captures/T4-bout-en-bout-sortie.txt', 'utf8')
    .split('\n').filter((l) => l.includes('1. liste en ligne')).map((l) => JSON.parse(l.slice(l.indexOf('['))));
  const enLigne = avant[W >= 1024 ? 0 : 1]; // relevée en ligne le 2026-10-18 sur 3f9f616, avant la tranche
  journal('1. liste en ligne', JSON.stringify(ici));
  journal('1. liste d’avant la tranche', JSON.stringify(enLigne));
  journal('1. même liste qu’avant la tranche ·', verdict(ici.length === 10 && JSON.stringify(ici) === JSON.stringify(enLigne)));

  // 2. Fiche de Bordeaux.
  const b = await choisir(p, '/', '33063');
  await p.screenshot({ path: `${OUT}/etape2-fiche-bordeaux-${tag}.png` });
  journal('2.', b.titre, ligneMairie(b.texte).join(' | '), '·', verdict(ligneMairie(b.texte)[0] === 'Mairie : Centre (Union du centre) · « Faire Gagner Bordeaux »'));

  // 3. Sans limite, puis « Gauche ».
  await ouvrir(p, '/');
  await sansLimite(p);
  journal('3. sans limite', adresse(p));
  await cocher(p, 'Gauche');
  const voulue = adresse(p);
  journal('3. adresse', voulue, '·', verdict(voulue.includes('mairie=gauche')));
  await p.screenshot({ path: `${OUT}/etape3-sans-limite-gauche-${tag}.png` });
  if (mobile(p)) { await voirListe(p); await p.screenshot({ path: `${OUT}/etape3-sans-limite-gauche-liste-${tag}.png` }); }
  const raisons = {
    '75056': null, '69123': null, '13055': null,
    '33063': 'Mairie : centre, hors des mairies choisies', '06088': 'Mairie : extrême droite, hors des mairies choisies',
  };
  for (const [code, nom] of [['75056', 'paris'], ['69123', 'lyon'], ['13055', 'marseille'], ['33063', 'bordeaux'], ['06088', 'nice']]) {
    const f = await choisir(p, voulue, code);
    await p.screenshot({ path: `${OUT}/etape3-fiche-${nom}-${tag}.png` });
    const passe = !nePassePas(f.texte);
    const attendu = raisons[code];
    const ok = attendu ? !passe && f.texte.includes(attendu) : passe && !f.texte.includes('hors des mairies choisies');
    journal('3.', f.titre, passe ? 'passe (couleur neutre)' : 'ne passe pas', '·', ligneMairie(f.texte).join(' | '), '·', verdict(ok));
  }

  // 4. « Sans étiquette » en plus.
  await ouvrir(p, voulue);
  await cocher(p, 'Sans étiquette');
  journal('4. adresse', adresse(p), '·', verdict(adresse(p).includes('mairie=gauche,sans-etiquette')));
  await p.screenshot({ path: `${OUT}/etape4-gauche-sans-etiquette-${tag}.png` });
  if (mobile(p)) { await voirListe(p); await p.screenshot({ path: `${OUT}/etape4-gauche-sans-etiquette-liste-${tag}.png` }); }
  // Un village sans étiquette, Val-Cenis (73290, tâche 3) : il passe maintenant.
  const v = await choisir(p, adresse(p), '73290');
  journal('4.', v.titre, nePassePas(v.texte) ? 'ne passe pas' : 'passe (couleur neutre)', '·', ligneMairie(v.texte).join(' | '), '·', verdict(!nePassePas(v.texte)));
  await p.screenshot({ path: `${OUT}/etape4-fiche-val-cenis-${tag}.png` });

  // 5. Pied de page.
  await ouvrir(p, '/');
  await voirCriteres(p);
  const pied = p.getByRole('contentinfo').filter({ visible: true }).first();
  await pied.scrollIntoViewIfNeeded();
  await p.waitForTimeout(400);
  await p.screenshot({ path: `${OUT}/etape5-pied-de-page-${tag}.png` });
  const texte = nbsp(await pied.innerText());
  journal('5. mention ·', verdict(texte.includes("Résultats des élections municipales 2026 : ministère de l'Intérieur ; blocs politiques : circulaire du 2 février 2026, sauf l'extrême gauche (dont La France insoumise), rangée à gauche")));
  await p.close();
}

// ---------------------------------------------------------------------------------------------------------------------
// Les 10 villes de mesure-tache-0.md, relues sur leur fiche (bureau, page /).
const p = await nouvellePage(1440, 900);
journal('===== 10 villes');
for (const [code, nom] of [['75056', 'paris'], ['69123', 'lyon'], ['13055', 'marseille'], ['33063', 'bordeaux'], ['06088', 'nice'], ['66136', 'perpignan'], ['31555', 'toulouse'], ['44109', 'nantes'], ['59350', 'lille'], ['67482', 'strasbourg'], ['59512', 'roubaix']]) {
  const f = await choisir(p, '/', code);
  await p.screenshot({ path: `${OUT}/ville-${nom}-1440x900.png` });
  journal('ville', code, f.titre, '→', ligneMairie(f.texte).join(' | '));
}

// Les 10 premières de chaque bloc, relues dans la liste de /?loyer=1200&mairie=<bloc>, contre la sortie de la tâche 0.
journal('===== 10 premières par bloc');
const t0 = readFileSync('/Users/mouga/git-repository/carte-ou-vivre/docs/plans/2026-10-18-mairies/captures/C2-10-premieres-par-bloc.txt', 'utf8');
for (const bloc of ['gauche', 'divers', 'centre', 'droite', 'extreme-droite', 'sans-etiquette']) {
  const section = t0.split(`### ${bloc} `)[1].split('###')[0];
  const attendu = [...section.matchAll(/^(\d+)\. (.+?) \((\w+), \w+\) · (\d+) ·/gm)].map((m) => `${m[1]} · ${m[2]} (${m[3]}) · ${m[4]}`);
  await ouvrir(p, `/?loyer=1200&mairie=${bloc}`);
  const lu = (await lignes(p)).map((l) => l.split(' · ').slice(0, 3).join(' · '));
  const ok = JSON.stringify(lu) === JSON.stringify(attendu.slice(0, 10));
  journal('bloc', bloc, adresse(p), '·', verdict(ok), ok ? '' : `\n  lu      ${JSON.stringify(lu)}\n  attendu ${JSON.stringify(attendu)}`);
  if (bloc === 'droite') await p.screenshot({ path: `${OUT}/10-premieres-droite-1440x900.png` });
}
await p.close();

// Ouverture à 375 × 548 (H48) : le curseur du prix entier dans la feuille, sur les vraies données.
const m = await nouvellePage(375, 548);
await ouvrir(m, '/');
const f = await m.getByTestId('feuille').boundingBox();
const c = await m.getByRole('slider', { name: 'Loyer maximum' }).boundingBox();
journal('375 × 548 : feuille y', Math.round(f.y), 'h', Math.round(f.height), '· curseur', Math.round(c.y), '→', Math.round(c.y + c.height), '·', verdict(c.y >= f.y && c.y + c.height <= 548));
await m.screenshot({ path: `${OUT}/ouverture-375x548.png` });
await navigateur.close();
