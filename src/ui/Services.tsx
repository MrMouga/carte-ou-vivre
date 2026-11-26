import { useId, useRef } from 'react';
import { resumeServices } from '@/domain/format';
import type { Reglages } from '@/domain/score';
import {
  cransService,
  libelleService,
  NIVEAUX_SCOLARITE,
  SERVICES_DEPART,
  SERVICES_SIMPLES,
  servicesVides,
  type NiveauScolarite,
  type ReglageServices,
  type ServiceSimple,
  type TypeGare,
} from '@/domain/services';
import { cn } from '@/lib/cn';
import { layout } from '@/theme/tokens';
import { Categorie } from './Categorie';
import { TempsIndisponibles } from './FicheServices';

// Catégorie « Services » (spec services, R51, H151 à H154, H167, H169 ; design F : docs/design/services/decisions.md,
// prototype `PisteA` du commit 2f300ae ; révisé le 2026-11-26, D19, D20). La dernière catégorie, après « Tes proches »,
// ouverte au départ. « Médecin », « Urgences » et « Supermarché » : libellé à gauche, Cases collées à droite ; « Scolarité » :
// Cases séparées des niveaux, puis le
// temps titré ; « Gare » : Choix souligné du type, puis le temps titré. Un filet sépare « Scolarité » et « Gare ».
// « Scolarité » : niveaux cumulables et temps commun ; filtre quand l'un et l'autre sont cochés (tâche 3b, R53, H153).

type Props = {
  reglages: Reglages;
  onChange: (r: Reglages) => void;
  disabled?: boolean;
  /** Le fichier des temps en erreur (R57) : l'erreur et « Réessayer » sous le titre, réglages affichés et inactifs. */
  erreur?: boolean;
  onReessayer?: () => void;
};

/** Une case : libellé entier, centré (contrat « Cases collées », « Cases séparées »). */
const CASE =
  'flex min-h-toucher cursor-pointer items-center justify-center p-1 text-center text-pastille text-foreground tabular-nums disabled:cursor-default disabled:opacity-50 max-bureau:scroll-my-1';

/**
 * Sous 1 024 px, une case touchée (ou atteinte au clavier) est amenée entière à l'écran dans l'onglet « Critères » (plan,
 * tâche 4) : Chromium ne fait pas défiler un élément focalisé déjà en partie visible (leçon
 * 2026-10-15-rangee-qui-defile-focus-clavier). Au focus, seulement celui du clavier (`:focus-visible`) : un défilement à
 * l'appui du doigt déplacerait la case sous lui avant le clic.
 */
const montrer = (el: HTMLElement) => {
  if (innerWidth < layout['largeur-bureau']) el.scrollIntoView({ block: 'nearest' });
};
const auFocus = (e: React.FocusEvent<HTMLElement>) => {
  if (e.currentTarget.matches(':focus-visible')) montrer(e.currentTarget);
};

const NIVEAUX = NIVEAUX_SCOLARITE.map((cle) => ({ cle, libelle: libelleService(cle) }));
const TYPES_GARE: { cle: TypeGare; libelle: string }[] = [
  { cle: 'gare', libelle: 'Toutes' },
  { cle: 'gare_regionale', libelle: 'Régionale' },
  { cle: 'gare_grandes_lignes', libelle: 'Grandes lignes' },
];

/** Le champ `services` des réglages : absent quand rien n'est coché et que le type de gare est « Toutes » (plan, « Le réglage »). */
function avecServices(r: Reglages, s: ReglageServices): Reglages {
  const { services: _, ...reste } = r;
  return servicesVides(s) ? reste : { ...reste, services: s };
}

/**
 * Cases collées (contrat du système) : boutons à bascule exclusifs, comme les distances de la mer (H153, D12 de
 * cadre-de-vie) ; cocher une case décoche l'autre, toucher la case cochée la décoche (`null` = peu importe). Le groupe est
 * nommé par sa ligne (`nomId`, ou `nom`).
 */
function Temps({ crans, valeur, onChange, disabled, nomId, nom, decritId, className }: {
  crans: readonly number[];
  valeur: number | null;
  onChange: (v: number | null) => void;
  disabled: boolean;
  nomId?: string;
  nom?: string;
  decritId?: string;
  className?: string;
}) {
  return (
    // Filets d'1 px : l'écart de la grille laisse voir le fond `border`. Pas d'`overflow-hidden` : il couperait le focus.
    <div
      role="group"
      aria-labelledby={nomId}
      aria-label={nom}
      aria-describedby={decritId}
      className={cn('grid grid-cols-3 gap-px rounded-chip border border-border bg-border', className)}
    >
      {crans.map((m) => {
        const cochee = valeur === m;
        return (
          <button
            key={m}
            type="button"
            aria-pressed={cochee}
            disabled={disabled}
            onFocus={auFocus}
            onClick={(e) => {
              montrer(e.currentTarget);
              onChange(cochee ? null : m);
            }}
            className={cn(CASE, 'bg-card first:rounded-l-chip last:rounded-r-chip aria-pressed:bg-primary aria-pressed:text-primary-foreground')}
          >
            {m}&nbsp;min
          </button>
        );
      })}
    </div>
  );
}

