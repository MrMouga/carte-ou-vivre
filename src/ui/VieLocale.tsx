import { useId } from 'react';
import { LIBELLE_BORD, resumeVieLocale } from '@/domain/format';
import type { Bord, Reglages } from '@/domain/score';
import { ORDRE_BORDS } from '@/domain/url';
import { Categorie } from './Categorie';

// Catégorie « Vie locale » (spec mairies, R42, D7 ; design F : docs/design/mairies/README.md), entre « Cadre de vie » et
// « Tes proches » (H111). Groupe « Mairie élue en 2026 » (H109) : Cases séparées en 3 colonnes, boutons à bascule
// cumulables (aria-pressed), dans l'ordre de R38 ; au clavier, Tab de case en case. D2 amendée le 2026-10-19 : 5 blocs,
// Gauche · Divers · Centre / Droite · Extrême droite · Sans étiquette (« Sans étiquette » au format d'une case, dans la
// 6e case, 3e colonne de la 2e ligne ; démo 2 du 2026-10-19). Sous la grille, sur toute la largeur, la phrase de D8 :
// explication générale du groupe, qui le décrit (aria-describedby sur le groupe, plus sur « Sans étiquette »).

type Props = { reglages: Reglages; onChange: (r: Reglages) => void; disabled?: boolean };

/** Une case : libellé entier, centré, sur deux lignes au plus (contrat « Cases séparées »). */
const CASE =
  'flex min-h-toucher cursor-pointer items-center justify-center rounded-chip border border-border bg-card p-1 text-center text-pastille text-foreground disabled:cursor-default disabled:opacity-50 aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground';

/**
 * Coche ou décoche `b` ; le résultat suit l'ordre de R38. Aucune cochée : le champ `mairies` est retiré des réglages
 * (« Peu importe », champ facultatif absent, plan « À respecter »).
 */
function basculer(r: Reglages, b: Bord): Reglages {
  const cochees = r.mairies ?? [];
  const mairies = ORDRE_BORDS.filter((x) => (x === b ? !cochees.includes(b) : cochees.includes(x)));
  const { mairies: _, ...reste } = r;
  return mairies.length ? { ...reste, mairies } : reste;
}

export function VieLocale({ reglages, onChange, disabled = false }: Props) {
  const idGroupe = useId();
  const idPhrase = useId();
  const cochees = reglages.mairies ?? [];
  return (
    <Categorie titre="Vie locale" resume={resumeVieLocale(reglages)}>
      <div className="flex flex-col gap-1">
        <span id={idGroupe} className="text-secondaire text-muted-foreground">
          Mairie élue en 2026
        </span>
        <div role="group" aria-labelledby={idGroupe} aria-describedby={idPhrase} className="grid grid-cols-3 gap-2">
          {ORDRE_BORDS.map((b) => (
            <button
              key={b}
              type="button"
              aria-pressed={cochees.includes(b)}
              disabled={disabled}
              onClick={() => onChange(basculer(reglages, b))}
              className={CASE}
            >
              {LIBELLE_BORD[b]}
            </button>
          ))}
        </div>
        {/* D8 : espace insécable dans « 3 500 » (H3 de loyer-mer). */}
        <p id={idPhrase} className="text-secondaire text-muted-foreground">
          Moins de 3{' '}500 habitants : le ministère ne classe pas les listes.
        </p>
      </div>
    </Categorie>
  );
}
