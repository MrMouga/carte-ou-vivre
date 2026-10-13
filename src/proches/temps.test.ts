import { describe, expect, it } from 'vitest';
import isochrone15 from '../../docs/plans/2026-10-13-proches/captures/T0-ign-exemples/isochrone-15min-nantes.json';
import { classer, departDe, pointsDes, type Geometrie } from './temps';

// Classement des mairies dans les zones d'un proche (R10) : la fin de tranche est la plus petite durée dont la zone
// contient la mairie ; 0 = hors de toutes les zones, « plus de 3 h ».
const carre = (r: number, cx = 0, cy = 0): number[][] => [
  [cx - r, cy - r],
  [cx + r, cy - r],
  [cx + r, cy + r],
  [cx - r, cy + r],
  [cx - r, cy - r],
];
const poly = (...anneaux: number[][][]): Geometrie => ({ type: 'Polygon', coordinates: anneaux });
const points = (...p: [number, number][]) => Float64Array.from(p.flat());

describe('R10 — fin de tranche d’une mairie', () => {
  it('zones emboîtées : la plus petite qui contient la mairie, quel que soit l’ordre d’arrivée des zones', () => {
    // Zones reçues la plus longue d'abord, comme la file les demande.
    const zones: [number, Geometrie][] = [
      [180, poly(carre(3))],
      [60, poly(carre(2))],
      [15, poly(carre(1))],
    ];
    expect([...classer(zones, points([0.5, 0.5], [1.5, -1.5], [-2.5, 2.9]))]).toEqual([15, 60, 180]);
  });

  it('« plus de 3 h » : une mairie hors de toutes les zones vaut 0', () => {
    expect([...classer([[180, poly(carre(3))]], points([10, 10], [0, 3.5]))]).toEqual([0, 0]);
  });

  it('MultiPolygon : une mairie dans le second morceau (une île reliée) compte', () => {
    const zone: Geometrie = { type: 'MultiPolygon', coordinates: [[carre(1)], [carre(1, 10, 10)]] };
    expect([...classer([[45, zone]], points([10.2, 9.8], [5, 5]))]).toEqual([45, 0]);
  });

  it('trou dans une zone : la mairie dans le trou prend la zone suivante', () => {
    const zones: [number, Geometrie][] = [
      [30, poly(carre(2), carre(0.5, 1, 1))],
      [90, poly(carre(4))],
    ];
    expect([...classer(zones, points([1, 1], [-1, -1]))]).toEqual([90, 30]);
  });

  it('vraie zone de l’IGN (15 min depuis 12 rue de la Paix, Nantes) : le départ y est, Bordeaux non', () => {
    const zone = isochrone15.geometry as Geometrie;
    expect([...classer([[15, zone]], points([-1.554555, 47.215051], [-0.5792, 44.8378]))]).toEqual([15, 0]);
  });
});

describe('D6 — point de départ', () => {
  const reperes = [
    [-1.553, 47.218, 0, 0, 0, 0],
    [1.444, 43.604, 0, 0, 0, 0],
  ];
  const codes = ['44109', '31555'];
  const mairie = (code: string) => {
    const i = codes.indexOf(code);
    return i < 0 ? undefined : ([reperes[i][0], reperes[i][1]] as [number, number]);
  };

  it('une adresse part de son point, tel que la recherche le rend (H28)', () => {
    expect(departDe({ code: '44109', estCommune: false, point: [-1.554555, 47.215051] }, mairie)).toEqual([-1.554555, 47.215051]);
  });

  it('une commune choisie part de sa mairie, par code INSEE', () => {
    expect(departDe({ code: '31555', estCommune: true, point: [1.433805, 43.604082] }, mairie)).toEqual([1.444, 43.604]);
  });

  it('points des mairies dans l’ordre de communes.json, lon puis lat', () => {
    expect([...pointsDes(reperes)]).toEqual([-1.553, 47.218, 1.444, 43.604]);
  });
});
