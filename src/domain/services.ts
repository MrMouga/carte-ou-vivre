// Spec services : lecture et écriture de `public/data/services.json` (plan, « Le fichier des temps »).
// Le fichier porte `codes` (les codes INSEE, dans l'ordre de communes.json), puis, pour chacun des 10 services, une chaîne
// d'un caractère par commune, dans l'ordre de `codes` : le caractère de rang n de ALPHABET vaut n minutes, de « 1 » (1 min)
// à « y » (rang 60, 60 min) ; « z » (rang 61) vaut « 61 min ou plus » ; « - » vaut « pas de chiffre » ; « 0 » n'est jamais écrit
// (H156 : au moins 1). Plus `iles_sans_pont` (H161). Les temps sont déjà arrondis par scripts/data/services.py (R52,
// H156) : la page les lit, les affiche et les compare tels quels, sans rien recalculer.

/** Les 10 services, dans l'ordre de la fiche (R54) : nom dans le fichier, nom dans l'adresse (R55), libellé (R51, R54). */
export const SERVICES = [
  { cle: 'medecin', adresse: 'medecin', libelle: 'Médecin' },
  { cle: 'commerce', adresse: 'commerce', libelle: 'Commerce alimentaire' },
  { cle: 'creche', adresse: 'creche', libelle: 'Crèche' },
  { cle: 'ecole', adresse: 'ecole', libelle: 'École' },
  { cle: 'college', adresse: 'college', libelle: 'Collège' },
  { cle: 'lycee', adresse: 'lycee', libelle: 'Lycée' },
  { cle: 'superieur', adresse: 'superieur', libelle: 'Supérieur' },
  { cle: 'gare', adresse: 'gare', libelle: 'Gare' },
  { cle: 'gare_regionale', adresse: 'gare-regionale', libelle: 'Gare régionale' },
  { cle: 'gare_grandes_lignes', adresse: 'gare-grandes-lignes', libelle: 'Gare grandes lignes' },
] as const;

export type ServiceCle = (typeof SERVICES)[number]['cle'];
/** Minutes arrondies d'un service (au moins 1) ; null : pas de chiffre. */
export type TempsServices = Record<ServiceCle, number | null>;
export type ServicesJson = { codes: string[]; iles_sans_pont: string[] } & Record<ServiceCle, string>;

export type Services = {
  /** Code INSEE → les 10 temps dans l'ordre de SERVICES ; null : pas de chiffre ; 61 : « 61 min ou plus ». */
  temps: Map<string, (number | null)[]>;
  /** Codes INSEE des îles sans pont (H161). */
  iles: Set<string>;
};

export const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
/** Plus grand temps écrit : « 61 min ou plus » (affiché « plus d'une heure »). */
export const PLUS_D_UNE_HEURE = 61;
const PAS_DE_CHIFFRE = '-';

/** Lit `services.json` ; une chaîne de la mauvaise longueur ou un caractère hors de l'alphabet est une erreur. */
export function lireServices(json: ServicesJson): Services {
  const n = json.codes.length;
  const colonnes = SERVICES.map(({ cle }) => {
    const chaine = json[cle];
    if (typeof chaine !== 'string' || chaine.length !== n) throw new Error(`services.json : « ${cle} » n'a pas ${n} caractères`);
    return chaine;
  });
  const temps = new Map<string, (number | null)[]>();
  json.codes.forEach((code, i) =>
    temps.set(
      code,
      colonnes.map((chaine) => {
        const c = chaine[i];
        if (c === PAS_DE_CHIFFRE) return null;
        const m = ALPHABET.indexOf(c);
        if (m < 1 || m > PLUS_D_UNE_HEURE) throw new Error(`services.json : caractère « ${c} » inattendu (commune ${code})`);
        return m;
      }),
    ),
  );
  return { temps, iles: new Set(json.iles_sans_pont) };
}

// ——— Tâche 1 : la valeur d'un service pour une commune (R54), jointe par code INSEE ———

/** État du fichier des temps dans la page (R57) : chargé à part, après la carte. */
export type EtatServices = { etat: 'chargement' } | { etat: 'erreur' } | { etat: 'pret'; services: Services };

const NBSP = ' ';
const DEP_CORSE = new Set(['2A', '2B']);
/** Les trois gares (« aucune sur l'île ») ; les deux dernières (« aucune en Corse ») (R54, D7). */
const GARES: readonly ServiceCle[] = ['gare', 'gare_regionale', 'gare_grandes_lignes'];
const GARES_CORSE: readonly ServiceCle[] = ['gare_regionale', 'gare_grandes_lignes'];

