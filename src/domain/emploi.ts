// Spec emploi : lecture de `public/data/emploi.json` (tâche 0), jointure par code INSEE (H140, H142), distances aux villes
// principales des bassins (R46, H136, H144) et « le plus proche » des raisons.
// Distances (plan, « Distances ») : de mairie à mairie (points de reperes.json, dans l'ordre de communes.json), `distanceKm`
// de src/proches/distance.ts, comparées et écrites au km comme la mer (`kmCompare`) ; la ville principale elle-même : 0 km.
// Le jeu de test peut les donner telles quelles (`distances_km`, H144) : elles remplacent alors le calcul.
import { distanceKm } from '../proches/distance';
import { dansNiveau, ecartNiveaux, kmCompare, type Commune, type MetierChoisi, type Niveau, type Raison } from './score';

/** `public/data/emploi.json`, tableaux nommés par `champs` (scripts/data/emploi.py). */
export type EmploiJson = {
  champs?: Record<string, string[]>;
  trimestre_chomage: string;
  /** [code du bassin, code INSEE de sa ville principale (H135) ; null : Monaco, 9399]. */
  bassins: [string, string | null][];
  /** [code de la zone d'emploi, nom Insee, taux de chômage]. */
  zones: [string, string, number][];
  /** Les bassins chiffrés de chaque métier : [bassin, projets, niveau le plus étroit] (R45, calculés en amont). */
  metiers: { code: string; libelle: string; noms: string[]; peu_chiffre: boolean; bassins: [string, number, Niveau][] }[];
  /** [code INSEE, bassin, zone d'emploi] par commune. */
  communes: [string, string | null, string | null][];
  /** Jeux de test seulement (H144) : code de commune → code de bassin → km affichés (0 = sur place). */
  distances_km?: Record<string, Record<string, number>>;
};

export type Metier = {
  code: string;
  libelle: string;
  noms: string[];
  peuChiffre: boolean;
  /** Bassins chiffrés seulement (D7) : projets et niveau le plus étroit. */
  bassins: Map<string, { projets: number; niveau: Niveau }>;
};

export type Emploi = {
  trimestre: string;
  /** Métiers par code, dans l'ordre du fichier. */
  metiers: Map<string, Metier>;
  /** Codes des bassins ; leur index sert aux tableaux ci-dessous. */
  bassins: string[];
  /** Index (dans `communes`) de la ville principale de chaque bassin, -1 si elle n'est pas sur la carte (Monaco). */
  villes: Int32Array;
  communes: readonly Commune[];
  /**
   * La distance d'une commune (index) à la ville principale d'un bassin (index), en km affichés : 0 = sur place, 1 = moins
   * d'1 km ; Infinity sans ville principale. Une seule fonction, quelle que soit la source (calcul ou jeu de test).
   */
  distance: (i: number, k: number) => number;
  /** La même distance avant l'arrondi (fiche, R47 : « à moins d'1 km » ou « à n km », comme la mer) ; jeu de test : ses km. */
  distanceBrute: (i: number, k: number) => number;
  /**
   * Villes principales à 30 km ou moins de chaque commune (R46), à plat : celles de la commune `i` sont
   * `bassin[debut[i]]` à `bassin[debut[i + 1] - 1]` (index de bassin).
   */
  aTrente: { debut: Int32Array; bassin: Int32Array };
};

/** R46 : rayon autour de la ville principale d'un bassin, en km affichés. */
export const RAYON_KM = 30;
const RAYON_TERRE_KM = 6371;

/** H140, H142 : bassin, zone d'emploi et taux de chaque commune, joints par code INSEE ; absente du fichier : inconnus. */
export function joindreEmploi(communes: Commune[], json: EmploiJson): Commune[] {
  const parCode = new Map(json.communes.map((l) => [l[0], l]));
  const zones = new Map(json.zones.map(([code, nom, taux]) => [code, { nom, taux }]));
  return communes.map((c) => {
    const [, bassin, zone] = parCode.get(c.code) ?? [c.code, null, null];
    const z = zone == null ? undefined : zones.get(zone);
    return { ...c, bassin, zoneEmploi: z?.nom ?? null, chomage: z?.taux ?? null };
  });
}

/**
 * Lit `emploi.json` pour les communes de la carte (`communes`, déjà jointes ; `points` : leurs mairies [lon, lat], dans le
 * même ordre) et calcule, une fois, les villes principales à 30 km ou moins de chaque commune.
 */
