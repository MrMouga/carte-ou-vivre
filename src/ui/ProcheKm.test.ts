import { describe, expect, it } from 'vitest';
import type { Proche } from '@/proches/useProches';
import { ligneProche } from './Fiche';
import { resumeDe } from './Proches';

// Proches-fiables, tâche 3a (details.md « Écrans et états ») : un proche **km** dans la fiche et le résumé replié.
// Fixture de proches-fiables, « 6 rue Test 17000 Rochelleville » au point [0.5, 0.5] ; communes dans l'ordre A à E
// (Portmer, Grandeville, Montcher, Terrebasse, Quaibleu) ; distances à vol d'oiseau en km, non arrondies.

const s = (t: string) => t.replace(/ /g, ' ');
const LIEU = { libelle: '6 rue Test 17000 Rochelleville', commune: 'Rochelleville', dep: '17', code: '17999', point: [0.5, 0.5] as [number, number], estCommune: false };
const [PORTMER, GRANDEVILLE, , , QUAIBLEU] = [0, 1, 2, 3, 4];

const km = (p: Partial<Proche> = {}): Proche => ({
  id: 1,
  nom: 'Rochelleville (17)',
  lieu: LIEU,
  depart: LIEU.point,
  plafond: 120,
  etat: 'km',
  temps: null,
  empreinte: '5-x',
  zones: [],
  distances: Float64Array.from([39.313, 87.906, 196.562, 87.906, 117.933]),
  ...p,
});

describe('Fiche, ligne d’un proche à vol d’oiseau (R35)', () => {
  it('AC-4 : Grandeville « Rochelleville (17) : 88 km à vol d’oiseau » ; Quaibleu 118 km ; Portmer 39 km', () => {
    expect(s(ligneProche(km(), GRANDEVILLE))).toBe("Rochelleville (17) : 88 km à vol d'oiseau");
    expect(s(ligneProche(km(), QUAIBLEU))).toBe("Rochelleville (17) : 118 km à vol d'oiseau");
    expect(s(ligneProche(km(), PORTMER))).toBe("Rochelleville (17) : 39 km à vol d'oiseau");
  });

  it('sous 1 km : « moins d’1 km à vol d’oiseau » (H96)', () => {
    expect(s(ligneProche(km({ distances: Float64Array.from([0.4, 0, 0, 0, 0]) }), PORTMER))).toBe("Rochelleville (17) : moins d'1 km à vol d'oiseau");
  });
});

describe('Résumé de « Tes proches » repliée (H34 de proches étendue)', () => {
  it('un proche km compte comme « approximatif » : « 1 · 1 approximatif », « 2 · 1 en calcul, 1 approximatif »', () => {
    expect(resumeDe([km()])).toBe('1 · 1 approximatif');
    expect(resumeDe([km({ id: 1, etat: 'calcul', distances: undefined }), km({ id: 2 })])).toBe('2 · 1 en calcul, 1 approximatif');
  });
});
