// Tâche 0b d'emploi — tableau pour Vincent, compte d'AC-12 (M2X90 à « 10 % ») et temps du calcul en Node.
// Lancer depuis la racine du dépôt : node docs/plans/2026-11-21-emploi/captures/T0b-tableau.mjs
// Écrit : docs/plans/2026-11-21-emploi/captures/T0b-tableau.txt
// distanceKm est celle du site (src/proches/distance.ts, types retirés par Node 22).
import { readFileSync, writeFileSync } from 'node:fs';
import { loadavg } from 'node:os';
import { distanceKm } from '../../../../src/proches/distance.ts';
import { villesA30km, compterPassent } from './T0b-voisinage.mjs';

const RACINE = new URL('../../../../', import.meta.url).pathname;
const lire = (f) => JSON.parse(readFileSync(RACINE + 'public/data/' + f, 'utf8'));
const communes = lire('communes.json').communes;
const reperes = lire('reperes.json').reperes;
const emploi = lire('emploi.json');
const sortie = [];
const dire = (s = '') => { sortie.push(s); console.log(s); };
const fr = (n) => n.toLocaleString('fr-FR').replace(/ /g, ' ');

if (communes.length !== reperes.length) throw new Error('communes et repères de longueurs différentes');
const indexCommune = new Map(communes.map((c, i) => [c[0], i]));
const nom = (code) => communes[indexCommune.get(code)][1];
const points = new Float64Array(communes.length * 2);
reperes.forEach((r, i) => { points[2 * i] = r[0]; points[2 * i + 1] = r[1]; });

const bassins = emploi.bassins; // [code, ville]
const indexBassin = new Map(bassins.map((b, i) => [b[0], i]));
const villes = [];
bassins.forEach(([code, ville], i) => { if (ville != null) villes.push([i, indexCommune.get(ville)]); });

dire(`T0b-tableau.mjs — ${new Date().toLocaleString('fr-FR')} — charge (1, 5, 15 min) : ${loadavg().map((x) => x.toFixed(2)).join(' ')}`);
dire(`${fr(communes.length)} communes, ${bassins.length} bassins, dont ${villes.length} avec une ville principale (sans : ${bassins.filter((b) => b[1] == null).map((b) => b[0]).join(', ')})`);

// Temps du calcul en Node : 3 tours d'échauffement, puis 15 essais.
const essais = [];
let proches;
for (let i = 0; i < 18; i++) {
  const t = performance.now();
  proches = villesA30km(points, villes, distanceKm);
  if (i >= 3) essais.push(performance.now() - t);
}
const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
dire(`calcul des villes principales à 30 km de chaque commune (Node ${process.version}, tri par latitude) : médiane ${med(essais).toFixed(1)} ms ; min ${Math.min(...essais).toFixed(1)} max ${Math.max(...essais).toFixed(1)} ; ${essais.length} essais après 3 d'échauffement`);
dire(`couples commune → ville principale à 30 km ou moins : ${fr(proches.bassin.length)} ; communes sans aucune ville à 30 km : ${fr(proches.debut.reduce((n, d, i) => (i && d === proches.debut[i - 1] ? n + 1 : n), 0))}`);

// Contrôle : même résultat sans le tri (toutes les communes × toutes les villes), et son temps.
const t0 = performance.now();
let couples = 0, ecarts = 0;
const kmCompare = (km) => Math.max(1, Math.round(km));
for (let i = 0; i < communes.length; i++) {
  const ici = new Set();
  for (const [b, iv] of villes) {
    const k = iv === i ? 0 : kmCompare(distanceKm([points[2 * i], points[2 * i + 1]], [points[2 * iv], points[2 * iv + 1]]));
    if (k <= 30) { couples++; ici.add(b + ':' + k); }
  }
  for (let t = proches.debut[i]; t < proches.debut[i + 1]; t++) if (!ici.has(proches.bassin[t] + ':' + proches.km[t])) ecarts++;
}
dire(`contrôle sans tri (${fr(communes.length)} × ${villes.length} distances) : ${fr(couples)} couples, ${ecarts} écart avec le calcul trié ; ${(performance.now() - t0).toFixed(0)} ms (une fois)`);

// Niveaux d'un métier.
const RANG = { '10': 0, '25': 1, tous: 2 };
const metier = (code) => emploi.metiers.find((m) => m.code === code);
function dansNiveau(m, niveau) {
  const d = new Uint8Array(bassins.length);
  for (const [b, , n] of m.bassins) if (RANG[n] <= RANG[niveau]) d[indexBassin.get(b)] = 1;
  return d;
}
// « Le plus proche » (R46, H136) parmi les bassins du niveau coché : km affiché, puis niveau le plus étroit, puis plus de
// projets, puis plus petit code INSEE de la ville.
function plusProche(m, niveau, iCommune) {
  let mieux = null;
  for (const [b, projets, n] of m.bassins) {
    if (RANG[n] > RANG[niveau]) continue;
    const ville = bassins[indexBassin.get(b)][1];
    if (ville == null) continue;
    const iv = indexCommune.get(ville);
    const km = iv === iCommune ? 0 : kmCompare(distanceKm([points[2 * iCommune], points[2 * iCommune + 1]], [points[2 * iv], points[2 * iv + 1]]));
    const cle = [km, RANG[n], -projets, ville];
    const avant = (x, y) => (x[0] - y[0] || x[1] - y[1] || x[2] - y[2] || (x[3] < y[3] ? -1 : x[3] > y[3] ? 1 : 0)) < 0;
    if (!mieux || avant(cle, mieux.cle)) mieux = { cle, ville, km, b, projets, n };
  }
  return mieux;
}
const kmTexte = (km) => (km === 0 ? 'sur place' : km === 1 ? 'à moins d\'1 km' : `à ${km} km`);