export function lireEmploi(json: EmploiJson, communes: readonly Commune[], points: readonly (readonly number[])[]): Emploi {
  const debutCalcul = performance.now();
  const indexCommune = new Map(communes.map((c, i) => [c.code, i]));
  const bassins = json.bassins.map(([b]) => b);
  const villes = Int32Array.from(json.bassins, ([, v]) => (v == null ? -1 : (indexCommune.get(v) ?? -1)));
  const metiers = new Map(
    json.metiers.map((m) => [
      m.code,
      { code: m.code, libelle: m.libelle, noms: m.noms, peuChiffre: m.peu_chiffre, bassins: new Map(m.bassins.map(([b, projets, niveau]) => [b, { projets, niveau }])) },
    ]),
  );
  const fixture = json.distances_km;
  // Une seule source de distance : `brute` (km de la fixture, ou de mairie à mairie) ; `distance` en est la valeur comparée.
  const brute = fixture
    ? (i: number, k: number) => (villes[k] < 0 ? Infinity : (fixture[communes[i].code]?.[bassins[k]] ?? Infinity))
    : (i: number, k: number) => {
        const v = villes[k];
        if (v < 0) return Infinity;
        return v === i ? 0 : distanceKm(points[i], points[v]);
      };
  const distance = fixture ? brute : (i: number, k: number) => (villes[k] === i ? 0 : kmCompare(brute(i, k)));
  const aTrente = fixture ? villesATrenteToutes(communes.length, bassins.length, distance) : villesATrenteParBande(communes.length, villes, points, distance);
  performance.measure('emploi : villes principales à 30 km', { start: debutCalcul, end: performance.now() });
  return { trimestre: json.trimestre_chomage, metiers, bassins, villes, communes, distance, distanceBrute: brute, aTrente };
}

/** Jeu de test (quelques communes) : toutes les villes principales, sans tri. */
function villesATrenteToutes(n: number, nb: number, distance: Emploi['distance']): Emploi['aTrente'] {
  const debut = new Int32Array(n + 1);
  const bassin: number[] = [];
  for (let i = 0; i < n; i++) {
    debut[i] = bassin.length;
    for (let k = 0; k < nb; k++) if (distance(i, k) <= RAYON_KM) bassin.push(k);
  }
  debut[n] = bassin.length;
  return { debut, bassin: Int32Array.from(bassin) };
}

/**
 * Vraies données : villes principales triées par latitude, puis calcul exact dans la bande. La distance sur la sphère est
 * au moins le rayon de la Terre × l'écart de latitude, et « 30 km ou moins » une fois arrondi veut dire moins de 30,5 km :
 * une ville hors de la bande de ± 30,5 km de latitude ne peut pas passer (mesuré en tâche 0b : 0 écart avec le calcul
 * complet).
 */
function villesATrenteParBande(n: number, villes: Int32Array, points: readonly (readonly number[])[], distance: Emploi['distance']): Emploi['aTrente'] {
  const BANDE = ((RAYON_KM + 0.5) / RAYON_TERRE_KM) * (180 / Math.PI);
  const tri = [...villes.keys()].filter((k) => villes[k] >= 0).sort((a, b) => points[villes[a]][1] - points[villes[b]][1]);
  const lats = Float64Array.from(tri, (k) => points[villes[k]][1]);
  const debut = new Int32Array(n + 1);
  let bassin = new Int32Array(n * 4);
  let t = 0;
  for (let i = 0; i < n; i++) {
    debut[i] = t;
    const lat = points[i][1];
    let bas = 0, haut = lats.length;
    while (bas < haut) {
      const m = (bas + haut) >> 1;
      if (lats[m] < lat - BANDE) bas = m + 1;
      else haut = m;
    }
    for (let j = bas; j < lats.length && lats[j] <= lat + BANDE; j++) {
      if (distance(i, tri[j]) > RAYON_KM) continue;
      if (t === bassin.length) {
        const plus = new Int32Array(t * 2);
        plus.set(bassin);
        bassin = plus;
      }
      bassin[t++] = tri[j];
    }
  }
  debut[n] = t;
  return { debut, bassin: bassin.slice(0, t) };
}

/**
 * La ville principale la plus proche de la commune `i` parmi les bassins du métier au niveau coché (R46), ou null s'il n'y
 * en a aucun. Égalité de distance écrite (H136) : le niveau le plus étroit, puis le plus de projets, puis le plus petit
 * code INSEE.
 */
export function plusProche(e: Emploi, i: number, code: string, niveau: Niveau): { code: string; nom: string; km: number } | null {
  const meilleur = bassinPlusProche(e, i, code, niveau);
  return meilleur && { code: meilleur.ville.code, nom: meilleur.ville.nom, km: meilleur.km };
}

