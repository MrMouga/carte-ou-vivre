import { describe, expect, it } from 'vitest';
import spec from '../../docs/specs/2026-11-25-recherche-et-mer/acceptance.json';
import { chercher, indexerNoms, normaliser, type Cherchable } from './recherche';

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

describe('H180 : normalisation', () => {
  it('majuscules, accents, ligatures, tirets, apostrophes et points', () => {
    expect(normaliser("  L'Haÿ-les-Roses ")).toBe('l hay les roses');
    expect(normaliser('ŒUVRE Æther')).toBe('oeuvre aether');
    expect(normaliser('St.-Malo’s')).toBe('st malo s');
  });
});
