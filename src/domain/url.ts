// R7, H7 : les réglages vivent dans l'adresse de la page (D7 : pas la commune choisie).
import { REGLAGES_DEPART, type Reglages, type Taille } from './score';

/** H2 : plage et pas de chaque plafond ; `aucun` = « Sans limite ». */
export const BORNES = {
  loyer: { min: 300, max: 2000, pas: 50 },
  mer: { min: 5, max: 200, pas: 5 },
} as const;

/** Ordre de D11, celui de l'adresse. */
export const ORDRE_TAILLES: Taille[] = ['petite-commune', 'petite-ville', 'ville-moyenne', 'grande-ville'];

function plafond(v: string | null, b: { min: number; max: number; pas: number }, depart: number | null): number | null {
  if (v === 'aucun') return null;
  if (v == null || !/^\d+$/.test(v)) return depart;
  const n = Number(v);
  return n >= b.min && n <= b.max && (n - b.min) % b.pas === 0 ? n : depart;
}

export function lireAdresse(search: string): Reglages {
  const q = new URLSearchParams(search);
  const demandees = (q.get('taille') ?? '').split(',');
  return {
    loyer: plafond(q.get('loyer'), BORNES.loyer, REGLAGES_DEPART.loyer),
    mer: plafond(q.get('mer'), BORNES.mer, REGLAGES_DEPART.mer),
    tailles: ORDRE_TAILLES.filter((t) => demandees.includes(t)),
  };
}

export function ecrireAdresse(r: Reglages): string {
  const parts = [`loyer=${r.loyer ?? 'aucun'}`, `mer=${r.mer ?? 'aucun'}`];
  const tailles = ORDRE_TAILLES.filter((t) => r.tailles.includes(t));
  if (tailles.length) parts.push(`taille=${tailles.join(',')}`);
  return `/?${parts.join('&')}`;
}
