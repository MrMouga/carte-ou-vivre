import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PROCHE, type ProchePret } from '../domain/score';
import { kmDePlafond, distances } from './distance';
import { approximatif, aRecalculer, commeUnPret, etatDe, recalcule, type EtatCalcul } from './etat';
import { placer, type Tache } from './file';
import { calculerTemps, type Suggestion } from './ign';
import { effacerProche, effacerTout, ecrireProche, empreinteDe, lireProches, stockageNavigateur, type ProcheGarde } from './memoire';
import { departDe, pointsDes } from './temps';

// Les proches de la page (spec proches R9–R13, D3–D7) : ajout, calcul de leurs temps, plafond, retrait, mémoire.
// - File : un proche calcule à la fois, les suivants sont « en attente » ; la file des zones IGN est commune à la page.
// - Calcul tolérant (proches-fiables R33) : une zone ratée est redemandée une fois ; 45 s au plus après le début de SON
//   calcul (H21), le proche prend ce qu'il a — prêt, partiel ou km selon ses zones et son plafond (`etat.ts`).
//   Un proche partiel ou km compte comme un prêt (D5) ; un proche km vaut ses distances à vol d'oiseau (R35), son plafond
//   passe des minutes aux km (H94). Un classement en échec finit comme un calcul sans zone : km (R33). Chaque fin de calcul
//   note l'heure de son début (`essai`, R36, H93). « Retirer » arrête son calcul ; « Effacer mes proches » arrête tout.
// - Mémoire du navigateur (R12, R36) : chaque changement d'un proche réécrit son entrée ; à l'ouverture, un proche gardé
//   prêt, partiel ou km revient dans son état sans calcul (km : ses distances recalculées des mairies) ; un proche gardé
//   non fini (en attente, en calcul, non prêt par la version d'avant) ou en heures dont l'empreinte des codes INSEE ne
//   correspond plus à la carte est calculé à l'ouverture comme un nouveau proche, dans l'ordre d'ajout (R37).
// - Recalcul (R36) : à l'ouverture, un proche partiel ou km dont le dernier essai a commencé il y a 15 min au
//   moins (H93) passe en recalcul, dans l'ordre d'ajout et dans la même file (H98). Pendant ce temps (aussi en attendant
//   son tour), il garde son état, compte et se règle ; `recalcul` le dit à la ligne. Le résultat le remplace s'il est plus
//   complet (H97), au plafond affiché à son arrivée (km ÷ 60, `etat.ts`) ; sinon seule l'heure du dernier essai change.
//   L'heure du dernier essai est notée dès le début de chaque recalcul : une page fermée pendant un recalcul ne fait pas
//   redemander l'IGN avant 15 min. « Recalculer avec l'IGN » (`recalculer`) met le proche en recalcul à tout moment.
//   Un enregistrement refusé → `memoireRefusee` (les proches marchent jusqu'à la fermeture de la page).
// - Priorité (R36, `file.ts`) : un ajout ou un « Recalculer avec l'IGN » passe devant les recalculs automatiques
//   pas encore commencés ; le calcul en cours continue. « Retirer » pendant un recalcul l'arrête, ou l'empêche de partir.
// Le nom ne part jamais vers l'IGN (H30) : seul le point de départ est envoyé.

/**
 * `zones` (de `ProcheGarde`) : durées des zones obtenues au dernier calcul, croissantes ; d'elles se déduisent la
 * couverture, l'état et les communes en « jusqu'à » (`etat.ts`). `distances` : proche km seulement (R35), en km non
 * arrondis, une par commune dans l'ordre de communes.json, pour les codes INSEE de `empreinte` ; son `plafond` est alors en
 * km (15 à 180). Non gardées : recalculées des mairies à l'ouverture.
 */
export type Proche = ProcheGarde & {
  distances?: Float64Array;
  /** R36 : en recalcul (en cours ou en attente de son tour) ; l'état affiché reste celui d'avant. Non gardé. */
  recalcul?: boolean;
};

export const NOM_MAX = 30;
export const MAX_PROCHES = 5;
const RETIRE = 'retiré';

/** Nom proposé pour une suggestion : sa commune et son département, « Nantes (44) » (R9). */
export const nomPropose = (s: Suggestion) => `${s.commune} (${s.dep})`;

/**
 * R33 : le proche à la fin de son calcul, selon ses zones et son plafond du moment. En km (R35) : ses distances à vol
 * d'oiseau depuis son départ (`points` : mairies), sans temps, et son plafond converti en km (H94 : 2 h → 120 km).
 */
function apresCalcul(p: Proche, temps: Uint16Array, zones: number[], empreinte: string | null, points: Float64Array, essai: number): Proche {
  const etat = etatDe(zones, p.plafond);
  if (etat !== 'km') return { ...p, etat, temps, empreinte, zones, essai, distances: undefined };
  return { ...p, etat, temps: null, empreinte, zones, essai, distances: distances(departKm(p), points), plafond: kmDePlafond(p.plafond) };
}

