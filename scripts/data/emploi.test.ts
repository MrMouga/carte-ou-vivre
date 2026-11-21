import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Tranche emploi, tâche 0a : les niveaux des bassins d'un métier (R45, H137), calculés par scripts/data/emploi.py.
const lireJson = (chemin: string) => JSON.parse(readFileSync(new URL(chemin, import.meta.url), 'utf8'));
const acceptance = lireJson('../../docs/specs/2026-11-21-emploi/acceptance.json');

type Niveau = { projets: number; niveau: '10' | '25' | 'tous' } | null;

describe('scripts/data/emploi.py --extrait (R45)', () => {
  it('AC-8 : b01 500, b02 300, b03 300 au niveau « 10 » ; b04 120, b05 80, b06 80 au « 25 » ; b07 40, b08 12, b09 5, b10 5 « tous » ; b11 à b20 sans chiffre', () => {
    const dossier = mkdtempSync(join(tmpdir(), 'emploi-'));
    const extrait = join(dossier, 'extrait.json');
    writeFileSync(extrait, JSON.stringify(acceptance.fixture.extrait_bmo));
    const script = fileURLToPath(new URL('./emploi.py', import.meta.url));
    const sortie = JSON.parse(execFileSync('python3', ['-I', script, '--extrait', extrait], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })) as Record<string, Niveau>;
    const sansChiffre = Object.fromEntries(['b11', 'b12', 'b13', 'b14', 'b15', 'b16', 'b17', 'b18', 'b19', 'b20'].map((b) => [b, null]));
    expect(sortie).toEqual({
      b01: { projets: 500, niveau: '10' },
      b02: { projets: 300, niveau: '10' },
      b03: { projets: 300, niveau: '10' },
      b04: { projets: 120, niveau: '25' },
      b05: { projets: 80, niveau: '25' },
      b06: { projets: 80, niveau: '25' },
      b07: { projets: 40, niveau: 'tous' },
      b08: { projets: 12, niveau: 'tous' },
      b09: { projets: 5, niveau: 'tous' },
      b10: { projets: 5, niveau: 'tous' },
      ...sansChiffre,
    });
  });
});