/** « Médecin », « Urgences », « Supermarché » : libellé à gauche, temps à droite, sur une ligne (piste A ; révision D19, D20). */
function Ligne({ cle, valeur, onChange, disabled }: { cle: ServiceSimple; valeur: number | null; onChange: (v: number | null) => void; disabled: boolean }) {
  const id = useId();
  return (
    <div className="grid grid-cols-5 items-center gap-2">
      <span id={id} className="col-span-2 text-pastille text-foreground">
        {libelleService(cle)}
      </span>
      <Temps crans={cransService(cle)} valeur={valeur} onChange={onChange} disabled={disabled} nomId={id} className="col-span-3" />
    </div>
  );
}

/** Titre visible au-dessus des temps de « Scolarité » et de « Gare » (H169). */
const TitreTemps = () => <span className="text-secondaire text-muted-foreground">Temps de trajet maximal</span>;

export function Services({ reglages, onChange, disabled = false, erreur = false, onReessayer = () => {} }: Props) {
  const titre = useRef<HTMLButtonElement>(null);
  const s = reglages.services ?? SERVICES_DEPART;
  const regler = (x: Partial<ReglageServices>) => onChange(avecServices(reglages, { ...s, ...x }));
  // Niveaux cumulables, gardés dans l'ordre des âges (H167).
  const basculerNiveau = (n: NiveauScolarite) =>
    regler({ niveaux: NIVEAUX_SCOLARITE.filter((x) => (x === n ? !s.niveaux.includes(n) : s.niveaux.includes(x))) });
  // État « incomplète » (details.md, H153) : des niveaux sans temps, ou un temps sans niveau. Gardé dans le réglage pour
  // le panneau, il ne filtre pas et n'est pas écrit dans l'adresse (`filtresServices`).
  const incomplete = s.niveaux.length > 0 !== (s.scolarite != null);
  const idPhrase = useId();
  const decrit = incomplete ? idPhrase : undefined;
  return (
    <Categorie titre="Services" resume={resumeServices(reglages)} refBouton={titre}>
      {/* R57 : en erreur, sous le titre ; les réglages restent affichés, inactifs (décidé par Claude, plan tâche 4). */}
      {erreur && <TempsIndisponibles onReessayer={onReessayer} focusApres={titre} />}
      <div className="flex flex-col gap-2">
        {SERVICES_SIMPLES.map((cle) => (
          <Ligne key={cle} cle={cle} valeur={s[cle]} onChange={(v) => regler({ [cle]: v })} disabled={disabled} />
        ))}
        <div className="flex flex-col gap-2 border-t border-border pt-2">
          <span className="text-pastille text-foreground">Scolarité</span>
          {/* Cases séparées des niveaux (contrat), cumulables, puis le temps commun. Pas de titre visible « Niveaux de
              scolarité » (design F, H169) ; le groupe garde son nom (H153). */}
          <div role="group" aria-label="Niveaux de scolarité" aria-describedby={decrit} className="flex flex-wrap gap-2">
            {NIVEAUX.map((n) => (
              <button
                key={n.cle}
                type="button"
                aria-pressed={s.niveaux.includes(n.cle)}
                disabled={disabled}
                onFocus={auFocus}
                onClick={(e) => {
                  montrer(e.currentTarget);
                  basculerNiveau(n.cle);
                }}
                className={cn(CASE, 'flex-auto rounded-chip border border-border bg-card aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground')}
              >
                {n.libelle}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-1">
            <TitreTemps />
            <Temps crans={cransService('ecole')} valeur={s.scolarite} onChange={(scolarite) => regler({ scolarite })} disabled={disabled} nom="Scolarité" decritId={decrit} />
          </div>
          {/* Phrase de l'état incomplet (H153) : reliée aux deux groupes par aria-describedby, dans aucune zone d'annonce
              (plan, « Annonces aux lecteurs d'écran »). */}
          {incomplete && (
            <p id={idPhrase} className="text-secondaire text-muted-foreground">
              Coche au moins un niveau et un temps.
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 border-t border-border pt-2">
          <span className="text-pastille text-foreground">Gare</span>
          {/* Choix souligné à trois valeurs (contrat) : un seul type, toujours un ; changer de type garde le temps coché.
              Pas de titre visible « Type de gare » (design F, H169) ; le groupe garde son nom (H153). */}
          <div role="group" aria-label="Type de gare" className="grid grid-cols-3 border-b border-border">
            {TYPES_GARE.map((t) => (
              <button
                key={t.cle}
                type="button"
                aria-pressed={s.gare === t.cle}
                disabled={disabled}
                onFocus={auFocus}
                onClick={(e) => {
                  montrer(e.currentTarget);
                  regler({ gare: t.cle });
                }}
                className={cn(
                  '-mb-px flex min-h-cible cursor-pointer items-center justify-center border-b-2 text-texte-fort disabled:cursor-default disabled:opacity-50 max-bureau:min-h-toucher max-bureau:scroll-my-1',
                  s.gare === t.cle ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground',
                )}
              >
                {t.libelle}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-1">
            <TitreTemps />
            <Temps crans={cransService('gare')} valeur={s.tempsGare} onChange={(tempsGare) => regler({ tempsGare })} disabled={disabled} nom="Gare" />
          </div>
        </div>
      </div>
    </Categorie>
  );
}
