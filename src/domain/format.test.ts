import { describe, expect, it } from 'vitest';
import { chiffresListe, compte, dureeMer, euros, eurosM2, km, LIBELLE_TAILLE, LIBELLE_TYPE, ligneListe, loyerTexte, merFiche, merTexte, montagneFiche, nomAffiche, population, plafondLoyer, raisonTexte, rangTexte, resumeCadre, tempsMerTexte, typeTexte } from './format';

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
  });

  it('nom affiché : nom (département)', () => {
    expect(nomAffiche({ nom: 'Portmer', dep: '17' })).toBe('Portmer (17)');
  });
});

describe('R5 — compte et lignes de la liste', () => {
  it('compte : pluriel, singulier, aucune', () => {
    expect(compte(3)).toBe('3 communes passent tes critères');
    expect(compte(1)).toBe('1 commune passe tes critères');
    expect(compte(0)).toBe('Aucune commune ne passe tes critères');
    expect(s(compte(1269))).toBe('1 269 communes passent tes critères');
  });

  it('AC-4 (format) : « 1 · Portmer (17) · 69 · 650 € · 5 min »', () => {
    const portmer = { nom: 'Portmer', dep: '17', loyerM2: 12.5, merKm: 0.9, merMin: 5 };
    expect(s(ligneListe(1, portmer, 69))).toBe('1 · Portmer (17) · 69 · 650 € · 5 min');
    expect(s(chiffresListe(portmer))).toBe('650 € · 5 min');
  });
});

describe('R4, R6, R1 — textes de la fiche', () => {
  it('type et population (R30 de cadre-de-vie), loyer, mer (AC-7, AC-8)', () => {
    expect(s(typeTexte('ville-dense', 260000))).toBe('Ville dense · 260 000 habitants');
    expect(s(typeTexte('ville-et-peripherie', 23000))).toBe('Ville et périphérie · 23 000 habitants');
    expect(s(typeTexte('bourg-et-village', 4200))).toBe('Bourg et village · 4 200 habitants');
    expect(s(typeTexte('campagne-isolee', 310))).toBe('Campagne isolée · 300 habitants');
    expect(s(loyerTexte(16.0))).toBe('832 € par mois pour 52 m² (16,0 €/m²)');
    expect(s(loyerTexte(12.5))).toBe('650 € par mois pour 52 m² (12,5 €/m²)');
    expect(s(merFiche({ merKm: 39.9, merMin: 50 }))).toBe('50 min de la mer en voiture');
    expect(s(merFiche({ merKm: 0.9, merMin: 5 }))).toBe('5 min de la mer en voiture');
  });

  it('valeurs inconnues (R30 : type ou population inconnus)', () => {
    expect(s(typeTexte(null, 4200))).toBe("Type d'environnement inconnu · 4 200 habitants");
    expect(typeTexte('ville-dense', null)).toBe('Ville dense · population inconnue');
    expect(typeTexte(undefined, null)).toBe("Type d'environnement inconnu · population inconnue");
    expect(loyerTexte(null)).toBe('Loyer inconnu');
    expect(merFiche({ merKm: null, merMin: null })).toBe('Distance à la mer inconnue');
  });

  it('rang (R6) : 1re sur 1 commune qui passe, 3e sur 3 communes qui passent', () => {
    expect(rangTexte(1, 1)).toBe('1re sur 1 commune qui passe');
    expect(rangTexte(3, 3)).toBe('3e sur 3 communes qui passent');
    expect(s(rangTexte(4, 1269))).toBe('4e sur 1 269 communes qui passent');
  });

  it('raisons (R1, AC-9, AC-10)', () => {
    expect(s(raisonTexte({ critere: 'loyer', valeur: 1560, plafond: 1200 }))).toBe('Loyer 1 560 € : au-dessus de ton plafond de 1 200 €');
    expect(s(raisonTexte({ critere: 'mer', valeur: 135, plafond: 60 }))).toBe('Mer 2 h 15 : au-dessus de ton plafond de 1 h');
    expect(s(raisonTexte({ critere: 'taille', taille: 'grande-ville', population: 260000 }))).toBe('Taille : 260 000 habitants, hors des tailles choisies');
    expect(raisonTexte({ critere: 'loyer-inconnu' })).toBe('Loyer inconnu');
    expect(raisonTexte({ critere: 'mer-inconnue' })).toBe('Distance à la mer inconnue');
    expect(raisonTexte({ critere: 'taille-inconnue' })).toBe('Taille inconnue');
  });
});

