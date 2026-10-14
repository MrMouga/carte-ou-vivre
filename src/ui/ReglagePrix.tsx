import { useId, useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { plafondPrix, resumePrix } from '@/domain/format';
import {
  bornesPrix,
  changerBien,
  changerMode,
  changerSurface,
  changerUnite,
  surfaceValide,
  type Bien,
  type Changement,
  type Mode,
  type ReglagePrix as Reglage,
  type Unite,
} from '@/domain/prix';
import { cn } from '@/lib/cn';
import { Categorie } from './Categorie';

// Réglage du prix (spec immobilier R21–R23, H56, H65 ; design F de /ui immobilier) : catégorie « Logement », Louer / Acheter
// en choix souligné, Appartement / Maison en tuiles, le curseur du plafond, puis l'unité et la surface sous le curseur.
// Pas d'état propre : le réglage et le plafond viennent de l'application (et de l'adresse, R26).

const NBSP = ' ';
const MODES: [Mode, string][] = [
  ['louer', 'Louer'],
  ['acheter', 'Acheter'],
];
const BIENS: [Bien, string][] = [
  ['appartement', 'Appartement'],
  ['maison', 'Maison'],
];
const UNITES: [Unite, string][] = [
  ['total', 'Total'],
  ['m2', 'Au m²'],
];

/** H56 : libellé visible du curseur, le même dans les deux unités. */
const libelle = (p: Reglage) => (p.mode === 'louer' ? 'Loyer mensuel' : "Prix d'achat");
/** H65 : le nom lu commence par le libellé visible et garde « loyer maximum » en Louer (tests des tranches précédentes). */
const nomCurseur = (p: Reglage) =>
  `${p.mode === 'louer' ? 'Loyer mensuel, loyer maximum' : "Prix d'achat, prix maximum"}${p.unite === 'm2' ? ' au m²' : ''}`;
/** Ce que la valeur veut dire, lu après elle (le sous-texte n'est plus affiché, D10). */
const precision = (p: Reglage) =>
  p.mode === 'louer'
    ? p.unite === 'total'
      ? `par mois pour ${p.surface}${NBSP}m²`
      : 'par mois, au m²'
    : p.unite === 'total'
      ? `pour ${p.surface}${NBSP}m²`
      : 'au m², prix médian des ventes';

function Immeuble() {
  return (
    <svg viewBox="0 0 24 24" className="size-6 shrink-0" aria-hidden="true">
      <path d="M5 21V4h10v17M15 9h4v12M3 21h18M8 8h1M11 8h1M8 12h1M11 12h1M8 16h1M11 16h1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
function Maison() {
  return (
    <svg viewBox="0 0 24 24" className="size-6 shrink-0" aria-hidden="true">
      <path d="M3 11 12 4l9 7M5 10v10h14V10M10 20v-6h4v6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Champ surface (état « surface en cours de saisie » de details.md) : il montre ce qui est tapé ; chaque frappe qui donne
 * une surface valide (H58) s'applique, sinon la carte garde la dernière valide ; en quittant le champ, elle revient.
 */
function Surface({ surface, onSurface, disabled }: { surface: number; onSurface: (s: number) => void; disabled: boolean }) {
  const [texte, setTexte] = useState(String(surface));
  const [vue, setVue] = useState(surface);
  if (vue !== surface) {
    // La surface a changé ailleurs (frappe valide, adresse) : le champ la reprend.
    setVue(surface);
    setTexte(String(surface));
  }
  return (
    <span className="flex items-center gap-2 text-texte">
      <input
        aria-label="Surface en m²"
        inputMode="numeric"
        disabled={disabled}
        value={texte}
        onChange={(e) => {
          const t = e.target.value;
          setTexte(t);
          if (/^\d+$/.test(t) && surfaceValide(Number(t))) onSurface(Number(t));
        }}
        onBlur={() => setTexte(String(surface))}
        className="h-pastille w-toucher rounded-base border border-border bg-card px-1 text-center text-texte-fort tabular-nums max-bureau:h-toucher max-bureau:text-(length:--taille-saisie)"
      />
      m²
    </span>
  );
}

type Props = { prix: Reglage; plafond: number | null; onChange: (c: Changement) => void; disabled: boolean };

export function ReglagePrix({ prix, plafond, onChange, disabled }: Props) {
  const id = useId();
  const b = bornesPrix(prix);
  const sansLimite = b.max + b.pas; // le cran après le maximum (H57)
  const valeur = plafondPrix(plafond, prix);
  return (
    <Categorie titre="Logement" resume={resumePrix(prix, plafond)}>
      {/* Choix souligné : le choix principal. */}
      <div role="group" aria-label="Louer ou acheter" className="flex border-b border-border">
        {MODES.map(([m, t]) => (
          <button
            key={m}
            type="button"
            aria-pressed={prix.mode === m}
            disabled={disabled}
            onClick={() => onChange(changerMode(prix, plafond, m))}
            className={cn(
              '-mb-px min-h-cible flex-1 cursor-pointer border-b-2 text-texte-fort max-bureau:min-h-toucher',
              prix.mode === m ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground',
            )}
          >
            {t}
          </button>
        ))}
      </div>
      {/* Tuiles de bien, compactes : icône à gauche, 44 px partout. */}
      <div role="group" aria-label="Type de logement" className="grid grid-cols-2 gap-2">
        {BIENS.map(([v, t]) => (
          <button
            key={v}
            type="button"
            aria-pressed={prix.bien === v}
            disabled={disabled}
            onClick={() => onChange({ prix: changerBien(prix, v), plafond })}
            className={cn(
              'flex min-h-toucher cursor-pointer items-center justify-center gap-2 rounded-chip border text-pastille',
              prix.bien === v ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground',
            )}
          >
            {v === 'maison' ? <Maison /> : <Immeuble />}
            {t}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between">
          <span id={id} className="text-texte">
            {libelle(prix)}
          </span>
          <span className="text-valeur-curseur tabular-nums">{valeur}</span>
        </div>
        <Slider
          aria-label={nomCurseur(prix)}
          aria-valuetext={plafond == null ? 'Sans limite' : `${valeur} ${precision(prix)}`}
          min={b.min}
          max={sansLimite}
          step={b.pas}
          value={[plafond ?? sansLimite]}
          onValueChange={([v]) => onChange({ prix, plafond: v >= sansLimite ? null : v })}
          disabled={disabled}
        />
        {/* Segmenté d'unité et champ surface, sous le curseur ; même hauteur en Au m², champ caché. */}
        <div className="flex min-h-pastille items-center justify-between gap-2 max-bureau:min-h-toucher">
          <div role="group" aria-label="Unité du prix" className="flex w-1/2 overflow-hidden rounded-chip border border-border">
            {UNITES.map(([u, t]) => (
              <button
                key={u}
                type="button"
                aria-pressed={prix.unite === u}
                disabled={disabled}
                onClick={() => onChange(changerUnite(prix, plafond, u))}
                className={cn(
                  'min-h-pastille flex-1 cursor-pointer text-pastille max-bureau:min-h-toucher',
                  prix.unite === u ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
                )}
              >
                {t}
              </button>
            ))}
          </div>
          {prix.unite === 'total' && <Surface surface={prix.surface} onSurface={(s) => onChange({ prix: changerSurface(prix, s), plafond })} disabled={disabled} />}
        </div>
      </div>
    </Categorie>
  );
}
