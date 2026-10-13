import { describe, expect, it } from 'vitest';
import loyerMer from '../../docs/specs/2026-10-12-loyer-mer/acceptance.json';
import proches from '../../docs/specs/2026-10-13-proches/acceptance.json';
import { duree, raisonTexte } from './format';
import { evaluer, PROCHE, REGLAGES_DEPART, type Commune, type ProchePret, type Reglages } from './score';

// Proches (R10, R11, H22) avec la fixture révisée de la spec proches : mêmes 5 communes que loyer-mer,
// et les fins de tranche du faux service de trajets (null = plus de 3 h, rangé 0).
// Les valeurs sont celles d'AC-1, AC-2, AC-4 et AC-6, mais ces tests portent sur le calcul : les AC sont prouvés en tâche 2b.
const communes: Commune[] = loyerMer.fixture.items.map((it) => ({
  code: it.code_insee,
  nom: it.nom,
  dep: it.dep,
  population: it.population,
  loyerM2: it.loyer_m2,
  estimationPropre: it.estimation_propre,
  merKm: it.mer_km,
}));
const trajets = proches.fixture.services['calcul de trajets (IGN) — fin de tranche en minutes par code de commune (null = plus de 3 h), par adresse choisie'] as Record<
  string,
  Record<string, number | null>
>;
/** Temps d'un proche de la fixture, dans l'ordre des communes (0 = plus de 3 h). */
const tempsDe = (libelle: string) => Uint16Array.from(communes, (c) => trajets[libelle][c.code] ?? 0);
const nantes = (plafond: number): ProchePret => ({ nom: 'Nantesville (44)', plafond, temps: tempsDe('1 rue Test 44000 Nantesville') });
const toulouse = (plafond: number): ProchePret => ({ nom: 'Toulouseville (31)', plafond, temps: tempsDe('2 place Test 31000 Toulouseville') });

const code = { A: '99001', B: '99002', C: '99003', D: '99004', E: '99005' } as const;
function scores(r: Reglages, liste: ProchePret[]) {
  const res = evaluer(communes, r, liste);
  return { res, by: (id: keyof typeof code) => res.parCode.get(code[id])! };
}

describe('R11 — plafond, note et score des proches', () => {
  it('plafond : de 15 min à 3 h par pas de 15 min, 2 h à l’ajout (H19)', () => {
    expect(PROCHE).toEqual({ pas: 15, max: 180, ajout: 120 });
  });

  it('Nantesville à 2 h : Portmer seule passe, score 65 ; Grandeville (2 h 15) et Quaibleu (plus de 3 h) ne passent pas', () => {
    const { res, by } = scores(REGLAGES_DEPART, [nantes(120)]);
    expect(res.classement.map((e) => [e.commune.nom, e.score])).toEqual([['Portmer', 65]]);
    expect(by('B').passe).toBe(false);
    expect(by('E').passe).toBe(false);
  });

  it('Nantesville à 2 h 15 : Portmer 67, Grandeville 21 (fin de tranche égale au plafond : passe, note 0)', () => {
    const { res } = scores(REGLAGES_DEPART, [nantes(135)]);
    expect(res.classement.map((e) => [e.commune.nom, e.score])).toEqual([['Portmer', 67], ['Grandeville', 21]]);
  });

  it('Nantesville à 2 h 15 et Toulouseville à 2 h 45 : Portmer 50, Grandeville 30 ; Quaibleu ne passe pas', () => {
    const { res, by } = scores(REGLAGES_DEPART, [nantes(135), toulouse(165)]);
    expect(res.classement.map((e) => [e.commune.nom, e.score])).toEqual([['Portmer', 50], ['Grandeville', 30]]);
    expect(by('E').passe).toBe(false);
  });

  it('loyer et mer sur « Sans limite », Nantesville à 2 h 15 : la page classe (Portmer 56, palier 40–60 ; Grandeville 0, palier 0–20)', () => {
    const { res, by } = scores({ loyer: null, mer: null, tailles: [] }, [nantes(135)]);
    expect(res.actif).toBe(true);
    expect(res.classement.map((e) => [e.commune.nom, e.score, e.palier])).toEqual([['Portmer', 56, 3], ['Grandeville', 0, 1]]);
    expect([by('C').passe, by('D').passe, by('E').passe]).toEqual([false, false, false]);
  });

  it('sans proche prêt, rien ne change (loyer-mer : 72, 49, 32)', () => {
    const { res } = scores(REGLAGES_DEPART, []);
    expect(res.classement.map((e) => e.score)).toEqual([72, 49, 32]);
    expect(evaluer(communes, REGLAGES_DEPART).classement.map((e) => e.score)).toEqual([72, 49, 32]);
  });

  it('raisons : après loyer, mer et taille, une par proche non tenu, dans l’ordre d’ajout ; « plus de 3 h » vaut 0', () => {
    const { by } = scores({ loyer: 1200, mer: 60, tailles: ['petite-ville'] }, [nantes(120), toulouse(60)]);
    expect(by('B').raisons).toEqual([
      { critere: 'taille', taille: 'grande-ville', population: 260000 },
      { critere: 'proche', nom: 'Nantesville (44)', valeur: 135, plafond: 120 },
      { critere: 'proche', nom: 'Toulouseville (31)', valeur: 75, plafond: 60 },
    ]);
    expect(by('E').raisons.filter((r) => r.critere === 'proche')).toEqual([
      { critere: 'proche', nom: 'Nantesville (44)', valeur: 0, plafond: 120 },
      { critere: 'proche', nom: 'Toulouseville (31)', valeur: 120, plafond: 60 },
    ]);
  });
});

// H3 : on compare après avoir remplacé les espaces insécables par des espaces.
const s = (t: string) => t.replace(/ /g, ' ');

describe('H22 — formats des temps des proches', () => {
  it('« 15 min », « 45 min », « 1 h », « 1 h 15 », « 2 h 15 », « 3 h », « plus de 3 h »', () => {
    expect([15, 45, 60, 75, 135, 120, 180, 0].map((m) => s(duree(m)))).toEqual(['15 min', '45 min', '1 h', '1 h 15', '2 h 15', '2 h', '3 h', 'plus de 3 h']);
  });

  it('raison d’un proche : « Nantesville (44) 2 h 15 : au-dessus de ton plafond de 2 h »', () => {
    expect(s(raisonTexte({ critere: 'proche', nom: 'Nantesville (44)', valeur: 135, plafond: 120 }))).toBe('Nantesville (44) 2 h 15 : au-dessus de ton plafond de 2 h');
    expect(s(raisonTexte({ critere: 'proche', nom: 'Nantesville (44)', valeur: 0, plafond: 135 }))).toBe('Nantesville (44) plus de 3 h : au-dessus de ton plafond de 2 h 15');
  });
});
