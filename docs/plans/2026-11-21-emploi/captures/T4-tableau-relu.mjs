// Tâche 4 d'emploi : le tableau de la tâche 0 (mesure-tache-0.md, « Part 0b — le tableau pour Vincent ») relu sur la
// page, version construite servie par `npx vite preview --port 4180`, vraies données, bureau 1 440 × 900.
// Pour chacun des 3 métiers (R4X90, H1X91, V1X80), à chaque niveau (10, 25, tous), la fiche de chacune des 5 villes
// (Bordeaux, Nantes, La Rochelle, Pau, Toulouse), page « sans plafond » (`loyer=aucun`) : la ligne du métier (projets,
// niveau du bassin) et, si la ville ne passe pas, la raison (ville principale la plus proche du niveau et km). Comparé au
// tableau ; chaque ligne finit par OK ou ÉCART. Méthode de choix d'une commune : celle de T1/T2 (zoom, clic, titre vérifié).
// Lancer : OUT=<dossier temporaire> node docs/plans/2026-11-21-emploi/captures/T4-tableau-relu.mjs
import { readFileSync } from 'node:fs';
import { chromium } from '/Users/mouga/git-repository/carte-ou-vivre/node_modules/playwright/index.mjs';
const BASE = process.env.BASE ?? 'http://localhost:4180';
const RACINE = '/Users/mouga/git-repository/carte-ou-vivre/public/data/';
const communes = JSON.parse(readFileSync(RACINE + 'communes.json', 'utf8')).communes;
const reperes = JSON.parse(readFileSync(RACINE + 'reperes.json', 'utf8')).reperes;
const metiersJson = JSON.parse(readFileSync(RACINE + 'emploi.json', 'utf8')).metiers;
const libelle = (code) => metiersJson.find((m) => m.code === code).libelle;
const journal = (...a) => console.log(new Date().toLocaleTimeString('fr-FR'), ...a);
const nbsp = (t) => (t ?? '').replace(/[  ]/g, ' ');
const W = 1440, H = 900;
const navigateur = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await (await navigateur.newContext({ viewport: { width: W, height: H } })).newPage();
const fiche = () => p.getByRole('region', { name: /\(\d+\)$/ });