// Spec cadre-de-vie : pastilles de taille en chiffres (R27, D2) et résumé de la catégorie « Cadre de vie » repliée (H75).
describe('R27, H75 — taille en chiffres, résumé du cadre de vie', () => {
  it('R27 : les quatre pastilles de taille, dans l’ordre, avec des espaces insécables dans les nombres (H3)', () => {
    expect(Object.values(LIBELLE_TAILLE).map(s)).toEqual(['Moins de 10 000 hab.', '10 000 – 50 000 hab.', '50 000 – 200 000 hab.', 'Plus de 200 000 hab.']);
    expect(LIBELLE_TAILLE['ville-moyenne']).toBe('50 000 – 200 000 hab.');
  });

  it('H75 : « Peu importe » si rien n’est choisi ; sinon les choix, dans l’ordre des groupes, séparés par « · »', () => {
    expect(resumeCadre({ loyer: 1200, mer: null, tailles: [] })).toBe('Peu importe');
    expect(s(resumeCadre({ loyer: 1200, mer: 60, tailles: ['petite-ville', 'ville-moyenne'] }))).toBe('2 tailles · Mer 1 h');
    expect(s(resumeCadre({ loyer: null, mer: null, tailles: ['grande-ville'] }))).toBe('1 taille');
    expect(s(resumeCadre({ loyer: 1200, mer: 90, tailles: [] }))).toBe('Mer 1 h 30');
  });
});

// Spec cadre-de-vie, tâche 4 : la ligne de la montagne dans la fiche (R30), sa raison (R29) et le résumé replié (H75).
describe('R29, R30, H75 — la montagne', () => {
  it('R30 : « Commune de montagne », « 140 km de la montagne à vol d’oiseau », « moins d’1 km de la montagne », inconnue', () => {
    expect(montagneFiche(0)).toBe('Commune de montagne');
    expect(s(montagneFiche(140))).toBe("140 km de la montagne à vol d'oiseau");
    expect(s(montagneFiche(49.6))).toBe("50 km de la montagne à vol d'oiseau");
    expect(s(montagneFiche(0.6))).toBe("moins d'1 km de la montagne");
    expect(s(montagneFiche(0.1))).toBe("moins d'1 km de la montagne");
    expect(montagneFiche(null)).toBe('Distance à la montagne inconnue');
  });

  it('R29 : raisons « Montagne 140 km : au-dessus de ton plafond de 50 km » et distance inconnue', () => {
    expect(s(raisonTexte({ critere: 'montagne', valeur: 140, plafond: 50 }))).toBe('Montagne 140 km : au-dessus de ton plafond de 50 km');
    expect(s(raisonTexte({ critere: 'montagne', valeur: 62, plafond: 10 }))).toBe('Montagne 62 km : au-dessus de ton plafond de 10 km');
    expect(raisonTexte({ critere: 'montagne-inconnue' })).toBe('Distance à la montagne inconnue');
  });

  it('H75 : « Montagne 30 km » après la mer', () => {
    expect(s(resumeCadre({ loyer: 1200, mer: null, montagne: 30, tailles: [] }))).toBe('Montagne 30 km');
    expect(s(resumeCadre({ loyer: 1200, mer: 60, montagne: 30, tailles: ['petite-ville', 'ville-moyenne'] }))).toBe('2 tailles · Mer 1 h · Montagne 30 km');
    expect(resumeCadre({ loyer: 1200, mer: null, montagne: null, tailles: [] })).toBe('Peu importe');
  });
});

// Spec cadre-de-vie, tâche 5 : le type d'environnement — libellés (R27), raison (R27), résumé replié (H75).
describe('R27, H75 — le type d’environnement', () => {
  it('R27 : les quatre types, dans l’ordre « Ville dense », « Ville et périphérie », « Bourg et village », « Campagne isolée »', () => {
    expect(Object.values(LIBELLE_TYPE)).toEqual(['Ville dense', 'Ville et périphérie', 'Bourg et village', 'Campagne isolée']);
  });

  it('R27 : raison « Environnement : ville et périphérie, hors des types choisis » ; type inconnu', () => {
    expect(raisonTexte({ critere: 'type', type: 'ville-et-peripherie' })).toBe('Environnement : ville et périphérie, hors des types choisis');
    expect(raisonTexte({ critere: 'type', type: 'ville-dense' })).toBe('Environnement : ville dense, hors des types choisis');
    expect(raisonTexte({ critere: 'type-inconnu' })).toBe("Type d'environnement inconnu");
  });

  it('H75 : « 1 type » au singulier, « 2 types », après les tailles et avant la mer', () => {
    expect(s(resumeCadre({ loyer: 1200, mer: null, tailles: [], types: ['ville-dense'] }))).toBe('1 type');
    expect(s(resumeCadre({ loyer: 1200, mer: 60, montagne: 30, tailles: ['petite-ville'], types: ['ville-dense', 'bourg-et-village'] }))).toBe(
      '1 taille · 2 types · Mer 1 h · Montagne 30 km',
    );
    expect(resumeCadre({ loyer: 1200, mer: null, tailles: [], types: [] })).toBe('Peu importe');
  });
});

