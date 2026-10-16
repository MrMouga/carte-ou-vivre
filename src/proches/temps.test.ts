import { describe, expect, it } from 'vitest';
import isochrone15 from '../../docs/plans/2026-10-13-proches/captures/T0-ign-exemples/isochrone-15min-nantes.json';
import { marque } from './etat';
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

describe('R34 (proches-fiables) — classement avec des zones manquantes', () => {
  // 12 zones emboîtées : celle de d minutes est un carré de demi-côté d / 60 ; une mairie à d / 60 − 0,1 est dans la tranche d.
  const DUREES = [15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180];
  const zonesSans = (...manquantes: number[]) =>
    DUREES.filter((d) => !manquantes.includes(d)).map((d): [number, Geometrie] => [d, poly(carre(d / 60))]);
  const mairies = (...tranches: number[]) => points(...tranches.map((d): [number, number] => [d / 60 - 0.1, 0]));
  const valeurs = (zones: [number, Geometrie][], fins: Uint16Array) => [...fins].map((f) => [f, marque(f, zones.map(([d]) => d))]);

  it('les 12 zones : chaque mairie prend sa tranche, exacte', () => {
    const z = zonesSans();
    expect(valeurs(z, classer(z, mairies(60, 135, 150, 180)))).toEqual([[60, 'exacte'], [135, 'exacte'], [150, 'exacte'], [180, 'exacte']]);
  });

  it('zone de 2 h 15 manquante (au milieu) : les tranches 2 h 15 et 2 h 30 disent « jusqu’à 2 h 30 », les autres ne changent pas', () => {
    const z = zonesSans(135);
    expect(valeurs(z, classer(z, mairies(60, 120, 135, 150, 165)))).toEqual([
      [60, 'exacte'],
      [120, 'exacte'],
      [150, 'jusqua'],
      [150, 'jusqua'],
      [165, 'exacte'],
    ]);
  });

  it('zones de 2 h 45 et 3 h manquantes (en haut) : au-delà de la couverture de 2 h 30, la mairie vaut 0 (« plus de 2 h 30 »)', () => {
    const z = zonesSans(165, 180);
    expect(valeurs(z, classer(z, mairies(150, 165, 180)))).toEqual([[150, 'exacte'], [0, 'au-dela'], [0, 'au-dela']]);
  });

  it('au milieu et en haut à la fois (1 h 30 et 3 h) : tranches 1 h 30 et 1 h 45 « jusqu’à 1 h 45 », 3 h au-delà ; aucune zone : tout à 0', () => {
    const z = zonesSans(90, 180);
    expect(valeurs(z, classer(z, mairies(75, 90, 105, 120, 180)))).toEqual([[75, 'exacte'], [105, 'jusqua'], [105, 'jusqua'], [120, 'exacte'], [0, 'au-dela']]);
    expect([...classer([], mairies(15, 180))]).toEqual([0, 0]);
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