/** Valeur d'un service pour une commune : île sans pont, Corse, temps arrondi (61 = « 61 min ou plus ») ou pas de chiffre. */
export type ValeurService = { cas: 'ile' } | { cas: 'corse' } | { cas: 'temps'; minutes: number } | { cas: 'sans-chiffre' };

/** Les 10 temps d'une commune, trouvés par son code INSEE ; une commune absente du fichier n'a aucun chiffre. */
function tempsDe(s: Services, code: string): (number | null)[] {
  return s.temps.get(code) ?? SERVICES.map(() => null);
}

/**
 * R54 : la valeur d'un service pour une commune, dans cet ordre : « aucune sur l'île » (les trois gares d'une île sans
 * pont), « aucune en Corse » (gares régionale et grandes lignes, département 2A ou 2B de communes.json), le temps lu
 * tel quel (déjà arrondi, H156), « pas de chiffre ».
 */
export function valeurService(s: Services, c: { code: string; dep: string }, cle: ServiceCle): ValeurService {
  if (s.iles.has(c.code) && GARES.includes(cle)) return { cas: 'ile' };
  if (DEP_CORSE.has(c.dep) && GARES_CORSE.includes(cle)) return { cas: 'corse' };
  const m = tempsDe(s, c.code)[SERVICES.findIndex((x) => x.cle === cle)];
  return m == null ? { cas: 'sans-chiffre' } : { cas: 'temps', minutes: m };
}

/** Texte de la valeur (R54) : « 4 min » jusqu'à 60 min, « plus d'une heure » au-delà. */
export function texteValeur(v: ValeurService): string {
  if (v.cas === 'ile') return "aucune sur l'île";
  if (v.cas === 'corse') return 'aucune en Corse';
  if (v.cas === 'sans-chiffre') return 'pas de chiffre';
  return v.minutes > 60 ? "plus d'une heure" : `${v.minutes}${NBSP}min`;
}

/** Les 10 lignes de la fiche, dans l'ordre de R54 : libellé et texte de la valeur. */
export function lignesServices(s: Services, c: { code: string; dep: string }) {
  return SERVICES.map(({ cle, libelle }) => ({ cle, libelle, valeur: texteValeur(valeurService(s, c, cle)) }));
}

/** R54 : la phrase de la traversée, pour une île sans pont qui a au moins un temps parmi les sept premiers services. */
export function phraseTraversee(s: Services, c: { code: string }): boolean {
  if (!s.iles.has(c.code)) return false;
  // Les sept premiers de SERVICES : médecin à supérieur.
  return tempsDe(s, c.code).slice(0, 7).some((m) => m != null);
}

/** H159 : phrase des limites, toujours affichée ; insécables avant « : » et dans « 100 000 ». */
export const LIMITES_SERVICES =
  "Temps en voiture, sans embouteillages, que la moitié des habitants ne dépasse pas ; les trajets en bus ou à pied ne sont pas comptés. Médecins généralistes libéraux seulement, sans savoir s'ils prennent de nouveaux patients. Crèches financées par la CAF. " +
  `Supérieur${NBSP}: universités et grandes écoles, antennes comprises. Gare régionale${NBSP}: 100${NBSP}000 voyageurs par an ou plus. ` +
  `Gare grandes lignes${NBSP}: gare nationale, ou au moins 4 arrêts de TGV ou d'Intercités par jour ; son temps part parfois de la mairie.`;
/** H159 : phrase de la traversée. */
export const TRAVERSEE = `Île sans pont${NBSP}: un temps peut compter la traversée, sans l'attente du bateau.`;

// ——— Tâche 2 : le réglage, ses filtres effectifs (R55) et le filtre (R53) ———

/** Niveaux de scolarité, dans l'ordre des âges (H167) : la crèche d'abord. */
export const NIVEAUX_SCOLARITE = ['creche', 'ecole', 'college', 'lycee', 'superieur'] as const satisfies readonly ServiceCle[];
export type NiveauScolarite = (typeof NIVEAUX_SCOLARITE)[number];
/** Les trois niveaux de gare (« Toutes » = `gare`). */
export type TypeGare = 'gare' | 'gare_regionale' | 'gare_grandes_lignes';

/** R55 : les temps valides de chaque service, ceux des pastilles (R51). */
export function cransService(cle: ServiceCle): readonly number[] {
  if (cle === 'medecin' || cle === 'commerce') return [5, 10, 15];
  if (GARES.includes(cle)) return [10, 20, 30];
  return [5, 10, 20]; // les cinq niveaux de scolarité
}
export const estGare = (cle: ServiceCle): cle is TypeGare => GARES.includes(cle);
export const estScolarite = (cle: ServiceCle): cle is NiveauScolarite => (NIVEAUX_SCOLARITE as readonly ServiceCle[]).includes(cle);

