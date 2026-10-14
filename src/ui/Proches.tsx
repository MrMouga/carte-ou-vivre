import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Button } from '@/components/ui/button';
import { rechercher, type Suggestion } from '@/proches/ign';
import { MAX_PROCHES, NOM_MAX, nomPropose, type Proche } from '@/proches/useProches';
import { geste, layout } from '@/theme/tokens';
import { Categorie } from './Categorie';
import { LigneProche } from './LigneProche';

// Zone « Tes proches » du panneau de réglages (Figma 21:562, 22:486, 26:1588 ; details.md « Écrans et états ») :
// vide (texte et champ) ; avec proches (lignes, et le champ replié derrière « + Ajouter un proche », D13) ; recherche
// (3 caractères au moins, 300 ms après la dernière frappe, 5 suggestions au plus, H20) ; suggestion choisie → champ « Nom »
// prérempli et « Ajouter » actif (R9). « Ajouter » vide les champs. Sous le champ : « Aucune adresse trouvée. », la panne de
// la recherche (R13) ou le doublon (R9). Plein (5 proches, tous états) : un message à la place du lien. « Effacer mes
// proches » sur la ligne du titre ; mémoire refusée (R12) : un message sous le titre. Repliée : le nombre et les états
// qui ne sont pas prêts (« 3 · 1 en calcul »).

const ATTENTE_RECHERCHE_MS = 300;
const MIN_CARACTERES = 3;

/** Les deux lignes d'une suggestion (Figma « Suggestion d'adresse » 18:151) : « 12 Rue de la Paix » / « 44000 Nantes ». */
function lignesDe(s: Suggestion): [string, string] {
  if (s.estCommune) return [s.libelle, 'Commune · départ de la mairie'];
  const m = /^(.*) (\d{5} .+)$/.exec(s.libelle);
  return m ? [m[1], m[2]] : [s.libelle, ''];
}

/** Icône de lieu de Figma (« Icône lieu », 14 × 14). */
function IconeLieu() {
  return (
    <svg viewBox="0 0 14 14" className="size-echantillon shrink-0 text-muted-foreground" aria-hidden="true">
      <path
        d="M7 1.16667C5.91703 1.16667 4.87842 1.59687 4.11265 2.36265C3.34687 3.12842 2.91667 4.16703 2.91667 5.25C2.91667 8.16667 7 12.8333 7 12.8333C7 12.8333 11.0833 8.16667 11.0833 5.25C11.0833 4.16703 10.6531 3.12842 9.88735 2.36265C9.12158 1.59687 8.08297 1.16667 7 1.16667ZM7 6.70833C6.61323 6.70833 6.24229 6.55469 5.9688 6.2812C5.69531 6.00771 5.54167 5.63677 5.54167 5.25C5.54167 4.86323 5.69531 4.49229 5.9688 4.2188C6.24229 3.94531 6.61323 3.79167 7 3.79167C7.38677 3.79167 7.75771 3.94531 8.0312 4.2188C8.30469 4.49229 8.45833 4.86323 8.45833 5.25C8.45833 5.63677 8.30469 6.00771 8.0312 6.2812C7.75771 6.55469 7.38677 6.70833 7 6.70833Z"
        fill="currentColor"
      />
    </svg>
  );
}

// 390 px : 44 px de haut (Figma 27:1160) et 16 px de texte, sans quoi Safari sur iPhone agrandit la page au focus.
const CHAMP =
  'w-full rounded-base border border-border bg-card px-2 py-1 text-texte text-foreground disabled:opacity-50 max-bureau:min-h-toucher max-bureau:text-(length:--taille-saisie)';
/** Cibles au toucher sous la largeur de bureau (contrat : 44 px). */
const TOUCHER = 'max-bureau:min-h-toucher';
const enBureau = () => innerWidth >= layout['largeur-bureau'];
/** Garde le focus où il est quand on appuie : sur iPhone, le champ perdrait le focus avant le clic, et la feuille redescendrait sous le doigt. */
const garderFocus = (e: React.MouseEvent) => e.preventDefault();

type AjoutProps = {
  onAjouter: (lieu: Suggestion, nom: string) => void;
  /** Libellés des proches déjà là : un doublon est refusé (R9). */
  libelles: string[];
  inactif: boolean;
  focus: boolean;
  champ: React.RefObject<HTMLInputElement | null>;
  /** Le focus entre dans l'ajout (champ, suggestions, « Nom », « Ajouter ») ou en sort. */
  onAjout?: (actif: boolean) => void;
  /** 390 px : la feuille est montée (App, en réponse à `onAjout`). */
  monte: boolean;
};

