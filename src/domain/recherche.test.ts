import { afterEach, describe, expect, it, vi } from 'vitest';
import spec from '../../docs/specs/2026-11-25-recherche-et-mer/acceptance.json';
import {
  chargerCodesPostaux,
  chercher,
  chercherCode,
  DELAI_CODES_MS,
  indexerCodes,
  indexerNoms,
  normaliser,
  type Cherchable,
  type CodesPostaux,
} from './recherche';

// Spec recherche-et-mer, tâche 1 : la recherche par nom (R58, H179 à H182). AC-12 porte ses propres communes inventées,
// hors de la carte (critère, « given ») ; AC-1 se rejoue aussi ici, sur la fixture de la tranche, avant le navigateur.

const nomAffiche = (c: Cherchable) => `${c.nom} (${c.dep})`;
const noms = (communes: Cherchable[], saisie: string) => {
  const r = chercher(indexerNoms(communes), saisie);
  return r.etat === 'suggestions' ? r.communes.map(nomAffiche) : r.etat;
};

// AC-12, « given » : nom, département, population ; les codes INSEE sont inventés (le critère n'en donne pas).
const AC12: Cherchable[] = [
  { code: '93066', nom: 'Saint-Denis', dep: '93', population: 113000 },
  { code: '85194', nom: "Les Sables-d'Olonne", dep: '85', population: 45000 },
  { code: '83115', nom: 'Sainte-Maxime', dep: '83', population: 14000 },
  { code: '55502', nom: 'Stenay', dep: '55', population: 2600 },
  { code: '17323', nom: "Saint-Denis-d'Oléron", dep: '17', population: 1300 },
  { code: '51410', nom: 'Œuilly', dep: '51', population: 600 },
];

describe('AC-12 recherche par nom : majuscules, accents, ligatures, tirets et apostrophes, début de mot, « st » et « ste »', () => {
  it('AC-12 « olonne » et « LES SABLES » : Les Sables-d\'Olonne (85)', () => {
    expect(noms(AC12, 'olonne')).toEqual(["Les Sables-d'Olonne (85)"]);
    expect(noms(AC12, 'LES SABLES')).toEqual(["Les Sables-d'Olonne (85)"]);
  });
  it('AC-12 « st denis » : Saint-Denis (93) puis Saint-Denis-d\'Oléron (17)', () => {
    expect(noms(AC12, 'st denis')).toEqual(['Saint-Denis (93)', "Saint-Denis-d'Oléron (17)"]);
  });
  it('AC-12 « st » : Saint-Denis (93), Sainte-Maxime (83), Stenay (55), Saint-Denis-d\'Oléron (17), dans cet ordre', () => {
    expect(noms(AC12, 'st')).toEqual(['Saint-Denis (93)', 'Sainte-Maxime (83)', 'Stenay (55)', "Saint-Denis-d'Oléron (17)"]);
  });
  it('AC-12 « ste max » : Sainte-Maxime (83)', () => {
    expect(noms(AC12, 'ste max')).toEqual(['Sainte-Maxime (83)']);
  });
  it('AC-12 « oeuilly » : Œuilly (51)', () => {
    expect(noms(AC12, 'oeuilly')).toEqual(['Œuilly (51)']);
  });
  it('AC-12 « denis » : Saint-Denis (93) puis Saint-Denis-d\'Oléron (17)', () => {
    expect(noms(AC12, 'denis')).toEqual(['Saint-Denis (93)', "Saint-Denis-d'Oléron (17)"]);
  });
  it('AC-12 « st-denis-d\'ol » : Saint-Denis-d\'Oléron (17)', () => {
    expect(noms(AC12, "st-denis-d'ol")).toEqual(["Saint-Denis-d'Oléron (17)"]);
  });
});

// AC-1 (son « then » sur les suggestions), sur les 6 communes de la fixture de la tranche.
const FIXTURE: Cherchable[] = spec.fixture.items.map((it) => ({ code: it.code_insee, nom: it.nom, dep: it.dep, population: it.population }));

describe('AC-1 recherche par nom sur la fixture de la tranche', () => {
  it('AC-1 « q » : aucune suggestion et aucun message ; « QUAI » : Quaibleu (13) ; « grandé » : Grandeville (33) ; « mo » : Montcher (75)', () => {
    expect(noms(FIXTURE, 'q')).toBe('court');
    expect(noms(FIXTURE, 'QUAI')).toEqual(['Quaibleu (13)']);
    expect(noms(FIXTURE, 'grandé')).toEqual(['Grandeville (33)']);
    expect(noms(FIXTURE, 'mo')).toEqual(['Montcher (75)']);
  });
});

