import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Tranche mairies, tâche 0 : la mairie de chaque commune (R39), calculée par scripts/data/mairies.py.
const lireJson = (chemin: string) => JSON.parse(readFileSync(new URL(chemin, import.meta.url), 'utf8'));
const acceptance = lireJson('../../docs/specs/2026-10-18-mairies/acceptance.json');

type Mairie = { bloc: string | null; etiquette: string | null; liste: string } | null;

describe('scripts/data/mairies.py --extrait (R39)', () => {
  it('AC-11 : 99101 droite « Divers droite » « Liste A » ; 99102 gauche « Union de la gauche » « Liste D » (second tour) ; 99103 sans étiquette « Liste E » ; 99104 sans résultat', () => {
    const dossier = mkdtempSync(join(tmpdir(), 'mairies-'));
    const extrait = join(dossier, 'extrait.json');
    writeFileSync(extrait, JSON.stringify(acceptance.fixture.extrait_ministere));
    const script = fileURLToPath(new URL('./mairies.py', import.meta.url));
    const sortie = JSON.parse(execFileSync('python3', ['-I', script, '--extrait', extrait], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })) as Record<string, Mairie>;
    expect(sortie).toEqual({
      '99101': { bloc: 'droite', etiquette: 'Divers droite', liste: 'Liste A' },
      '99102': { bloc: 'gauche', etiquette: 'Union de la gauche', liste: 'Liste D' },
      '99103': { bloc: null, etiquette: null, liste: 'Liste E' },
      '99104': null,
    });
  });
});

describe('public/data/mairies.json et nuances.json (R39, H117, D8)', () => {
  const { champs, communes: lignes } = lireJson('../../public/data/mairies.json') as { champs: string[]; communes: [string, string | null, string | null][] };
  const nuances = lireJson('../../public/data/nuances.json') as Record<string, { etiquette: string; bloc: string }>;
  const carte = lireJson('../../public/data/communes.json') as { champs: string[]; communes: unknown[][] };
  const population = new Map(carte.communes.map((r) => [r[0] as string, r[carte.champs.indexOf('population')] as number]));
  const parCode = new Map(lignes.map((l) => [l[0], l]));
  const mairie = (code: string) => {
    const [, nuance, liste] = parCode.get(code)!;
    return { bloc: nuance ? nuances[nuance].bloc : null, liste };
  };

  it('une ligne par commune de la carte, dans l’ordre de communes.json ; les 25 nuances de listes de la circulaire, chacune dans un des 6 blocs', () => {
    expect(champs).toEqual(['code', 'nuance', 'liste']);
    expect(lignes.map((l) => l[0])).toEqual(carte.communes.map((r) => r[0]));
    expect(Object.keys(nuances)).toHaveLength(25);
    const blocs = new Set(['extreme-gauche', 'gauche', 'divers', 'centre', 'droite', 'extreme-droite']);
    expect(Object.values(nuances).filter((n) => !blocs.has(n.bloc))).toEqual([]);
  });

  it('AC-12 : Paris, Lyon et Marseille bloc gauche avec leurs listes ; Bordeaux centre « Faire Gagner Bordeaux » ; Nice extrême droite « LE MEILLEUR EST A VENIR AVEC ERIC CIOTTI »', () => {
    expect(mairie('75056')).toEqual({ bloc: 'gauche', liste: "Paris est à vous! avec Emmanuel Grégoire L'union de la gauche et des écologistes" });
    expect(mairie('69123')).toEqual({ bloc: 'gauche', liste: "POUR VIVRE LYON, L'UNION DE LA GAUCHE ET DES ECOLOGISTES AVEC GREGORY DOUCET" });
    expect(mairie('13055')).toEqual({ bloc: 'gauche', liste: 'POUR MARSEILLE, LA GAUCHE, LES ECOLOGISTES ET LES CITOYENS RASSEMBLES' });
    expect(mairie('33063')).toEqual({ bloc: 'centre', liste: 'Faire Gagner Bordeaux' });
    expect(mairie('06088')).toEqual({ bloc: 'extreme-droite', liste: 'LE MEILLEUR EST A VENIR AVEC ERIC CIOTTI' });
  });

  it('AC-12 : 34 672 communes ont une mairie, 74 sont sans résultat ; 3 164 mairies ont une étiquette, les 31 508 autres toutes sous 3 500 habitants', () => {
    const avecMairie = lignes.filter((l) => l[1] != null);
    expect(avecMairie).toHaveLength(34672);
    expect(lignes.filter((l) => l[1] == null && l[2] == null)).toHaveLength(74);
    expect(avecMairie.filter((l) => l[1] !== '')).toHaveLength(3164);
    const sansEtiquette = avecMairie.filter((l) => l[1] === '');
    expect(sansEtiquette).toHaveLength(31508);
    expect(sansEtiquette.filter((l) => !(population.get(l[0])! < 3500))).toEqual([]);
    expect(avecMairie.filter((l) => l[1] !== '' && !(l[1]! in nuances))).toEqual([]);
  });
});
