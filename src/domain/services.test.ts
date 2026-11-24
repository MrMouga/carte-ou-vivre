import { describe, expect, it } from 'vitest';
import cadreDeVie from '../../docs/specs/2026-10-14-cadre-de-vie/acceptance.json';
import services from '../../docs/specs/2026-11-23-services/acceptance.json';
import {
  ecrireServices,
  filtresServices,
  libelleService,
  LIMITES_SERVICES,
  lignesServices,
  lireServices,
  NIVEAUX_SCOLARITE,
  phraseTraversee,
  SERVICES,
  SERVICES_DEPART,
  TRAVERSEE,
  valeurService,
  type ReglageServices,
  type ServiceCle,
  type Services,
  type TempsServices,
  type TypeGare,
} from './services';
import { evaluer, REGLAGES_DEPART, type Commune, type ProchePret } from './score';
import { ecrireAdresse, lireAdresse, lirePrix } from './url';
import { raisonTexte } from './format';

// Tranche services, tâche 1 : la valeur d'un service dans la fiche (R54), jointe par code INSEE. La fixture « 6 communes »
// est servie comme dans tests/e2e/lib/carte.ts : temps et drapeau d'île de la fixture de services, département et
// population de celle de cadre-de-vie, par code INSEE.
const texte = (s: string) => s.replace(/ /g, ' ');
const f = services.fixture;
const cadre = new Map(cadreDeVie.fixture.items.map((it) => [it.code_insee, it]));
type Id = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
type Item = { id: string; code_insee: string; nom: string; ile_sans_pont: boolean; temps_services: TempsServices; departement?: string; population?: number };

/** Le fichier des temps de la fixture (ou de la variante « cas sûrs »), écrit et relu par les fonctions de la page. */
function servi(items: Item[]): Services {
  return lireServices(ecrireServices(items.map((it) => ({ code: it.code_insee, temps: it.temps_services, ile_sans_pont: it.ile_sans_pont }))));
}
const SIX = f.items as Item[];
const CAS_SURS: Item[] = SIX.map((it) => ({ ...it, ...(f.variante_cas_surs as Record<string, Partial<Item>>)[it.id] }));
const commune = (items: Item[], id: Id) => {
  const it = items.find((x) => x.id === id)!;
  return { code: it.code_insee, dep: it.departement ?? cadre.get(it.code_insee)!.dep };
};
/** Les 10 lignes de la fiche lues « <Service> : <valeur> », espaces insécables remis en espaces. */
const lu = (s: Services, c: { code: string; dep: string }) => lignesServices(s, c).map((l) => texte(`${l.libelle} : ${l.valeur}`));
const lignes = (items: Item[], id: Id) => lu(servi(items), commune(items, id));

