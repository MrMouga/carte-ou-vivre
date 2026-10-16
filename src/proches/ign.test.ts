import { afterEach, describe, expect, it, vi } from 'vitest';
import rechercheNantes from '../../docs/plans/2026-10-13-proches/captures/T0-ign-exemples/recherche-12-rue-de-la-paix-nantes.json';
import rechercheToulouse from '../../docs/plans/2026-10-13-proches/captures/T0-ign-exemples/recherche-toulouse.json';
import { DELAI_CALCUL_MS, ECART_MS, suggestionsDe, urlIsochrone, urlRecherche, zones } from './ign';

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
  /** Faux fetch qui note l'heure, la durée, le mode de cache (`cache` de fetch) de chaque demande ; `essai` : 1, puis 2… pour une même durée. */
  function espion(reponse: (d: number, essai: number, signal?: AbortSignal) => Response | Promise<Response>) {
    vi.useFakeTimers({ now: (base += 3_600_000) });
    const appels: { t: number; d: number; cache?: RequestCache }[] = [];
    vi.stubGlobal('fetch', (url: string, init?: RequestInit) => {
      const d = Number(new URL(url).searchParams.get('costValue'));
      const essai = appels.filter((a) => a.d === d).length + 1;
      appels.push({ t: Date.now() - base, d, cache: init?.cache });
      return Promise.resolve(reponse(d, essai, init?.signal ?? undefined));
    });
    return appels;
  }
  const DUREES = [180, 165, 150, 135, 120, 105, 90, 75, 60, 45, 30, 15];

  it('12 zones, de 3 h à 15 min, une toutes les 250 ms (au plus 4 par seconde)', async () => {
    const appels = espion((d) => new Response(`{"zone":${d}}`));
    const p = zones([0, 0]);
    await vi.advanceTimersByTimeAsync(3000);
    const res = await p;
    expect(ECART_MS).toBe(250);
    expect(appels.map((a) => a.d)).toEqual([180, 165, 150, 135, 120, 105, 90, 75, 60, 45, 30, 15]);
    expect(appels.map((a) => a.t)).toEqual(appels.map((_, i) => i * 250));
    expect(res.obtenues.map(([d]) => d)).toEqual(appels.map((a) => a.d));
    expect(res.obtenues[0][1]).toBe('{"zone":180}');
    expect(res.manquantes).toEqual([]);
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

  // Recalé (proches-fiables R33, H92) : un refus ne fait plus échouer le proche ; même départ, même action.
  it('un refus (429) : la zone est redemandée une fois, 5 s plus tard ; les autres zones partent sans attendre', async () => {
    const appels = espion((d, essai) => (d === 150 && essai === 1 ? new Response('<html>429</html>', { status: 429 }) : new Response('{}')));
    const p = zones([0, 0]);
    await vi.advanceTimersByTimeAsync(7000);
    const res = await p;
    expect(appels.map((a) => a.d)).toEqual([...DUREES, 150]);
    expect(appels.slice(0, 12).map((a) => a.t)).toEqual(DUREES.map((_, i) => i * 250)); // la file ne s'arrête pas
    expect(appels[12].t).toBe(500 + 5000); // refusée à 500 ms, redemandée 5 s plus tard
    expect(res.obtenues).toHaveLength(12);
    expect(res.manquantes).toEqual([]);
  });

  // Recalé (proches-fiables R33) : une erreur réseau ne fait plus échouer le proche ; même départ, même action.
  it('une erreur réseau : chaque zone redemandée une fois, par la file ; le calcul ne lève rien, aucune zone obtenue', async () => {
    const appels = espion(() => Promise.reject(new TypeError('Failed to fetch')));
    const p = zones([0, 0]);
    await vi.advanceTimersByTimeAsync(7000);
    const res = await p;
    expect(appels.map((a) => a.d)).toEqual([...DUREES, ...DUREES]);
    expect(appels.map((a) => a.t)).toEqual(appels.map((_, i) => i * 250));
    expect(res.obtenues).toEqual([]);
    expect(res.manquantes).toEqual(DUREES);
  });
});