const VILLES = [['33063', 'Bordeaux'], ['44109', 'Nantes'], ['17300', 'La Rochelle'], ['64445', 'Pau'], ['31555', 'Toulouse']];
// Le tableau de mesure-tache-0.md : projets (null = pas de chiffre publié), niveau du bassin, et pour 10 / 25 / tous :
// 'sur place' (la ville passe) ou la ville principale la plus proche du niveau et ses km (la ville ne passe pas).
const TABLEAU = {
  R4X90: {
    Bordeaux: [199, '10', ['sur place', 'sur place', 'sur place']],
    Nantes: [147, '10', ['sur place', 'sur place', 'sur place']],
    'La Rochelle': [6, 'tous', ['Nantes, 122 km', 'La Roche-sur-Yon, 61 km', 'sur place']],
    Pau: [null, null, ['Toulouse, 151 km', 'Dax, 72 km', 'Mont-de-Marsan, 67 km']],
    Toulouse: [156, '10', ['sur place', 'sur place', 'sur place']],
  },
  H1X91: {
    Bordeaux: [7, '10', ['sur place', 'sur place', 'sur place']],
    Nantes: [16, '10', ['sur place', 'sur place', 'sur place']],
    'La Rochelle': [null, null, ['Nantes, 122 km', 'Nantes, 122 km', 'Nantes, 122 km']],
    Pau: [null, null, ['Tarbes, 37 km', 'Tarbes, 37 km', 'Tarbes, 37 km']],
    Toulouse: [20, '10', ['sur place', 'sur place', 'sur place']],
  },
  V1X80: {
    Bordeaux: [626, '10', ['sur place', 'sur place', 'sur place']],
    Nantes: [570, '10', ['sur place', 'sur place', 'sur place']],
    'La Rochelle': [66, 'tous', ['La Roche-sur-Yon, 61 km', 'La Roche-sur-Yon, 61 km', 'sur place']],
    Pau: [326, '10', ['sur place', 'sur place', 'sur place']],
    Toulouse: [761, '10', ['sur place', 'sur place', 'sur place']],
  },
};
const NIVEAUX = ['10', '25', 'tous'];
const milliers = (n) => n.toLocaleString('fr-FR').replace(/[  ]/g, ' ');
/** Ce que la fiche doit dire (R47, R46) pour une ville, un métier, un niveau coché. */
function attendu(code, ville, niveau) {
  const [projets, nivBassin, proches] = TABLEAU[code][ville];
  const lib = libelle(code);
  const k = NIVEAUX.indexOf(niveau);
  const qualif = (n) => (n === 'tous' ? 'bassin où ce métier recrute' : `parmi les ${n} % de bassins qui recrutent le plus`);
  if (proches[k] === 'sur place') return { ligne: `${lib} : ${ville}, sur place, ${qualif(nivBassin)} · ${milliers(projets)} recrutements prévus en 2026`, raison: null };
  const ligne = projets == null ? `${lib} : bassin de ${ville}, pas de chiffre publié pour ce métier` : `${lib} : bassin de ${ville}, ${milliers(projets)} recrutements prévus en 2026`;
  const debut = niveau === 'tous' ? `${lib} : aucun bassin où ce métier recrute dans un rayon de 30 km` : `${lib} : aucun bassin parmi les ${niveau} % qui recrutent le plus dans un rayon de 30 km`;
  return { ligne, raison: `${debut} (le plus proche : ${proches[k]})` };
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
async function ouvrir(chemin) {
  for (let essai = 0; essai < 3; essai++) {
    await p.goto(BASE + chemin);
    await p.locator('[data-testid="carte"][data-carte-prete="1"]').waitFor({ timeout: 60000 });
    await p.waitForTimeout(1500);
    if (!(await p.getByText('Fond de carte indisponible').isVisible())) return;
  }
}
async function ficheDe(chemin, code) {
  const i = communes.findIndex((c) => c[0] === code);
  const [, nom, dep] = communes[i];
  const r = reperes[i];
  for (const [lon, lat] of [[r[0] + 0.01, r[1]], r.slice(0, 2), [(r[2] + r[4]) / 2, (r[3] + r[5]) / 2], [r[0] + 0.01, r[1] - 0.01]]) {
    await ouvrir(chemin);
    const { x, y } = ecran(lon, lat);
    await p.mouse.move(x, y);
    for (let k = 0; k < 12; k++) { await p.mouse.wheel(0, -300); await p.waitForTimeout(60); }
    await p.waitForTimeout(1200);
    await p.mouse.click(x, y);
    if (!(await fiche().waitFor({ timeout: 5000 }).then(() => true, () => false))) continue;
    if (nbsp(await p.locator('#titre-fiche').innerText()).trim() === `${nom} (${dep})`) {
      await p.waitForTimeout(800);
      return nbsp(await fiche().innerText());
    }
  }
  throw new Error(`commune ${code} non choisie`);
}

let ecarts = 0;
for (const code of Object.keys(TABLEAU)) {
  journal(`== ${code} — ${libelle(code)}`);
  for (const niveau of NIVEAUX) {
    const chemin = `/?loyer=aucun&metier=${code}:${niveau}`;
    for (const [insee, ville] of VILLES) {
      const t = await ficheDe(chemin, insee);
      const l = t.split('\n').map((x) => x.trim()).filter(Boolean);
      const lib = libelle(code);
      const lue = l.find((x) => x.startsWith(`${lib} :`) && !/ : aucun bassin /.test(x)) ?? '(absente)';
      const raison = l.find((x) => x.startsWith(`${lib} : aucun bassin`)) ?? null;
      const a = attendu(code, ville, niveau);
      const ok = lue === a.ligne && raison === a.raison;
      if (!ok) ecarts++;
      journal(`  ${ok ? 'OK   ' : 'ÉCART'} ${niveau.padEnd(4)} ${ville.padEnd(11)} | ${lue.slice(lib.length + 3)}${raison ? ` | raison : ${raison.slice(lib.length + 3)}` : ' | passe'}`);
      if (!ok) journal(`        attendu : ${a.ligne.slice(lib.length + 3)}${a.raison ? ` | raison : ${a.raison.slice(lib.length + 3)}` : ' | passe'}`);
    }
  }
}
journal(`écarts : ${ecarts} sur ${Object.keys(TABLEAU).length * NIVEAUX.length * VILLES.length} fiches`);
await navigateur.close();
