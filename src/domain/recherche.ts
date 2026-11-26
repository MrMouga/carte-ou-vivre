// Recherche d'une commune (spec recherche-et-mer, R58, H179 à H182). Tout se passe dans la page : les noms sont ceux de
// communes.json, déjà chargé ; rien de ce qui est tapé ne part ailleurs (D3). La recherche par code postal (tâche 2) part de
// l'état `code` rendu ici.

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
