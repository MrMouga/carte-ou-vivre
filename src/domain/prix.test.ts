import { describe, expect, it } from 'vitest';
import immobilier from '../../docs/specs/2026-10-14-immobilier/acceptance.json';
import { compte, estimationTexte, ligneListe, plafondPrix, prixFiche, raisonTexte, rangTexte, resumePrix } from './format';
import {
  auCran,
  bornesPrix,
  changerBien,
  changerMode,
  changerSurface,
  changerUnite,
  joindreAchats,
  PRIX_DEPART,
  valeurAffichee,
  type Achat,
  type ReglagePrix,
} from './prix';
import { evaluer, type Commune, type Reglages } from './score';
import { ecrireAdresse, lireAdresse, lirePrix } from './url';

// Spec immobilier : les nombres et les textes des critères AC-1 à AC-13, recalculés sans navigateur, sur la fixture
// « 6 communes ». Les critères eux-mêmes sont prouvés par les tests e2e (tâches 2 à 4) ; ici, le calcul.
const s = (t: string) => t.replace(/\u00a0/g, ' '); // espaces insécables (H3) → espaces

const communes: Commune[] = immobilier.fixture.items.map((it) => ({
  code: it.code_insee,
  nom: it.nom,
  dep: it.dep,
  population: it.population,
  loyerM2: it.loyer_m2,
  estimationPropre: it.estimation_propre,
  merKm: it.mer_km,
  loyerM2Maison: it.loyer_m2_maison,
  estimationPropreMaison: it.estimation_propre_maison,
  achatAppartement: it.achat_appartement as Achat,
  achatMaison: it.achat_maison as Achat,
}));
type Id = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
const code = Object.fromEntries(immobilier.fixture.items.map((it) => [it.id, it.code_insee])) as Record<Id, string>;

/** La page pour des réglages et un réglage du prix : adresse, compte, liste, fiche, comme les lit l'utilisateur. */
function page(r: Reglages, p: ReglagePrix) {
  const res = evaluer(communes, r, [], p);
  const ev = (id: Id) => res.parCode.get(code[id])!;
  return {
    res,
    ev,
    adresse: ecrireAdresse(r, p),
    compte: compte(res.classement.length),
    liste: res.classement.map((e) => s(ligneListe(e.rang!, e.commune, e.score!, p))),
    classement: res.classement.map((e) => [e.commune.nom, e.score]),
    prix: (id: Id) => s(prixFiche(ev(id).commune, p)),
    estimation: (id: Id) => estimationTexte(ev(id).commune, p),
    raisons: (id: Id) => ev(id).raisons.map((x) => s(raisonTexte(x))),
    plafond: s(plafondPrix(r.loyer, p)),
  };
}
const ouvrir = (search: string) => ({ r: lireAdresse(search), p: lirePrix(search) });

