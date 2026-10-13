import { afterEach, describe, expect, it, vi } from 'vitest';
import rechercheNantes from '../../docs/plans/2026-10-13-proches/captures/T0-ign-exemples/recherche-12-rue-de-la-paix-nantes.json';
import rechercheToulouse from '../../docs/plans/2026-10-13-proches/captures/T0-ign-exemples/recherche-toulouse.json';
import { ECART_MS, suggestionsDe, urlIsochrone, urlRecherche, zones } from './ign';

// Module IGN (décisions de la tâche 0) : recherche qui rend le code INSEE, isochrones bdtopo-valhalla, file à 4 par seconde.

const feature = (citycode: string, city: string, type = 'housenumber', label = `1 rue X ${city}`) => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [2, 48] },
  properties: { label, citycode, city, type },
});

describe('R9, H20 — suggestions de la recherche', () => {
  it('vraie réponse « 12 rue de la Paix, Nantes » : libellé, commune, département et code INSEE de la première', () => {
    const s = suggestionsDe(rechercheNantes);
    expect(s[0]).toEqual({ libelle: '12 Rue de la Paix 44000 Nantes', commune: 'Nantes', dep: '44', code: '44109', point: [-1.554555, 47.215051], estCommune: false });
    expect(s.length).toBeLessThanOrEqual(5);
  });

  it('vraie réponse « Toulouse » : la commune seule est reconnue comme commune', () => {
    expect(suggestionsDe(rechercheToulouse)[0]).toMatchObject({ libelle: 'Toulouse', code: '31555', dep: '31', estCommune: true });
  });

  it('arrondissements de Paris, Lyon et Marseille ramenés à la ville ; Corse 2A/2B ; outre-mer écarté ; 5 au plus', () => {
    const s = suggestionsDe({
      features: [
        feature('97120', 'Pointe-à-Pitre'),
        feature('75104', 'Paris'),
        feature('69382', 'Lyon'),
        feature('13207', 'Marseille'),
        feature('2A004', 'Ajaccio'),
        feature('97411', 'Saint-Denis'),
        feature('2B033', 'Bastia'),
        feature('44109', 'Nantes'),
      ],
    });
    expect(s.map((x) => [x.code, x.dep, x.commune])).toEqual([
      ['75056', '75', 'Paris'],
      ['69123', '69', 'Lyon'],
      ['13055', '13', 'Marseille'],
      ['2A004', '2A', 'Ajaccio'],
      ['2B033', '2B', 'Bastia'],
    ]);
  });

  it('adresse de la recherche : index adresse, autocomplétion, 10 résultats demandés', () => {
    expect(urlRecherche('12 rue de la Paix, Nantes')).toBe(
      'https://data.geopf.fr/geocodage/search?q=12+rue+de+la+Paix%2C+Nantes&index=address&autocomplete=1&limit=10',
    );
  });
});

describe('Isochrones — paramètres et file', () => {
  it('paramètres retenus en tâche 0, coordonnées sans arrondi (H28)', () => {
    expect(urlIsochrone([-1.554555, 47.215051], 180)).toBe(
      'https://data.geopf.fr/navigation/isochrone?resource=bdtopo-valhalla&point=-1.554555%2C47.215051&costType=time&costValue=180&timeUnit=minute&profile=car&direction=departure&geometryFormat=geojson&crs=EPSG%3A4326',
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
  let base = Date.UTC(2026, 9, 13);
  /** Faux fetch qui note l'heure et la durée de chaque demande. */
  function espion(reponse: (d: number) => Response | Promise<Response>) {
    vi.useFakeTimers({ now: (base += 3_600_000) });
    const appels: { t: number; d: number }[] = [];
    vi.stubGlobal('fetch', (url: string) => {
      const d = Number(new URL(url).searchParams.get('costValue'));
      appels.push({ t: Date.now() - base, d });
      return Promise.resolve(reponse(d));
    });
    return appels;
  }

  it('12 zones, de 3 h à 15 min, une toutes les 250 ms (au plus 4 par seconde)', async () => {
    const appels = espion((d) => new Response(`{"zone":${d}}`));
    const p = zones([0, 0]);
    await vi.advanceTimersByTimeAsync(3000);
    const res = await p;
    expect(ECART_MS).toBe(250);
    expect(appels.map((a) => a.d)).toEqual([180, 165, 150, 135, 120, 105, 90, 75, 60, 45, 30, 15]);
    expect(appels.map((a) => a.t)).toEqual(appels.map((_, i) => i * 250));
    expect(res.map(([d]) => d)).toEqual(appels.map((a) => a.d));
    expect(res[0][1]).toBe('{"zone":180}');
  });

  it('deux proches de suite : la file reste à 250 ms d’écart', async () => {
    const appels = espion(() => new Response('{}'));
    const p = Promise.all([zones([0, 0]), zones([1, 1])]);
    await vi.advanceTimersByTimeAsync(7000);
    await p;
    expect(appels).toHaveLength(24);
    expect(appels.map((a) => a.t)).toEqual(appels.map((_, i) => i * 250));
  });

  it('page occupée 600 ms : les zones en retard ne partent pas en paquet, 250 ms au moins entre deux', async () => {
    const appels = espion(() => new Response('{}'));
    const p = zones([0, 0]);
    await vi.advanceTimersByTimeAsync(0);
    vi.advanceTimersByTime(600); // fil de la page pris 600 ms : les minuteries échues se déclenchent, la suite attend
    await vi.advanceTimersByTimeAsync(4000);
    await p;
    const ecarts = appels.slice(1).map((a, i) => a.t - appels[i].t);
    expect(appels).toHaveLength(12);
    expect(Math.min(...ecarts)).toBeGreaterThanOrEqual(250);
  });

  it('un refus (429) fait échouer le proche, et les zones qui restent ne sont pas demandées', async () => {
    const appels = espion((d) => new Response(d === 150 ? '<html>429</html>' : '{}', { status: d === 150 ? 429 : 200 }));
    const p = zones([0, 0]);
    const echec = expect(p).rejects.toThrow('429');
    await vi.advanceTimersByTimeAsync(3000);
    await echec;
    expect(appels.map((a) => a.d)).toEqual([180, 165, 150]);
  });

  it('une erreur réseau fait échouer le proche', async () => {
    espion(() => Promise.reject(new TypeError('Failed to fetch')));
    const p = zones([0, 0]);
    const echec = expect(p).rejects.toThrow('Failed to fetch');
    await vi.advanceTimersByTimeAsync(3000);
    await echec;
  });
});
