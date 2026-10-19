// Corrections 2 de mairies (D2 amendée le 2026-10-19) : preuves sur la version construite servie par
// `npx vite preview --port 4180` (vraies données) ; helpers repris de T4-bout-en-bout.mjs. Usage : OUT=<dossier> node C2-preuves.mjs
import { readFileSync } from 'node:fs';
import { chromium } from '/Users/mouga/git-repository/carte-ou-vivre/node_modules/playwright/index.mjs';
const BASE = process.env.BASE ?? 'http://localhost:4180';
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

// ---------------------------------------------------------------------------------------------------------------------
// Corrections 2 (D2 amendée le 2026-10-19) : 6 pastilles, LFI à gauche, mention amendée.
const ligneMairie = (t) => t.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('Mairie :'));
const BLOCS = ['Gauche', 'Divers', 'Centre', 'Droite', 'Extrême droite', 'Sans étiquette'];
const libelles = async (p) => (await groupe(p).getByRole('button').allInnerTexts()).map((t) => nbsp(t).trim());
const cochees = (p) => groupe(p).getByRole('button', { pressed: true }).allInnerTexts();
const MENTION = "Résultats des élections municipales 2026 : ministère de l'Intérieur ; blocs politiques : circulaire du 2 février 2026, sauf l'extrême gauche (dont La France insoumise), rangée à gauche";
const attendues = readFileSync('/Users/mouga/git-repository/carte-ou-vivre/docs/plans/2026-10-18-mairies/captures/C2-10-premieres-par-bloc.txt', 'utf8')
  .split('### gauche')[1].split('###')[0].split('\n').filter((l) => /^\d+\. /.test(l))
  .map((l) => { const m = l.match(/^(\d+)\. (.+?) \((\d\w), \w+\) · (\d+) ·/); return `${m[1]} · ${m[2]} (${m[3]}) · ${m[4]}`; });

for (const [W, H] of [[1440, 900], [390, 844]]) {
  const p = await nouvellePage(W, H);
  const tag = `${W}x${H}`;
  journal(`===== ${tag}`);

  // Catégorie « Vie locale » à l'ouverture.
  await ouvrir(p, '/');
  await voirCriteres(p);
  const g = groupe(p);
  await g.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await p.waitForTimeout(500);
  const l = await libelles(p);
  journal('adresse', adresse(p), '· pastilles', JSON.stringify(l), '· cochées', JSON.stringify(await cochees(p)), verdict(adresse(p) === '/?loyer=1200' && JSON.stringify(l) === JSON.stringify(BLOCS)));
  const boites = await Promise.all((await g.getByRole('button').all()).map((b) => b.boundingBox()));
  journal('grille', boites.map((b, i) => `${l[i]} x${Math.round(b.x)} y${Math.round(b.y)} ${Math.round(b.width)}×${Math.round(b.height)}`).join(' | '));
  const grille = Math.round(boites[3].x) === Math.round(boites[0].x) && Math.round(boites[4].y) === Math.round(boites[3].y) && Math.round(boites[5].x) === Math.round(boites[0].x) && boites[5].y > boites[3].y;
  journal('Gauche · Divers · Centre / Droite · Extrême droite · (vide) / Sans étiquette', verdict(grille));
  await p.screenshot({ path: `${OUT}/C2-vie-locale-${tag}.png` });

  // /?loyer=1200&mairie=gauche : compte et 10 premières.
  await ouvrir(p, '/?loyer=1200&mairie=gauche');
  await voirListe(p);
  const compte = nbsp(await liste(p).getByText(/communes? passen?t tes critères/).first().innerText());
  const dix = (await lignes(p)).map((t) => t.split(' · ').slice(0, 3).join(' · '));
  journal('/?loyer=1200&mairie=gauche ·', compte, verdict(/^748 communes passent tes critères/.test(compte)));
  dix.forEach((t, i) => journal(`  ${t}`, t === attendues[i] ? 'OK' : `ÉCART (attendu ${attendues[i]})`));
  await p.screenshot({ path: `${OUT}/C2-gauche-liste-${tag}.png` });

  // /?mairie=extreme-gauche : nom ignoré.
  await ouvrir(p, '/?mairie=extreme-gauche');
  await voirCriteres(p);
  journal('/?mairie=extreme-gauche →', adresse(p), '· cochées', JSON.stringify(await cochees(p)), verdict(adresse(p) === '/?loyer=1200' && (await cochees(p)).length === 0));
}

// Fiche de Roubaix (59512), en bureau, sans filtre puis avec « Gauche ».
{
  const p = await nouvellePage(1440, 900);
  for (const chemin of ['/?loyer=1200', '/?loyer=1200&mairie=gauche']) {
    const { titre, texte } = await choisir(p, chemin, '59512');
    const m = ligneMairie(texte);
    journal(chemin, '· fiche', titre, '·', JSON.stringify(m), '· ne passe pas :', nePassePas(texte),
      verdict(JSON.stringify(m) === JSON.stringify(['Mairie : Gauche (La France insoumise) · « FIERS DE ROUBAIX »']) && !nePassePas(texte)));
    await p.screenshot({ path: `${OUT}/C2-fiche-roubaix-${chemin.includes('mairie') ? 'gauche' : 'depart'}-1440x900.png` });
  }

  // Pied de page.
  await ouvrir(p, '/');
  const pied = p.getByRole('contentinfo').filter({ visible: true }).first();
  const t = nbsp(await pied.innerText()).replace(/\s+/g, ' ');
  journal('pied de page contient la mention amendée', verdict(t.includes(MENTION)));
  await pied.screenshot({ path: `${OUT}/C2-pied-de-page-1440x900.png` });
}
await navigateur.close();
