import { describe, expect, it } from 'vitest';
import acceptance from '../../docs/specs/2026-10-13-proches/acceptance.json';
import * as ancienne from '../../tests/fixtures/memoire-56ac3d6';
import { CLE, decoder, effacerTout, empreinteDe, encoder, ecrireProche, effacerProche, lireProches, type ProcheGarde } from './memoire';

// Mémoire du navigateur (R12) : une entrée par proche ; temps en entiers 16 bits dans l'ordre de communes.json, en base64 ;
// empreinte de la liste des codes INSEE. Valeurs de la fixture (Nantesville : 60, 135, 150, 150, plus de 3 h).

/** Stockage du navigateur simulé (même interface que localStorage). */
function stockage(refuse = false): Storage {
  const m = new Map<string, string>();
  return {
    get length() {
      return m.size;
    },
    key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => {
      if (refuse) throw new DOMException('quota', 'QuotaExceededError');
      m.set(k, String(v));
    },
    removeItem: (k) => void m.delete(k),
    clear: () => m.clear(),
  };
}

const CODES = acceptance.fixture.items.map((it) => it.code_insee);
const lieu = { libelle: '1 rue Test 44000 Nantesville', commune: 'Nantesville', dep: '44', code: '44999', point: [-2, 3] as [number, number], estCommune: false };
const nantesville = (p: Partial<ProcheGarde> = {}): ProcheGarde => ({
  id: 1,
  nom: 'Nantesville (44)',
  lieu,
  depart: [-2, 3],
  plafond: 135,
  etat: 'pret',
  temps: Uint16Array.from([60, 135, 150, 150, 0]),
  empreinte: empreinteDe(CODES),
  ...p,
});

describe('R12 — temps en base64', () => {
  it('un tableau de 16 bits revient à l’identique ; 34 746 communes font ≈ 93 Ko', () => {
    const t = Uint16Array.from([60, 135, 150, 150, 0, 180, 15]);
    expect([...decoder(encoder(t))]).toEqual([...t]);
    const grand = new Uint16Array(34_746).map((_, i) => (i % 13) * 15);
    const b64 = encoder(grand);
    expect(b64.length).toBe(92_656);
    expect([...decoder(b64)]).toEqual([...grand]);
  });
});

describe('R12 — empreinte de la liste des codes INSEE', () => {
  it('change si un code change, si l’ordre change ou si un code manque', () => {
    const e = empreinteDe(CODES);
    expect(empreinteDe([...CODES])).toBe(e);
    expect(empreinteDe(['99001', '99002', '99003', '99004', '99006'])).not.toBe(e);
    expect(empreinteDe([...CODES].reverse())).not.toBe(e);
    expect(empreinteDe(CODES.slice(0, 4))).not.toBe(e);
  });
});

describe('R12 — écrire et relire les proches', () => {
  it('Nantesville prêt à 2 h 15 revient prêt, avec son adresse, son point, son nom, son plafond et ses temps', () => {
    const s = stockage();
    ecrireProche(s, nantesville());
    expect(s.length).toBe(1);
    expect(s.key(0)).toBe(`${CLE}1`);
    const [p] = lireProches(s);
    expect(p).toMatchObject({ id: 1, nom: 'Nantesville (44)', lieu, depart: [-2, 3], plafond: 135, etat: 'pret', empreinte: empreinteDe(CODES) });
    expect([...p.temps!]).toEqual([60, 135, 150, 150, 0]);
  });

  // Recalage (proches-fiables R37, tâche 4) : même situation de départ, un proche gardé non prêt n'est plus relu
  // « indisponible » mais à calculer à l'ouverture (en attente, sans temps) ; « indisponible » n'est plus un état (D5).
  it('un proche qui n’était pas prêt (en attente, calcul) revient à calculer (en attente), sans temps', () => {
    const s = stockage();
    ecrireProche(s, nantesville({ id: 1, etat: 'calcul', temps: null, empreinte: null }));
    ecrireProche(s, nantesville({ id: 2, etat: 'attente', temps: null, empreinte: null }));
    expect(lireProches(s).map((p) => [p.id, p.etat, p.temps, p.plafond])).toEqual([
      [1, 'attente', null, 135],
      [2, 'attente', null, 135],
    ]);
  });

  it('dans l’ordre d’ajout (id), quel que soit l’ordre des clés ; une entrée illisible est ignorée', () => {
    const s = stockage();
    ecrireProche(s, nantesville({ id: 10, nom: 'B' }));
    ecrireProche(s, nantesville({ id: 2, nom: 'A' }));
    s.setItem(`${CLE}5`, '{pas du json');
    s.setItem('autre-cle', 'x');
    expect(lireProches(s).map((p) => p.nom)).toEqual(['A', 'B']);
  });

  it('« Retirer » efface une entrée ; « Effacer mes proches » les efface toutes, sans toucher aux autres clés', () => {
    const s = stockage();
    ecrireProche(s, nantesville({ id: 1 }));
    ecrireProche(s, nantesville({ id: 2 }));
    ecrireProche(s, nantesville({ id: 3 }));
    s.setItem('autre-cle', 'x');
    effacerProche(s, 2);
    expect(lireProches(s).map((p) => p.id)).toEqual([1, 3]);
    effacerTout(s);
    expect(lireProches(s)).toEqual([]);
    expect(s.getItem('autre-cle')).toBe('x');
  });

  it('mémoire refusée : l’écriture lève une erreur (l’appelant affiche le message) ; sans stockage, la lecture est vide', () => {
    expect(() => ecrireProche(stockage(true), nantesville())).toThrow();
    expect(() => ecrireProche(null, nantesville())).toThrow();
    expect(lireProches(null)).toEqual([]);
  });
});

