import { describe, expect, it } from 'vitest';
import { adresseDe } from './LigneProche';

// Corrections 3 (Vincent, 2026-10-13) : sous le nom d'une ville choisie seule, « départ de la mairie » sans répéter la ville.
describe('adresseDe', () => {
  it('ville seule → « départ de la mairie »', () => {
    expect(adresseDe({ lieu: { libelle: 'Arcachon', commune: 'Arcachon', dep: '33', code: '33009', point: [-1.17, 44.66], estCommune: true } })).toBe(
      'départ de la mairie',
    );
  });

  it('adresse précise → le libellé de l’IGN tel quel', () => {
    expect(
      adresseDe({ lieu: { libelle: '1 rue Test 44000 Nantesville', commune: 'Nantesville', dep: '44', code: '44999', point: [-2, 3], estCommune: false } }),
    ).toBe('1 rue Test 44000 Nantesville');
  });
});
