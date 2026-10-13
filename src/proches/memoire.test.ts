import { describe, expect, it } from 'vitest';
import acceptance from '../../docs/specs/2026-10-13-proches/acceptance.json';
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

  it('un proche qui n’était pas prêt (en attente, calcul, indisponible) revient indisponible, sans temps', () => {
    const s = stockage();
    ecrireProche(s, nantesville({ id: 1, etat: 'calcul', temps: null, empreinte: null }));
    ecrireProche(s, nantesville({ id: 2, etat: 'attente', temps: null, empreinte: null }));
    ecrireProche(s, nantesville({ id: 3, etat: 'indisponible', temps: null, empreinte: null }));
    expect(lireProches(s).map((p) => [p.id, p.etat, p.temps])).toEqual([
      [1, 'indisponible', null],
      [2, 'indisponible', null],
      [3, 'indisponible', null],
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
