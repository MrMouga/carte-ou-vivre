import { describe, expect, it } from 'vitest';
import { couverture, etatDe, marque, plusComplet } from './etat';

// État d'un proche à la fin de son calcul (spec proches-fiables R33, R34, H97) : prêt (12 zones), partiel ou km,
// selon les zones obtenues et le plafond. Durées en minutes : 15, 30… 180.
const toutes = [15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180];
const sans = (...manquantes: number[]) => toutes.filter((d) => !manquantes.includes(d));
const jusqua = (max: number) => toutes.filter((d) => d <= max);

describe('R33 — couverture et choix de l’état', () => {
  it('couverture = plus grande zone obtenue ; 0 si aucune', () => {
    expect(couverture(toutes)).toBe(180);
    expect(couverture(sans(180))).toBe(165);
    expect(couverture(sans(135))).toBe(180);
    expect(couverture([])).toBe(0);
  });

  it('les 12 zones → prêt, quel que soit le plafond', () => {
    expect(etatDe(toutes, 120)).toBe('pret');
    expect(etatDe(toutes, 180)).toBe('pret');
  });

  it('borne : couverture = plafond → partiel ; un pas de 15 min dessous → km (AC-6 a et b : 2 h et 1 h 45, plafond 2 h)', () => {
    expect(etatDe(jusqua(120), 120)).toBe('partiel');
    expect(etatDe(jusqua(105), 120)).toBe('km');
  });

  it('aucune zone → km, même avec le plafond le plus bas', () => {
    expect(etatDe([], 120)).toBe('km');
    expect(etatDe([], 15)).toBe('km');
  });

  it('une zone manquante sous la couverture → partiel (AC-2 : 2 h 15 manque, couverture 3 h)', () => {
    expect(etatDe(sans(135), 120)).toBe('partiel');
  });

  it('plafond bas et grandes zones ratées → partiel, pas de km (AC-6 c : 45 min, couverture 1 h 45)', () => {
    expect(etatDe(jusqua(105), 45)).toBe('partiel');
  });

  it('proche en km : son plafond en km vaut le même nombre de minutes (60 km par heure, H94) — AC-12 : 180 km et 165 km, couverture 2 h 45', () => {
    expect(etatDe(sans(180), 180)).toBe('km');
    expect(etatDe(sans(180), 165)).toBe('partiel');
  });
});

describe('R34 — valeur d’une commune d’un proche partiel', () => {
  it('fin de tranche dont la zone juste dessous est obtenue → valeur exacte', () => {
    expect(marque(60, sans(135))).toBe('exacte');
    expect(marque(15, sans(135))).toBe('exacte'); // 15 min : aucune zone dessous
  });

  it('zone juste dessous manquante → « jusqu’à » (Grandeville, Montcher, Terrebasse à 2 h 30 quand 2 h 15 manque)', () => {
    expect(marque(150, sans(135))).toBe('jusqua');
    expect(marque(30, sans(15))).toBe('jusqua');
  });

  it('hors de la couverture (0) → « plus de <couverture> »', () => {
    expect(marque(0, sans(180))).toBe('au-dela');
  });

  it('proche prêt : jamais « jusqu’à »', () => {
    expect(toutes.map((d) => marque(d, toutes))).toEqual(toutes.map(() => 'exacte'));
  });
});

describe('H97 — un résultat plus complet remplace l’ancien', () => {
  const pret = { etat: 'pret', zones: toutes } as const;
  const partiel = (zones: number[]) => ({ etat: 'partiel', zones }) as const;
  const km = (zones: number[] = []) => ({ etat: 'km', zones }) as const;

  it('prêt d’abord, km en dernier', () => {
    expect(plusComplet(pret, partiel(sans(135)))).toBe(true);
    expect(plusComplet(pret, km())).toBe(true);
    expect(plusComplet(partiel(jusqua(45)), km(jusqua(105)))).toBe(true);
    expect(plusComplet(km(), pret)).toBe(false);
    expect(plusComplet(partiel(sans(135)), pret)).toBe(false);
  });

  it('entre deux partiels : le plus de zones ; un partiel à 3 zones ne remplace pas un partiel à 11 zones', () => {
    expect(plusComplet(partiel(jusqua(45)), partiel(sans(135)))).toBe(false);
    expect(plusComplet(partiel(sans(135)), partiel(jusqua(45)))).toBe(true);
  });

  it('à égalité de zones, la plus grande couverture', () => {
    expect(plusComplet(partiel(sans(60)), partiel(sans(180)))).toBe(true);
    expect(plusComplet(partiel(sans(180)), partiel(sans(60)))).toBe(false);
  });

  it('même rang et mêmes zones, ou deux km : pas plus complet (l’ancien reste)', () => {
    expect(plusComplet(partiel(sans(135)), partiel(sans(135)))).toBe(false);
    expect(plusComplet(km(jusqua(105)), km())).toBe(false);
    expect(plusComplet(pret, pret)).toBe(false);
  });
});