/** Message sous le champ, à la place des suggestions (tableau des états Figma 23:1616). */
type Avis = 'aucune' | 'panne' | 'doublon' | null;
const AVIS = {
  aucune: 'Aucune adresse trouvée.',
  panne: "Recherche d'adresse indisponible. Réessaie dans un moment.",
  doublon: 'Cette adresse est déjà dans tes proches.',
} as const;

/** Recherche, suggestions, champ « Nom » et « Ajouter » (R9, H20, R13). */
function Ajout({ onAjouter, libelles, inactif, focus, champ, onAjout, monte }: AjoutProps) {
  const [texte, setTexte] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [choisie, setChoisie] = useState<Suggestion | null>(null);
  const [nom, setNom] = useState('');
  const [avis, setAvis] = useState<Avis>(null);
  const idListe = useId();
  // « search » dans `id` et `name` : Safari ignore `autocomplete="off"` sur un champ qui ressemble à une adresse (libellé
  // « Adresse ou ville ») et propose la fiche contact de l'utilisateur (« AutoFill Contact ») ; il ne la propose pas sur
  // un champ de recherche. La seule suggestion attendue est celle de l'IGN.
  const idAdresse = `search-lieu${useId()}`;
  const idNom = `search-nom${useId()}`;
  const champNom = useRef<HTMLInputElement>(null);
  const liste = useRef<HTMLUListElement>(null);
  const bloc = useRef<HTMLDivElement>(null);
  // Bureau : le panneau défile jusqu'aux suggestions quand elles arrivent sous son bord (Figma 22:486). À 390 px, le champ
  // est déjà en haut de la feuille, les suggestions dessous.
  useEffect(() => {
    if (suggestions.length && enBureau()) liste.current?.scrollIntoView({ block: 'center' }); // « nearest » les laisse sous le compte collé
  }, [suggestions]);
  // Bureau : un message sous le champ (aucune adresse, panne, doublon) pousse « Ajouter » vers le bas ; le panneau défile
  // pour le garder entier au-dessus du compte collé (relecture navigateur, qa.md).
  const bouton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (avis && enBureau()) bouton.current?.scrollIntoView({ block: 'center' });
  }, [avis]);
  // 390 px : le focus entre dans l'ajout → la feuille monte (App), puis elle défile pour mettre le champ en haut, sous la
  // poignée : sur un iPhone, il ne reste qu'environ 340 px au-dessus du clavier. Marge `scroll-mt-1` : la moitié de l'écart
  // qui précède, pour que rien de coupé ne dépasse sous la poignée (depuis interface-telephone, la poignée est hors de
  // l'onglet qui défile ; avant, collée en haut de la feuille, elle couvrait 12 px de plus : `scroll-mt-4`).
  // Le défilement se fait dans le rendu qui monte la feuille (`useLayoutEffect`), avant la fin de l'événement `focus` :
  // c'est là que Safari sur iPhone relève où est le champ, pour faire glisser la page au-dessus du clavier. Un champ
  // déplacé plus tard (une image plus tard) sort de la partie glissée : le clavier s'ouvrait sur la liste, champ caché.
  useLayoutEffect(() => {
    if (!monte) return;
    if (!enBureau()) bloc.current?.scrollIntoView({ block: 'start' });
    // Ouvert par « + Ajouter un proche » : le focus vient seulement maintenant, champ déjà en place (même raison).
    if (focus && !bloc.current?.contains(document.activeElement)) champ.current?.focus();
  }, [monte]);
  // 390 px, toucher du champ alors que la feuille n'est pas montée (interface-telephone, R20 ; mesure de la tâche 0) :
  // Safari sur iPhone note la place du champ au tout début du focus, avant notre code, puis, à l'ouverture du clavier, fait
  // défiler la page pour centrer cette ancienne place ; le champ, remonté entre-temps, partait au-dessus de l'écran. On
  // fait donc comme « + Ajouter un proche » : au relâchement du doigt, on annule le focus du navigateur (et le clic qui
  // suit), on monte et on place la feuille tout de suite (`flushSync` : rendu et `useLayoutEffect` ci-dessus), puis on
  // donne le focus, champ déjà à sa place. Dans un `touchend`, iOS ouvre le clavier. Un doigt qui a bougé (défilement)
  // garde le comportement du navigateur ; le clavier physique et le bureau ne passent pas par ici.
  const toucher = useRef<{ x: number; y: number } | null>(null);
  const toucherDebut = (e: React.TouchEvent) => {
    const t = e.touches[0];
    toucher.current = e.touches.length === 1 ? { x: t.clientX, y: t.clientY } : null;
  };
  const toucherFin = (e: React.TouchEvent<HTMLInputElement>) => {
    const debut = toucher.current;
    toucher.current = null;
    const t = e.changedTouches[0];
    if (!debut || !t || monte || enBureau() || inactif || !e.cancelable) return;
    if (Math.hypot(t.clientX - debut.x, t.clientY - debut.y) >= geste['seuil-toucher']) return;
    e.preventDefault();
    flushSync(() => onAjout?.(true));
    e.currentTarget.focus({ preventScroll: true });
  };
  const entrer = (e: React.FocusEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget)) onAjout?.(true);
  };
  // Ouvert par « + Ajouter un proche » : la feuille monte d'abord, le champ prend le focus ensuite (ci-dessus). Focus déjà
  // dans l'ajout au montage (rendu de nouveau en mode strict) : lu ici plutôt que par l'événement, que React ne transmet
  // pas pendant le rendu et qui ne revient pas quand le champ a déjà le focus. L'ajout disparaît (proche ajouté) : la
  // feuille redescend, même si le navigateur n'annonce pas la perte du focus.
  useEffect(() => {
    if (focus || bloc.current?.contains(document.activeElement)) onAjout?.(true);
    return () => onAjout?.(false);
  }, []); // au montage seulement
  const sortir = (e: React.FocusEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget)) onAjout?.(false);
  };

  // Recherche 300 ms après la dernière frappe ; la réponse d'un texte dépassé est ignorée.
  useEffect(() => {
    if (choisie || texte.trim().length < MIN_CARACTERES) {
      setSuggestions([]);
      return;
    }
    const arret = new AbortController();
    const minuterie = setTimeout(() => {
      rechercher(texte, arret.signal).then(
        (s) => {
          setSuggestions(s);
          setAvis(s.length ? null : 'aucune');
        },
        () => {
          if (arret.signal.aborted) return;
          setSuggestions([]);
          setAvis('panne'); // R13 : la carte et le reste marchent
        },
      );
    }, ATTENTE_RECHERCHE_MS);
    return () => {
      clearTimeout(minuterie);
      arret.abort();
    };
  }, [texte, choisie]);

  const choisir = (s: Suggestion) => {
    setChoisie(s);
    setTexte(s.libelle);
    setNom(nomPropose(s));
    setSuggestions([]);
    requestAnimationFrame(() => champNom.current?.focus());
  };

  const ajouter = () => {
    if (!choisie) return;
    if (libelles.includes(choisie.libelle)) return setAvis('doublon'); // R9 : les champs restent, pour changer d'adresse
    onAjout?.(false); // dans le même rendu que le nouveau proche, pour que Proches le montre dans la feuille redescendue
    onAjouter(choisie, nom);
    setTexte('');
    setNom('');
    setChoisie(null);
  };

  return (
    <div ref={bloc} onFocus={entrer} onBlur={sortir} className="flex flex-col gap-2 max-bureau:scroll-mt-1">
      <label htmlFor={idAdresse} className="text-secondaire text-muted-foreground">
        Adresse ou ville
      </label>
      <input
        id={idAdresse}
        name="search-lieu"
        ref={champ}
        type="text"
        autoComplete="off"
        aria-controls={idListe}
        value={texte}
        disabled={inactif}
        onTouchStart={toucherDebut}
        onTouchEnd={toucherFin}
        onChange={(e) => {
          setTexte(e.target.value);
          setChoisie(null);
          setAvis(null);
        }}
        className={CHAMP}
      />
      {/* Toujours présent, pour que les lecteurs d'écran lisent chaque message (sans le rôle `status`, pris par le compte). */}
      <p aria-live="polite" className={avis ? 'text-texte text-foreground' : 'sr-only'}>
        {avis && AVIS[avis]}
      </p>
      <ul ref={liste} id={idListe} aria-label="Suggestions" hidden={suggestions.length === 0} className="flex flex-col rounded-base border border-border bg-card shadow-panneau">
          {suggestions.map((s) => {
            const [l1, l2] = lignesDe(s);
            return (
              <li key={`${s.libelle}|${s.point.join(',')}`}>
                <button
                  type="button"
                  aria-label={l2 ? `${l1}, ${l2}` : l1}
                  onMouseDown={garderFocus}
                  onClick={() => choisir(s)}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-base p-2 text-left hover:bg-background max-bureau:min-h-toucher max-bureau:py-1"
                >
                  <IconeLieu />
                  <span className="flex min-w-0 flex-col">
                    <span className="text-texte-fort">{l1}</span>
                    {l2 && <span className="text-secondaire text-muted-foreground">{l2}</span>}
                  </span>
                </button>
              </li>
            );
          })}
      </ul>
      {choisie && (
        <>
          <label htmlFor={idNom} className="text-secondaire text-muted-foreground">
            Nom
          </label>
          <input
            id={idNom}
            name="search-nom"
            ref={champNom}
            type="text"
            autoComplete="off"
            maxLength={NOM_MAX}
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && ajouter()}
            className={CHAMP}
          />
        </>
      )}
      <Button ref={bouton} className={`self-start ${TOUCHER}`} disabled={!choisie || inactif} onMouseDown={garderFocus} onClick={ajouter}>
        Ajouter
      </Button>
    </div>
  );
}

