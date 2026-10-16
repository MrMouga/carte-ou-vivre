import { describe, expect, it } from 'vitest';
import type { Proche } from '@/proches/useProches';
import { ligneProche } from './Fiche';
import { valeurPastille } from './Pastilles';
import { resumeDe } from './Proches';

// Proches-fiables, tâche 2 (details.md « Écrans et états ») : un proche **partiel** dans la fiche, les pastilles et le
// résumé replié. Fixture de proches-fiables, « 1 rue Test 44000 Nantesville » ; communes dans l'ordre A à E (Portmer,
// Grandeville, Montcher, Terrebasse, Quaibleu) ; temps = fin de la plus petite zone obtenue qui contient la mairie.

const s = (t: string) => t.replace(/\u00a0/g, ' ');
const TOUTES = Array.from({ length: 12 }, (_, i) => (i + 1) * 15);
const LIEU = { libelle: '1 rue Test 44000 Nantesville', commune: 'Nantesville', dep: '44', code: '44999', point: [-2, 3] as [number, number], estCommune: false };
const [PORTMER, GRANDEVILLE, , , QUAIBLEU] = [0, 1, 2, 3, 4];

const proche = (p: Partial<Proche>): Proche => ({
  id: 1,
  nom: 'Nantesville (44)',
  lieu: LIEU,
  depart: LIEU.point,
  plafond: 120,
  etat: 'pret',
  temps: Uint16Array.from([60, 135, 150, 150, 0]),
  empreinte: '5-x',
  zones: TOUTES,
  ...p,
});
/** Panne « zone-135-toujours » (AC-2) : Grandeville, Montcher et Terrebasse dans la zone de 2 h 30. */
const sans135 = (plafond: number) => proche({ etat: 'partiel', plafond, temps: Uint16Array.from([60, 150, 150, 150, 0]), zones: TOUTES.filter((d) => d !== 135) });
/** Panne « zone-180-toujours » (AC-3) : couverture 2 h 45, Quaibleu hors de la couverture. */
const sans180 = (plafond: number) => proche({ etat: 'partiel', plafond, zones: TOUTES.filter((d) => d !== 180) });

describe('Fiche, ligne d’un proche partiel (R34)', () => {
  it('AC-2 : Grandeville « Nantesville (44) : jusqu’à 2 h 30 en voiture », Portmer « Nantesville (44) : 1 h en voiture »', () => {
    expect(s(ligneProche(sans135(150), GRANDEVILLE))).toBe("Nantesville (44) : jusqu'à 2 h 30 en voiture");
    expect(s(ligneProche(sans135(150), PORTMER))).toBe('Nantesville (44) : 1 h en voiture');
  });

  it('commune hors de la couverture : « Nantesville (44) : plus de 2 h 45 en voiture » ; un proche prêt garde « plus de 3 h »', () => {
    expect(s(ligneProche(sans180(120), QUAIBLEU))).toBe('Nantesville (44) : plus de 2 h 45 en voiture');
    expect(s(ligneProche(proche({}), QUAIBLEU))).toBe('Nantesville (44) : plus de 3 h en voiture');
  });
});

describe('Pastilles d’un proche partiel (R15 de proches étendue)', () => {
  it('sans commune choisie : « 2 h 15 au plus », comme un proche prêt', () => {
    expect(s(valeurPastille(sans135(135), null))).toBe('2 h 15 au plus');
  });

  it('commune choisie : sa valeur comme la fiche l’écrit, puis « · au-dessus de <plafond> » quand elle dépasse', () => {
    expect(s(valeurPastille(sans135(135), GRANDEVILLE))).toBe("jusqu'à 2 h 30 · au-dessus de 2 h 15");
    expect(s(valeurPastille(sans135(150), GRANDEVILLE))).toBe("jusqu'à 2 h 30");
    expect(s(valeurPastille(sans180(120), QUAIBLEU))).toBe('plus de 2 h 45 · au-dessus de 2 h');
    expect(s(valeurPastille(sans180(120), PORTMER))).toBe('1 h');
  });
});

describe('Résumé de « Tes proches » repliée (H34 de proches étendue)', () => {
  it('un partiel compte comme « approximatif » : « 3 · 1 en calcul, 1 approximatif », « 4 · 2 approximatifs »', () => {
    expect(resumeDe([proche({ id: 1 }), proche({ id: 2, etat: 'calcul' }), sans135(120)])).toBe('3 · 1 en calcul, 1 approximatif');
    expect(resumeDe([proche({ id: 1 }), proche({ id: 2 }), sans135(120), sans180(120)])).toBe('4 · 2 approximatifs');
  });
});
