import { describe, expect, it } from 'vitest';
import { chiffresListe, compte, euros, eurosM2, km, LIBELLE_TAILLE, LIBELLE_TYPE, ligneListe, loyerTexte, merFiche, merTexte, montagneFiche, nomAffiche, population, plafondLoyer, raisonTexte, rangTexte, resumeCadre, typeTexte } from './format';

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

  it('AC-4 (format) : « 1 · Portmer (17) · 72 · 650 € · moins d’1 km »', () => {
    const portmer = { nom: 'Portmer', dep: '17', loyerM2: 12.5, merKm: 0.9 };
    expect(s(ligneListe(1, portmer, 72))).toBe("1 · Portmer (17) · 72 · 650 € · moins d'1 km");
    expect(s(chiffresListe(portmer))).toBe("650 € · moins d'1 km");
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
    expect(s(merFiche(39.9))).toBe("40 km de la mer à vol d'oiseau");
    expect(s(merFiche(0.9))).toBe("moins d'1 km de la mer");
  });

  it('valeurs inconnues (R30 : type ou population inconnus)', () => {
    expect(s(typeTexte(null, 4200))).toBe("Type d'environnement inconnu · 4 200 habitants");
    expect(typeTexte('ville-dense', null)).toBe('Ville dense · population inconnue');
    expect(typeTexte(undefined, null)).toBe("Type d'environnement inconnu · population inconnue");
    expect(loyerTexte(null)).toBe('Loyer inconnu');
    expect(merFiche(null)).toBe('Distance à la mer inconnue');
  });

  it('rang (R6) : 1re sur 1 commune qui passe, 3e sur 3 communes qui passent', () => {
    expect(rangTexte(1, 1)).toBe('1re sur 1 commune qui passe');
    expect(rangTexte(3, 3)).toBe('3e sur 3 communes qui passent');
    expect(s(rangTexte(4, 1269))).toBe('4e sur 1 269 communes qui passent');
  });

  it('raisons (R1, AC-9, AC-10)', () => {
    expect(s(raisonTexte({ critere: 'loyer', valeur: 1560, plafond: 1200 }))).toBe('Loyer 1 560 € : au-dessus de ton plafond de 1 200 €');
    expect(s(raisonTexte({ critere: 'mer', valeur: 148, plafond: 50 }))).toBe('Mer 148 km : au-dessus de ton plafond de 50 km');
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
    expect(s(resumeCadre({ loyer: 1200, mer: 50, tailles: ['petite-ville', 'ville-moyenne'] }))).toBe('2 tailles · Mer 50 km');
    expect(s(resumeCadre({ loyer: null, mer: null, tailles: ['grande-ville'] }))).toBe('1 taille');
    expect(s(resumeCadre({ loyer: 1200, mer: 100, tailles: [] }))).toBe('Mer 100 km');
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
    expect(s(resumeCadre({ loyer: 1200, mer: 50, montagne: 30, tailles: ['petite-ville', 'ville-moyenne'] }))).toBe('2 tailles · Mer 50 km · Montagne 30 km');
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
    expect(s(resumeCadre({ loyer: 1200, mer: 50, montagne: 30, tailles: ['petite-ville'], types: ['ville-dense', 'bourg-et-village'] }))).toBe(
      '1 taille · 2 types · Mer 50 km · Montagne 30 km',
    );
    expect(resumeCadre({ loyer: 1200, mer: null, tailles: [], types: [] })).toBe('Peu importe');
  });
});