// Proches-fiables R36, R37 (tâche 4) : le format gardé reste lisible par la version en ligne (commit 56ac3d6, copiée dans
// tests/fixtures/memoire-56ac3d6.ts) et relit ses entrées. Valeurs de la fixture : Nantesville sans la zone de 135 min
// (partiel, plafond 2 h 30), Rochelleville à vol d'oiseau (km, plafond 90 km).
const ZONES = [15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180];
const ESSAI = Date.UTC(2026, 9, 16, 9, 30);
const partiel = (p: Partial<ProcheGarde> = {}) =>
  nantesville({ etat: 'partiel', plafond: 150, temps: Uint16Array.from([60, 150, 150, 150, 0]), zones: ZONES.filter((z) => z !== 135), essai: ESSAI, ...p });
const rochelleville = { libelle: '6 rue Test 17000 Rochelleville', commune: 'Rochelleville', dep: '17', code: '17999', point: [0.5, 0.5] as [number, number], estCommune: false };
const km = (p: Partial<ProcheGarde> = {}) =>
  nantesville({ id: 2, nom: 'Rochelleville (17)', lieu: rochelleville, depart: [0.5, 0.5], etat: 'km', plafond: 90, temps: null, empreinte: null, zones: [], essai: ESSAI, ...p });
const brut = (s: Storage, id: number) => JSON.parse(s.getItem(CLE + id)!);

describe('R36 — aller-retour de chaque état', () => {
  it('prêt : revient prêt, avec ses temps, ses 12 zones et l’heure de son dernier essai', () => {
    const s = stockage();
    ecrireProche(s, nantesville({ zones: ZONES, essai: ESSAI }));
    const [p] = lireProches(s);
    expect(p).toMatchObject({ etat: 'pret', plafond: 135, empreinte: empreinteDe(CODES), zones: ZONES, essai: ESSAI });
    expect([...p.temps!]).toEqual([60, 135, 150, 150, 0]);
  });

  it('partiel : revient partiel, avec ses temps, ses zones obtenues (sans 135 min), son plafond 2 h 30 et son dernier essai', () => {
    const s = stockage();
    ecrireProche(s, partiel());
    const [p] = lireProches(s);
    expect(p).toMatchObject({ etat: 'partiel', plafond: 150, empreinte: empreinteDe(CODES), zones: ZONES.filter((z) => z !== 135), essai: ESSAI });
    expect([...p.temps!]).toEqual([60, 150, 150, 150, 0]);
  });

  it('km : revient km, sans temps, avec son plafond 90 km, ses zones obtenues (aucune) et son dernier essai', () => {
    const s = stockage();
    ecrireProche(s, km());
    ecrireProche(s, km({ id: 3, zones: [15, 30, 45, 60], plafond: 120 }));
    expect(lireProches(s).map((p) => [p.etat, p.plafond, p.temps, p.zones, p.essai])).toEqual([
      ['km', 90, null, [], ESSAI],
      ['km', 120, null, [15, 30, 45, 60], ESSAI],
    ]);
  });

  it('l’entrée garde v: 1 et les champs d’avant : prêt → pret: true ; partiel et km → pret: false ; km sans temps', () => {
    const s = stockage();
    ecrireProche(s, nantesville({ zones: ZONES, essai: ESSAI }));
    ecrireProche(s, partiel({ id: 2 }));
    ecrireProche(s, km({ id: 3 }));
    expect(brut(s, 1)).toMatchObject({ v: 1, pret: true, etat: 'pret', temps: encoder(Uint16Array.from([60, 135, 150, 150, 0])) });
    expect(brut(s, 2)).toMatchObject({ v: 1, pret: false, etat: 'partiel', plafond: 150, essai: ESSAI });
    expect(brut(s, 3)).toMatchObject({ v: 1, pret: false, etat: 'km', plafond: 90, temps: null, empreinte: null, zones: [] });
  });

  it('une entrée nouvelle incohérente (partiel sans temps ni zones) revient à calculer, sans temps', () => {
    const s = stockage();
    ecrireProche(s, partiel());
    s.setItem(CLE + 1, JSON.stringify({ ...brut(s, 1), temps: null, zones: undefined }));
    expect(lireProches(s).map((p) => [p.etat, p.temps])).toEqual([['attente', null]]);
  });
});

