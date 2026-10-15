import type { Changement, ReglagePrix as Reglage } from '@/domain/prix';
import type { Reglages } from '@/domain/score';
import { CadreDeVie } from './CadreDeVie';
import { ReglagePrix } from './ReglagePrix';

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

// Panneau de réglages (frame Figma 5:2, « Réglages ») : marque, réglage du prix (design F d'immobilier), cadre de vie
// (design F de cadre-de-vie : taille, mer et montagne), en catégories repliables. Sous 1 024 px, le titre n'est pas affiché,
// seulement lu (D11 d'interface-telephone : la place gagnée garde le curseur du prix visible à 375 × 548).
export function Settings({ reglages, onChange, prix, onPrix, inactif = false, children }: Props) {
  return (
    <section aria-label="Réglages" className="flex flex-col gap-3 p-4 max-bureau:pb-2 bureau:min-h-0 bureau:overflow-y-auto bureau:pb-0 bureau:rounded-panel bureau:border bureau:border-border bureau:bg-card bureau:shadow-panneau">
      <h1 className="font-serif text-marque max-bureau:sr-only">Où vivre en France</h1>
      <ReglagePrix prix={prix} plafond={reglages.loyer} onChange={onPrix} disabled={inactif} />
      <CadreDeVie reglages={reglages} onChange={onChange} disabled={inactif} />
      {children}
    </section>
  );
}