/** Résumé de la catégorie repliée (design decisions.md) : « Aucun », « 3 », « 3 · 1 en calcul », « 5 · 1 en attente, 2 indisponibles ». */
export function resumeDe(proches: Proche[]): string {
  if (!proches.length) return 'Aucun';
  const n = (e: Proche['etat']) => proches.filter((p) => p.etat === e).length;
  const etats = [
    [n('calcul'), 'en calcul', 'en calcul'],
    [n('attente'), 'en attente', 'en attente'],
    [n('indisponible'), 'indisponible', 'indisponibles'],
  ]
    .filter(([k]) => k)
    .map(([k, un, plusieurs]) => `${k} ${k === 1 ? un : plusieurs}`);
  return etats.length ? `${proches.length} · ${etats.join(', ')}` : String(proches.length);
}

type Props = {
  proches: Proche[];
  onAjouter: (lieu: Suggestion, nom: string) => void;
  onPlafond: (id: number, minutes: number) => void;
  onReessayer: (p: Proche) => void;
  onRetirer: (id: number) => void;
  onEffacer: () => void;
  /** Un enregistrement dans le navigateur a échoué (R12). */
  memoireRefusee: boolean;
  /** Pendant le chargement de la page : les points des mairies ne sont pas encore là. */
  inactif: boolean;
  /** Le focus entre dans l'ajout d'un proche ou en sort (390 px : la feuille monte, App). */
  onAjout?: (actif: boolean) => void;
  /** 390 px : la feuille est montée pour l'ajout (App). */
  monte?: boolean;
};