/** `plusProche`, avec le bassin (index), son niveau le plus étroit et ses projets. */
function bassinPlusProche(e: Emploi, i: number, code: string, niveau: Niveau) {
  const metier = e.metiers.get(code);
  if (!metier) return null;
  let meilleur: { k: number; km: number; niveau: Niveau; projets: number; ville: Commune } | null = null;
  for (let k = 0; k < e.bassins.length; k++) {
    const x = metier.bassins.get(e.bassins[k]);
    if (!x || !dansNiveau(x.niveau, niveau) || e.villes[k] < 0) continue;
    const c = { k, km: e.distance(i, k), niveau: x.niveau, projets: x.projets, ville: e.communes[e.villes[k]] };
    if (c.km === Infinity) continue;
    const avant = !meilleur || (c.km - meilleur.km || ecartNiveaux(c.niveau, meilleur.niveau) || meilleur.projets - c.projets || (c.ville.code < meilleur.ville.code ? -1 : 1)) < 0;
    if (avant) meilleur = c;
  }
  return meilleur;
}

/**
 * Ligne d'un métier choisi dans la fiche de la commune `i` (R47). `niveau` : le métier a un niveau coché et la commune
 * passe son filtre (R46) : la ville principale la plus proche du niveau (égalité : H136), sa distance (`surPlace` pour la
 * ville elle-même ; sinon km avant l'arrondi, comme la mer), le niveau le plus étroit de ce bassin et ses projets.
 * `bassin` : sinon, le bassin de la commune, nommé par sa ville principale (H135), et ses projets (null : pas de chiffre
 * publié, D7). Null : métier inconnu, ou commune sans bassin (jeu de test « métropole »).
 */
export type LigneMetier =
  | { forme: 'niveau'; libelle: string; ville: string; surPlace: boolean; km: number; niveau: Niveau; projets: number }
  | { forme: 'bassin'; libelle: string; ville: string; projets: number | null };

export function ligneMetier(e: Emploi, i: number, { code, niveau }: MetierChoisi): LigneMetier | null {
  const metier = e.metiers.get(code);
  if (!metier) return null;
  if (niveau != null) {
    const p = bassinPlusProche(e, i, code, niveau);
    if (p && p.km <= RAYON_KM) {
      const surPlace = e.villes[p.k] === i;
      return { forme: 'niveau', libelle: metier.libelle, ville: p.ville.nom, surPlace, km: surPlace ? 0 : e.distanceBrute(i, p.k), niveau: p.niveau, projets: p.projets };
    }
  }
  const bassin = e.communes[i].bassin;
  const k = bassin == null ? -1 : e.bassins.indexOf(bassin);
  if (k < 0 || e.villes[k] < 0) return null;
  return { forme: 'bassin', libelle: metier.libelle, ville: e.communes[e.villes[k]].nom, projets: metier.bassins.get(bassin!)?.projets ?? null };
}

/** R44 : suggestions dès 2 caractères (espaces non comptées), 8 au plus (H133). */
export const MIN_CARACTERES_METIER = 2;
export const MAX_SUGGESTIONS_METIER = 8;

/** H133 : accents et casse ignorés ; les séparateurs de mots (espace, tiret, apostrophes, virgule, parenthèses) deviennent une espace. */
const mots = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .split(/[\s\-'’,()]+/)
    .filter(Boolean);

/** Le texte tapé (déjà découpé) commence-t-il un mot de `texte` ? Plusieurs mots tapés se suivent dans le texte. */
function commenceUnMot(texte: string, tape: string): boolean {
  const m = mots(texte);
  return m.some((_, i) => m.slice(i).join(' ').startsWith(tape));
}

/**
 * R44, H133, H134 : les métiers dont un mot du libellé, ou d'un nom courant, commence par le texte tapé ; ceux de `exclus`
 * (déjà choisis) écartés. Trouvés par leur libellé d'abord, puis par un nom courant, chacun dans l'ordre alphabétique ;
 * chacun une fois ; 8 au plus ; rien sous 2 caractères.
 */
export function chercherMetiers(metiers: Iterable<Metier>, texte: string, exclus: readonly string[] = []): Metier[] {
  const tape = mots(texte).join(' ');
  if (tape.replace(/ /g, '').length < MIN_CARACTERES_METIER) return [];
  const parLibelle: Metier[] = [];
  const parNom: Metier[] = [];
  for (const m of metiers) {
    if (exclus.includes(m.code)) continue;
    if (commenceUnMot(m.libelle, tape)) parLibelle.push(m);
    else if (m.noms.some((n) => commenceUnMot(n, tape))) parNom.push(m);
  }
  const alpha = (a: Metier, b: Metier) => a.libelle.localeCompare(b.libelle, 'fr');
  return [...parLibelle.sort(alpha), ...parNom.sort(alpha)].slice(0, MAX_SUGGESTIONS_METIER);
}

/** La raison d'un métier, avec la ville principale la plus proche de la commune `i` (fiche, R46). */
export function avecPlusProche(e: Emploi, i: number, r: Extract<Raison, { critere: 'metier' }>): Extract<Raison, { critere: 'metier' }> {
  const p = plusProche(e, i, r.code, r.niveau);
  return p ? { ...r, plusProche: { nom: p.nom, km: p.km } } : r;
}
