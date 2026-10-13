import { useCallback, useMemo, useRef, useState } from 'react';
import { PROCHE, type ProchePret } from '../domain/score';
import { calculerTemps, type Suggestion } from './ign';
import { departDe, pointsDes } from './temps';

// Les proches de la page (spec proches R9–R11, D3–D6) : ajout, calcul de leurs temps, plafond, retrait.
// Les calculs passent un par un (le suivant attend, « En attente… ») ; la file des zones IGN est déjà commune à la page.
// Pas encore de mémoire du navigateur (R12, tâche 3) : un rechargement efface les proches. Le nom ne part jamais vers
// l'IGN (H30) : seul le point de départ est envoyé.

export type EtatProche = 'attente' | 'calcul' | 'pret' | 'indisponible';

export type Proche = {
  id: number;
  /** Nom libre (30 caractères au plus), ou « commune (département) » (R9, D4). */
  nom: string;
  /** Suggestion choisie : son libellé est l'adresse affichée sous le nom. */
  lieu: Suggestion;
  /** Plafond en minutes, de 15 min à 3 h ; 2 h à l'ajout (H19). */
  plafond: number;
  etat: EtatProche;
  /** Fins de tranche par commune, dans l'ordre de communes.json (0 = plus de 3 h) ; null tant que le proche n'est pas prêt. */
  temps: Uint16Array | null;
};

export const NOM_MAX = 30;

/** Nom proposé pour une suggestion : sa commune et son département, « Nantes (44) » (R9). */
export const nomPropose = (s: Suggestion) => `${s.commune} (${s.dep})`;

/** `reperes` : mairies dans l'ordre de communes.json (D18 de loyer-mer) ; `codes` : codes INSEE dans le même ordre. */
export function useProches(reperes: number[][] | null, codes: string[] | null) {
  const [proches, setProches] = useState<Proche[]>([]);
  const points = useMemo(() => (reperes ? pointsDes(reperes) : null), [reperes]);
  const index = useMemo(() => new Map(codes?.map((c, i) => [c, i])), [codes]);
  const prochain = useRef(1);
  const file = useRef<Promise<void>>(Promise.resolve());
  const occupe = useRef(0);

  const changer = (id: number, p: Partial<Proche>) => setProches((ps) => ps.map((x) => (x.id === id ? { ...x, ...p } : x)));

  const ajouter = useCallback(
    (lieu: Suggestion, nom: string) => {
      if (!points || !reperes) return;
      const id = prochain.current++;
      const depart = departDe(lieu, (code) => {
        const i = index.get(code);
        return i == null ? undefined : [reperes[i][0], reperes[i][1]];
      });
      const proche: Proche = { id, nom: nom.trim().slice(0, NOM_MAX) || nomPropose(lieu), lieu, plafond: PROCHE.ajout, etat: occupe.current ? 'attente' : 'calcul', temps: null };
      setProches((ps) => [...ps, proche]);
      occupe.current++;
      file.current = file.current.then(async () => {
        changer(id, { etat: 'calcul' });
        try {
          changer(id, { etat: 'pret', temps: await calculerTemps(depart, points) });
        } catch {
          changer(id, { etat: 'indisponible' }); // R13 ; « Réessayer » et le délai de 45 s : tâche 3
        } finally {
          occupe.current--;
        }
      });
    },
    [points, reperes, index],
  );

  const regler = useCallback((id: number, plafond: number) => changer(id, { plafond }), []);
  /** Retire un proche qui ne calcule pas (prêt ou indisponible) ; l'arrêt d'un calcul en cours vient en tâche 3. */
  const retirer = useCallback((id: number) => setProches((ps) => ps.filter((x) => x.id !== id || x.etat === 'calcul' || x.etat === 'attente')), []);

  /** Proches prêts, pour le score (R11) : un proche dans un autre état ne compte pas. */
  const prets = useMemo<ProchePret[]>(
    () => proches.filter((p) => p.etat === 'pret' && p.temps).map((p) => ({ nom: p.nom, plafond: p.plafond, temps: p.temps! })),
    [proches],
  );

  return { proches, prets, ajouter, regler, retirer };
}
