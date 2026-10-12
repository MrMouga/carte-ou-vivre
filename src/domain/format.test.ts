import { describe, expect, it } from 'vitest';
import { chiffresListe, compte, euros, eurosM2, km, ligneListe, loyerTexte, merFiche, merTexte, nomAffiche, population, plafondLoyer, plafondMer, raisonTexte, rangTexte, tailleTexte } from './format';

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
  it('taille, loyer, mer (AC-7, AC-8)', () => {
    expect(s(tailleTexte(260000))).toBe('Grande ville · 260 000 habitants');
    expect(s(tailleTexte(23000))).toBe('Petite ville · 23 000 habitants');
    expect(s(loyerTexte(16.0))).toBe('832 € par mois pour 52 m² (16,0 €/m²)');
    expect(s(loyerTexte(12.5))).toBe('650 € par mois pour 52 m² (12,5 €/m²)');
    expect(s(merFiche(39.9))).toBe("40 km de la mer à vol d'oiseau");
    expect(s(merFiche(0.9))).toBe("moins d'1 km de la mer");
  });

  it('valeurs inconnues', () => {
    expect(tailleTexte(null)).toBe('Taille inconnue');
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
    expect(s(raisonTexte({ critere: 'mer', valeur: 148, plafond: 60 }))).toBe('Mer 148 km : au-dessus de ton plafond de 60 km');
    expect(s(raisonTexte({ critere: 'taille', taille: 'grande-ville', population: 260000 }))).toBe('Taille : grande ville (260 000 habitants)');
    expect(raisonTexte({ critere: 'loyer-inconnu' })).toBe('Loyer inconnu');
    expect(raisonTexte({ critere: 'mer-inconnue' })).toBe('Distance à la mer inconnue');
    expect(raisonTexte({ critere: 'taille-inconnue' })).toBe('Taille inconnue');
  });
});
