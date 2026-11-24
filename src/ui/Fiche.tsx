import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { chomageFiche, distanceProche, estimationTexte, mairieFiche, merFiche, metierFiche, montagneFiche, nomAffiche, prixFiche, raisonTexte, rangTexte, tempsProche, typeTexte } from '@/domain/format';
import type { ReglagePrix } from '@/domain/prix';
import type { Evaluation, MetierChoisi, Raison } from '@/domain/score';
import { avecPlusProche, ligneMetier, type Emploi } from '@/domain/emploi';
import { cn } from '@/lib/cn';
import type { Proche } from '@/proches/useProches';
import { CLASSES_PALIER } from './Legend';
import { FicheServices } from './FicheServices';
import type { EtatServices } from '@/domain/services';

type Props = {
  evaluation: Evaluation;
  /** Nombre de communes qui passent (R6). */
  total: number;
  /** Réglage du prix : la ligne du prix est celle du mode et de l'unité choisis (R24, D7). */
  prix: ReglagePrix;
  /** Proches dans l'ordre d'ajout, et l'index de la commune dans communes.json (ordre de leurs temps). */
  proches: Proche[];
  index: number;
  /** Données de l'emploi : « le plus proche » des raisons d'un métier (R46), calculé à l'ouverture de la fiche. */
  emploi: Emploi;
  /** Métiers choisis, dans l'ordre du choix (R47) ; absent : aucun. */
  metiers?: MetierChoisi[];
  /** Temps des services (R54, R57) et « Réessayer » du seul fichier des temps. */
  temps: EtatServices;
  onReessayerServices: () => void;
  onRetour: () => void;
};

/**
 * Deux métiers peuvent écarter la même commune : la clé d'une raison de métier porte son code ; de même, celle d'un
 * service porte son nom (plusieurs services filtrés, R53).
 */
const cleRaison = (r: Raison) => (r.critere === 'metier' ? `metier-${r.code}` : r.critere === 'service' ? `service-${r.service}` : r.critere);

/**
 * Ligne d'un proche dans la fiche (details.md) : « Parents de Léa : 3 h 30 en voiture », « … : calcul en cours » ;
 * partiel (proches-fiables R34) : « Nantesville (44) : jusqu'à 2 h 30 en voiture », « … : plus de 2 h 45 en voiture » ;
 * km (R35) : « Rochelleville (17) : 88 km à vol d'oiseau ».
 */
export function ligneProche(p: Proche, index: number): string {
  if (p.etat === 'km' && p.distances) return `${p.nom} : ${distanceProche(p.distances[index])} à vol d'oiseau`;
  if ((p.etat !== 'pret' && p.etat !== 'partiel') || !p.temps) return `${p.nom} : calcul en cours`;
  return `${p.nom} : ${tempsProche(p.temps[index], p.zones)} en voiture`;
}

// Fiche (Figma « Fiche », frames 5:154 et 5:235) : passe (score, rang), ne passe pas (raisons), sans plafond ; commune sans
// note (R25 d'immobilier : passe, prix inconnu, aucun autre critère qui note) : ni score ni rang, la ligne dit pourquoi.
// Tranche proches (Figma 22:307) : sous la mer, « Tes proches » et une ligne par proche, dans tous les états de la fiche.
export function Fiche({ evaluation: e, total, prix, proches, index, emploi, metiers = [], temps, onReessayerServices, onRetour }: Props) {
  const c = e.commune;
  const estimation = estimationTexte(c, prix);
  const titre = useRef<HTMLHeadingElement>(null);
  // Le focus suit la commune choisie (la liste qui avait le focus a disparu).
  useEffect(() => titre.current?.focus(), [c.code]);
  return (
    <section aria-labelledby="titre-fiche" className="flex flex-col items-start gap-2 p-4 max-bureau:pb-2 bureau:min-h-0 bureau:overflow-y-auto bureau:rounded-panel bureau:border bureau:border-border bureau:bg-card bureau:shadow-panneau">
      <Button variant="lien" onClick={onRetour}>
        ← Les 10 premières
      </Button>
      <div className="flex flex-col">
        <h2 id="titre-fiche" ref={titre} tabIndex={-1} className="font-serif text-titre-fiche">
          {nomAffiche(c)}
        </h2>
        <p className="text-texte text-muted-foreground tabular-nums">{typeTexte(c.typeEnv, c.population)}</p>
      </div>
      {e.score != null && (
        <div className="flex flex-col">
          <p className="flex items-baseline gap-2">
            <span className={cn('size-echantillon rounded-echantillon', CLASSES_PALIER[e.palier! - 1])} aria-hidden="true" />
            <span className="text-score-grand tabular-nums">{e.score}</span>
            <span className="text-texte text-muted-foreground">/ 100</span>
          </p>
          <p className="text-texte text-muted-foreground tabular-nums">{rangTexte(e.rang!, total)}</p>
        </div>
      )}
      {!e.passe && (
        <div className="flex flex-col gap-1">
          <h3 className="text-categorie uppercase text-muted-foreground">Ne passe pas tes critères</h3>
          {/* H148 : un petit écart entre les raisons, pour que deux raisons longues (métiers) ne se lisent pas d'un bloc. */}
          <ul className="flex flex-col gap-1">
            {e.raisons.map((r) => (
              <li key={cleRaison(r)} className="text-texte-fort tabular-nums">
                {raisonTexte(r.critere === 'metier' ? avecPlusProche(emploi, index, r) : r)}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-col">
        <p className="text-texte tabular-nums">{prixFiche(c, prix)}</p>
        {estimation && <p className="text-secondaire text-muted-foreground">{estimation}</p>}
      </div>
      <p className="text-texte tabular-nums">{merFiche(c.merKm)}</p>
      {/* Cadre-de-vie, R30 : la montagne sous la mer. */}
      <p className="text-texte tabular-nums">{montagneFiche(c.montagneKm)}</p>
      {/* Mairies, R40 (D6, H112) : la mairie élue en 2026 sous la montagne, toujours affichée, sans mise en avant. */}
      <p className="text-texte tabular-nums">{mairieFiche(c)}</p>
      {/* Emploi, R47 (H139, design F) : sous « Mairie », une ligne par métier choisi, libellé en gras, puis le chômage,
          toujours présent. */}
      {metiers.map((m) => {
        const l = ligneMetier(emploi, index, m);
        if (!l) return null;
        const { libelle, reste } = metierFiche(l);
        return (
          <p key={m.code} className="text-texte tabular-nums">
            {/* Insécable avant « : » : un libellé long ne laisse pas les deux-points seuls en début de ligne. */}
            <span className="text-texte-fort">{libelle}</span>{' '}: {reste}
          </p>
        );
      })}
      <p className="text-texte tabular-nums">{chomageFiche(c, emploi.trimestre)}</p>
      {proches.length > 0 && (
        <div className="flex flex-col gap-1 pt-2">
          <h3 className="text-categorie uppercase text-muted-foreground">Tes proches</h3>
          <ul className="flex flex-col gap-1">
            {proches.map((p) => (
              <li key={p.id} className="text-texte tabular-nums">
                {ligneProche(p, index)}
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* Services, R54 : sous le chômage et, quand il existe, sous « Tes proches ». */}
      <FicheServices commune={c} temps={temps} onReessayer={onReessayerServices} />
    </section>
  );
}