describe('R58 et H179 à H182 : états, nombre et ordre des suggestions', () => {
  it('vide, trop court (1 caractère), aucune (« zzz », « -- », « 330000 », « 33 bordeaux »)', () => {
    expect(noms(FIXTURE, '')).toBe('vide');
    expect(noms(FIXTURE, '   ')).toBe('vide');
    expect(noms(FIXTURE, ' g ')).toBe('court');
    expect(noms(FIXTURE, 'zzz')).toBe('aucune');
    expect(noms(FIXTURE, '--')).toBe('aucune');
    expect(noms(FIXTURE, '330000')).toBe('aucune');
    expect(noms(FIXTURE, '33 grandeville')).toBe('aucune');
  });
  it('2 à 5 chiffres, espaces retirées : recherche par code postal (« 33 000 » = « 33000 »)', () => {
    expect(chercher(indexerNoms(FIXTURE), '33 000')).toEqual({ etat: 'code', chiffres: '33000' });
    expect(chercher(indexerNoms(FIXTURE), '99')).toEqual({ etat: 'code', chiffres: '99' });
  });
  it('n\'importe où dans le nom ne compte pas : « ville » ne trouve pas Grandeville, « eville » non plus', () => {
    expect(noms(FIXTURE, 'ville')).toBe('aucune');
    expect(noms(FIXTURE, 'eville')).toBe('aucune');
  });
  it('8 suggestions au plus, par population décroissante, puis nom, puis code INSEE ; chaque commune une fois', () => {
    const communes: Cherchable[] = [
      ...Array.from({ length: 10 }, (_, i) => ({ code: `990${String(i).padStart(2, '0')}`, nom: `Saint-Lieu ${String.fromCharCode(74 - i)}`, dep: '99', population: 1000 + i * 100 })),
      { code: '99201', nom: 'Sainte-Égale', dep: '99', population: 5000 },
      { code: '99200', nom: 'Sainte-Égale', dep: '98', population: 5000 },
      { code: '99300', nom: 'Saint-Avant', dep: '99', population: 5000 },
      { code: '99400', nom: 'Sans-Habitants', dep: '99', population: null },
    ];
    expect(noms(communes, 'sa')).toEqual([
      'Saint-Avant (99)',
      'Sainte-Égale (98)',
      'Sainte-Égale (99)',
      'Saint-Lieu A (99)',
      'Saint-Lieu B (99)',
      'Saint-Lieu C (99)',
      'Saint-Lieu D (99)',
      'Saint-Lieu E (99)',
    ]);
    // « saint lieu » touche deux mots ; la commune n'apparaît qu'une fois même si deux variantes la trouvent (« st » → « saint »).
    expect(noms(communes, 'st lieu j')).toEqual(['Saint-Lieu J (99)']);
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// Tâche 2 : la recherche par code postal (R58 partie code, H181, H183) et le chargement des codes (H187).

/** Suggestions par code, par leur libellé : « 33991 · Grandeville (33) » (H183). */
const parCode = (communes: Cherchable[], codes: CodesPostaux, saisie: string) => {
  const r = chercher(indexerNoms(communes), saisie);
  if (r.etat !== 'code') return r.etat;
  const rc = chercherCode(indexerCodes(codes, communes), r.chiffres);
  return rc.etat === 'postaux' ? rc.suggestions.map((s) => `${s.postal} · ${nomAffiche(s.commune)}`) : rc.etat;
};

describe('AC-13 recherche par code : code complet partagé, début de code, arrondissements de Paris déjà rattachés', () => {
  // « given » : 12 communes C01 (99) à C12 (99), de 12 000 à 1 000 habitants par pas de 1 000, toutes au code 99200 ;
  // Paris (75, 75056) ; la ligne de La Poste 75015 → 75115 est déjà rattachée à la ville dans le fichier servi (tâche 0a,
  // morceau a d'AC-13) : `"75015": ["75056"]`. Codes INSEE des C inventés (le critère n'en donne pas).
  const C: Cherchable[] = Array.from({ length: 12 }, (_, i) => ({
    code: `99${String(201 + i)}`,
    nom: `C${String(i + 1).padStart(2, '0')}`,
    dep: '99',
    population: 12000 - i * 1000,
  }));
  const PARIS: Cherchable = { code: '75056', nom: 'Paris', dep: '75', population: 2100000 };
  const communes = [...C].reverse().concat(PARIS); // dans le désordre : l'ordre vient de la règle, pas du fichier
  const codes: CodesPostaux = { '75015': ['75056'], '99200': C.map((c) => c.code).reverse() };

  it('AC-13 « 99200 » : 12 suggestions, « 99200 · C01 (99) » à « 99200 · C12 (99) », dans cet ordre (toutes, code complet)', () => {
    expect(parCode(communes, codes, '99200')).toEqual(C.map((c) => `99200 · ${c.nom} (99)`));
    const r = chercherCode(indexerCodes(codes, communes), '99200');
    expect(r.etat === 'postaux' && r.complet).toBe(true);
  });
  it('AC-13 « 992 » : 8 suggestions, C01 à C08', () => {
    expect(parCode(communes, codes, '992')).toEqual(C.slice(0, 8).map((c) => `99200 · ${c.nom} (99)`));
    const r = chercherCode(indexerCodes(codes, communes), '992');
    expect(r.etat === 'postaux' && r.complet).toBe(false);
  });
  it('AC-13 « 75015 » : « 75015 · Paris (75) »', () => {
    expect(parCode(communes, codes, '75015')).toEqual(['75015 · Paris (75)']);
  });
});

// AC-2 (son « then »), sur les 6 communes de la fixture de la tranche et leurs `codes_postaux`, avant le navigateur.
const CODES_FIXTURE: CodesPostaux = {};
for (const it of spec.fixture.items) for (const cp of it.codes_postaux) (CODES_FIXTURE[cp] ??= []).push(it.code_insee);

describe('AC-2 recherche par code sur la fixture de la tranche', () => {
  it('AC-2 « 99100 » : Quaibleu puis Portmer ; « 339 » : 33990 · Grandeville ; « 33 991 » : 33991 · Grandeville', () => {
    expect(parCode(FIXTURE, CODES_FIXTURE, '99100')).toEqual(['99100 · Quaibleu (13)', '99100 · Portmer (17)']);
    expect(parCode(FIXTURE, CODES_FIXTURE, '339')).toEqual(['33990 · Grandeville (33)']);
    expect(parCode(FIXTURE, CODES_FIXTURE, '33 991')).toEqual(['33991 · Grandeville (33)']);
  });
});

describe('R58 et H183 : recherche par code', () => {
  it('le plus petit des codes qui correspondent est dans le libellé ; chaque commune une fois', () => {
    // Grandeville a 33990 et 33991 : « 3399 » la trouve deux fois, une seule suggestion, au plus petit code.
    expect(parCode(FIXTURE, CODES_FIXTURE, '3399')).toEqual(['33990 · Grandeville (33)']);
    // « 99 » : 99100 (Quaibleu, Portmer) ; triées par population.
    expect(parCode(FIXTURE, CODES_FIXTURE, '99')).toEqual(['99100 · Quaibleu (13)', '99100 · Portmer (17)']);
  });
  it('un code inconnu, ou d\'une commune absente de la carte (outre-mer, Monaco), donne « aucune »', () => {
    expect(parCode(FIXTURE, CODES_FIXTURE, '12345')).toBe('aucune');
    expect(parCode(FIXTURE, { ...CODES_FIXTURE, '97400': ['97411'] }, '974')).toBe('aucune');
    expect(parCode(FIXTURE, { ...CODES_FIXTURE, '99100': ['97411', '99001'] }, '99100')).toEqual(['99100 · Portmer (17)']);
  });
  it('début de code (2 à 4 chiffres) : 8 au plus, dans l\'ordre de H182', () => {
    const communes: Cherchable[] = Array.from({ length: 10 }, (_, i) => ({ code: `990${i}0`, nom: `Lieu ${i}`, dep: '99', population: 100 + i }));
    const codes: CodesPostaux = Object.fromEntries(communes.map((c, i) => [`9930${i}`, [c.code]]));
    expect(parCode(communes, codes, '993')).toEqual(Array.from({ length: 8 }, (_, k) => `9930${9 - k} · Lieu ${9 - k} (99)`));
  });
});

describe('H187 : chargement des codes postaux (une demande, un nouvel essai aussitôt, indisponibles après 2 erreurs ou 10 s)', () => {
  afterEach(() => vi.useRealTimers());
  const CODES = { '33990': ['99002'] };

  it('une demande qui répond : une seule demande', async () => {
    const lire = vi.fn(() => Promise.resolve(CODES));
    await expect(chargerCodesPostaux(lire)).resolves.toEqual(CODES);
    expect(lire).toHaveBeenCalledTimes(1);
  });
  it('une erreur : un nouvel essai aussitôt, qui répond', async () => {
    const lire = vi.fn().mockRejectedValueOnce(new Error('503')).mockResolvedValueOnce(CODES);
    await expect(chargerCodesPostaux(lire)).resolves.toEqual(CODES);
    expect(lire).toHaveBeenCalledTimes(2);
  });
  it('deux erreurs : indisponibles, sans troisième demande', async () => {
    const lire = vi.fn(() => Promise.reject(new Error('503')));
    await expect(chargerCodesPostaux(lire)).rejects.toThrow();
    expect(lire).toHaveBeenCalledTimes(2);
  });
  it('sans réponse : encore en chargement à 9,9 s, indisponibles à 10 s', async () => {
    vi.useFakeTimers();
    let etat = 'chargement';
    chargerCodesPostaux(() => new Promise<CodesPostaux>(() => {})).then(
      () => (etat = 'pret'),
      () => (etat = 'indisponible'),
    );
    await vi.advanceTimersByTimeAsync(9_900); // on est à 9,9 s
    expect(etat).toBe('chargement');
    await vi.advanceTimersByTimeAsync(100); // on est à 10 s
    expect(etat).toBe('indisponible');
    expect(DELAI_CODES_MS).toBe(10_000);
  });
});

describe('H180 : normalisation', () => {
  it('majuscules, accents, ligatures, tirets, apostrophes et points', () => {
    expect(normaliser("  L'Haÿ-les-Roses ")).toBe('l hay les roses');
    expect(normaliser('ŒUVRE Æther')).toBe('oeuvre aether');
    expect(normaliser('St.-Malo’s')).toBe('st malo s');
  });
});