/**
 * R36 : le proche approximatif `p` à l'arrivée de son recalcul. Plus complet (H97) → ses nouveaux temps, son état et son
 * plafond en minutes ; sinon l'état d'avant reste. Dans les deux cas, l'heure du dernier essai est celle de ce recalcul.
 */
function apresRecalcul(p: Proche, temps: Uint16Array, zones: number[], empreinte: string | null, essai: number): Proche {
  const r = recalcule({ etat: p.etat as EtatCalcul, zones: p.zones ?? [], plafond: p.plafond }, zones);
  if (!r) return { ...p, recalcul: false, essai };
  return { ...p, ...r, temps, empreinte, zones, essai, distances: undefined, recalcul: false };
}

/** Point de départ des distances à vol d'oiseau (H101). */
const departKm = (p: Proche) => p.depart ?? p.lieu.point;

/** `reperes` : mairies dans l'ordre de communes.json (D18 de loyer-mer) ; `codes` : codes INSEE dans le même ordre. */
export function useProches(reperes: number[][] | null, codes: string[] | null) {
  const stockage = useMemo(stockageNavigateur, []);
  const [gardes] = useState(() => lireProches(stockage));
  const [proches, setProches] = useState<Proche[]>(gardes);
  const [memoireRefusee, setMemoireRefusee] = useState(false);
  const points = useMemo(() => (reperes ? pointsDes(reperes) : null), [reperes]);
  const index = useMemo(() => new Map(codes?.map((c, i) => [c, i])), [codes]);
  const empreinte = useMemo(() => (codes ? empreinteDe(codes) : null), [codes]);
  const prochain = useRef(Math.max(0, ...gardes.map((p) => p.id)) + 1);
  // Lu par la file, qui vit hors du rendu.
  const page = useRef({ points, empreinte });
  page.current = { points, empreinte };
  const file = useRef<readonly Tache[]>([]);
  const actuels = useRef(proches);
  actuels.current = proches;
  const courant = useRef<{ id: number; arret: AbortController } | null>(null);

  const modifier = (id: number, f: (x: Proche) => Proche) => setProches((ps) => ps.map((x) => (x.id === id ? f(x) : x)));
  const changer = (id: number, p: Partial<Proche>) => modifier(id, (x) => ({ ...x, ...p }));
  /** Met `tache` à sa place dans la file (R36 : priorité ; un seul calcul par proche). */
  const enFiler = (tache: Tache) => (file.current = placer(file.current, tache, courant.current?.id ?? null));

  /** Lance le calcul du premier proche en attente, si aucun ne calcule et que les mairies sont chargées. */
  const suivant = useCallback(() => {
    const { points, empreinte } = page.current;
    if (courant.current || !points) return;
    const [tache, ...reste] = file.current;
    if (!tache) return;
    file.current = reste;
    const arret = new AbortController();
    courant.current = { id: tache.id, arret };
    const essai = Date.now(); // H93 : début de l'essai
    // Un recalcul garde l'état affiché (R36) ; son heure est notée tout de suite (gardée même si la page se ferme avant la fin).
    changer(tache.id, tache.recalcul ? { essai } : { etat: 'calcul' });
    const fin = (temps: Uint16Array, zones: number[]) => (x: Proche) =>
      tache.recalcul ? apresRecalcul(x, temps, zones, empreinte, essai) : apresCalcul(x, temps, zones, empreinte, points, essai);
    const arrete = new Promise<never>((_, ko) => arret.signal.addEventListener('abort', () => ko(arret.signal.reason), { once: true }));
    Promise.race([calculerTemps(tache.depart, points, arret.signal), arrete])
      .then(
        ({ temps, zones }) => modifier(tache.id, fin(temps, zones)),
        // Classement en échec : comme un calcul sans zone, le proche passe à vol d'oiseau (R33, R35), ou reste tel quel (R36).
        () => arret.signal.reason !== RETIRE && modifier(tache.id, fin(new Uint16Array(points.length / 2), [])),
      )
      .finally(() => {
        courant.current = null;
        suivant();
      });
  }, []);

  /** Mairie d'une commune de la carte, par son code INSEE (D6) ; aucune tant que les mairies ne sont pas chargées. */
  const mairie = useCallback(
    (code: string): [number, number] | undefined => {
      const i = index.get(code);
      return i == null || !reperes ? undefined : [reperes[i][0], reperes[i][1]];
    },
    [reperes, index],
  );

  const ajouter = useCallback(
    (lieu: Suggestion, nom: string) => {
      if (!reperes) return;
      const id = prochain.current++;
      const depart = departDe(lieu, mairie);
      const proche: Proche = { id, nom: nom.trim().slice(0, NOM_MAX) || nomPropose(lieu), lieu, depart, plafond: PROCHE.ajout, etat: 'attente', temps: null, empreinte: null };
      setProches((ps) => [...ps, proche]);
      enFiler({ id, depart });
      suivant();
    },
    [reperes, mairie, suivant],
  );

  const regler = useCallback((id: number, plafond: number) => changer(id, { plafond }), []);

  const enFile = (id: number) => courant.current?.id === id || file.current.some((t) => t.id === id);

  /**
   * « Recalculer avec l'IGN » (R36) : le proche approximatif passe en recalcul, devant les recalculs automatiques pas
   * encore commencés ; déjà en file ou en calcul : rien.
   */
  const recalculer = useCallback(
    (id: number) => {
      const p = actuels.current.find((x) => x.id === id);
      if (!p || enFile(id) || !approximatif(p.etat)) return;
      enFiler({ id, depart: p.depart ?? departDe(p.lieu, mairie), recalcul: true });
      changer(id, { recalcul: true });
      suivant();
    },
    [mairie, suivant],
  );

  /**
   * Retire un proche dans tous ses états, en recalcul compris ; s'il calcule, son calcul s'arrête (ses zones pas encore
   * parties ne partent pas) ; s'il attend son tour, il ne part pas.
   */
  const retirer = useCallback((id: number) => {
    file.current = file.current.filter((t) => t.id !== id);
    if (courant.current?.id === id) courant.current.arret.abort(RETIRE);
    setProches((ps) => ps.filter((x) => x.id !== id));
  }, []);

  /** « Effacer mes proches » : sans confirmation, arrête les calculs et retire tous les proches, de la mémoire aussi (D7). */
  const effacer = useCallback(() => {
    file.current = [];
    courant.current?.arret.abort(RETIRE);
    setProches([]);
    try {
      effacerTout(stockage);
    } catch {
      // stockage refusé : rien n'y est gardé
    }
  }, [stockage]);

  // À l'ouverture, une fois la carte chargée (R12, R36, R37) : un proche km retrouve ses distances ; un proche gardé en
  // attente (non fini, `memoire.ts`) ou en heures aux temps d'une autre carte est calculé comme un nouveau proche (son nom
  // et son plafond restent) ; un proche partiel ou km dont le dernier essai date de 15 min au moins passe en recalcul.
  // Tous dans une même file, dans l'ordre d'ajout. Idempotent : un proche déjà dans la file ou en calcul n'y revient pas.
  useEffect(() => {
    if (!points || !empreinte) return;
    const maintenant = Date.now();
    const aCalculer = (p: Proche) => p.etat === 'attente' || ((p.etat === 'pret' || p.etat === 'partiel') && p.empreinte !== empreinte);
    const calculs = new Set<number>();
    const recalculs = new Set<number>();
    for (const p of actuels.current) {
      if (enFile(p.id)) continue;
      const depart = p.depart ?? departDe(p.lieu, mairie);
      if (aCalculer(p)) calculs.add(p.id);
      else if (aRecalculer(p, maintenant)) recalculs.add(p.id);
      else continue;
      enFiler(recalculs.has(p.id) ? { id: p.id, depart, recalcul: true, auto: true } : { id: p.id, depart });
    }
    setProches((ps) =>
      ps.map((p) => {
        if (calculs.has(p.id)) return { ...p, etat: 'attente', depart: p.depart ?? departDe(p.lieu, mairie), temps: null, empreinte: null, zones: undefined, distances: undefined };
        const q = recalculs.has(p.id) ? { ...p, recalcul: true } : p;
        if (q.etat === 'km' && (!q.distances || q.empreinte !== empreinte)) return { ...q, distances: distances(departKm(q), points), empreinte };
        return q;
      }),
    );
    suivant();
  }, [points, empreinte, mairie, suivant]);

  // R12 : chaque proche changé est réécrit, chaque proche retiré est effacé. Un refus (navigateur, mémoire pleine) → message.
  const ecrits = useRef(new Map(gardes.map((p) => [p.id, p])));
  useEffect(() => {
    let refus = false;
    const presents = new Set(proches.map((p) => p.id));
    for (const p of proches) {
      if (ecrits.current.get(p.id) === p) continue;
      try {
        ecrireProche(stockage, p);
        ecrits.current.set(p.id, p);
      } catch {
        refus = true;
      }
    }
    for (const id of [...ecrits.current.keys()])
      if (!presents.has(id)) {
        try {
          effacerProche(stockage, id);
        } catch {
          // stockage refusé
        }
        ecrits.current.delete(id);
      }
    if (refus) setMemoireRefusee(true);
  }, [proches, stockage]);

  /**
   * Proches qui comptent, pour le score (R11) : prêts, partiels ou km (D5 de proches-fiables), km avec ses distances (R35).
   * Un proche dans un autre état, ou aux valeurs d'une autre carte, ne compte pas.
   */
  const prets = useMemo<ProchePret[]>(
    () =>
      proches
        .filter((p) => commeUnPret(p.etat) && (p.temps || p.distances) && p.empreinte === empreinte)
        .map((p) =>
          p.etat === 'km' && p.distances
            ? { nom: p.nom, plafond: p.plafond, distances: p.distances }
            : { nom: p.nom, plafond: p.plafond, temps: p.temps!, zones: p.zones },
        ),
    [proches, empreinte],
  );

  return { proches, prets, memoireRefusee, ajouter, regler, recalculer, retirer, effacer };
}
