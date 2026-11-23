// Copie de docs/plans/2026-11-21-emploi/captures/T4-bout-en-bout.mjs pour /ship (2026-11-23), mise aux libellés de D15
// (« Partout » · « Beaucoup » · « Le plus » sous « Où ce métier recrute » ; focus sur « Partout » après un choix).

// Tâche 4 d'emploi : « Vérification de bout en bout » de details.md, étapes 1 à 6, sur la version construite servie par
// `npx vite preview --port 4180` (vraies données), en bureau (1 440 × 900) et à 390 × 844.
// Onglet A : les gestes de l'utilisateur dans le panneau (champ, suggestions, curseur, cases, lien du second métier).
// Onglet B (même navigateur) : l'adresse de A ouverte dans un nouvel onglet, pour lire les fiches (la commune est choisie
// sur la carte à la vue d'ouverture : zoom à la molette, clic, titre vérifié, méthode de T1/T2) ; c'est aussi l'étape 5.
// Lancer : OUT=<dossier temporaire> node docs/plans/2026-11-21-emploi/captures/T4-bout-en-bout.mjs
import { readFileSync } from 'node:fs';
import { chromium } from '/Users/mouga/git-repository/carte-ou-vivre/node_modules/playwright/index.mjs';
import { layout, size, space } from '/Users/mouga/git-repository/carte-ou-vivre/src/theme/tokens.ts';
const BASE = process.env.BASE ?? 'http://localhost:4180';
const OUT = process.env.OUT;
const RACINE = '/Users/mouga/git-repository/carte-ou-vivre/public/data/';
const communes = JSON.parse(readFileSync(RACINE + 'communes.json', 'utf8')).communes;
const reperes = JSON.parse(readFileSync(RACINE + 'reperes.json', 'utf8')).reperes;
const navigateur = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const journal = (...a) => console.log(new Date().toLocaleTimeString('fr-FR'), ...a);
const nbsp = (t) => (t ?? '').replace(/[  ]/g, ' ');
const verdict = (ok, quoi) => journal(`  ${ok ? 'OK ' : 'ÉCART'} ${quoi}`);
const INFIRMIERS = 'Infirmiers et sages-femmes';
const M2X90 = "Ingénieurs et cadres d'étude, recherche et développement en informatique et télécom";

const mx = (lon) => (lon + 180) / 360;
const my = (lat) => (1 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) / Math.PI) / 2;
let [w, s, e, n] = [Infinity, Infinity, -Infinity, -Infinity];
for (const r of reperes) { w = Math.min(w, r[2]); s = Math.min(s, r[3]); e = Math.max(e, r[4]); n = Math.max(n, r[5]); }
const [x0, x1, y0, y1] = [mx(w), mx(e), my(n), my(s)];
/** Point d'écran à la vue d'ouverture (src/map/view.ts : paddingCarte ; bureau : panneaux ; 390 px : feuille de 45 %). */
function ecran(W, H, lon, lat) {
  const pad = W >= layout['largeur-bureau']
    ? { top: 16, left: 16 + 340 + 16, right: 16 + 320 + 16, bottom: 32 + 16 }
    : { top: space['space-4'], left: space['space-4'], right: space['space-4'], bottom: Math.max(layout['part-feuille'] * H, size['taille-feuille-min']) + space['space-4'] };
  const z = Math.log2(Math.min((W - pad.left - pad.right) / ((x1 - x0) * 512), (H - pad.top - pad.bottom) / ((y1 - y0) * 512)));
  const monde = 512 * 2 ** z;
  const cx = pad.left + (W - pad.left - pad.right) / 2, cy = pad.top + (H - pad.top - pad.bottom) / 2;
  return { x: cx + (mx(lon) - (x0 + x1) / 2) * monde, y: cy + (my(lat) - (y0 + y1) / 2) * monde, z };
}
async function pixels(p, pts) {
  const png = await p.screenshot();
  return p.evaluate(async ({ b64, pts }) => {
    const bmp = await createImageBitmap(await (await fetch(`data:image/png;base64,${b64}`)).blob());
    const c = new OffscreenCanvas(bmp.width, bmp.height);
    const ctx = c.getContext('2d');
    ctx.drawImage(bmp, 0, 0);
    const k = bmp.width / innerWidth;
    return pts.map((q) => Array.from(ctx.getImageData(Math.round(q.x * k), Math.round(q.y * k), 1, 1).data).slice(0, 3));
  }, { b64: png.toString('base64'), pts });
}

