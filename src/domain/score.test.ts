import { describe, expect, it } from 'vitest';
import acceptance from '../../docs/specs/2026-10-12-loyer-mer/acceptance.json';
import { evaluer, palier, REGLAGES_DEPART, type Commune, type Reglages } from './score';

// Fixture « 5 communes » d'acceptance.json, au format du domaine.
const fixture: Commune[] = acceptance.fixture.items.map((it) => ({
  code: it.code_insee,
  nom: it.nom,
  dep: it.dep,
  population: it.population,
  loyerM2: it.loyer_m2,
  estimationPropre: it.estimation_propre,
  merKm: it.mer_km,
}));
const code = Object.fromEntries(acceptance.fixture.items.map((it) => [it.id, it.code_insee])) as Record<'A' | 'B' | 'C' | 'D' | 'E', string>;

function scores(r: Reglages) {
  const res = evaluer(fixture, r);
  const by = (id: keyof typeof code) => res.parCode.get(code[id])!;
  return { res, by };
}

describe('R1, R2, R3 — passage, score et palier', () => {
  it('AC-1 réglages de départ : A 72 (palier 60–80), E 49 (40–60), B 32 (20–40) ; C et D ne passent pas', () => {
    const { by } = scores(REGLAGES_DEPART);
    expect(REGLAGES_DEPART).toEqual({ loyer: 1200, mer: 60, tailles: [] });
    expect([by('A').score, by('E').score, by('B').score]).toEqual([72, 49, 32]);
    expect([by('A').palier, by('E').palier, by('B').palier]).toEqual([4, 3, 2]);
    expect(by('C').passe).toBe(false);
    expect(by('D').passe).toBe(false);
    expect(by('C').score).toBeNull();
  });

  it('AC-2 mer « Sans limite » : D 65, A 46, B 31, E 9 ; seule C ne passe pas', () => {
    const { by } = scores({ loyer: 1200, mer: null, tailles: [] });
    expect([by('D').score, by('A').score, by('B').score, by('E').score]).toEqual([65, 46, 31, 9]);
    expect(['A', 'B', 'C', 'D', 'E'].filter((id) => !by(id as keyof typeof code).passe)).toEqual(['C']);
  });

  it('AC-3 mer 40 km : B passe avec 15 (39,9 km affiché 40 km, égal au plafond) ; A 72, E 46 ; C et D ne passent pas', () => {
    const { by } = scores({ loyer: 1200, mer: 40, tailles: [] });
    expect(by('B').passe).toBe(true);
    expect([by('B').score, by('A').score, by('E').score]).toEqual([15, 72, 46]);
    expect(by('C').passe).toBe(false);
    expect(by('D').passe).toBe(false);
  });

  it('palier : [0, 20) → 1 … [80, 100] → 5', () => {
    expect([0, 19, 20, 39, 40, 59, 60, 79, 80, 100].map(palier)).toEqual([1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
  });

  it('distance sous 1 km comparée comme 1 km (cas limite) : plafond 5 km, A (0,9 km) passe', () => {
    const { by } = scores({ loyer: null, mer: 5, tailles: [] });
    expect(by('A').passe).toBe(true);
    expect(by('A').score).toBe(80); // 100 × (1 − 1 / 5)
  });

  it('raisons par critère non tenu : Montcher au-dessus des deux plafonds', () => {
    const { by } = scores(REGLAGES_DEPART);
    expect(by('C').raisons).toEqual([
      { critere: 'loyer', valeur: 1560, plafond: 1200 },
      { critere: 'mer', valeur: 148, plafond: 60 },
    ]);
  });

  it('classement : communes qui passent, score affiché décroissant, puis loyer croissant, puis nom', () => {
    const { res } = scores(REGLAGES_DEPART);
    expect(res.classement.map((c) => c.commune.nom)).toEqual(['Portmer', 'Quaibleu', 'Grandeville']);
    expect(res.classement.map((c) => c.rang)).toEqual([1, 2, 3]);
    expect(res.actif).toBe(true);
  });

  it('sans aucun plafond : aucune commune notée, page « sans plafond »', () => {
    const { res, by } = scores({ loyer: null, mer: null, tailles: [] });
    expect(res.actif).toBe(false);
    expect(by('A').score).toBeNull();
    expect(res.classement).toEqual([]);
  });
});