describe('AC-1 à AC-13 — la même page, calculée par l’évaluation seule', () => {
  it('AC-1 ouverture de / : Appartement, Louer, Total, 52 m², 1 200 € ; /?loyer=1200&mer=60 ; A 72, E 49, B 32 ; C, D, F non colorées', () => {
    const { r, p } = ouvrir('');
    expect(p).toEqual({ mode: 'louer', bien: 'appartement', unite: 'total', surface: 52 });
    const v = page(r, p);
    expect(v.plafond).toBe('1 200 €');
    expect(v.adresse).toBe('/?loyer=1200&mer=60');
    expect([v.ev('A').score, v.ev('E').score, v.ev('B').score]).toEqual([72, 49, 32]);
    for (const id of ['C', 'D', 'F'] as Id[]) expect(v.ev(id).palier).toBeNull();
    expect(s(resumePrix(p, r.loyer))).toBe('Louer · Appartement · 52 m² · 1 200 €');
  });

  it('AC-2 surface 72 m² : /?loyer=1200&mer=60&surface=72 ; Portmer 62 · 900 €, Grandeville 19 · 1 152 € ; raison de Quaibleu 1 512 €', () => {
    const { r, p: p0 } = ouvrir('');
    const p = changerSurface(p0, 72);
    const v = page(r, p);
    expect(v.adresse).toBe('/?loyer=1200&mer=60&surface=72');
    expect(v.compte).toBe('2 communes passent tes critères');
    expect(v.liste).toEqual(["1 · Portmer (17) · 62 · 900 € · moins d'1 km", '2 · Grandeville (33) · 19 · 1 152 € · 40 km']);
    expect(v.prix('B')).toBe('1 152 € par mois pour 72 m² (16,0 €/m²)');
    expect(v.raisons('E')).toContain('Loyer 1 512 € : au-dessus de ton plafond de 1 200 €');
  });

  it('AC-3 Maison depuis 72 m² : surface et plafond gardés ; Portmer 68 · 756 €, Grandeville 28 · 936 € ; Estimation du secteur ; Quaibleu 1 224 €', () => {
    const { r, p: p0 } = ouvrir('?loyer=1200&mer=60&surface=72');
    const p = changerBien(p0, 'maison');
    expect([p.surface, r.loyer]).toEqual([72, 1200]);
    const v = page(r, p);
    expect(v.adresse).toBe('/?loyer=1200&mer=60&bien=maison&surface=72');
    expect(v.compte).toBe('2 communes passent tes critères');
    expect(v.liste).toEqual(["1 · Portmer (17) · 68 · 756 € · moins d'1 km", '2 · Grandeville (33) · 28 · 936 € · 40 km']);
    expect(v.prix('A')).toBe('756 € par mois pour 72 m² (10,5 €/m²)');
    expect(v.estimation('A')).toBe('Estimation du secteur (communes voisines)');
    expect(v.raisons('E')).toContain('Loyer 1 224 € : au-dessus de ton plafond de 1 200 €');
  });

  it('AC-4 Au m² puis Total : 23 €/m², /?loyer=23&mer=60&unite=m2, liste au m² ; retour : 1 200 €, 52 m², /?loyer=1200&mer=60', () => {
    const { r, p: p0 } = ouvrir('');
    const m2 = changerUnite(p0, r.loyer, 'm2');
    const v = page({ ...r, loyer: m2.plafond }, m2.prix);
    expect(v.plafond).toBe('23 €/m²');
    expect(v.adresse).toBe('/?loyer=23&mer=60&unite=m2');
    expect(v.liste).toEqual([
      "1 · Portmer (17) · 72 · 12,5 €/m² · moins d'1 km",
      '2 · Quaibleu (13) · 49 · 21,0 €/m² · 7 km',
      '3 · Grandeville (33) · 32 · 16,0 €/m² · 40 km',
    ]);
    expect(v.prix('B')).toBe('16,0 €/m² par mois');
    const total = changerUnite(m2.prix, m2.plafond, 'total');
    expect([total.plafond, total.prix.surface]).toEqual([1200, 52]);
    expect(ecrireAdresse({ ...r, loyer: total.plafond }, total.prix)).toBe('/?loyer=1200&mer=60');
  });

  it('AC-5 Acheter puis Louer : Au m², 5 000 €/m², /?achat=5000&mer=60, 3 communes ; retour : Total, 52 m², 1 200 €', () => {
    const { r, p: p0 } = ouvrir('');
    const achat = changerMode(p0, r.loyer, 'acheter');
    expect(achat.prix.unite).toBe('m2');
    const v = page({ ...r, loyer: achat.plafond }, achat.prix);
    expect(v.plafond).toBe('5 000 €/m²');
    expect(v.adresse).toBe('/?achat=5000&mer=60');
    expect(v.compte).toBe('3 communes passent tes critères');
    expect(v.liste).toEqual([
      "1 · Portmer (17) · 61 · 3 800 €/m² · moins d'1 km",
      '2 · Quaibleu (13) · 46 · 4 800 €/m² · 7 km',
      '3 · Grandeville (33) · 23 · 4 400 €/m² · 40 km',
    ]);
    expect(v.prix('B')).toBe("4 400 €/m² à l'achat");
    expect(v.estimation('B')).toBeNull();
    const louer = changerMode(achat.prix, achat.plafond, 'louer');
    expect(louer).toEqual({ prix: PRIX_DEPART, plafond: 1200 });
    expect(ecrireAdresse({ ...r, loyer: louer.plafond }, louer.prix)).toBe('/?loyer=1200&mer=60');
  });

  it('AC-6 Total depuis /?achat=5000&mer=60 : 260 000 €, 52 m², /?achat=260000&mer=60&unite=total ; 198 000 €, 250 000 €, 229 000 €', () => {
    const { r, p: p0 } = ouvrir('?achat=5000&mer=60');
    const t = changerUnite(p0, r.loyer, 'total');
    const v = page({ ...r, loyer: t.plafond }, t.prix);
    expect(v.plafond).toBe('260 000 €');
    expect(t.prix.surface).toBe(52);
    expect(v.adresse).toBe('/?achat=260000&mer=60&unite=total');
    expect(v.compte).toBe('3 communes passent tes critères');
    expect(v.liste).toEqual([
      "1 · Portmer (17) · 61 · 198 000 € · moins d'1 km",
      '2 · Quaibleu (13) · 46 · 250 000 € · 7 km',
      '3 · Grandeville (33) · 23 · 229 000 € · 40 km',
    ]);
    expect(v.prix('B')).toBe('229 000 € pour 52 m² (4 400 €/m²)');
  });

  it('AC-7 Maison depuis /?achat=5000&mer=60 : /?achat=5000&mer=60&bien=maison&surface=52 ; Portmer 64, Quaibleu 48 ; Grandeville 5 100 €/m²', () => {
    const { r, p: p0 } = ouvrir('?achat=5000&mer=60');
    const p = changerBien(p0, 'maison');
    const v = page(r, p);
    expect(v.adresse).toBe('/?achat=5000&mer=60&bien=maison&surface=52');
    expect(v.compte).toBe('2 communes passent tes critères');
    expect(v.liste).toEqual(["1 · Portmer (17) · 64 · 3 500 €/m² · moins d'1 km", '2 · Quaibleu (13) · 48 · 4 600 €/m² · 7 km']);
    expect(v.prix('A')).toBe("3 500 €/m² à l'achat");
    expect(v.estimation('A')).toBe('Estimation du secteur (moins de 5 ventes dans la commune)');
    expect(v.raisons('B')).toContain('Achat 5 100 €/m² : au-dessus de ton plafond de 5 000 €/m²');
  });

  it('AC-8 /?achat=5000&mer=200 : 4 communes, Terrebasse 4e avec 10 et « prix inconnu » ; C et F non colorées', () => {
    const { r, p } = ouvrir('?achat=5000&mer=200');
    const v = page(r, p);
    expect(v.compte).toBe('4 communes passent tes critères');
    expect(v.liste).toEqual([
      "1 · Portmer (17) · 62 · 3 800 €/m² · moins d'1 km",
      '2 · Quaibleu (13) · 50 · 4 800 €/m² · 7 km',
      '3 · Grandeville (33) · 46 · 4 400 €/m² · 40 km',
      '4 · Terrebasse (23) · 10 · prix inconnu · 180 km',
    ]);
    expect(v.prix('D')).toBe("Prix d'achat inconnu : trop peu de ventes dans le secteur");
    expect(v.ev('D').score).toBe(10);
    expect(rangTexte(v.ev('D').rang!, v.res.classement.length)).toBe('4e sur 4 communes qui passent');
    for (const id of ['C', 'F'] as Id[]) expect([v.ev(id).palier, v.ev(id).sansNote]).toEqual([null, false]);
  });

  it('AC-9 /?achat=5000&mer=aucun : Portmer 24, Grandeville 12, Quaibleu 4 ; D et F sans note (neutres) ; C ne passe pas ; Rhinval : Alsace-Moselle', () => {
    const { r, p } = ouvrir('?achat=5000&mer=aucun');
    const v = page(r, p);
    expect(v.compte).toBe('3 communes passent tes critères');
    expect(v.classement).toEqual([['Portmer', 24], ['Grandeville', 12], ['Quaibleu', 4]]);
    for (const id of ['D', 'F'] as Id[]) expect(v.ev(id)).toMatchObject({ passe: true, sansNote: true, score: null, rang: null, palier: null });
    expect(v.ev('C').passe).toBe(false);
    expect(v.prix('F')).toBe("Prix d'achat inconnu : les ventes ne sont pas publiées en Alsace-Moselle");
  });

  it('AC-10 /?achat=300000&mer=aucun&bien=maison&unite=total&surface=100 : réglage relu, adresse inchangée, Terrebasse 57 · 130 000 € ; F neutre ; Portmer 350 000 €', () => {
    const search = '?achat=300000&mer=aucun&bien=maison&unite=total&surface=100';
    const { r, p } = ouvrir(search);
    expect(p).toEqual({ mode: 'acheter', bien: 'maison', unite: 'total', surface: 100 });
    expect([r.loyer, r.mer]).toEqual([300000, null]);
    const v = page(r, p);
    expect(v.plafond).toBe('300 000 €');
    expect(v.adresse).toBe(`/${search}`);
    expect(v.compte).toBe('1 commune passe tes critères');
    expect(v.liste).toEqual(['1 · Terrebasse (23) · 57 · 130 000 € · 180 km']);
    expect(v.ev('F').sansNote).toBe(true);
    expect(v.raisons('A')).toContain('Achat 350 000 € : au-dessus de ton plafond de 300 000 €');
  });

  it('AC-11 /?achat=abc&unite=litre&bien=villa&surface=0 : Appartement, Acheter, Au m², 5 000 €/m² ; /?achat=5000&mer=60 ; Portmer 61, Quaibleu 46, Grandeville 23', () => {
    const { r, p } = ouvrir('?achat=abc&unite=litre&bien=villa&surface=0');
    expect(p).toEqual({ mode: 'acheter', bien: 'appartement', unite: 'm2', surface: 52 });
    const v = page(r, p);
    expect(v.plafond).toBe('5 000 €/m²');
    expect(v.adresse).toBe('/?achat=5000&mer=60');
    expect(v.compte).toBe('3 communes passent tes critères');
    expect(v.classement).toEqual([['Portmer', 61], ['Quaibleu', 46], ['Grandeville', 23]]);
  });

  it('AC-13 /?loyer=1100&mer=aucun&bien=maison : 92 m², 1 100 €, adresse inchangée ; Terrebasse 46 · 598 €, Portmer 12 · 966 € ; Rhinval « Loyer inconnu », neutre ; Grandeville 1 196 €', () => {
    const { r, p } = ouvrir('?loyer=1100&mer=aucun&bien=maison');
    expect(p).toEqual({ mode: 'louer', bien: 'maison', unite: 'total', surface: 92 });
    const v = page(r, p);
    expect(v.plafond).toBe('1 100 €');
    expect(v.adresse).toBe('/?loyer=1100&mer=aucun&bien=maison');
    expect(v.compte).toBe('2 communes passent tes critères');
    expect(v.liste).toEqual(['1 · Terrebasse (23) · 46 · 598 € · 180 km', "2 · Portmer (17) · 12 · 966 € · moins d'1 km"]);
    expect(v.ev('F')).toMatchObject({ passe: true, sansNote: true, score: null, rang: null });
    expect(v.prix('F')).toBe('Loyer inconnu');
    expect(v.raisons('B')).toContain('Loyer 1 196 € : au-dessus de ton plafond de 1 100 €');
  });
});

