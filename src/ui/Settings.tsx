import { useId } from 'react';
import { Slider } from '@/components/ui/slider';
import { plafondLoyer, plafondMer } from '@/domain/format';
import type { Reglages } from '@/domain/score';
import { BORNES } from '@/domain/url';

type CurseurProps = {
  libelle: string;
  sousTexte: string;
  /** H2 ; le cran après le maximum = « Sans limite ». */
  bornes: { min: number; max: number; pas: number };
  valeur: number | null;
  texte: (v: number | null) => string;
  onChange: (v: number | null) => void;
};

function Curseur({ libelle, sousTexte, bornes, valeur, texte, onChange }: CurseurProps) {
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
      />
      {valeur != null && <p className="text-secondaire text-muted-foreground">{sousTexte}</p>}
    </div>
  );
}

type Props = { reglages: Reglages; onChange: (r: Reglages) => void; children?: React.ReactNode };

// Panneau de réglages (frame Figma 5:2, « Réglages ») : marque, plafond de loyer, plafond de mer.
export function Settings({ reglages, onChange, children }: Props) {
  return (
    <section aria-label="Réglages" className="flex flex-col gap-3 rounded-panel border border-border bg-card p-4 shadow-panneau">
      <h1 className="font-serif text-marque">Carte où vivre</h1>
      <div className="flex flex-col gap-2">
        <h2 className="text-categorie uppercase text-muted-foreground">Loyer</h2>
        <Curseur
          libelle="Loyer maximum"
          sousTexte="par mois pour 52 m²"
          bornes={BORNES.loyer}
          valeur={reglages.loyer}
          texte={plafondLoyer}
          onChange={(loyer) => onChange({ ...reglages, loyer })}
        />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-categorie uppercase text-muted-foreground">Mer</h2>
        <Curseur
          libelle="Mer à moins de"
          sousTexte="à vol d'oiseau"
          bornes={BORNES.mer}
          valeur={reglages.mer}
          texte={plafondMer}
          onChange={(mer) => onChange({ ...reglages, mer })}
        />
      </div>
      {children}
    </section>
  );
}
