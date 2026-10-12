import { describe, expect, it } from 'vitest';
import { lireAdresse, ecrireAdresse } from './url';

describe('R7, H7 — réglages dans l’adresse', () => {
  it('AC-11 /?loyer=800&mer=60 → 800 €, 60 km, peu importe', () => {
    expect(lireAdresse('?loyer=800&mer=60')).toEqual({ loyer: 800, mer: 60, tailles: [] });
  });

  it('AC-12 valeurs invalides → valeurs de départ de ces réglages seulement ; adresse réécrite /?loyer=1200&mer=aucun', () => {
    const r = lireAdresse('?loyer=abc&mer=aucun&taille=village');
    expect(r).toEqual({ loyer: 1200, mer: null, tailles: [] });
    expect(ecrireAdresse(r)).toBe('/?loyer=1200&mer=aucun');
  });

  it('AC-14 /?taille=petite-ville,ville-moyenne → deux tailles ; adresse /?loyer=1200&mer=60&taille=petite-ville,ville-moyenne', () => {
    const r = lireAdresse('?taille=petite-ville,ville-moyenne');
    expect(r).toEqual({ loyer: 1200, mer: 60, tailles: ['petite-ville', 'ville-moyenne'] });
    expect(ecrireAdresse(r)).toBe('/?loyer=1200&mer=60&taille=petite-ville,ville-moyenne');
  });

  it('H7 : hors plage ou hors pas = invalide (loyer=1234, loyer=250, mer=7, mer=205, 1200.0)', () => {
    for (const q of ['loyer=1234', 'loyer=250', 'loyer=2050', 'loyer=1200.0', 'loyer=']) expect(lireAdresse(`?${q}`).loyer).toBe(1200);
    for (const q of ['mer=7', 'mer=205', 'mer=0', 'mer=-5']) expect(lireAdresse(`?${q}`).mer).toBe(60);
    expect(lireAdresse('?loyer=300&mer=200')).toMatchObject({ loyer: 300, mer: 200 });
    expect(lireAdresse('?loyer=aucun').loyer).toBeNull();
  });

  it('tailles : noms inconnus ignorés, ordre de D11, doublons retirés', () => {
    expect(lireAdresse('?taille=grande-ville,village,petite-commune,grande-ville').tailles).toEqual(['petite-commune', 'grande-ville']);
    expect(ecrireAdresse({ loyer: null, mer: null, tailles: ['grande-ville', 'petite-commune'] })).toBe('/?loyer=aucun&mer=aucun&taille=petite-commune,grande-ville');
  });

  it('adresse vide → réglages de départ', () => {
    expect(lireAdresse('')).toEqual({ loyer: 1200, mer: 60, tailles: [] });
    expect(ecrireAdresse(lireAdresse(''))).toBe('/?loyer=1200&mer=60');
  });
});