// AC-12 : M2X90 à « 10 % ».
const m2 = metier('M2X90');
const n10 = compterPassent(proches, dansNiveau(m2, '10'));
dire();
dire(`AC-12 : communes qui passent M2X90 à « 10 % » : ${fr(n10)} (attendu 4 588, écart accepté 4 542 à 4 634) → ${n10 >= 4542 && n10 <= 4634 ? 'dans l\'écart' : 'HORS DE L\'ÉCART'}`);
// Contrôles d'AC-12 sur les raisons (« le plus proche »).
const v1 = metier('V1X80');
const pr = plusProche(v1, '10', indexCommune.get('17300'));
dire(`AC-12 : La Rochelle, V1X80 à « 10 % », le plus proche : ${nom(pr.ville)}, ${pr.km} km (attendu La Roche-sur-Yon, 61 km)`);
const pp = plusProche(m2, '10', indexCommune.get('64445'));
dire(`AC-12 : Pau, M2X90 à « 10 % », le plus proche : ${nom(pp.ville)}, ${pp.km} km (attendu Bayonne, 92 km)`);
const passe = (m, niveau, i) => { const d = dansNiveau(m, niveau); for (let t = proches.debut[i]; t < proches.debut[i + 1]; t++) if (d[proches.bassin[t]]) return true; return false; };
dire(`AC-12 : V1X80 à « 10 % » : Bordeaux ${passe(v1, '10', indexCommune.get('33063')) ? 'passe' : 'NE PASSE PAS'}, Pau ${passe(v1, '10', indexCommune.get('64445')) ? 'passe' : 'NE PASSE PAS'}`);

// Tableau pour Vincent.
const METIERS = ['R4X90', 'H1X91', 'V1X80'];
const VILLES = [['Bordeaux', '33063'], ['Nantes', '44109'], ['La Rochelle', '17300'], ['Pau', '64445'], ['Toulouse', '31555']];
const NIVEAU_TEXTE = { '10': '10 %', '25': '25 %', tous: 'partout où il recrute' };
for (const code of METIERS) {
  const m = metier(code);
  dire();
  dire(`== ${code} — ${m.libelle}`);
  dire(`noms courants : ${m.noms.join(', ') || '(aucun)'} ; peu chiffré : ${m.peu_chiffre ? 'oui' : 'non'} ; bassins chiffrés : ${m.bassins.length} sur ${bassins.length}`);
  const compte = Object.fromEntries(Object.keys(RANG).map((n) => [n, m.bassins.filter(([, , x]) => RANG[x] <= RANG[n]).length]));
  const passent = Object.fromEntries(Object.keys(RANG).map((n) => [n, compterPassent(proches, dansNiveau(m, n))]));
  dire(`bassins par niveau (cumulés) : 10 % ${compte['10']}, 25 % ${compte['25']}, tous ${compte.tous}`);
  dire(`communes qui passent (sur ${fr(communes.length)}) : 10 % ${fr(passent['10'])}, 25 % ${fr(passent['25'])}, partout où il recrute ${fr(passent.tous)}`);
  const classes = [...m.bassins].sort((a, b) => b[1] - a[1]);
  for (const [ville, codeVille] of VILLES) {
    const ib = bassins.findIndex((b) => b[1] === codeVille);
    const codeBassin = bassins[ib][0];
    const ligne = m.bassins.find((b) => b[0] === codeBassin);
    const ic = indexCommune.get(codeVille);
    const autour = (() => { let n = 0; for (let i = 0; i < communes.length; i++) for (let t = proches.debut[i]; t < proches.debut[i + 1]; t++) if (proches.bassin[t] === ib) { n++; break; } return n; })();
    const parNiveau = Object.keys(RANG).map((n) => {
      const p = plusProche(m, n, ic);
      return `${NIVEAU_TEXTE[n]} : ${p.km <= 30 ? 'passe' : 'ne passe pas'} (${nom(p.ville)}, ${kmTexte(p.km)})`;
    });
    const rang = ligne ? classes.findIndex((b) => b[0] === codeBassin) + 1 : null;
    dire(`  ${ville} (bassin ${codeBassin}) : ${ligne ? `${fr(ligne[1])} projets, niveau « ${NIVEAU_TEXTE[ligne[2]]} », ${rang}e sur ${m.bassins.length} chiffrés` : 'pas de chiffre publié'} ; communes à 30 km de sa ville principale : ${fr(autour)} ; la ville elle-même — ${parNiveau.join(' ; ')}`);
  }
  const dix = classes.filter(([, , n]) => n === '10');
  dire(`villes principales du niveau « 10 % » (${dix.length}) : ${dix.map(([b, p]) => { const v = bassins[indexBassin.get(b)][1]; return `${v == null ? `bassin ${b} (sans ville principale)` : nom(v)} ${fr(p)}`; }).join(' · ')}`);
}

writeFileSync(RACINE + 'docs/plans/2026-11-21-emploi/captures/T0b-tableau.txt', sortie.join('\n') + '\n');
