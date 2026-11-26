// Recherche d'une commune (spec recherche-et-mer, R58, H179 à H182). Tout se passe dans la page : les noms sont ceux de
// communes.json, déjà chargé ; rien de ce qui est tapé ne part ailleurs (D3). La recherche par code postal part de l'état
// `code` rendu par `chercher`, dans le fichier des codes du site, demandé une fois (H187).

import { avecDelai } from './chargement';

/** Ce que la recherche lit d'une commune. */
export type Cherchable = { code: string; nom: string; dep: string; population: number | null };

/** Nombre de suggestions au plus, par nom ou par début de code (H179). */
export const MAX_SUGGESTIONS = 8;

/**
 * H180 : sans majuscules, accents ni ligatures (« œ » = « oe », « æ » = « ae ») ; tout ce qui n'est ni lettre ni chiffre
 * (tirets, apostrophes, points) vaut une espace ; espaces resserrées.
 */
export function normaliser(s: string): string {
  return s
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/**
 * Index des noms (H179) : calculé une fois, à l'arrivée des données. Les communes y sont déjà dans l'ordre des suggestions
 * (H182 : population décroissante, puis nom, puis code INSEE) : une recherche s'arrête à la 8e trouvée.
 */
export type IndexNoms<C extends Cherchable = Cherchable> = { communes: C[]; noms: string[] };

export const ordreSuggestions = (a: Cherchable, b: Cherchable) =>
  (b.population ?? -1) - (a.population ?? -1) || a.nom.localeCompare(b.nom, 'fr') || (a.code < b.code ? -1 : a.code > b.code ? 1 : 0);

export function indexerNoms<C extends Cherchable>(communes: readonly C[]): IndexNoms<C> {
  const triees = [...communes].sort(ordreSuggestions);
  return { communes: triees, noms: triees.map((c) => normaliser(c.nom)) };
}

export type Resultat<C extends Cherchable = Cherchable> =
  /** Rien de tapé. */
  | { etat: 'vide' }
  /** Un seul caractère : ni suggestion ni message. */
  | { etat: 'court' }
  /** « Aucune commune ne correspond. » */
  | { etat: 'aucune' }
  /** 2 à 5 chiffres, espaces retirées : recherche par code postal (tâche 2). */
  | { etat: 'code'; chiffres: string }
  | { etat: 'suggestions'; communes: C[] };

/**
 * Les saisies à essayer : « st » et « ste », mots entiers de la saisie, valent aussi « saint » et « sainte » (H180).
 * « st » seul, dernier mot, trouve donc aussi « Sainte-… » (« saint » en est le début).
 */
function variantes(q: string): string[] {
  let tout = [''];
  for (const mot of q.split(' ')) {
    const choix = mot === 'st' ? ['st', 'saint'] : mot === 'ste' ? ['ste', 'sainte'] : [mot];
    tout = tout.flatMap((debut) => choix.map((c) => (debut ? `${debut} ${c}` : c)));
  }
  return tout;
}

/** Une commune correspond si la saisie commence au début de son nom ou d'un de ses mots (H180). */
const correspond = (nom: string, v: string) => nom.startsWith(v) || nom.includes(` ${v}`);

/**
 * R58 : dès 2 caractères, une saisie qui contient une lettre cherche par nom (8 au plus, dans l'ordre de H182, chaque
 * commune une fois) ; 2 à 5 chiffres, espaces retirées, cherchent par code postal ; toute autre saisie donne « aucune » (H181).
 */
export function chercher<C extends Cherchable>(index: IndexNoms<C>, saisie: string): Resultat<C> {
  const s = saisie.trim();
  if (!s) return { etat: 'vide' };
  if (s.length < 2) return { etat: 'court' };
  if (/\p{L}/u.test(s)) {
    const vs = variantes(normaliser(s));
    const trouvees: C[] = [];
    for (let i = 0; i < index.noms.length && trouvees.length < MAX_SUGGESTIONS; i++) {
      const nom = index.noms[i];
      if (vs.some((v) => correspond(nom, v))) trouvees.push(index.communes[i]);
    }
    return trouvees.length ? { etat: 'suggestions', communes: trouvees } : { etat: 'aucune' };
  }
  const chiffres = s.replace(/\s/g, '');
  return /^\d{2,5}$/.test(chiffres) ? { etat: 'code', chiffres } : { etat: 'aucune' };
}

// ---------------------------------------------------------------------------------------------------------------------
// Recherche par code postal (tâche 2 : R58 partie code, H183, H187).

/** `public/data/codes-postaux.json` (tâche 0a) : code postal → codes INSEE de communes.json, arrondissements déjà rattachés. */
export type CodesPostaux = Record<string, string[]>;

/** Les codes postaux dans l'ordre croissant, chacun avec ses communes de la carte (un code INSEE absent est écarté). */
export type IndexCodes<C extends Cherchable = Cherchable> = { postaux: string[]; communes: C[][] };

export function indexerCodes<C extends Cherchable>(codes: CodesPostaux, communes: readonly C[]): IndexCodes<C> {
  const parInsee = new Map(communes.map((c) => [c.code, c]));
  const postaux = Object.keys(codes).sort();
  return { postaux, communes: postaux.map((cp) => codes[cp].flatMap((insee) => parInsee.get(insee) ?? [])) };
}

export type ResultatCode<C extends Cherchable = Cherchable> =
  | { etat: 'aucune' }
  /** `complet` : code de 5 chiffres, toutes ses communes, dans une liste qui défile ; sinon 8 au plus. */
  | { etat: 'postaux'; suggestions: { commune: C; postal: string }[]; complet: boolean };

/**
 * R58 : un début de code (2 à 4 chiffres) donne 8 communes au plus ; un code complet (5 chiffres), toutes. Chaque commune
 * une fois, avec le plus petit de ses codes qui correspondent (H183), dans l'ordre de H182. `chiffres` vient de l'état
 * `code` de `chercher` (espaces déjà retirées).
 */
export function chercherCode<C extends Cherchable>(index: IndexCodes<C>, chiffres: string): ResultatCode<C> {
  const vues = new Map<C, string>();
  index.postaux.forEach((cp, i) => {
    if (!cp.startsWith(chiffres)) return;
    // Les codes sont dans l'ordre croissant : le premier vu d'une commune est son plus petit.
    for (const c of index.communes[i]) if (!vues.has(c)) vues.set(c, cp);
  });
  if (!vues.size) return { etat: 'aucune' };
  const complet = chiffres.length === 5;
  const triees = [...vues.keys()].sort(ordreSuggestions);
  return {
    etat: 'postaux',
    suggestions: (complet ? triees : triees.slice(0, MAX_SUGGESTIONS)).map((commune) => ({ commune, postal: vues.get(commune)! })),
    complet,
  };
}

/** H187 : codes postaux indisponibles 10 s après la première demande sans réponse. */
export const DELAI_CODES_MS = 10_000;

/**
 * H187 : une demande ; en cas d'erreur, un nouvel essai aussitôt ; échec après une seconde erreur ou 10 s sans réponse.
 * Le nouvel essai à la prochaine prise de focus est à l'appelant (App).
 */
export function chargerCodesPostaux(lire: () => Promise<CodesPostaux>): Promise<CodesPostaux> {
  return avecDelai(
    lire().catch(() => lire()),
    DELAI_CODES_MS,
  );
}
