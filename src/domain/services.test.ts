import { describe, expect, it } from 'vitest';
import cadreDeVie from '../../docs/specs/2026-10-14-cadre-de-vie/acceptance.json';
import services from '../../docs/specs/2026-11-23-services/acceptance.json';
import {
  ecrireServices,
  LIMITES_SERVICES,
  lignesServices,
  lireServices,
  phraseTraversee,
  SERVICES,
  TRAVERSEE,
  valeurService,
  type ServiceCle,
  type Services,
  type TempsServices,
} from './services';

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