describe('R37 — relecture des entrées gardées par la version d’avant (56ac3d6)', () => {
  const ecrireAncienne = (s: Storage, p: Partial<ancienne.ProcheGarde>) => ancienne.ecrireProche(s, { ...nantesville(), ...p } as ancienne.ProcheGarde);

  it('prêt à 2 h 15 : revient prêt, avec ses temps et son empreinte, sans zones ni dernier essai', () => {
    const s = stockage();
    ecrireAncienne(s, {});
    const [p] = lireProches(s);
    expect(p).toMatchObject({ etat: 'pret', plafond: 135, empreinte: empreinteDe(CODES), zones: undefined, essai: undefined });
    expect([...p.temps!]).toEqual([60, 135, 150, 150, 0]);
  });

  it('indisponible, en attente, en calcul : revient à calculer (en attente), avec son nom, son adresse, son départ et son plafond 2 h 15', () => {
    const s = stockage();
    ecrireAncienne(s, { id: 1, etat: 'indisponible', temps: null, empreinte: null });
    ecrireAncienne(s, { id: 2, etat: 'attente', temps: null, empreinte: null });
    ecrireAncienne(s, { id: 3, etat: 'calcul', temps: null, empreinte: null });
    const relus = lireProches(s);
    expect(relus.map((p) => [p.id, p.etat, p.temps, p.empreinte, p.plafond])).toEqual([
      [1, 'attente', null, null, 135],
      [2, 'attente', null, null, 135],
      [3, 'attente', null, null, 135],
    ]);
    for (const p of relus) expect(p).toMatchObject({ nom: 'Nantesville (44)', lieu, depart: [-2, 3] });
  });
});

describe('Compatibilité — la version d’avant (56ac3d6) relit les entrées nouvelles', () => {
  it('un proche partiel ou km revient « indisponible » (pas ignoré), avec son nom, son adresse et son plafond ; un prêt revient prêt', () => {
    const s = stockage();
    ecrireProche(s, nantesville({ zones: ZONES, essai: ESSAI }));
    ecrireProche(s, partiel({ id: 2 }));
    ecrireProche(s, km({ id: 3 }));
    const relus = ancienne.lireProches(s);
    expect(relus.map((p) => [p.id, p.nom, p.etat, p.plafond])).toEqual([
      [1, 'Nantesville (44)', 'pret', 135],
      [2, 'Nantesville (44)', 'indisponible', 150],
      [3, 'Rochelleville (17)', 'indisponible', 90],
    ]);
    expect([...relus[0].temps!]).toEqual([60, 135, 150, 150, 0]);
    expect(relus[2].lieu).toEqual(rochelleville);
  });

  it('une entrée partielle réécrite par la version d’avant (« Réessayer », page fermée pendant le calcul) revient à calculer ici', () => {
    const s = stockage();
    ecrireProche(s, partiel());
    const [relu] = ancienne.lireProches(s);
    ancienne.ecrireProche(s, { ...relu, etat: 'calcul' });
    expect(lireProches(s).map((p) => [p.etat, p.temps, p.plafond])).toEqual([['attente', null, 150]]);
  });
});