describe('R61, H191, H192 — la mer en minutes (spec recherche-et-mer)', () => {
  it('H191 : 0 → « moins d’1 min », « 5 min », « 50 min », « 1 h », « 1 h 05 », « 2 h 40 », « 7 h »', () => {
    expect(s(dureeMer(0))).toBe("moins d'1 min");
    expect(s(dureeMer(5))).toBe('5 min');
    expect(s(dureeMer(14))).toBe('14 min');
    expect(s(dureeMer(50))).toBe('50 min');
    expect(s(dureeMer(60))).toBe('1 h');
    expect(s(dureeMer(65))).toBe('1 h 05');
    expect(s(dureeMer(135))).toBe('2 h 15');
    expect(s(dureeMer(160))).toBe('2 h 40');
    expect(s(dureeMer(420))).toBe('7 h');
  });

  it('R60 : les pastilles 15, 30, 60, 90 s’écrivent « 15 min », « 30 min », « 1 h », « 1 h 30 »', () => {
    expect([15, 30, 60, 90].map((m) => s(dureeMer(m)))).toEqual(['15 min', '30 min', '1 h', '1 h 30']);
  });

  it('H3 : espaces insécables dans la durée (jamais coupée en fin de ligne)', () => {
    expect(dureeMer(0)).toBe("moins d'1 min");
    expect(dureeMer(65)).toBe('1 h 05');
  });

  it('H192 : un temps compté d’après les km s’écrit avec « ≈ » (Rhinval, 420 km → « ≈ 7 h ») ; un temps calculé, sans', () => {
    expect(s(tempsMerTexte({ minutes: 420, dapresKm: true }))).toBe('≈ 7 h');
    expect(tempsMerTexte({ minutes: 420, dapresKm: true })).toBe('≈ 7 h');
    expect(s(tempsMerTexte({ minutes: 1, dapresKm: true }))).toBe('≈ 1 min');
    expect(s(tempsMerTexte({ minutes: 160, dapresKm: false }))).toBe('2 h 40');
    expect(s(tempsMerTexte({ minutes: 0, dapresKm: false }))).toBe("moins d'1 min");
  });

  // Tâche 3b : branchement sur la liste, les raisons, la fiche et le résumé (R62, R63, H75).
  it('R62 : la colonne de la liste en minutes, « ≈ 7 h » d’après les km (Rhinval), « moins d’1 min » ; sans km ni temps, « Distance à la mer inconnue »', () => {
    const rhinval = { nom: 'Rhinval', dep: '67', loyerM2: 11, merKm: 420, merMin: null };
    expect(s(chiffresListe(rhinval))).toBe('572 € · ≈ 7 h');
    expect(s(chiffresListe({ ...rhinval, merMin: 160 }))).toBe('572 € · 2 h 40');
    expect(s(chiffresListe({ ...rhinval, merMin: 0 }))).toBe("572 € · moins d'1 min");
    expect(s(chiffresListe({ ...rhinval, merKm: null }))).toBe('572 € · Distance à la mer inconnue');
  });

  it('R62 : raisons « Mer 2 h 40 : au-dessus de ton plafond de 1 h » ; sans temps « Mer ≈ 7 h : au-dessus de ton plafond de 1 h »', () => {
    expect(s(raisonTexte({ critere: 'mer', valeur: 160, plafond: 60 }))).toBe('Mer 2 h 40 : au-dessus de ton plafond de 1 h');
    expect(s(raisonTexte({ critere: 'mer', valeur: 420, plafond: 60, dapresKm: true }))).toBe('Mer ≈ 7 h : au-dessus de ton plafond de 1 h');
    expect(s(raisonTexte({ critere: 'mer', valeur: 135, plafond: 90 }))).toBe('Mer 2 h 15 : au-dessus de ton plafond de 1 h 30');
  });

  it('R63 : la fiche « 2 h 40 de la mer en voiture », « moins d’1 min de la mer en voiture » ; sans temps « Temps en voiture jusqu’à la mer inconnu : compté 7 h d’après les km »', () => {
    expect(s(merFiche({ merKm: 180.3, merMin: 160 }))).toBe('2 h 40 de la mer en voiture');
    expect(s(merFiche({ merKm: 0.2, merMin: 0 }))).toBe("moins d'1 min de la mer en voiture");
    expect(s(merFiche({ merKm: 420, merMin: null }))).toBe("Temps en voiture jusqu'à la mer inconnu : compté 7 h d'après les km");
    expect(s(merFiche({ merKm: 420 }))).toBe("Temps en voiture jusqu'à la mer inconnu : compté 7 h d'après les km");
  });

  it('H75 révisée : le résumé replié dit « Mer 30 min », « Mer 15 min »', () => {
    expect(s(resumeCadre({ loyer: 1200, mer: 30, tailles: [] }))).toBe('Mer 30 min');
    expect(s(resumeCadre({ loyer: 1200, mer: 15, tailles: [] }))).toBe('Mer 15 min');
  });
});