/**
 * État de la catégorie « Services » (plan, « Le réglage ») : temps coché du médecin et du commerce (`null` = aucun),
 * niveaux de scolarité cochés et temps commun, type de gare et temps de la gare. Une scolarité incomplète (H153) ou un
 * type de gare sans temps sont gardés ici pour le panneau, mais ne filtrent pas (`filtresServices`).
 */
export type ReglageServices = {
  medecin: number | null;
  commerce: number | null;
  niveaux: NiveauScolarite[];
  scolarite: number | null;
  gare: TypeGare;
  tempsGare: number | null;
};
export const SERVICES_DEPART: ReglageServices = { medecin: null, commerce: null, niveaux: [], scolarite: null, gare: 'gare', tempsGare: null };
/** Rien de coché et le type « Toutes » : le champ `services` des réglages est alors absent. */
export const servicesVides = (s: ReglageServices) =>
  s.medecin == null && s.commerce == null && !s.niveaux.length && s.scolarite == null && s.gare === 'gare' && s.tempsGare == null;

/** Un service filtré et son temps coché. */
export type FiltreService = { cle: ServiceCle; minutes: number };

/**
 * La seule fonction des filtres effectifs (plan, « Le réglage ») : l'évaluation, l'adresse et le résumé replié passent
 * par elle. Dans l'ordre fixe de R55 : médecin, commerce, chaque niveau de scolarité coché (si un temps commun est coché,
 * H153), puis la gare de son type (si un temps est coché).
 */
export function filtresServices(s?: ReglageServices): FiltreService[] {
  if (!s) return [];
  const f: FiltreService[] = [];
  if (s.medecin != null) f.push({ cle: 'medecin', minutes: s.medecin });
  if (s.commerce != null) f.push({ cle: 'commerce', minutes: s.commerce });
  if (s.scolarite != null) for (const n of NIVEAUX_SCOLARITE) if (s.niveaux.includes(n)) f.push({ cle: n, minutes: s.scolarite });
  if (s.tempsGare != null) f.push({ cle: s.gare, minutes: s.tempsGare });
  return f;
}

/** Raison d'un service filtré qui écarte une commune (R53) : temps au-dessus du plafond, ou un des trois cas de D7. */
export type RaisonService =
  | { critere: 'service'; service: ServiceCle; cas: 'temps'; valeur: number; plafond: number }
  | { critere: 'service'; service: ServiceCle; cas: 'ile' | 'corse' | 'sans-habitant'; plafond: number };

/**
 * R53 : `null` si la commune passe ce filtre. Inférieur ou égal au temps coché : passe ; sans chiffre : passe ; ne passent
 * jamais (D7) : une île sans pont pour les trois gares, la Corse pour les gares régionale et grandes lignes, une commune de
 * population 0 pour tous les services. Le temps est comparé tel que lu (déjà arrondi, H156 ; 61 = « 61 min ou plus »).
 */
export function raisonService(s: Services, c: { code: string; dep: string; population: number | null }, { cle, minutes }: FiltreService): RaisonService | null {
  const v = valeurService(s, c, cle);
  if (v.cas === 'ile' || v.cas === 'corse') return { critere: 'service', service: cle, cas: v.cas, plafond: minutes };
  if (c.population === 0) return { critere: 'service', service: cle, cas: 'sans-habitant', plafond: minutes };
  if (v.cas === 'temps' && v.minutes > minutes) return { critere: 'service', service: cle, cas: 'temps', valeur: v.minutes, plafond: minutes };
  return null;
}

/** Libellé d'un service (R51, R54), celui des raisons. */
export const libelleService = (cle: ServiceCle) => SERVICES.find((x) => x.cle === cle)!.libelle;

/** Écrit `services.json` depuis des temps arrondis (au-delà de 61 min : « 61 ou plus »), dans l'ordre des lignes. */
export function ecrireServices(lignes: { code: string; temps: TempsServices; ile_sans_pont?: boolean }[]): ServicesJson {
  const caractere = (m: number | null, code: string) => {
    if (m === null) return PAS_DE_CHIFFRE;
    if (!Number.isInteger(m) || m < 1) throw new Error(`services.json : ${m} min n'est pas un temps arrondi (commune ${code})`);
    return ALPHABET[Math.min(m, PLUS_D_UNE_HEURE)];
  };
  const colonnes = Object.fromEntries(
    SERVICES.map(({ cle }) => [cle, lignes.map((l) => caractere(l.temps[cle], l.code)).join('')]),
  ) as Record<ServiceCle, string>;
  return {
    codes: lignes.map((l) => l.code),
    ...colonnes,
    iles_sans_pont: lignes.filter((l) => l.ile_sans_pont).map((l) => l.code),
  };
}
