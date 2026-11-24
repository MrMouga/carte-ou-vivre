// Spec services : lecture et écriture de `public/data/services.json` (plan, « Le fichier des temps »).
// Le fichier porte `codes` (les codes INSEE, dans l'ordre de communes.json), puis, pour chacun des 10 services, une chaîne
// d'un caractère par commune, dans l'ordre de `codes` : le caractère de rang n de ALPHABET vaut n minutes, de « 1 » (1 min)
// à « y » (rang 60, 60 min ; le plan écrit « Y », rang 34) ; « z » (rang 61) vaut « 61 min ou plus » ; « - » vaut « pas de chiffre » ; « 0 » n'est jamais écrit
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