describe('R21 — changer de mode, de bien, de surface', () => {
  it('Acheter met Au m² et 5 000 €/m², même depuis « Sans limite » ; Louer met Total et 1 200 € ; bien et surface gardés', () => {
    const maison70 = { ...PRIX_DEPART, bien: 'maison' as const, surface: 70 };
    expect(changerMode(maison70, null, 'acheter')).toEqual({ prix: { ...maison70, mode: 'acheter', unite: 'm2' }, plafond: 5000 });
    expect(changerMode({ ...maison70, mode: 'acheter', unite: 'total' }, 350000, 'louer')).toEqual({ prix: maison70, plafond: 1200 });
    expect(changerMode(maison70, 900, 'louer')).toEqual({ prix: maison70, plafond: 900 });
  });

  it('changer de bien ne change ni la surface ni l’unité (le plafond n’est pas touché : la fonction ne le reçoit pas)', () => {
    const p = { mode: 'acheter' as const, bien: 'appartement' as const, unite: 'total' as const, surface: 70 };
    expect(changerBien(p, 'maison')).toEqual({ ...p, bien: 'maison' });
  });

  it('H58 surface : entier de 10 à 300 m² ; sinon la dernière surface valide reste', () => {
    expect(changerSurface(PRIX_DEPART, 10).surface).toBe(10);
    expect(changerSurface(PRIX_DEPART, 300).surface).toBe(300);
    for (const n of [9, 301, 0, 72.5, NaN]) expect(changerSurface(PRIX_DEPART, n).surface).toBe(52);
  });
});

