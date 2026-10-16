import { describe, expect, it } from 'vitest';
import proches from '../../docs/specs/2026-10-13-proches/acceptance.json';
import { distanceKm, distances, kmDePlafond } from './distance';

// Repli à vol d'oiseau (spec proches-fiables R35, D3, H94, H95) : distance du point de départ à chaque mairie, sur la
// sphère de 6 371 km ; plafond en heures converti en km à 60 km par heure.

const ROCHELLEVILLE: [number, number] = [0.5, 0.5]; // « 6 rue Test 17000 Rochelleville »
const mairies = proches.fixture.items.map((it) => it.mairie as [number, number]);

describe('R35, H95 — distance à vol d’oiseau', () => {
  it('fixture depuis [0.5, 0.5], au km : Portmer 39, Grandeville 88, Montcher 197, Terrebasse 88, Quaibleu 118', () => {
    expect(mairies.map((m) => Math.round(distanceKm(ROCHELLEVILLE, m)))).toEqual([39, 88, 197, 88, 118]);
  });

  it('une par mairie, dans l’ordre des points (lon, lat alternés)', () => {
    const d = distances(ROCHELLEVILLE, Float64Array.from(mairies.flat()));
    expect(Array.from(d, Math.round)).toEqual([39, 88, 197, 88, 118]);
  });

  it('même point : 0 km ; 1° de longitude à l’équateur : 6 371 × π / 180 ≈ 111,19 km', () => {
    expect(distanceKm([2, 47], [2, 47])).toBe(0);
    expect(distanceKm([0, 0], [1, 0])).toBeCloseTo((6371 * Math.PI) / 180, 6);
  });

  it('T0 : La Rochelle (mairie de 17300) à 121 km de « 12 rue de la Paix, Nantes » [-1.554555, 47.215051]', () => {
    // Mairie de La Rochelle d'après public/data/reperes.json, index du code 17300 (mesure-tache-0.md : 121,324 km).
    expect(distanceKm([-1.554555, 47.215051], [-1.1513, 46.1596])).toBeCloseTo(121.324, 3);
  });
});

describe('H94 — plafond converti à l’entrée en repli (60 km par heure)', () => {
  it('45 min → 45 km, 2 h → 120 km, 3 h → 180 km', () => {
    expect(kmDePlafond(45)).toBe(45);
    expect(kmDePlafond(120)).toBe(120);
    expect(kmDePlafond(180)).toBe(180);
  });
});
