import { describe, expect, it } from 'vitest';
import { lireAdresse, lirePrix, ecrireAdresse } from './url';

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

describe('R26, H66 — le réglage du prix dans l’adresse (spec immobilier)', () => {
  const allerRetour = (search: string) => ecrireAdresse(lireAdresse(search), lirePrix(search));

  it('AC-10 (adresse) : /?achat=300000&mer=aucun&bien=maison&unite=total&surface=100 relue puis réécrite à l’identique', () => {
    const search = '?achat=300000&mer=aucun&bien=maison&unite=total&surface=100';
    expect(lirePrix(search)).toEqual({ mode: 'acheter', bien: 'maison', unite: 'total', surface: 100 });
    expect(lireAdresse(search)).toEqual({ loyer: 300000, mer: null, tailles: [] });
    expect(allerRetour(search)).toBe(`/${search}`);
  });

  it('AC-11 (adresse) : /?achat=abc&unite=litre&bien=villa&surface=0 → Appartement, Acheter, Au m², 5 000 €/m² ; /?achat=5000&mer=60', () => {
    const search = '?achat=abc&unite=litre&bien=villa&surface=0';
    expect(lirePrix(search)).toEqual({ mode: 'acheter', bien: 'appartement', unite: 'm2', surface: 52 });
    expect(lireAdresse(search).loyer).toBe(5000);
    expect(allerRetour(search)).toBe('/?achat=5000&mer=60');
  });

  it('H66 : `loyer` et `achat` ensemble → Louer, `achat` retiré, même si `loyer` est invalide (1 200 €)', () => {
    expect(allerRetour('?achat=5000&loyer=900')).toBe('/?loyer=900&mer=60');
    expect(lirePrix('?achat=5000&loyer=abc').mode).toBe('louer');
    expect(allerRetour('?achat=5000&loyer=abc')).toBe('/?loyer=1200&mer=60');
  });

  it('surface selon le bien : 52 m² au départ, 92 m² en Maison ; écrite seulement si elle en diffère, dans toutes les unités', () => {
    expect(lirePrix('?bien=maison').surface).toBe(92);
    expect(allerRetour('?loyer=1200&bien=maison')).toBe('/?loyer=1200&mer=60&bien=maison');
    expect(allerRetour('?loyer=1200&bien=maison&surface=52')).toBe('/?loyer=1200&mer=60&bien=maison&surface=52');
    expect(allerRetour('?loyer=1200&surface=92')).toBe('/?loyer=1200&mer=60&surface=92');
    expect(allerRetour('?achat=5000&surface=70')).toBe('/?achat=5000&mer=60&surface=70');
    for (const v of ['9', '301', '72.5', '', 'abc']) expect(lirePrix(`?surface=${v}`).surface).toBe(52);
  });

  it('unité : Total au départ en Louer, Au m² en Acheter ; écrite seulement si elle en diffère', () => {
    expect(allerRetour('?loyer=1200&unite=total')).toBe('/?loyer=1200&mer=60');
    expect(allerRetour('?achat=5000&unite=m2')).toBe('/?achat=5000&mer=60');
    expect(allerRetour('?loyer=23&unite=m2')).toBe('/?loyer=23&mer=60&unite=m2');
  });

  it('ordre : plafond du prix, mer, taille, bien, unite, surface', () => {
    expect(allerRetour('?surface=70&unite=m2&bien=maison&taille=petite-ville&mer=10&loyer=20')).toBe(
      '/?loyer=20&mer=10&taille=petite-ville&bien=maison&unite=m2&surface=70',
    );
  });

  it('H57 : plafond hors plage ou hors cran → plafond de départ du réglage (5 000 €/m² × la surface en Acheter · Total)', () => {
    expect(lireAdresse('?achat=255000&unite=total').loyer).toBe(260000);
    expect(lireAdresse('?achat=255000&unite=total&surface=70').loyer).toBe(350000);
    expect(lireAdresse('?achat=5050').loyer).toBe(5000);
    expect(lireAdresse('?achat=12100').loyer).toBe(5000);
    expect(lireAdresse('?loyer=41&unite=m2').loyer).toBe(23);
    expect(lireAdresse('?achat=500').loyer).toBe(500);
    expect(lireAdresse('?achat=aucun').loyer).toBeNull();
    expect(allerRetour('?achat=aucun')).toBe('/?achat=aucun&mer=60');
  });

  it('une adresse de la tranche 1 s’ouvre à l’identique (D1)', () => {
    expect(lirePrix('?loyer=800&mer=60')).toEqual({ mode: 'louer', bien: 'appartement', unite: 'total', surface: 52 });
    expect(allerRetour('?loyer=800&mer=60&taille=petite-ville')).toBe('/?loyer=800&mer=60&taille=petite-ville');
  });
});

describe('Spec immobilier, tâche 3 — surface de départ selon le bien (D2, R26)', () => {
  it('surface de départ lue selon le bien : /?bien=maison → 92 m² ; /?bien=maison&surface=52 → 52 m²', () => {
    expect(lirePrix('?bien=maison')).toEqual({ mode: 'louer', bien: 'maison', unite: 'total', surface: 92 });
    expect(lirePrix('?bien=maison&surface=52')).toEqual({ mode: 'louer', bien: 'maison', unite: 'total', surface: 52 });
    expect(lirePrix('?achat=5000&bien=maison').surface).toBe(92);
    expect(lirePrix('?bien=maison&surface=0').surface).toBe(92); // invalide → départ du bien (H58)
  });
});