describe('R23, H57 — changer d’unité, crans et bornes', () => {
  it('loyer 1 200 € pour 52 m² → 23 €/m² → 1 200 € (23 × 52 = 1 196)', () => {
    const m2 = changerUnite(PRIX_DEPART, 1200, 'm2');
    expect(m2.plafond).toBe(23);
    expect(changerUnite(m2.prix, 23, 'total').plafond).toBe(1200);
  });

  it('achat 5 000 €/m² × 52 m² → 260 000 € ; 12 000 €/m² × 92 m² → 1 000 000 € (ramené à la borne)', () => {
    const achat = { ...PRIX_DEPART, mode: 'acheter' as const, unite: 'm2' as const };
    expect(changerUnite(achat, 5000, 'total').plafond).toBe(260000);
    expect(changerUnite({ ...achat, bien: 'maison', surface: 92 }, 12000, 'total').plafond).toBe(1000000);
  });

  it('ramené à la borne basse : 5 €/m² × 10 m² = 50 € → 300 €', () => {
    expect(changerUnite({ ...PRIX_DEPART, unite: 'm2', surface: 10 }, 5, 'total').plafond).toBe(300);
  });

  it('« Sans limite » le reste quand on change d’unité', () => {
    expect(changerUnite(PRIX_DEPART, null, 'm2')).toEqual({ prix: { ...PRIX_DEPART, unite: 'm2' }, plafond: null });
  });

  it('au cran le plus proche, moitié vers le haut : 1 225 € → 1 250 € ; 1 224 € → 1 200 €', () => {
    const b = bornesPrix({ mode: 'louer', unite: 'total' });
    expect([auCran(1225, b), auCran(1224, b)]).toEqual([1250, 1200]);
  });

  it('H57 : plages et crans des quatre réglages', () => {
    expect(bornesPrix({ mode: 'louer', unite: 'total' })).toEqual({ min: 300, max: 2000, pas: 50 });
    expect(bornesPrix({ mode: 'louer', unite: 'm2' })).toEqual({ min: 5, max: 40, pas: 1 });
    expect(bornesPrix({ mode: 'acheter', unite: 'm2' })).toEqual({ min: 500, max: 12000, pas: 100 });
    expect(bornesPrix({ mode: 'acheter', unite: 'total' })).toEqual({ min: 50000, max: 1000000, pas: 10000 });
  });
});

