import { describe, expect, it } from 'vitest';
import type { Proche } from '@/proches/useProches';
import { ligneProche } from './Fiche';
import { valeurPastille } from './Pastilles';
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

describe('Pastilles d’un proche à vol d’oiseau (R15 de proches étendue, tâche 3b)', () => {
  it('AC-5 sans commune choisie : « 90 km au plus »', () => {
    expect(s(valeurPastille(km({ plafond: 90 }), null))).toBe('90 km au plus');
    expect(s(valeurPastille(km(), null))).toBe('120 km au plus');
  });

  it('AC-5 Quaibleu choisie : « 118 km · au-dessus de 90 km » ; Portmer et Grandeville sous le plafond : la distance seule', () => {
    expect(s(valeurPastille(km({ plafond: 90 }), QUAIBLEU))).toBe('118 km · au-dessus de 90 km');
    expect(s(valeurPastille(km({ plafond: 90 }), GRANDEVILLE))).toBe('88 km');
    expect(s(valeurPastille(km({ plafond: 90 }), PORTMER))).toBe('39 km');
  });

  it('comparée au km affiché, comme le score : 90,4 km tient 90 km, 90,5 km non ; « moins d’1 km » sous 1 km', () => {
    expect(s(valeurPastille(km({ plafond: 90, distances: Float64Array.from([90.4, 0, 0, 0, 0]) }), PORTMER))).toBe('90 km');
    expect(s(valeurPastille(km({ plafond: 90, distances: Float64Array.from([90.5, 0, 0, 0, 0]) }), PORTMER))).toBe('91 km · au-dessus de 90 km');
    expect(s(valeurPastille(km({ plafond: 15, distances: Float64Array.from([0.4, 0, 0, 0, 0]) }), PORTMER))).toBe("moins d'1 km");
  });
});

describe('Résumé de « Tes proches » repliée (H34 de proches étendue)', () => {
  it('un proche km compte comme « approximatif » : « 1 · 1 approximatif », « 2 · 1 en calcul, 1 approximatif »', () => {
    expect(resumeDe([km()])).toBe('1 · 1 approximatif');
    expect(resumeDe([km({ id: 1, etat: 'calcul', distances: undefined }), km({ id: 2 })])).toBe('2 · 1 en calcul, 1 approximatif');
  });
});
