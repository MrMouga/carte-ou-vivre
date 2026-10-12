import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Contrôles du fichier servi (tâche 1a) : les chiffres de référence de la discovery, par code INSEE ; distances depuis
// la mairie depuis D18 (tâche 8).
const { champs, communes } = JSON.parse(readFileSync(new URL('../../public/data/communes.json', import.meta.url), 'utf8')) as {
  champs: string[];
  communes: unknown[][];
};
const col = (name: string) => champs.indexOf(name);
const byCode = new Map(communes.map((r) => [r[0] as string, r]));
const get = (code: string, name: string) => byCode.get(code)![col(name)] as number;

describe('public/data/communes.json', () => {
  it('34 746 communes de métropole, toutes avec population, loyer et distance à la mer', () => {
    expect(communes).toHaveLength(34746);
    for (const name of ['population', 'loyer_m2', 'mer_km']) expect(communes.filter((r) => r[col(name)] == null)).toEqual([]);
  });

  it('Bordeaux (33063) : 832 € pour 52 m², 16,0 €/m², 39 km de la mer (D18)', () => {
    expect(Math.round(get('33063', 'loyer_m2') * 52)).toBe(832);
    expect(get('33063', 'loyer_m2').toFixed(1)).toBe('16.0');
    expect(Math.round(get('33063', 'mer_km'))).toBe(39);
  });

  it("La Rochelle (17300) à moins d'1 km de la mer (D18), la homonyme de Haute-Saône (70450) loin", () => {
    expect(get('17300', 'mer_km')).toBeLessThan(1);
    expect(get('70450', 'mer_km')).toBeGreaterThan(300);
  });

  it("Adour corrigé : Port-de-Lanne, Saint-Étienne-d'Orthe et Sames au-delà de 2 km", () => {
    for (const code of ['40231', '40256', '64502']) expect(get(code, 'mer_km')).toBeGreaterThan(2);
  });

  it("Paris, Lyon et Marseille d'un seul tenant, sans arrondissement", () => {
    for (const code of ['75056', '69123', '13055']) expect(byCode.has(code)).toBe(true);
    expect([...byCode.keys()].filter((c) => /^(751\d\d|6938\d|132\d\d)$/.test(c))).toEqual([]);
  });
});