describe('R22, H59 — valeur affichée', () => {
  const avec = (m2: number): Commune => ({ ...communes[0], achatAppartement: { m2, source: 'commune' } });
  const achatTotal = (surface: number): ReglagePrix => ({ mode: 'acheter', bien: 'appartement', unite: 'total', surface });

  it('montant d’achat au millier d’euros, moitié vers le haut : 229 500 € → 230 000 € ; 229 499 € → 229 000 €', () => {
    expect(valeurAffichee(avec(4500), achatTotal(51))).toBe(230000); // 4 500 × 51 = 229 500
    expect(valeurAffichee(avec(4499.98), achatTotal(51))).toBe(229000); // 229 498,98
  });

  it('achat au m² à l’euro ; loyer au m² à une décimale ; loyer total à l’euro', () => {
    const c = { ...avec(4412.5), loyerM2: 15.9932 };
    expect(valeurAffichee(c, { ...achatTotal(52), unite: 'm2' })).toBe(4413);
    expect(valeurAffichee(c, { ...PRIX_DEPART, unite: 'm2' })).toBe(16);
    expect(valeurAffichee(c, { ...PRIX_DEPART, surface: 70 })).toBe(1120); // Bordeaux, vérification de bout en bout, étape 2
  });

  it('prix inconnu : null, quel que soit le réglage', () => {
    const f = communes[5];
    for (const mode of ['louer', 'acheter'] as const) expect(valeurAffichee(f, { ...PRIX_DEPART, mode, bien: 'maison' })).toBeNull();
    expect(valeurAffichee(f, { ...PRIX_DEPART, mode: 'acheter' })).toBeNull();
  });
});

