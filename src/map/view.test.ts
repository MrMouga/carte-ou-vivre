import { describe, expect, it } from 'vitest';
import { hauteurFeuille, paddingBureau, paddingCarte } from './view';
import { size, space } from '@/theme/tokens';

// D9 d'interface-telephone : sous 1 024 px, la feuille ouverte prend 45 % de la hauteur, jamais moins de 272 px ; la carte
// se cadre dans la bande au-dessus.
describe('hauteur de la feuille et cadrage de la carte', () => {
  it('390 × 844 : 45 % de la hauteur (379,8 px), au-dessus du plancher', () => {
    expect(hauteurFeuille(844)).toBeCloseTo(379.8);
    expect(paddingCarte(390, 844).bottom).toBeCloseTo(379.8 + space['space-4']);
  });
  it('375 × 548 : 45 % ferait 246,6 px, le plancher de 272 px joue', () => {
    expect(hauteurFeuille(548)).toBe(size['taille-feuille-min']);
    expect(paddingCarte(375, 548).bottom).toBe(272 + space['space-4']);
  });
  it('une hauteur de feuille mesurée passe avant le calcul', () => {
    expect(paddingCarte(390, 664, 200).bottom).toBe(200 + space['space-4']);
  });
  it('bureau (≥ 1 024 px) : cadrage entre les panneaux, inchangé', () => {
    expect(paddingCarte(1440, 900)).toEqual(paddingBureau());
  });
});
