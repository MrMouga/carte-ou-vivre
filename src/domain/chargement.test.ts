import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { avecDelai, indicateur } from './chargement';

// H9 : l'indicateur apparaît après 300 ms et reste au moins 300 ms ; au bout de 15 s sans données, erreur.
describe('indicateur de chargement (H9)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  test('chargement fini avant 300 ms : jamais montré', () => {
    const vu: boolean[] = [];
    const ind = indicateur((v) => vu.push(v));
    ind.debut();
    vi.advanceTimersByTime(250);
    ind.fin();
    vi.advanceTimersByTime(1000);
    expect(vu).toEqual([]);
  });

  test('montré à 300 ms, pas avant', () => {
    const vu: boolean[] = [];
    const ind = indicateur((v) => vu.push(v));
    ind.debut();
    vi.advanceTimersByTime(299);
    expect(vu).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(vu).toEqual([true]);
  });

  test('fini à 350 ms : reste montré jusqu’à 600 ms', () => {
    const vu: boolean[] = [];
    const ind = indicateur((v) => vu.push(v));
    ind.debut();
    vi.advanceTimersByTime(350);
    ind.fin();
    vi.advanceTimersByTime(249);
    expect(vu).toEqual([true]);
    vi.advanceTimersByTime(1);
    expect(vu).toEqual([true, false]);
  });

  test('fini à 2 s : masqué tout de suite', () => {
    const vu: boolean[] = [];
    const ind = indicateur((v) => vu.push(v));
    ind.debut();
    vi.advanceTimersByTime(2000);
    ind.fin();
    vi.advanceTimersByTime(0);
    expect(vu).toEqual([true, false]);
  });
});

describe('délai des données (H9)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  test('rien après 15 s : échec', async () => {
    const p = avecDelai(new Promise(() => {}), 15_000);
    const attente = expect(p).rejects.toThrow('délai');
    await vi.advanceTimersByTimeAsync(15_000);
    await attente;
  });

  test('réponse avant 15 s : la valeur passe', async () => {
    const p = avecDelai(new Promise((r) => setTimeout(() => r(42), 14_000)), 15_000);
    await vi.advanceTimersByTimeAsync(14_000);
    await expect(p).resolves.toBe(42);
  });
});
