import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Tranche recherche-et-mer, tâche 0a : le fichier des codes postaux (R58, D2), écrit par scripts/data/codes_postaux.py
// à partir de la base de La Poste, rattaché aux communes de la carte (COG 2025).
const script = fileURLToPath(new URL('./codes_postaux.py', import.meta.url));

type Mouvement = { MOD: string; DATE_EFF: string; TYPECOM_AV: string; COM_AV: string; TYPECOM_AP: string; COM_AP: string };
type Extrait = { carte: string[]; lignes: [string, string][]; mouvements?: Mouvement[] };

/** Lance le script sur ces seules données : [code INSEE, code postal] de La Poste, communes de la carte, mouvements du COG. */
const codes = (extrait: Extrait): Record<string, string[]> => {
  const fichier = join(mkdtempSync(join(tmpdir(), 'codes-postaux-')), 'extrait.json');
  writeFileSync(fichier, JSON.stringify(extrait));
  return JSON.parse(execFileSync('python3', ['-I', script, '--extrait', fichier], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
};

const mouvement = (date: string, av: string, ap: string, mod = '32'): Mouvement =>
  ({ MOD: mod, DATE_EFF: date, TYPECOM_AV: 'COM', COM_AV: av, TYPECOM_AP: 'COM', COM_AP: ap });

describe('scripts/data/codes_postaux.py --extrait (R58)', () => {
  it('AC-13 (morceau a) : une ligne de La Poste qui rattache 75015 à l\'arrondissement 75115 sort "75015": ["75056"] (Paris)', () => {
    expect(codes({ carte: ['75056'], lignes: [['75115', '75015']] })).toEqual({ '75015': ['75056'] });
  });

  it('Lyon et Marseille : les codes de leurs arrondissements vont à la ville (69123, 13055)', () => {
    expect(codes({ carte: ['69123', '13055'], lignes: [['69381', '69001'], ['13208', '13008'], ['13209', '13008']] }))
      .toEqual({ '69001': ['69123'], '13008': ['13055'] });
  });

  it("outre-mer et Monaco écartés : seule la commune de métropole sort", () => {
    expect(codes({ carte: ['01001'], lignes: [['97411', '97400'], ['98735', '98714'], ['99138', '98000'], ['01001', '01400']] }))
      .toEqual({ '01400': ['01001'] });
  });

  it("une commune absente de la carte n'est pas écrite", () => {
    expect(codes({ carte: ['01001'], lignes: [['01001', '01400'], ['01002', '01640']] })).toEqual({ '01400': ['01001'] });
  });

  it('recalage en avant : un ancien code (fusionné en 2019) va vers la commune qui l\'a remplacé', () => {
    expect(codes({ carte: ['01245'], lignes: [['01324', '01310']], mouvements: [mouvement('2019-01-01', '01324', '01245')] }))
      .toEqual({ '01310': ['01245'] });
  });

  it('recalage en arrière : une commune créée en 2026 donne ses codes aux communes 2025 qui la composent', () => {
    expect(codes({
      carte: ['01001', '01002'],
      lignes: [['01999', '01400']],
      mouvements: [mouvement('2026-01-01', '01001', '01999'), mouvement('2026-01-01', '01002', '01999')],
    })).toEqual({ '01400': ['01001', '01002'] });
  });

  it('recalage en arrière : une fusion de 2026 qui garde le code de l\'une donne ses codes à toutes les communes 2025', () => {
    expect(codes({
      carte: ['01001', '01002'],
      lignes: [['01001', '01400'], ['01001', '01640']],
      mouvements: [mouvement('2026-01-01', '01002', '01001'), mouvement('2026-01-01', '01001', '01001')],
    })).toEqual({ '01400': ['01001', '01002'], '01640': ['01001', '01002'] });
  });

  it("un mouvement d'avant 2025 ne recale pas en arrière une commune de la carte", () => {
    expect(codes({ carte: ['01001', '01002'], lignes: [['01001', '01400']], mouvements: [mouvement('2016-01-01', '01002', '01001')] }))
      .toEqual({ '01400': ['01001'] });
  });
});
