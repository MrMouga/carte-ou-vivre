import { describe, expect, it } from 'vitest';
import { lireAdresse, lirePrix, ecrireAdresse } from './url';

describe('R7, H7 — réglages dans l’adresse', () => {
  it('AC-11 /?loyer=800&mer=50 → 800 €, 50 km, peu importe', () => {
    expect(lireAdresse('?loyer=800&mer=50')).toEqual({ loyer: 800, mer: 50, tailles: [] });
  });

  it('AC-12 valeurs invalides → valeurs de départ de ces réglages seulement ; adresse réécrite /?loyer=1200', () => {
    const r = lireAdresse('?loyer=abc&mer=aucun&taille=village');
    expect(r).toEqual({ loyer: 1200, mer: null, tailles: [] });
    expect(ecrireAdresse(r)).toBe('/?loyer=1200');
  });

  it('AC-14 /?taille=petite-ville,ville-moyenne → deux tailles ; adresse /?loyer=1200&taille=petite-ville,ville-moyenne', () => {
    const r = lireAdresse('?taille=petite-ville,ville-moyenne');
    expect(r).toEqual({ loyer: 1200, mer: null, tailles: ['petite-ville', 'ville-moyenne'] });
    expect(ecrireAdresse(r)).toBe('/?loyer=1200&taille=petite-ville,ville-moyenne');
  });

  it('H7 : loyer hors plage ou hors pas = invalide (loyer=1234, loyer=250, 1200.0)', () => {
    for (const q of ['loyer=1234', 'loyer=250', 'loyer=2050', 'loyer=1200.0', 'loyer=']) expect(lireAdresse(`?${q}`).loyer).toBe(1200);
    expect(lireAdresse('?loyer=aucun').loyer).toBeNull();
  });

  it('tailles : noms inconnus ignorés, ordre de D11, doublons retirés', () => {
    expect(lireAdresse('?taille=grande-ville,village,petite-commune,grande-ville').tailles).toEqual(['petite-commune', 'grande-ville']);
    expect(ecrireAdresse({ loyer: null, mer: null, tailles: ['grande-ville', 'petite-commune'] })).toBe('/?loyer=aucun&taille=petite-commune,grande-ville');
  });

  it('R32 : adresse vide → prix de départ, cadre de vie sur Peu importe ; /?loyer=1200', () => {
    expect(lireAdresse('')).toEqual({ loyer: 1200, mer: null, tailles: [] });
    expect(ecrireAdresse(lireAdresse(''))).toBe('/?loyer=1200');
  });
});

// Spec cadre-de-vie, R31 : la mer en cinq choix ; une valeur de l'ancienne plage (multiple de 5, de 5 à 200) prend le choix
// juste au-dessus, au-delà de 100 Peu importe ; toute autre valeur = Peu importe ; `mer` absente quand Peu importe.
describe('R31 — la mer dans l’adresse (spec cadre-de-vie)', () => {
  const mer = (v: string) => lireAdresse(`?loyer=1200&mer=${v}`).mer;

  it('AC-9 (adresse) : /?loyer=1200&mer=60 → 100 km, /?loyer=1200&mer=100 ; /?loyer=1200&mer=25 → 30 km, /?loyer=1200&mer=30', () => {
    expect(mer('60')).toBe(100);
    expect(ecrireAdresse(lireAdresse('?loyer=1200&mer=60'))).toBe('/?loyer=1200&mer=100');
    expect(mer('25')).toBe(30);
    expect(ecrireAdresse(lireAdresse('?loyer=1200&mer=25'))).toBe('/?loyer=1200&mer=30');
  });

  it('les cinq choix se lisent tels quels : 10, 30, 50, 100 ; aucun = Peu importe', () => {
    expect(['10', '30', '50', '100'].map(mer)).toEqual([10, 30, 50, 100]);
    expect(mer('aucun')).toBeNull();
    expect(lireAdresse('?loyer=1200').mer).toBeNull();
  });

  it('ancienne plage : mer=5 → 10 km, mer=15 → 30, mer=35 → 50, mer=55 → 100, mer=95 → 100 ; mer=105 et mer=200 → Peu importe', () => {
    expect(['5', '15', '35', '55', '95'].map(mer)).toEqual([10, 30, 50, 100, 100]);
    expect(['105', '200'].map(mer)).toEqual([null, null]);
  });

  it('toute autre valeur = Peu importe : mer=23, mer=0, mer=abc, mer=205, mer=-5, mer=50.0', () => {
    for (const v of ['23', '0', 'abc', '205', '-5', '50.0', '']) expect(mer(v)).toBeNull();
  });

  it('Peu importe n’est pas écrite ; une distance l’est, après le plafond du prix', () => {
    expect(ecrireAdresse({ loyer: 1200, mer: null, tailles: [] })).toBe('/?loyer=1200');
    expect(ecrireAdresse({ loyer: 1200, mer: 50, tailles: ['petite-ville'] })).toBe('/?loyer=1200&mer=50&taille=petite-ville');
    expect(ecrireAdresse(lireAdresse('?loyer=1200&mer=200'))).toBe('/?loyer=1200');
  });
});