describe('valeur d’un service dans la fiche (R54)', () => {
  it('AC-6 Portmer : les 10 lignes dans l’ordre de R54, sans phrase de la traversée ; phrase des limites de H159', () => {
    expect(lignes(SIX, 'A')).toEqual([
      'Médecin : 4 min',
      'Commerce alimentaire : 3 min',
      'Crèche : 12 min',
      'École : 2 min',
      'Collège : 9 min',
      'Lycée : 14 min',
      'Supérieur : 18 min',
      'Gare : 6 min',
      'Gare régionale : 8 min',
      'Gare grandes lignes : 40 min',
    ]);
    expect(phraseTraversee(servi(SIX), commune(SIX, 'A'))).toBe(false);
    expect(texte(LIMITES_SERVICES)).toBe(
      "Temps en voiture, sans embouteillages, que la moitié des habitants ne dépasse pas ; les trajets en bus ou à pied ne sont pas comptés. Médecins généralistes libéraux seulement, sans savoir s'ils prennent de nouveaux patients. Crèches financées par la CAF. Supérieur : universités et grandes écoles, antennes comprises. Gare régionale : 100 000 voyageurs par an ou plus. Gare grandes lignes : gare nationale, ou au moins 4 arrêts de TGV ou d'Intercités par jour ; son temps part parfois de la mairie.",
    );
    // H159 : insécables avant « : » et dans « 100 000 ».
    expect(LIMITES_SERVICES).toContain('Supérieur :');
    expect(LIMITES_SERVICES).toContain('Gare régionale :');
    expect(LIMITES_SERVICES).toContain('100 000');
  });

  it('AC-6 Terrebasse « Gare régionale : plus d’une heure » (61 min), Quaibleu « Gare régionale : 60 min », Rhinval « pas de chiffre »', () => {
    expect(lignes(SIX, 'D')[8]).toBe("Gare régionale : plus d'une heure");
    expect(lignes(SIX, 'D')[6]).toBe("Supérieur : plus d'une heure"); // 70 min
    expect(lignes(SIX, 'E')[8]).toBe('Gare régionale : 60 min');
    expect(lignes(SIX, 'E')[9]).toBe("Gare grandes lignes : plus d'une heure"); // 75 min
    const rhinval = lignes(SIX, 'F');
    for (const l of ['Médecin : pas de chiffre', 'Supérieur : pas de chiffre', 'Gare régionale : pas de chiffre', 'Gare grandes lignes : pas de chiffre'])
      expect(rhinval).toContain(l);
    expect(rhinval[1]).toBe('Commerce alimentaire : 6 min');
  });

  it('60 min et 61 min : « 60 min » puis « plus d’une heure », sans recalcul', () => {
    const s = servi([{ ...SIX[0], temps_services: { ...SIX[0].temps_services, medecin: 60, commerce: 61 } }]);
    const c = { code: SIX[0].code_insee, dep: '17' };
    expect(valeurService(s, c, 'medecin')).toEqual({ cas: 'temps', minutes: 60 });
    expect(valeurService(s, c, 'commerce')).toEqual({ cas: 'temps', minutes: 61 });
    expect(lu(s, c).slice(0, 2)).toEqual(['Médecin : 60 min', "Commerce alimentaire : plus d'une heure"]);
  });

  it('jointure par code INSEE : une commune absente du fichier n’a aucun chiffre ; l’ordre du fichier ne compte pas', () => {
    const s = servi([...SIX].reverse());
    expect(lu(s, commune(SIX, 'A'))[0]).toBe('Médecin : 4 min');
    expect(lu(s, { code: '99999', dep: '17' })).toEqual(SERVICES.map((x) => `${x.libelle} : pas de chiffre`));
  });

  it('île sans pont (cas sûrs, Portmer) : « aucune sur l’île » pour les trois gares, pas pour le médecin ; phrase de la traversée', () => {
    const l = lignes(CAS_SURS, 'A');
    expect(l.slice(7)).toEqual(["Gare : aucune sur l'île", "Gare régionale : aucune sur l'île", "Gare grandes lignes : aucune sur l'île"]);
    expect(l[0]).toBe('Médecin : 4 min');
    expect(valeurService(servi(CAS_SURS), commune(CAS_SURS, 'A'), 'gare')).toEqual({ cas: 'ile' });
    expect(phraseTraversee(servi(CAS_SURS), commune(CAS_SURS, 'A'))).toBe(true);
    expect(texte(TRAVERSEE)).toBe("Île sans pont : un temps peut compter la traversée, sans l'attente du bateau.");
  });

  it('île sans pont sans aucun temps parmi les 7 premiers services (cas sûrs, Montcher) : « aucune sur l’île », sans phrase de la traversée', () => {
    const l = lignes(CAS_SURS, 'C');
    expect(l[0]).toBe('Médecin : pas de chiffre');
    expect(l[7]).toBe("Gare : aucune sur l'île");
    expect(phraseTraversee(servi(CAS_SURS), commune(CAS_SURS, 'C'))).toBe(false);
  });

  it('île sans pont avec un temps de gare dans le fichier (Île-de-Bréhat, 9 min) : « aucune sur l’île »', () => {
    const s = lireServices(ecrireServices([{ code: '22016', temps: { ...SIX[0].temps_services, gare: 9 }, ile_sans_pont: true }]));
    expect(valeurService(s, { code: '22016', dep: '22' }, 'gare')).toEqual({ cas: 'ile' });
  });

  it('Corse (cas sûrs, Quaibleu en 2B) : « aucune en Corse » pour la gare régionale et grandes lignes, pas pour « Gare »', () => {
    const l = lignes(CAS_SURS, 'E');
    expect(l.slice(7)).toEqual(['Gare : 30 min', 'Gare régionale : aucune en Corse', 'Gare grandes lignes : aucune en Corse']);
    expect(l[0]).toBe('Médecin : 10 min');
    // Lu dans le département (communes.json), jamais dans le code.
    const s = servi(SIX);
    expect(valeurService(s, { code: '99005', dep: '2A' }, 'gare_regionale')).toEqual({ cas: 'corse' });
    expect(valeurService(s, { code: '99005', dep: '13' }, 'gare_regionale')).toEqual({ cas: 'temps', minutes: 60 });
    expect(phraseTraversee(servi(CAS_SURS), commune(CAS_SURS, 'E'))).toBe(false);
  });

  it('population 0 (cas sûrs, Terrebasse) : « pas de chiffre » pour les 10 services', () => {
    expect(lignes(CAS_SURS, 'D').map((l) => l.endsWith(': pas de chiffre'))).toEqual(SERVICES.map(() => true));
  });

  it('libellés de R54 dans l’ordre ; « 4 min » avec une espace insécable', () => {
    const l = lignesServices(servi(SIX), commune(SIX, 'A'));
    expect(l.map((x) => x.libelle)).toEqual(SERVICES.map((s) => s.libelle));
    expect(l[0].valeur).toBe('4 min');
    const cles: ServiceCle[] = SERVICES.map((s) => s.cle);
    expect(cles).toEqual(['medecin', 'commerce', 'creche', 'ecole', 'college', 'lycee', 'superieur', 'gare', 'gare_regionale', 'gare_grandes_lignes']);
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// Tâche 2 : l'adresse (R55) et le filtre (R53).

/** Ouvre une adresse et rend celle que la page réécrit (R55 : « réécrite à l'ouverture avec les réglages effectifs »). */
const reecrite = (adresse: string) => {
  const search = adresse.slice(1);
  return ecrireAdresse(lireAdresse(search), lirePrix(search));
};

describe('adresse des services (R55)', () => {
  it('AC-11 première adresse : nom inconnu et minutes invalides retirés, seconde entrée du médecin, gare régionale après la gare, lycée à un autre temps que le collège', () => {
    expect(reecrite('/?loyer=1200&services=medecin:10,zzz:10,ecole:7,college:20,medecin:5,gare:10,gare-regionale:20,lycee:10')).toBe(
      '/?loyer=1200&services=medecin:10,college:20,gare:10',
    );
  });

  it('AC-11 deuxième adresse : `services` après `metier`, ordre fixe (médecin avant crèche)', () => {
    expect(reecrite('/?services=creche:10,medecin:10&metier=V1X80:10&loyer=1200')).toBe('/?loyer=1200&metier=V1X80:10&services=medecin:10,creche:10');
  });

  it('AC-11 troisième adresse : première entrée valide gardée, ordre fixe ; « Grandes lignes » est le type de gare', () => {
    const a = '/?loyer=1200&services=medecin:7,medecin:10,gare:5,gare-grandes-lignes:10,lycee:10,ecole:10,ecole:5';
    expect(reecrite(a)).toBe('/?loyer=1200&services=medecin:10,ecole:10,lycee:10,gare-grandes-lignes:10');
    expect(lireAdresse(a.slice(1)).services).toEqual({ medecin: 10, commerce: null, niveaux: ['ecole', 'lycee'], scolarite: 10, gare: 'gare_grandes_lignes', tempsGare: 10 });
  });

  it('AC-17 dernière adresse : 15 min retiré (pas un temps de scolarité), le lycée fixe le temps commun', () => {
    expect(reecrite('/?loyer=1200&services=superieur:15,lycee:10,superieur:10')).toBe('/?loyer=1200&services=lycee:10,superieur:10');
  });

  it('`services` avant `bien` ; une adresse sans `services`, ou dont aucune entrée n’est valide, ne renvoie pas le champ', () => {
    expect(reecrite('/?bien=maison&services=commerce:15&loyer=1200')).toBe('/?loyer=1200&services=commerce:15&bien=maison');
    expect('services' in lireAdresse('?loyer=1200')).toBe(false);
    expect('services' in lireAdresse('?loyer=1200&services=zzz:10,medecin:7,gare:5')).toBe(false);
    expect(reecrite('/?loyer=1200&services=zzz:10')).toBe('/?loyer=1200');
  });

  it('filtres effectifs : une scolarité incomplète ou un type de gare sans temps ne filtrent pas et ne s’écrivent pas', () => {
    const incomplets: ReglageServices = { ...SERVICES_DEPART, niveaux: ['ecole'], gare: 'gare_regionale' };
    expect(filtresServices(incomplets)).toEqual([]);
    expect(ecrireAdresse({ ...REGLAGES_DEPART, services: incomplets })).toBe('/?loyer=1200');
    expect(filtresServices({ ...SERVICES_DEPART, scolarite: 20 })).toEqual([]);
  });
});

/** Communes de la fixture pour l'évaluation : département et population de cadre-de-vie, sauf la variante « cas sûrs ». */
const communes = (items: Item[]): Commune[] =>
  items.map((it) => {
    const c = cadre.get(it.code_insee)!;
    return { code: it.code_insee, nom: it.nom, dep: it.departement ?? c.dep, population: it.population ?? c.population, loyerM2: null, estimationPropre: false, merKm: null };
  });
const NOMS: Record<Id, string> = { A: 'Portmer', B: 'Grandeville', C: 'Montcher', D: 'Terrebasse', E: 'Quaibleu', F: 'Rhinval' };
/** Évalue avec les seuls services réglés (aucun plafond de prix) ; rend les noms qui passent et les raisons, en texte. */
function filtrer(items: Item[], services: Partial<ReglageServices>, proches: ProchePret[] = []) {
  const r = evaluer(communes(items), { loyer: null, mer: null, tailles: [], services: { ...SERVICES_DEPART, ...services } }, proches, undefined, undefined, servi(items));
  const evals = [...r.parCode.values()];
  return {
    passent: evals.filter((e) => e.passe).map((e) => e.commune.nom),
    raisons: (id: Id) => evals.find((e) => e.commune.nom === NOMS[id])!.raisons.map((x) => texte(raisonTexte(x))),
  };
}

describe('filtre des services (R53)', () => {
  it('AC-8 médecin 5 min : Rhinval (pas de chiffre) passe sans raison ; Quaibleu « Médecin 10 min : au-dessus de ton plafond de 5 min »', () => {
    const f = filtrer(SIX, { medecin: 5 });
    expect(f.passent).toEqual(['Portmer', 'Grandeville', 'Montcher', 'Rhinval']);
    expect(f.raisons('F')).toEqual([]);
    expect(f.raisons('E')).toEqual(['Médecin 10 min : au-dessus de ton plafond de 5 min']);
    expect(f.raisons('D')).toEqual(['Médecin 18 min : au-dessus de ton plafond de 5 min']);
  });

  it('médecin à chaque cran : inférieur ou égal passe (Quaibleu, 10 min, passe à 10 min)', () => {
    expect(filtrer(SIX, { medecin: 10 }).passent).toEqual(['Portmer', 'Grandeville', 'Montcher', 'Quaibleu', 'Rhinval']);
    expect(filtrer(SIX, { medecin: 15 }).passent).toEqual(['Portmer', 'Grandeville', 'Montcher', 'Quaibleu', 'Rhinval']);
  });

  it('gare à chaque cran, pour les trois types ; Terrebasse et Quaibleu au-delà d’une heure', () => {
    const gare = (g: TypeGare, t: number) => filtrer(SIX, { gare: g, tempsGare: t }).passent;
    expect(gare('gare', 10)).toEqual(['Portmer', 'Grandeville', 'Montcher']);
    expect(gare('gare', 20)).toEqual(['Portmer', 'Grandeville', 'Montcher', 'Rhinval']);
    expect(gare('gare', 30)).toEqual(['Portmer', 'Grandeville', 'Montcher', 'Quaibleu', 'Rhinval']);
    for (const t of [10, 20, 30]) {
      expect(gare('gare_regionale', t)).toEqual(['Portmer', 'Grandeville', 'Montcher', 'Rhinval']);
      expect(gare('gare_grandes_lignes', t)).toEqual(['Grandeville', 'Montcher', 'Rhinval']);
    }
    const f = filtrer(SIX, { gare: 'gare_regionale', tempsGare: 30 });
    expect(f.raisons('D')).toEqual(["Gare régionale plus d'une heure : au-dessus de ton plafond de 30 min"]);
    expect(f.raisons('E')).toEqual(['Gare régionale 60 min : au-dessus de ton plafond de 30 min']);
    expect(filtrer(SIX, { gare: 'gare_grandes_lignes', tempsGare: 30 }).raisons('A')).toEqual(['Gare grandes lignes 40 min : au-dessus de ton plafond de 30 min']);
  });

  it('cas sûrs : île sans pont sur les trois niveaux de gare, quel que soit son temps ; pas sur le médecin', () => {
    for (const g of ['gare', 'gare_regionale', 'gare_grandes_lignes'] as const) {
      const f = filtrer(CAS_SURS, { gare: g, tempsGare: 30 });
      expect(f.passent).not.toContain('Portmer');
      expect(f.raisons('A')).toEqual([`${libelleService(g)} : aucune sur l'île`]);
      expect(f.raisons('C')).toEqual([`${libelleService(g)} : aucune sur l'île`]); // Montcher, île sans aucun temps
    }
    expect(filtrer(CAS_SURS, { medecin: 5 }).passent).toContain('Portmer');
  });

  it('cas sûrs : Corse sur régionale et grandes lignes seulement ; en « Toutes », règle normale, égalité qui passe (30 min)', () => {
    expect(filtrer(CAS_SURS, { gare: 'gare_regionale', tempsGare: 30 }).raisons('E')).toEqual(['Gare régionale : aucune en Corse']);
    expect(filtrer(CAS_SURS, { gare: 'gare_grandes_lignes', tempsGare: 30 }).raisons('E')).toEqual(['Gare grandes lignes : aucune en Corse']);
    expect(filtrer(CAS_SURS, { gare: 'gare', tempsGare: 30 }).passent).toContain('Quaibleu');
  });

  it('cas sûrs (AC-9) : avec « Régionale » 30 min, passent Grandeville et Rhinval (sans chiffre, hors des cas sûrs)', () => {
    expect(filtrer(CAS_SURS, { gare: 'gare_regionale', tempsGare: 30 }).passent).toEqual(['Grandeville', 'Rhinval']);
    expect(filtrer(CAS_SURS, { gare: 'gare', tempsGare: 30 }).passent).toEqual(['Grandeville', 'Quaibleu', 'Rhinval']);
  });

  it('cas sûrs : population 0 (Terrebasse) ne passe aucun service, « <Service> : pas de chiffre, commune sans habitant »', () => {
    const tous: Partial<ReglageServices> = { medecin: 15, commerce: 15, niveaux: [...NIVEAUX_SCOLARITE], scolarite: 20, gare: 'gare', tempsGare: 30 };
    const f = filtrer(CAS_SURS, tous);
    expect(f.passent).not.toContain('Terrebasse');
    expect(f.raisons('D')).toEqual(SERVICES.slice(0, 8).map((s) => `${s.libelle} : pas de chiffre, commune sans habitant`));
    expect(filtrer(CAS_SURS, { medecin: 15 }).raisons('D')).toEqual(['Médecin : pas de chiffre, commune sans habitant']);
  });

  it('AC-17 scolarité : chaque niveau coché est un service filtré, avec le temps commun', () => {
    const f = filtrer(SIX, { niveaux: ['superieur'], scolarite: 20 });
    expect(f.passent).toEqual(['Portmer', 'Grandeville', 'Montcher', 'Rhinval']);
    expect(f.raisons('E')).toEqual(['Supérieur 25 min : au-dessus de ton plafond de 20 min']);
    expect(f.raisons('D')).toEqual(["Supérieur plus d'une heure : au-dessus de ton plafond de 20 min"]);
    expect(filtrer(SIX, { niveaux: ['ecole', 'superieur'], scolarite: 20 }).passent).toEqual(f.passent);
    expect(filtrer(SIX, { niveaux: ['superieur'], scolarite: null }).passent).toHaveLength(6); // incomplète : ne filtre pas
  });

  it('H160 : les raisons des services viennent après celle d’un proche, dans l’ordre médecin … gare ; espace insécable avant « : »', () => {
    const proche: ProchePret = { nom: 'Nantesville (44)', plafond: 15, temps: Uint16Array.from([30, 30, 30, 30, 30, 30]) };
    const r = evaluer(
      communes(SIX),
      { loyer: null, mer: null, tailles: [], services: { medecin: 5, commerce: 5, niveaux: ['superieur', 'creche'], scolarite: 5, gare: 'gare', tempsGare: 10 } },
      [proche],
      undefined,
      undefined,
      servi(SIX),
    ).parCode.get('99004')!; // Terrebasse
    expect(r.raisons.map((x) => texte(raisonTexte(x)))).toEqual([
      'Nantesville (44) 30 min : au-dessus de ton plafond de 15 min',
      'Médecin 18 min : au-dessus de ton plafond de 5 min',
      'Commerce alimentaire 8 min : au-dessus de ton plafond de 5 min',
      'Crèche 34 min : au-dessus de ton plafond de 5 min',
      "Supérieur plus d'une heure : au-dessus de ton plafond de 5 min",
      'Gare 41 min : au-dessus de ton plafond de 10 min',
    ]);
    // H159 : insécables avant « : » et dans « 18 min », « 5 min » (le texte lu ci-dessus les remet en espaces).
    expect(raisonTexte(r.raisons[1])).toBe('Médecin 18 min : au-dessus de ton plafond de 5 min');
    expect(raisonTexte(r.raisons[4])).toBe("Supérieur plus d'une heure : au-dessus de ton plafond de 5 min");
    expect(r.score).toBeNull();
  });

  it('le filtre ne note pas : sans plafond, aucune note ; sans temps chargés, aucun service ne filtre', () => {
    const r = evaluer(communes(SIX), { loyer: null, mer: null, tailles: [], services: { ...SERVICES_DEPART, medecin: 5 } }, [], undefined, undefined, servi(SIX));
    expect(r.actif).toBe(false);
    expect([...r.parCode.values()].every((e) => e.score == null)).toBe(true);
    const sans = evaluer(communes(SIX), { loyer: null, mer: null, tailles: [], services: { ...SERVICES_DEPART, medecin: 5 } });
    expect([...sans.parCode.values()].every((e) => e.passe)).toBe(true);
  });
});