describe('R24 — textes du prix', () => {
  const b = communes[1];
  const reglage = (mode: 'louer' | 'acheter', unite: 'total' | 'm2'): ReglagePrix => ({ mode, unite, bien: 'appartement', surface: 52 });

  it('ligne de la fiche dans les quatre modes (tableau de R24)', () => {
    expect(s(prixFiche(b, reglage('louer', 'total')))).toBe('832 € par mois pour 52 m² (16,0 €/m²)');
    expect(s(prixFiche(b, reglage('louer', 'm2')))).toBe('16,0 €/m² par mois');
    expect(s(prixFiche(b, reglage('acheter', 'total')))).toBe('229 000 € pour 52 m² (4 400 €/m²)');
    expect(s(prixFiche(b, reglage('acheter', 'm2')))).toBe("4 400 €/m² à l'achat");
  });

  it('raisons quand le prix dépasse (tableau de R24)', () => {
    expect(s(raisonTexte({ critere: 'loyer', valeur: 1512, plafond: 1200 }))).toBe('Loyer 1 512 € : au-dessus de ton plafond de 1 200 €');
    expect(s(raisonTexte({ critere: 'loyer-m2', valeur: 30, plafond: 23 }))).toBe('Loyer 30,0 €/m² : au-dessus de ton plafond de 23 €/m²');
    expect(s(raisonTexte({ critere: 'achat', valeur: 350000, plafond: 300000 }))).toBe('Achat 350 000 € : au-dessus de ton plafond de 300 000 €');
    expect(s(raisonTexte({ critere: 'achat-m2', valeur: 5100, plafond: 5000 }))).toBe('Achat 5 100 €/m² : au-dessus de ton plafond de 5 000 €/m²');
  });

  it('résumé de la catégorie : surface seulement en Total ; « Sans limite »', () => {
    expect(s(resumePrix(PRIX_DEPART, 1200))).toBe('Louer · Appartement · 52 m² · 1 200 €');
    expect(s(resumePrix({ ...PRIX_DEPART, mode: 'acheter', unite: 'm2', bien: 'maison' }, 5000))).toBe('Acheter · Maison · 5 000 €/m²');
    expect(s(resumePrix({ ...PRIX_DEPART, unite: 'm2' }, null))).toBe('Louer · Appartement · Sans limite');
  });

  it('estimation du secteur : loyer estimé (communes voisines) ; achat de l’intercommunalité (moins de 5 ventes) ; rien sans prix', () => {
    expect(estimationTexte(communes[0], PRIX_DEPART)).toBe('Estimation du secteur (communes voisines)'); // Portmer : estimation_propre false
    expect(estimationTexte(b, PRIX_DEPART)).toBeNull(); // Grandeville : estimation propre de la commune
    expect(estimationTexte(b, { ...PRIX_DEPART, mode: 'acheter', bien: 'maison' })).toBeNull(); // prix de la commune
    expect(estimationTexte(communes[3], reglage('acheter', 'm2'))).toBeNull(); // Terrebasse : prix inconnu
    expect(estimationTexte(communes[5], { ...PRIX_DEPART, bien: 'maison' })).toBeNull(); // Rhinval : loyer de maison inconnu
  });
});

describe('H68 — prix d’achat joints par code INSEE', () => {
  it('une ligne par code, dans n’importe quel ordre ; une commune absente a un prix inconnu', () => {
    const achat = {
      champs: ['code', 'appartement_m2', 'appartement_source', 'maison_m2', 'maison_source'],
      communes: [
        ['99002', 4400, 'commune', 5100, 'commune'],
        ['99001', 3800, 'commune', 3500, 'secteur'],
      ] as [string, number | null, string, number | null, string][],
    };
    const jointes = joindreAchats(communes, achat); // Montcher (99003) a un prix dans la fixture, mais pas de ligne ici
    expect(jointes[0].achatMaison).toEqual({ m2: 3500, source: 'secteur' });
    expect(jointes[1].achatAppartement).toEqual({ m2: 4400, source: 'commune' });
    expect(jointes[2].achatAppartement).toEqual({ m2: null, source: 'inconnu-secteur' });
    expect(jointes.map((c) => c.code)).toEqual(communes.map((c) => c.code));
  });
});