describe('R26, H66 — le réglage du prix dans l’adresse (spec immobilier)', () => {
  const allerRetour = (search: string) => ecrireAdresse(lireAdresse(search), lirePrix(search));

  it('AC-10 (adresse) : /?achat=300000&mer=aucun&bien=maison&unite=total&surface=100 → /?achat=300000&bien=maison&unite=total&surface=100', () => {
    const search = '?achat=300000&mer=aucun&bien=maison&unite=total&surface=100';
    expect(lirePrix(search)).toEqual({ mode: 'acheter', bien: 'maison', unite: 'total', surface: 100 });
    expect(lireAdresse(search)).toEqual({ loyer: 300000, mer: null, tailles: [] });
    expect(allerRetour(search)).toBe('/?achat=300000&bien=maison&unite=total&surface=100');
  });

  it('AC-11 (adresse) : /?achat=abc&unite=litre&bien=villa&surface=0 → Appartement, Acheter, Au m², 5 000 €/m² ; /?achat=5000', () => {
    const search = '?achat=abc&unite=litre&bien=villa&surface=0';
    expect(lirePrix(search)).toEqual({ mode: 'acheter', bien: 'appartement', unite: 'm2', surface: 52 });
    expect(lireAdresse(search).loyer).toBe(5000);
    expect(allerRetour(search)).toBe('/?achat=5000');
  });

  it('H66 : `loyer` et `achat` ensemble → Louer, `achat` retiré, même si `loyer` est invalide (1 200 €)', () => {
    expect(allerRetour('?achat=5000&loyer=900')).toBe('/?loyer=900');
    expect(lirePrix('?achat=5000&loyer=abc').mode).toBe('louer');
    expect(allerRetour('?achat=5000&loyer=abc')).toBe('/?loyer=1200');
  });

  it('surface selon le bien : 52 m² au départ, 92 m² en Maison ; écrite seulement si elle en diffère, dans toutes les unités', () => {
    expect(lirePrix('?bien=maison').surface).toBe(92);
    expect(allerRetour('?loyer=1200&bien=maison')).toBe('/?loyer=1200&bien=maison');
    expect(allerRetour('?loyer=1200&bien=maison&surface=52')).toBe('/?loyer=1200&bien=maison&surface=52');
    expect(allerRetour('?loyer=1200&surface=92')).toBe('/?loyer=1200&surface=92');
    expect(allerRetour('?achat=5000&surface=70')).toBe('/?achat=5000&surface=70');
    for (const v of ['9', '301', '72.5', '', 'abc']) expect(lirePrix(`?surface=${v}`).surface).toBe(52);
  });

  it('unité : Total au départ en Louer, Au m² en Acheter ; écrite seulement si elle en diffère', () => {
    expect(allerRetour('?loyer=1200&unite=total')).toBe('/?loyer=1200');
    expect(allerRetour('?achat=5000&unite=m2')).toBe('/?achat=5000');
    expect(allerRetour('?loyer=23&unite=m2')).toBe('/?loyer=23&unite=m2');
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
    expect(allerRetour('?achat=aucun')).toBe('/?achat=aucun');
  });

  it('une adresse de la tranche 1 s’ouvre à l’identique (D1)', () => {
    expect(lirePrix('?loyer=800&mer=50')).toEqual({ mode: 'louer', bien: 'appartement', unite: 'total', surface: 52 });
    expect(allerRetour('?loyer=800&mer=50&taille=petite-ville')).toBe('/?loyer=800&mer=50&taille=petite-ville');
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

// Spec cadre-de-vie, R31 : `montagne` vaut 10, 30, 50 ou 100 ; toute autre valeur (dont 0) = Peu importe, non écrite ;
// ordre : plafond du prix, `mer`, `montagne`, `taille`, `bien`, `unite`, `surface`.
describe('R31 — la montagne dans l’adresse (spec cadre-de-vie)', () => {
  const montagne = (v: string) => lireAdresse(`?loyer=1200&montagne=${v}`).montagne ?? null;

  it('AC-3 (adresse) : montagne 10 km depuis / → /?loyer=1200&montagne=10', () => {
    expect(ecrireAdresse({ ...lireAdresse(''), montagne: 10 })).toBe('/?loyer=1200&montagne=10');
  });

  it('les quatre distances se lisent telles quelles : 10, 30, 50, 100', () => {
    expect(['10', '30', '50', '100'].map(montagne)).toEqual([10, 30, 50, 100]);
    expect(ecrireAdresse(lireAdresse('?loyer=1200&mer=100&montagne=50'))).toBe('/?loyer=1200&mer=100&montagne=50');
  });

  it('montagne=0, montagne=abc et toute autre valeur = Peu importe, et l’adresse ne l’écrit pas', () => {
    for (const v of ['0', 'abc', '5', '25', '60', '200', 'aucun', '-10', '50.0', '']) expect(montagne(v)).toBeNull();
    expect(lireAdresse('?loyer=1200').montagne ?? null).toBeNull();
    expect(ecrireAdresse(lireAdresse('?loyer=1200&montagne=0'))).toBe('/?loyer=1200');
    expect(ecrireAdresse(lireAdresse('?loyer=1200&montagne=abc'))).toBe('/?loyer=1200');
  });

  it('ordre : prix, mer, montagne, taille, bien, unite, surface', () => {
    const q = '?achat=300000&surface=100&unite=total&bien=maison&taille=petite-ville&montagne=30&mer=50';
    expect(ecrireAdresse(lireAdresse(q), lirePrix(q))).toBe('/?achat=300000&mer=50&montagne=30&taille=petite-ville&bien=maison&unite=total&surface=100');
  });
});

// Spec cadre-de-vie, R31 : `env` liste les types cochés (noms de H71) ; comme `taille`, un nom inconnu est ignoré et la
// liste réécrite dans l'ordre de R27, sans doublon ; absente quand aucun type n'est coché ; après `taille`, avant `bien`.
describe('R31 — le type d’environnement dans l’adresse (spec cadre-de-vie)', () => {
  it('AC-5 (adresse) : « Ville dense » depuis / → /?loyer=1200&env=ville-dense ; puis « Bourg et village » → env=ville-dense,bourg-et-village', () => {
    expect(ecrireAdresse({ ...lireAdresse(''), types: ['ville-dense'] })).toBe('/?loyer=1200&env=ville-dense');
    expect(ecrireAdresse({ ...lireAdresse(''), types: ['bourg-et-village', 'ville-dense'] })).toBe('/?loyer=1200&env=ville-dense,bourg-et-village');
  });

  it('AC-8 (adresse) : /?mer=200&montagne=0&taille=petite-commune&env=bourg-et-village,village → /?loyer=1200&taille=petite-commune&env=bourg-et-village', () => {
    const r = lireAdresse('?mer=200&montagne=0&taille=petite-commune&env=bourg-et-village,village');
    expect(r.mer).toBeNull();
    expect(r.montagne ?? null).toBeNull();
    expect(r.tailles).toEqual(['petite-commune']);
    expect(r.types).toEqual(['bourg-et-village']);
    expect(ecrireAdresse(r)).toBe('/?loyer=1200&taille=petite-commune&env=bourg-et-village');
  });

  it('noms inconnus ignorés, ordre de R27, doublons retirés : env=campagne-isolee,village,ville-dense,campagne-isolee → env=ville-dense,campagne-isolee', () => {
    const r = lireAdresse('?loyer=1200&env=campagne-isolee,village,ville-dense,campagne-isolee');
    expect(r.types).toEqual(['ville-dense', 'campagne-isolee']);
    expect(ecrireAdresse(r)).toBe('/?loyer=1200&env=ville-dense,campagne-isolee');
  });

  it('aucun type (absent, vide ou seulement des noms inconnus) = Peu importe, et l’adresse ne l’écrit pas', () => {
    for (const q of ['?loyer=1200', '?loyer=1200&env=', '?loyer=1200&env=village,urbain']) {
      expect(lireAdresse(q).types ?? []).toEqual([]);
      expect(ecrireAdresse(lireAdresse(q))).toBe('/?loyer=1200');
    }
  });

  it('ordre : prix, mer, montagne, taille, env, bien, unite, surface', () => {
    const q = '?achat=300000&surface=100&env=campagne-isolee&unite=total&bien=maison&taille=petite-ville&montagne=30&mer=50';
    expect(ecrireAdresse(lireAdresse(q), lirePrix(q))).toBe(
      '/?achat=300000&mer=50&montagne=30&taille=petite-ville&env=campagne-isolee&bien=maison&unite=total&surface=100',
    );
  });
});
