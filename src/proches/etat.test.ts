import { describe, expect, it } from 'vitest';
import { aRecalculer, ATTENTE_RECALCUL_MS, couverture, etatDe, marque, plusComplet, recalcule } from './etat';

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

describe('R36 — à l’ouverture, quels proches se recalculent (15 min au moins depuis le début du dernier essai, H93)', () => {
  const maintenant = Date.UTC(2026, 9, 16, 12, 0);
  const il_y_a = (min: number) => maintenant - min * 60_000;

  it('15 min = 900 000 ms', () => expect(ATTENTE_RECALCUL_MS).toBe(900_000));

  it('AC-8 (a) à (c) : partiel ou km, dernier essai il y a plus de 15 min → recalculé', () => {
    expect(aRecalculer({ etat: 'km', essai: il_y_a(16) }, maintenant)).toBe(true);
    expect(aRecalculer({ etat: 'partiel', essai: il_y_a(16) }, maintenant)).toBe(true);
  });

  it('borne : 15 min tout juste → recalculé ; une milliseconde de moins → non', () => {
    expect(aRecalculer({ etat: 'km', essai: il_y_a(15) }, maintenant)).toBe(true);
    expect(aRecalculer({ etat: 'km', essai: il_y_a(15) + 1 }, maintenant)).toBe(false);
  });

  it('AC-8 (d) et (e) : dernier essai il y a 5 min → non recalculé', () => {
    expect(aRecalculer({ etat: 'km', essai: il_y_a(5) }, maintenant)).toBe(false);
    expect(aRecalculer({ etat: 'partiel', essai: il_y_a(5) }, maintenant)).toBe(false);
  });

  it('un proche prêt, en attente ou en calcul ne passe jamais en recalcul (AC-8 de proches ; R37 le calcule à part)', () => {
    for (const etat of ['pret', 'attente', 'calcul'] as const) expect(aRecalculer({ etat, essai: il_y_a(60) }, maintenant)).toBe(false);
  });

  it('partiel ou km sans heure de dernier essai → recalculé', () => {
    expect(aRecalculer({ etat: 'km' }, maintenant)).toBe(true);
  });
});

describe('R36 — résultat d’un recalcul : remplacé s’il est plus complet (H97), plafond affiché à l’arrivée, km ÷ 60', () => {
  const partiel = (zones: number[], plafond: number) => ({ etat: 'partiel', zones, plafond }) as const;
  const km = (plafond: number, zones: number[] = []) => ({ etat: 'km', zones, plafond }) as const;

  it('AC-6 (c) : km 45 km, l’IGN donne jusqu’à 1 h 45 → partiel, plafond 45 min', () => {
    expect(recalcule(km(45), jusqua(105))).toEqual({ etat: 'partiel', plafond: 45 });
  });

  it('AC-7 : partiel à 2 h 30 (2 h 15 manquait), l’IGN donne les 12 zones → prêt, plafond 2 h 30', () => {
    expect(recalcule(partiel(sans(135), 150), toutes)).toEqual({ etat: 'pret', plafond: 150 });
  });

  it('AC-8 (a) et (d) : km 90 km, les 12 zones → prêt, plafond 1 h 30', () => {
    expect(recalcule(km(90), toutes)).toEqual({ etat: 'pret', plafond: 90 });
  });

  it('AC-8 (b) et (e) : km 90 km, panne totale → l’ancien reste (km)', () => {
    expect(recalcule(km(90), [])).toBeNull();
  });

  it('AC-8 (c) : partiel à 2 h 30, panne totale → l’ancien reste (partiel, pas km)', () => {
    expect(recalcule(partiel(sans(135), 150), [])).toBeNull();
  });

  it('AC-12 (a) : km 180 km, l’IGN donne jusqu’à 2 h 45 → l’ancien reste (3 h n’est pas vérifiée)', () => {
    expect(recalcule(km(180), sans(180))).toBeNull();
  });

  it('AC-12 (b) : km 165 km, l’IGN donne jusqu’à 2 h 45 → partiel, plafond 2 h 45', () => {
    expect(recalcule(km(165), sans(180))).toEqual({ etat: 'partiel', plafond: 165 });
  });

  it('H97 : un partiel à 3 zones ne remplace pas un partiel à 11 zones', () => {
    expect(recalcule(partiel(sans(135), 30), jusqua(45))).toBeNull();
  });

  it('curseur bougé pendant le recalcul : le plafond affiché à l’arrivée décide (km 120 → 90 km, jusqu’à 1 h 45 → partiel 1 h 30)', () => {
    expect(recalcule(km(120), jusqua(105))).toBeNull();
    expect(recalcule(km(90), jusqua(105))).toEqual({ etat: 'partiel', plafond: 90 });
  });
});