for (const [W, H] of [[1440, 900], [390, 844]]) {
  const mobile = W < layout['largeur-bureau'];
  const L = `${W}x${H}`;
  const contexte = await navigateur.newContext({ viewport: { width: W, height: H } });
  const A = await contexte.newPage();
  const B = await contexte.newPage();
  const adresse = (p) => new URL(p.url()).search;
  const fiche = (p) => p.getByRole('region', { name: /\(\d+\)$/ });
  const onglet = (p, nom) => p.getByRole('tab', { name: nom, exact: true });
  const caseDix = (p, lib) => p.getByRole('group', { name: `Où ce métier recrute ${lib}`, exact: true }).getByRole('button', { name: 'Le plus', exact: true });
  async function ouvrir(p, chemin) {
    for (let essai = 0; essai < 3; essai++) {
      await p.goto(BASE + chemin);
      await p.locator('[data-testid="carte"][data-carte-prete="1"]').waitFor({ timeout: 60000 });
      await p.waitForTimeout(2500);
      if (!(await p.getByText('Fond de carte indisponible').isVisible())) return;
    }
    journal('  fond de secours pour', chemin);
  }
  /** Onglet B : ouvre `chemin`, choisit la commune `code` sur la carte, vérifie le titre, renvoie le texte de la fiche. */
  async function ficheDe(chemin, code, nomCapture) {
    const i = communes.findIndex((c) => c[0] === code);
    const [, nom, dep] = communes[i];
    const r = reperes[i];
    for (const [lon, lat] of [[r[0] + 0.01, r[1]], r.slice(0, 2), [(r[2] + r[4]) / 2, (r[3] + r[5]) / 2], [r[0] + 0.01, r[1] - 0.01]]) {
      await ouvrir(B, chemin);
      const { x, y } = ecran(W, H, lon, lat);
      await B.mouse.move(x, y);
      for (let k = 0; k < 12; k++) { await B.mouse.wheel(0, -300); await B.waitForTimeout(60); }
      await B.waitForTimeout(1500);
      await B.mouse.click(x, y);
      if (!(await fiche(B).waitFor({ timeout: 5000 }).then(() => true, () => false))) continue;
      const titre = nbsp(await B.locator('#titre-fiche').innerText()).trim();
      if (titre === `${nom} (${dep})`) {
        await B.waitForTimeout(2000);
        if (nomCapture) await B.screenshot({ path: `${OUT}/T4-${nomCapture}-${L}.png` });
        return nbsp(await fiche(B).innerText());
      }
      journal('  essai raté pour', code, '→', titre);
    }
    throw new Error(`commune ${code} non choisie`);
  }
  const ligne = (t, debut) => t.split('\n').map((x) => x.trim()).find((x) => x.startsWith(debut)) ?? '(absente)';
  const raisons = (t) => (/ne passe pas tes critères/i.test(t) ? t.split('\n').map((x) => x.trim()).filter((x) => / : aucun bassin /.test(x)) : []);
  const captureA = async (nom, cible) => {
    await A.mouse.move(0, 0);
    await A.waitForTimeout(1500);
    if (cible) await cible.scrollIntoViewIfNeeded();
    await A.screenshot({ path: `${OUT}/T4-${nom}-${L}.png` });
  };

  journal(`===== ${L} =====`);
  // 1. Ouvrir / : l'adresse devient /?loyer=1200 ; « Emploi » entre « Vie locale » et « Tes proches », champ vide, phrase
  // sur l'État ; la fiche de Bordeaux dit « Chômage : … % dans la zone d'emploi de Bordeaux (…) ».
  journal('Étape 1');
  await ouvrir(A, '/');
  verdict(adresse(A) === '?loyer=1200', `adresse ${adresse(A)}`);
  const titres = (await A.getByRole('region', { name: 'Réglages' }).getByRole('heading', { level: 2 }).allTextContents()).map((t) => nbsp(t).trim());
  verdict(titres.indexOf('Emploi') === titres.indexOf('Vie locale') + 1 && titres.indexOf('Tes proches') === titres.indexOf('Emploi') + 1, `catégories : ${titres.join(' > ')}`);
  const champ = A.getByRole('combobox', { name: 'Ton métier' });
  verdict((await champ.inputValue()) === '', 'champ « Ton métier » vide');
  const etat = A.getByText("Les emplois de l'État (enseignants du public, fonctionnaires) ne sont pas dans l'enquête.", { exact: true });
  verdict(await etat.isVisible(), 'phrase sur l’État visible');
  await captureA('etape1-emploi', etat);
  let t = await ficheDe(adresse(A), '33063', 'etape1-fiche-bordeaux');
  const chomage = ligne(t, 'Chômage :');
  verdict(/^Chômage : \d+,\d % dans la zone d'emploi de Bordeaux \(.+\)$/.test(chomage), `Bordeaux : « ${chomage} »`);

  // 2. Taper « infirm », choisir « Infirmiers et sages-femmes » : l'adresse contient metier=V1X80 ; la fiche de Bordeaux
  // dit « … : bassin de Bordeaux, 626 recrutements prévus en 2026 ».
  journal('Étape 2');
  if (mobile) await onglet(A, 'Critères').click();
  await champ.fill('infirm');
  const sugg = A.getByRole('listbox', { name: 'Suggestions de métiers' }).getByRole('option');
  journal('  suggestions pour « infirm » :', (await sugg.allInnerTexts()).join(' | '));
  await captureA('etape2-suggestions', sugg.first());
  await A.getByRole('option', { name: INFIRMIERS, exact: true }).click();
  await caseDix(A, INFIRMIERS).waitFor();
  verdict(adresse(A).includes('metier=V1X80'), `adresse ${adresse(A)}`);
  await captureA('etape2-choisi', caseDix(A, INFIRMIERS));
  t = await ficheDe(adresse(A), '33063', 'etape2-fiche-bordeaux');
  const lInf = ligne(t, `${INFIRMIERS} :`);
  verdict(lInf === `${INFIRMIERS} : bassin de Bordeaux, 626 recrutements prévus en 2026`, `Bordeaux : « ${lInf} »`);

  // 3. Loyer sur « Sans limite », cocher « Le plus » : Bordeaux et Pau prennent la couleur neutre ; la fiche de La Rochelle
  // donne la raison « … (le plus proche : La Roche-sur-Yon, 61 km) » ; l'adresse contient metier=V1X80:10.
  journal('Étape 3');
  if (mobile) await onglet(A, 'Critères').click();
  const curseur = A.getByRole('slider', { name: 'Loyer maximum' });
  await curseur.focus();
  await A.keyboard.press('End');
  verdict((await curseur.getAttribute('aria-valuetext')) === 'Sans limite' && adresse(A).includes('loyer=aucun'), `curseur ${await curseur.getAttribute('aria-valuetext')}, adresse ${adresse(A)}`);
  await caseDix(A, INFIRMIERS).click();
  await A.waitForTimeout(500);
  verdict(adresse(A).includes('metier=V1X80:10'), `adresse ${adresse(A)}`);
  await captureA('etape3-carte');
  // La couleur ne se lit pas au pixel sur le vrai fond (Plan IGN sous la couche) : la fiche dit si la commune passe (page
  // « sans plafond » : celles qui passent prennent la couleur neutre, R46), et sa capture montre la commune zoomée.
  for (const [code, nom] of [['33063', 'bordeaux'], ['64445', 'pau']]) {
    t = await ficheDe(adresse(A), code, `etape3-fiche-${nom}`);
    verdict(raisons(t).length === 0 && !/ne passe pas tes critères/i.test(t), `${nom} passe ; « ${ligne(t, `${INFIRMIERS} :`)} »`);
  }
  t = await ficheDe(adresse(A), '17300', 'etape3-fiche-la-rochelle');
  const rLR = raisons(t);
  verdict(rLR.some((x) => x.endsWith('(le plus proche : La Roche-sur-Yon, 61 km)')), `La Rochelle : raisons ${JSON.stringify(rLR)}`);

  // 4. « + Ajouter un second métier », taper « développeur », choisir, cocher « Le plus » : Pau n'est plus colorée, sa fiche
  // donne la raison « … (le plus proche : Bayonne, 92 km) » ; l'adresse contient metier=V1X80:10,M2X90:10.
  journal('Étape 4');
  if (mobile) await onglet(A, 'Critères').click();
  await A.getByRole('button', { name: '+ Ajouter un second métier' }).click();
  const second = A.getByRole('combobox', { name: 'Second métier' });
  verdict(await second.evaluate((el) => el === document.activeElement), 'le champ « Second métier » a le focus');
  if (mobile) verdict(!(await A.getByRole('tablist').isVisible()), '390 px : feuille montée (pas d’onglets)');
  await A.keyboard.type('développeur');
  await A.waitForTimeout(300);
  journal('  suggestions pour « développeur » :', (await sugg.allInnerTexts()).join(' | '));
  await captureA('etape4-second-metier');
  await A.getByRole('option', { name: M2X90, exact: true }).click();
  await caseDix(A, M2X90).waitFor();
  if (mobile) verdict(await A.getByRole('tablist').isVisible(), '390 px : feuille redescendue après le choix');
  verdict(await A.getByRole('group', { name: `Où ce métier recrute ${M2X90}`, exact: true }).getByRole('button', { name: 'Partout', exact: true }).evaluate((el) => el === document.activeElement), 'focus sur « Partout » du second métier (D15)');
  await caseDix(A, M2X90).click();
  await A.waitForTimeout(500);
  verdict(adresse(A).includes('metier=V1X80:10,M2X90:10'), `adresse ${adresse(A)}`);
  await captureA('etape4-deux-metiers', caseDix(A, M2X90));
  t = await ficheDe(adresse(A), '64445', 'etape4-fiche-pau');
  const rPau = raisons(t);
  verdict(rPau.some((x) => x.startsWith(`${M2X90} :`) && x.endsWith('(le plus proche : Bayonne, 92 km)')), `Pau : raisons ${JSON.stringify(rPau)}`);

  // 5. Copier l'adresse dans un nouvel onglet : mêmes métiers, mêmes niveaux, même carte.
  journal('Étape 5');
  await ouvrir(B, adresse(A));
  verdict(adresse(B) === adresse(A), `adresse B ${adresse(B)} = A ${adresse(A)}`);
  if (mobile) for (const p of [A, B]) await onglet(p, 'Critères').click();
  const etatCases = (p) => p.getByRole('group', { name: /^Où ce métier recrute / }).evaluateAll((gs) => gs.map((g) => [...g.querySelectorAll('button')].map((b) => `${b.textContent}${b.getAttribute('aria-pressed') === 'true' ? '✓' : ''}`).join('/')));
  const metiers = (p) => p.getByRole('button', { name: /^Retirer / }).evaluateAll((bs) => bs.map((b) => b.getAttribute('aria-label')));
  const [mA, mB, cA, cB] = [await metiers(A), await metiers(B), await etatCases(A), await etatCases(B)];
  verdict(JSON.stringify(mA) === JSON.stringify(mB) && JSON.stringify(cA) === JSON.stringify(cB), `métiers ${JSON.stringify(mB)} ; cases ${JSON.stringify(cB)}`);
  // Même carte : 400 points de la bande de carte, lus dans A (vue d'ouverture, jamais zoomée) et dans B (rouvert).
  const grille = [];
  const hautCarte = mobile ? H - Math.max(layout['part-feuille'] * H, size['taille-feuille-min']) : H;
  for (let a = 0; a < 20; a++) for (let b = 0; b < 20; b++) grille.push({ x: (W * (a + 0.5)) / 20, y: (hautCarte * (b + 0.5)) / 20 });
  // Bureau : seuls les points de la carte hors des panneaux comptent (gauche 372 px, droite 352 px).
  const surCarte = grille.filter((q) => mobile || (q.x > 372 && q.x < W - 352));
  for (const p of [A, B]) { await p.mouse.move(0, 0); await p.waitForTimeout(1500); }
  const [gA, gB] = [await pixels(A, surCarte), await pixels(B, surCarte)];
  const differents = surCarte.filter((_, k) => Math.max(...gA[k].map((v, i) => Math.abs(v - gB[k][i]))) > 3).length;
  verdict(differents === 0, `même carte : ${surCarte.length - differents} points sur ${surCarte.length} identiques (± 3)`);
  await B.screenshot({ path: `${OUT}/T4-etape5-nouvel-onglet-${L}.png` });

  // 6. Les mentions de R49 sont au pied de page.
  journal('Étape 6');
  if (mobile) await onglet(B, 'Les 10 premières').click();
  const pied = B.getByRole('contentinfo').filter({ visible: true }).first();
  await pied.scrollIntoViewIfNeeded();
  const tp = nbsp(await pied.innerText());
  for (const m of ["Projets de recrutement et bassins d'emploi : France Travail, enquête Besoins en main-d'œuvre 2026", "Chômage : Insee, taux de chômage localisés par zone d'emploi, 2e trimestre 2026"]) verdict(tp.includes(m), `pied de page : « ${m} »`);
  await B.screenshot({ path: `${OUT}/T4-etape6-mentions-${L}.png` });
  await contexte.close();
}
await navigateur.close();
