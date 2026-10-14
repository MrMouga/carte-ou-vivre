import { useId } from 'react';
import { Slider } from '@/components/ui/slider';
import { plafondMer } from '@/domain/format';
import type { Changement, ReglagePrix as Reglage } from '@/domain/prix';
import type { Reglages } from '@/domain/score';
import { BORNES } from '@/domain/url';
import { Categorie } from './Categorie';
import { ReglagePrix } from './ReglagePrix';

type CurseurProps = {
  libelle: string;
  sousTexte: string;
  /** H2 ; le cran après le maximum = « Sans limite ». */
  bornes: { min: number; max: number; pas: number };
  valeur: number | null;
  texte: (v: number | null) => string;
  onChange: (v: number | null) => void;
  disabled: boolean;
};

function Curseur({ libelle, sousTexte, bornes, valeur, texte, onChange, disabled }: CurseurProps) {
  const id = useId();
  const sansLimite = bornes.max + bornes.pas;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <span id={id} className="text-texte">
          {libelle}
        </span>
        <span className="text-valeur tabular-nums">{texte(valeur)}</span>
      </div>
      <Slider
        aria-labelledby={id}
        aria-valuetext={valeur == null ? 'Sans limite' : `${texte(valeur)} ${sousTexte}`}
        min={bornes.min}
        max={sansLimite}
        step={bornes.pas}
        value={[valeur ?? sansLimite]}
        onValueChange={([v]) => onChange(v >= sansLimite ? null : v)}
        disabled={disabled}
      />
      {valeur != null && <p className="text-secondaire text-muted-foreground">{sousTexte}</p>}
    </div>
  );
}

/**
 * `prix` : réglage du prix (spec immobilier) ; son plafond est `reglages.loyer`. `onPrix` reçoit le réglage et le plafond
 * ensemble (R21, R23 : changer de mode ou d'unité change aussi le plafond). `inactif` : pendant le chargement (details.md),
 * les réglages ne bougent pas.
 */
type Props = {
  reglages: Reglages;
  onChange: (r: Reglages) => void;
  prix: Reglage;
  onPrix: (c: Changement) => void;
  inactif?: boolean;
  children?: React.ReactNode;
};

// Panneau de réglages (frame Figma 5:2, « Réglages ») : marque, réglage du prix (design F d'immobilier), plafond de mer,
// en catégories repliables. Sous 1 024 px, le titre n'est pas affiché, seulement lu (D11 d'interface-telephone : la place
// gagnée garde le curseur du prix visible à 375 × 548).
export function Settings({ reglages, onChange, prix, onPrix, inactif = false, children }: Props) {
  return (
    <section aria-label="Réglages" className="flex flex-col gap-3 p-4 max-bureau:pb-2 bureau:min-h-0 bureau:overflow-y-auto bureau:pb-0 bureau:rounded-panel bureau:border bureau:border-border bureau:bg-card bureau:shadow-panneau">
      <h1 className="font-serif text-marque max-bureau:sr-only">Où vivre en France</h1>
      <ReglagePrix prix={prix} plafond={reglages.loyer} onChange={onPrix} disabled={inactif} />
      <Categorie titre="Mer" resume={plafondMer(reglages.mer)}>
        <Curseur
          libelle="Mer à moins de"
          sousTexte="à vol d'oiseau"
          bornes={BORNES.mer}
          valeur={reglages.mer}
          texte={plafondMer}
          onChange={(mer) => onChange({ ...reglages, mer })}
          disabled={inactif}
        />
      </Categorie>
      {children}
    </section>
  );
}
