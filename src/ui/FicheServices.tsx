import { useRef, type RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { LIMITES_SERVICES, lignesServices, phraseTraversee, TRAVERSEE, type EtatServices } from '@/domain/services';

type Props = {
  /** Commune de la fiche : son code INSEE (jointure) et son département (Corse, R54). */
  commune: { code: string; dep: string };
  temps: EtatServices;
  /** « Réessayer » : relance le seul fichier des temps (R57). */
  onReessayer: () => void;
};

/**
 * Erreur du fichier des temps (R57, H168), dans la fiche et dans la catégorie « Services » : « Temps des services
 * indisponibles. » (alerte, présente seulement en erreur) et « Réessayer », qui relance le seul fichier des temps. Le
 * bouton disparaît une fois touché (retour au chargement) : le focus va d'abord au titre du bloc (`focusApres`), sans
 * faire défiler la feuille (leçon 2026-10-14-feuille-a-onglets-panneau-court-et-page-qui-glisse).
 */
export function TempsIndisponibles({ onReessayer, focusApres }: { onReessayer: () => void; focusApres: RefObject<HTMLElement | null> }) {
  return (
    <div className="flex flex-col items-start gap-1">
      <p role="alert" className="text-texte">
        Temps des services indisponibles.
      </p>
      <Button
        variant="lien"
        className="max-bureau:min-h-toucher"
        onClick={() => {
          focusApres.current?.focus({ preventScroll: true });
          onReessayer();
        }}
      >
        Réessayer
      </Button>
    </div>
  );
}

// Bloc « Services en voiture » de la fiche (R54, H159 ; design F, `FicheA` du prototype 2f300ae) : une colonne, libellé à
// gauche, valeur à droite en chiffres tabulaires, filets entre les lignes. Le texte lu d'une ligne reste
// « <Service> : <valeur> » (les deux-points, insécables, ne sont que pour les lecteurs d'écran). Pendant le chargement,
// « Chargement des temps… », hors de toute zone d'annonce (plan, « Annonces aux lecteurs d'écran ») ; en erreur, l'alerte
// n'existe que dans cet état (R57, H168).
export function FicheServices({ commune, temps, onReessayer }: Props) {
  const titre = useRef<HTMLHeadingElement>(null);
  return (
    <div className="flex w-full flex-col gap-2 pt-2">
      {/* tabIndex -1 : reçoit le focus après « Réessayer » (le bouton disparaît). */}
      <h3 ref={titre} tabIndex={-1} className="text-categorie uppercase text-muted-foreground">
        Services en voiture
      </h3>
      {temps.etat === 'chargement' && <p className="text-texte text-muted-foreground">Chargement des temps…</p>}
      {temps.etat === 'erreur' && <TempsIndisponibles onReessayer={onReessayer} focusApres={titre} />}
      {temps.etat === 'pret' && (
        <>
          <ul className="flex w-full flex-col">
            {lignesServices(temps.services, commune).map((l) => (
              <li key={l.cle} className="flex items-baseline justify-between gap-2 border-b border-border py-1 text-texte last:border-b-0">
                <span>
                  {l.libelle}
                  <span className="sr-only">{' '}:</span>
                </span>{' '}
                <span className="text-right text-texte-fort tabular-nums">{l.valeur}</span>
              </li>
            ))}
          </ul>
          <p className="text-secondaire text-muted-foreground">{LIMITES_SERVICES}</p>
          {phraseTraversee(temps.services, commune) && <p className="text-secondaire text-muted-foreground">{TRAVERSEE}</p>}
        </>
      )}
    </div>
  );
}
