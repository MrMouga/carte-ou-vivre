import { describe, expect, it } from 'vitest';
import { placer, type Tache } from './file';

// File des calculs de proches (spec proches-fiables R36, D4, H98) : un calcul à la fois ; un ajout ou un « Recalculer avec
// l'IGN » passe devant les recalculs automatiques pas encore commencés ; le calcul en cours continue (il n'est pas dans
// la file) ; un proche n'a jamais deux calculs à la fois.
const D: [number, number] = [0.5, 0.5];
const ajout = (id: number): Tache => ({ id, depart: D });
const auto = (id: number): Tache => ({ id, depart: D, recalcul: true, auto: true });
const manuel = (id: number): Tache => ({ id, depart: D, recalcul: true });
const ids = (f: readonly Tache[]) => f.map((t) => t.id);

describe('R36 — file des calculs : priorité', () => {
  it('file vide : la tâche y entre seule', () => {
    expect(ids(placer([], ajout(1), null))).toEqual([1]);
    expect(ids(placer([], auto(1), null))).toEqual([1]);
  });

  it('AC-11 : un ajout passe devant les recalculs automatiques pas encore commencés (Rochelleville 2 attend, Nantesville 1 calcule)', () => {
    const file = [auto(2)]; // 1 est en cours, hors de la file
    expect(ids(placer(file, ajout(3), 1))).toEqual([3, 2]);
  });

  it('« Recalculer avec l’IGN » passe, comme un ajout, devant les recalculs automatiques', () => {
    expect(ids(placer([auto(2), auto(3)], manuel(4), 1))).toEqual([4, 2, 3]);
  });

  it('entre eux, ajouts et recalculs manuels gardent leur ordre d’arrivée', () => {
    let file: readonly Tache[] = [auto(2), auto(3)];
    file = placer(file, ajout(4), 1);
    file = placer(file, manuel(5), 1);
    file = placer(file, ajout(6), 1);
    expect(ids(file)).toEqual([4, 5, 6, 2, 3]);
  });

  it('un recalcul automatique va en fin de file, derrière tout le reste (ordre d’ajout à l’ouverture)', () => {
    expect(ids(placer([ajout(1), auto(2)], auto(3), null))).toEqual([1, 2, 3]);
    expect(ids(placer([auto(2)], auto(3), null))).toEqual([2, 3]);
  });

  it('un ajout derrière des calculs qui ne sont pas des recalculs automatiques (R37, ajouts) attend son tour', () => {
    expect(ids(placer([ajout(1), ajout(2)], ajout(3), null))).toEqual([1, 2, 3]);
  });

  it('à l’ouverture (R36, R37), la file suit l’ordre d’ajout ; un ajout ne passe que devant le premier recalcul automatique', () => {
    // 1 calcul de R37, 2 recalcul automatique, 3 calcul de R37 : l'ajout 4 passe devant 2, donc aussi devant 3.
    expect(ids(placer([ajout(1), auto(2), ajout(3)], ajout(4), null))).toEqual([1, 4, 2, 3]);
  });

  it('ne change pas la file reçue', () => {
    const file = [auto(2)];
    placer(file, ajout(3), 1);
    expect(ids(file)).toEqual([2]);
  });
});

describe('R36 — file des calculs : un seul calcul par proche à la fois', () => {
  it('un proche déjà dans la file n’y entre pas une seconde fois', () => {
    const file = [ajout(1), auto(2)];
    expect(placer(file, manuel(2), null)).toBe(file);
    expect(placer(file, ajout(1), null)).toBe(file);
  });

  it('le proche en cours de calcul n’entre pas dans la file', () => {
    const file = [auto(2)];
    expect(placer(file, manuel(1), 1)).toBe(file);
    expect(placer([], ajout(1), 1)).toEqual([]);
  });
});
