import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PROCHE, type ProchePret } from '../domain/score';
import { kmDePlafond, distances } from './distance';
import { etatDe } from './etat';
import { calculerTemps, type Suggestion } from './ign';
import { effacerProche, effacerTout, ecrireProche, empreinteDe, lireProches, stockageNavigateur, type ProcheGarde } from './memoire';
import { departDe, pointsDes } from './temps';

// Les proches de la page (spec proches R9–R13, D3–D7) : ajout, calcul de leurs temps, plafond, retrait, mémoire.
// - File : un proche calcule à la fois, les suivants sont « en attente » ; la file des zones IGN est commune à la page.
// - Calcul tolérant (proches-fiables R33) : une zone ratée est redemandée une fois ; 45 s au plus après le début de SON
//   calcul (H21), le proche prend ce qu'il a — prêt, partiel ou km selon ses zones et son plafond (`etat.ts`).
//   Un proche partiel ou km compte comme un prêt (D5) ; un proche km vaut ses distances à vol d'oiseau (R35), son plafond
//   passe des minutes aux km (H94). « Réessayer » remet un proche indisponible (empreinte périmée, relu de la mémoire,
//   classement en échec) dans la file. « Retirer » arrête son calcul ; « Effacer mes proches » arrête tout.
// - Mémoire du navigateur (R12) : chaque changement d'un proche réécrit son entrée ; à l'ouverture, les proches gardés
//   reviennent sans calcul ; un proche dont l'empreinte des codes INSEE ne correspond plus à la carte revient indisponible.
//   Un enregistrement refusé → `memoireRefusee` (les proches marchent jusqu'à la fermeture de la page).
// Le nom ne part jamais vers l'IGN (H30) : seul le point de départ est envoyé.

export type { EtatProche } from './memoire';
/**
 * `zones` : durées des zones obtenues au dernier calcul, croissantes (12 pour un proche prêt) ; d'elles se déduisent la
 * couverture, l'état et les communes en « jusqu'à » (`etat.ts`). Absent pour un proche relu de la mémoire (format inchangé
 * jusqu'à la tâche 4 de proches-fiables). `distances` : proche km seulement (R35), en km non arrondis, une par commune dans
 * l'ordre de communes.json, pour les codes INSEE de `empreinte` ; son `plafond` est alors en km (15 à 180).
 */
export type Proche = ProcheGarde & { zones?: number[]; distances?: Float64Array };

export const NOM_MAX = 30;
export const MAX_PROCHES = 5;
const RETIRE = 'retiré';
/** Un proche indisponible n'a pas de temps (R12, R13). */
const INDISPONIBLE = { etat: 'indisponible', temps: null, empreinte: null } as const;

/** Nom proposé pour une suggestion : sa commune et son département, « Nantes (44) » (R9). */
export const nomPropose = (s: Suggestion) => `${s.commune} (${s.dep})`;

type Tache = { id: number; depart: [number, number] };

/**
 * R33 : le proche à la fin de son calcul, selon ses zones et son plafond du moment. En km (R35) : ses distances à vol
 * d'oiseau depuis son départ (`points` : mairies), sans temps, et son plafond converti en km (H94 : 2 h → 120 km).
 */
function apresCalcul(p: Proche, temps: Uint16Array, zones: number[], empreinte: string | null, points: Float64Array): Proche {
  const etat = etatDe(zones, p.plafond);
  if (etat !== 'km') return { ...p, etat, temps, empreinte, zones };
  const depart = p.depart ?? p.lieu.point;
  return { ...p, etat, temps: null, empreinte, zones, distances: distances(depart, points), plafond: kmDePlafond(p.plafond) };
}

/** D5 de proches-fiables : un proche prêt, partiel ou km compte (score, état « sans plafond », commune sans prix). */
const compteAuScore = (p: Proche) => p.etat === 'pret' || p.etat === 'partiel' || p.etat === 'km';

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
  const file = useRef<Tache[]>([]);
  const courant = useRef<{ id: number; arret: AbortController } | null>(null);

  const changer = (id: number, p: Partial<Proche>) => setProches((ps) => ps.map((x) => (x.id === id ? { ...x, ...p } : x)));

  /** Lance le calcul du premier proche en attente, si aucun ne calcule et que les mairies sont chargées. */
  const suivant = useCallback(() => {
    const { points, empreinte } = page.current;
    if (courant.current || !points) return;
    const tache = file.current.shift();
    if (!tache) return;
    const arret = new AbortController();
    courant.current = { id: tache.id, arret };
    changer(tache.id, { etat: 'calcul' });
    const arrete = new Promise<never>((_, ko) => arret.signal.addEventListener('abort', () => ko(arret.signal.reason), { once: true }));
    Promise.race([calculerTemps(tache.depart, points, arret.signal), arrete])
      .then(
        ({ temps, zones }) => setProches((ps) => ps.map((x) => (x.id === tache.id ? apresCalcul(x, temps, zones, empreinte, points) : x))),
        () => arret.signal.reason !== RETIRE && changer(tache.id, INDISPONIBLE), // classement en échec
      )
      .finally(() => {
        courant.current = null;
        suivant();
      });
  }, []);

  // Un « Réessayer » pendant le chargement attend les mairies.
  useEffect(() => suivant(), [points, suivant]);

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
      file.current.push({ id, depart });
      suivant();
    },
    [reperes, mairie, suivant],
  );

  /** Indisponible → en attente, puis calcul quand son tour vient (ses 45 s repartent de zéro). */
  const reessayer = useCallback(
    (p: Proche) => {
      if (p.etat !== 'indisponible' || file.current.some((t) => t.id === p.id)) return;
      const depart = p.depart ?? departDe(p.lieu, mairie);
      changer(p.id, { etat: 'attente', depart });
      file.current.push({ id: p.id, depart });
      suivant();
    },
    [mairie, suivant],
  );

  const regler = useCallback((id: number, plafond: number) => changer(id, { plafond }), []);

  /** Retire un proche dans tous ses états ; s'il calcule, son calcul s'arrête (ses zones pas encore parties ne partent pas). */
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

  // R12 : un proche gardé dont les temps ne correspondent plus aux codes INSEE de la carte revient indisponible.
  useEffect(() => {
    if (!empreinte) return;
    const perime = (p: Proche) => compteAuScore(p) && p.empreinte !== empreinte;
    setProches((ps) => (ps.some(perime) ? ps.map((p) => (perime(p) ? { ...p, ...INDISPONIBLE } : p)) : ps));
  }, [empreinte]);

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
        .filter((p) => compteAuScore(p) && (p.temps || p.distances) && p.empreinte === empreinte)
        .map((p) =>
          p.etat === 'km' && p.distances
            ? { nom: p.nom, plafond: p.plafond, distances: p.distances }
            : { nom: p.nom, plafond: p.plafond, temps: p.temps!, zones: p.zones },
        ),
    [proches, empreinte],
  );

  return { proches, prets, memoireRefusee, ajouter, reessayer, regler, retirer, effacer };
}