describe('R33, H92 (proches-fiables) — nouvel essai et fin du calcul', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
  let base = Date.UTC(2026, 9, 16);
  function espion(reponse: (d: number, essai: number, signal?: AbortSignal) => Response | Promise<Response>) {
    vi.useFakeTimers({ now: (base += 3_600_000) });
    const appels: { t: number; d: number; cache?: RequestCache }[] = [];
    vi.stubGlobal('fetch', (url: string, init?: RequestInit) => {
      const d = Number(new URL(url).searchParams.get('costValue'));
      const essai = appels.filter((a) => a.d === d).length + 1;
      appels.push({ t: Date.now() - base, d, cache: init?.cache });
      return reponse(d, essai, init?.signal ?? undefined);
    });
    return appels;
  }
  const DUREES = [180, 165, 150, 135, 120, 105, 90, 75, 60, 45, 30, 15];
  const ok = (d: number) => new Response(`{"zone":${d}}`);
  /** Erreur de l'IGN au format relevé en tâche 0 : JSON, gardée 21 jours par le navigateur. */
  const erreur = (status: number) => new Response('{"message":"An invalid response was received from the upstream server"}', { status, headers: { 'cache-control': 'private, max-age=1814400' } });
  /** Zone sans réponse : la demande reste ouverte jusqu'à son arrêt. */
  const muette = (signal?: AbortSignal) => new Promise<Response>((_, ko) => signal?.addEventListener('abort', () => ko(signal.reason)));
  const apres = (ms: number, r: Response) => new Promise<Response>((ok) => setTimeout(() => ok(r), ms));

  it('AC-1 (zone-135-une-fois) : la zone de 135 min en erreur (502) est redemandée une fois, par la file, sans le cache du navigateur ; 12 zones obtenues', async () => {
    const appels = espion((d, essai) => (d === 135 && essai === 1 ? erreur(502) : ok(d)));
    const p = zones([0, 0]);
    await vi.advanceTimersByTimeAsync(4000);
    const res = await p;
    expect(appels.map((a) => a.d)).toEqual([...DUREES, 135]);
    // Le second essai passe par la file commune : 250 ms après la dernière zone partie (15 min, à 2 750 ms).
    expect(appels[12].t).toBe(3000);
    // Les erreurs de l'IGN sont gardées 21 jours par le navigateur (tâche 0) : le second essai ne lit pas le cache.
    expect(appels.filter((a) => a.d === 135).map((a) => a.cache)).toEqual([undefined, 'reload']);
    expect(appels.slice(0, 12).every((a) => a.cache === undefined)).toBe(true);
    expect(res.obtenues.map(([d]) => d)).toEqual(DUREES);
    expect(res.manquantes).toEqual([]);
  });

  it('zone en erreur aux deux essais (504) : elle manque, sans troisième essai ; le calcul ne lève rien', async () => {
    const appels = espion((d) => (d === 135 ? erreur(504) : ok(d)));
    const p = zones([0, 0]);
    await vi.advanceTimersByTimeAsync(4000);
    const res = await p;
    expect(appels.map((a) => a.d)).toEqual([...DUREES, 135]);
    expect(res.obtenues).toHaveLength(11);
    expect(res.manquantes).toEqual([135]);
  });

  it('zone muette : jamais redemandée ; le calcul finit 45 s après son début avec les 11 autres', async () => {
    const appels = espion((d, _, signal) => (d === 135 ? muette(signal) : ok(d)));
    let fini = false;
    const p = zones([0, 0]).then((r) => ((fini = true), r));
    expect(DELAI_CALCUL_MS).toBe(45_000);
    await vi.advanceTimersByTimeAsync(44_999); // on est à 44,999 s
    expect(fini).toBe(false);
    await vi.advanceTimersByTimeAsync(1); // 45 s
    expect(fini).toBe(true);
    const res = await p;
    expect(appels.map((a) => a.d)).toEqual(DUREES);
    expect(res.obtenues).toHaveLength(11);
    expect(res.manquantes).toEqual([135]);
  });

  it('à 45 s, un second essai pas encore revenu manque aussi, et un second essai pas encore parti ne part pas', async () => {
    // 180 refusée (429) puis muette ; 165 refusée à 40 s → son second essai attendrait jusqu'à 45 s passées.
    const appels = espion((d, essai, signal) =>
      d === 180 ? (essai === 1 ? erreur(429) : muette(signal)) : d === 165 && essai === 1 ? apres(40_000, erreur(429)) : ok(d),
    );
    const p = zones([0, 0]);
    await vi.advanceTimersByTimeAsync(46_000);
    const res = await p;
    expect(appels.map((a) => a.d)).toEqual([...DUREES, 180]);
    expect(res.manquantes).toEqual([180, 165]);
  });

  it('refus 429 puis second essai : pas avant 5 s, et 250 ms au moins après le départ réel de la demande précédente', async () => {
    // 180 refusée à 0 ms : second essai pas avant 5 000 ms. 15 part à 2 750 ms, échoue (502) à 4 950 ms et repart aussitôt :
    // le second essai de 180 attend alors 5 200 ms.
    const appels = espion((d, essai) => (d === 180 && essai === 1 ? erreur(429) : d === 15 && essai === 1 ? apres(2200, erreur(502)) : ok(d)));
    const p = zones([0, 0]);
    await vi.advanceTimersByTimeAsync(7000);
    const res = await p;
    expect(appels.slice(12)).toEqual([
      { t: 4950, d: 15, cache: 'reload' },
      { t: 5200, d: 180, cache: 'reload' },
    ]);
    const ecarts = appels.slice(1).map((a, i) => a.t - appels[i].t);
    expect(Math.min(...ecarts)).toBeGreaterThanOrEqual(250);
    expect(res.manquantes).toEqual([]);
  });

  it('arrêt (« Retirer ») : le calcul lève une erreur, et les zones pas encore parties ne partent pas', async () => {
    const appels = espion((_d, _e, signal) => muette(signal));
    const arret = new AbortController();
    const p = zones([0, 0], arret.signal);
    const echec = expect(p).rejects.toBe('retiré');
    await vi.advanceTimersByTimeAsync(600);
    arret.abort('retiré');
    await vi.advanceTimersByTimeAsync(10_000);
    await echec;
    expect(appels.map((a) => a.d)).toEqual([180, 165, 150]);
  });
});
