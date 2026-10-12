import { describe, expect, it } from 'vitest';
import { euros, eurosM2, km, merTexte, nomAffiche, population, plafondLoyer, plafondMer } from './format';

// H3 : les tests comparent après avoir remplacé les espaces insécables par des espaces.
const s = (t: string) => t.replace(/ /g, ' ');

describe('H3 — formats', () => {
  it('euros : espace insécable avant les milliers et avant €', () => {
    expect(euros(832)).toBe('832 €');
    expect(s(euros(1092))).toBe('1 092 €');
    expect(s(euros(1560))).toBe('1 560 €');
  });

  it('€/m² à une décimale, avec une virgule', () => {
    expect(s(eurosM2(16.0))).toBe('16,0 €/m²');
    expect(s(eurosM2(12.5))).toBe('12,5 €/m²');
    expect(s(eurosM2(11.555))).toBe('11,6 €/m²');
  });

  it('km entiers ; sous 1 km : « moins d’1 km »', () => {
    expect(s(km(39.9))).toBe('40 km');
    expect(s(merTexte(0.9))).toBe("moins d'1 km");
    expect(s(merTexte(7))).toBe('7 km');
    expect(s(merTexte(1.2))).toBe('1 km');
  });

  it('population : au millier dès 10 000 habitants, à la centaine en dessous', () => {
    expect(s(population(260000))).toBe('260 000');
    expect(s(population(23000))).toBe('23 000');
    expect(s(population(267991))).toBe('268 000');
    expect(s(population(4200))).toBe('4 200');
    expect(s(population(4249))).toBe('4 200');
  });

  it('valeurs des curseurs : « Sans limite » au dernier cran', () => {
    expect(s(plafondLoyer(1200))).toBe('1 200 €');
    expect(plafondLoyer(null)).toBe('Sans limite');
    expect(s(plafondMer(60))).toBe('60 km');
    expect(plafondMer(null)).toBe('Sans limite');
  });

  it('nom affiché : nom (département)', () => {
    expect(nomAffiche({ nom: 'Portmer', dep: '17' })).toBe('Portmer (17)');
  });
});