export function Proches({ proches, onAjouter, onPlafond, onReessayer, onRetirer, onEffacer, memoireRefusee, inactif, onAjout, monte = false }: Props) {
  // D13 : dès un proche, le champ est replié derrière « + Ajouter un proche ».
  const [ouvert, setOuvert] = useState(false);
  const vide = proches.length === 0;
  const plein = proches.length >= MAX_PROCHES;
  // Après « Ajouter », « Retirer » ou « Effacer mes proches », le bouton pressé disparaît : le focus passe au lien
  // « + Ajouter un proche », au champ s'il n'y a plus de proche, ou au message « 5 proches au maximum… » après le 5ᵉ,
  // plutôt que de se perdre.
  const lien = useRef<HTMLButtonElement>(null);
  const champ = useRef<HTMLInputElement>(null);
  const messagePlein = useRef<HTMLParagraphElement>(null);
  const refocus = useRef(false);
  // 390 px : après « Ajouter », la feuille redescend ; elle montre « Tes proches » en haut, ou au moins la ligne du nouveau
  // proche quand elle est plus bas.
  const section = useRef<HTMLElement>(null);
  const montrer = useRef(false);
  // Sous 1 024 px, le focus est donné sans faire défiler : le navigateur centrerait « + Ajouter un proche », au bout d'un
  // onglet trop court pour le centrer, et le titre comme la ligne du nouveau proche sortiraient du haut (feuille à 45 %,
  // interface-telephone). L'onglet défile pour poser le titre en haut, juste sous les onglets, entier avec « Effacer mes
  // proches » (relecture des corrections : avant, la ligne du nouveau proche puis « + Ajouter un proche » étaient amenés
  // en entier, et le titre passait à moitié sous les onglets). La ligne du nouveau proche commence alors dans l'onglet,
  // en entier ou en partie ; si elle tombe tout entière sous son bas (3 proches et plus à 390 × 664), elle passe avant le
  // titre, puis ce qui a le focus (le message « 5 proches au maximum… » après le 5ᵉ).
  useEffect(() => {
    const montrerIci = montrer.current && !enBureau();
    montrer.current = false;
    if (refocus.current) (lien.current ?? champ.current ?? messagePlein.current)?.focus({ preventScroll: montrerIci });
    refocus.current = false;
    if (montrerIci) {
      section.current?.scrollIntoView({ block: 'start' });
      const nouveau = section.current?.querySelector('ul > li:last-child');
      const onglet = section.current?.closest('[role="tabpanel"]');
      if (!nouveau || !onglet || nouveau.getBoundingClientRect().top < onglet.getBoundingClientRect().bottom) return;
      nouveau.scrollIntoView({ block: 'nearest' });
      const actif = document.activeElement;
      if (actif instanceof HTMLElement && section.current?.contains(actif)) actif.scrollIntoView({ block: 'nearest' });
    }
  });
  // Le focus revient au champ d'adresse (plus aucun proche, ou l'ajout était ouvert). Sous 1 024 px, par le chemin de
  // « + Ajouter un proche » : l'ajout s'ouvre avec le focus demandé, la feuille monte et se place, puis le champ prend le
  // focus (`useLayoutEffect` de l'ajout). Safari sur iPhone note la place du champ au début du focus : donné au champ
  // resté en bas, il le faisait cacher par le clavier (défaut vu en tâche 4, corrigé en corrections). Un ajout déjà
  // affiché ne remonte pas : la feuille monte ici. En bureau, le focus est rendu comme avant.
  const ajoutAffiche = !plein && (vide || ouvert);
  const versLeChamp = () => {
    if (enBureau()) {
      refocus.current = true;
      return;
    }
    setOuvert(true);
    if (ajoutAffiche) onAjout?.(true);
  };
  const effacer = (
    <Button
      variant="lien"
      className={TOUCHER}
      onClick={() => {
        onEffacer();
        setOuvert(false);
        versLeChamp();
      }}
    >
      Effacer mes proches
    </Button>
  );
  return (
    <section ref={section} aria-labelledby="titre-proches">
      <Categorie titre="Tes proches" resume={resumeDe(proches)} idTitre="titre-proches" action={vide ? undefined : effacer}>
        {memoireRefusee && <p className="text-texte text-foreground">Tes proches ne seront pas gardés sur ce navigateur.</p>}
        {vide ? (
          <p className="text-secondaire text-muted-foreground">Ajoute l'adresse d'un proche : la carte calcule le temps en voiture jusqu'à chaque commune.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {proches.map((p) => (
              <LigneProche
                key={p.id}
                proche={p}
                inactif={inactif}
                onPlafond={(v) => onPlafond(p.id, v)}
                onReessayer={() => onReessayer(p)}
                onRetirer={() => {
                  onRetirer(p.id);
                  if (proches.length === 1 || ouvert) versLeChamp();
                  else refocus.current = true;
                }}
              />
            ))}
          </ul>
        )}
        {plein ? (
          <p ref={messagePlein} tabIndex={-1} className="text-texte text-muted-foreground">
            5 proches au maximum. Retire-en un pour en ajouter un autre.
          </p>
        ) : ajoutAffiche ? (
          <Ajout
            champ={champ}
            libelles={proches.map((p) => p.lieu.libelle)}
            inactif={inactif}
            focus={ouvert}
            onAjout={onAjout}
            monte={monte}
            onAjouter={(lieu, nom) => {
              onAjouter(lieu, nom);
              refocus.current = true;
              montrer.current = true;
              setOuvert(false);
            }}
          />
        ) : (
          <Button ref={lien} variant="lien" className={`self-start ${TOUCHER}`} onClick={() => setOuvert(true)}>
            + Ajouter un proche
          </Button>
        )}
      </Categorie>
    </section>
  );
}
