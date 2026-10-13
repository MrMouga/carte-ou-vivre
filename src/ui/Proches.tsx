import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { rechercher, type Suggestion } from '@/proches/ign';
import { NOM_MAX, nomPropose, type Proche } from '@/proches/useProches';
import { Categorie } from './Categorie';
import { LigneProche } from './LigneProche';

// Zone « Tes proches » du panneau de réglages (Figma 21:562, 22:486, 26:1588 ; details.md « Écrans et états ») :
// vide (texte et champ) ; avec proches (lignes, et le champ replié derrière « + Ajouter un proche », D13) ; recherche
// (3 caractères au moins, 300 ms après la dernière frappe, 5 suggestions au plus, H20) ; suggestion choisie → champ « Nom »
// prérempli et « Ajouter » actif (R9). « Ajouter » vide les champs. Messages (aucune adresse, panne, doublon, plein),
// « Effacer mes proches » et résumé détaillé : tâche 3.

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

const CHAMP = 'w-full rounded-base border border-border bg-card px-2 py-1 text-texte text-foreground disabled:opacity-50';

type AjoutProps = { onAjouter: (lieu: Suggestion, nom: string) => void; inactif: boolean; focus: boolean };

/** Recherche, suggestions, champ « Nom » et « Ajouter » (R9, H20). */
function Ajout({ onAjouter, inactif, focus }: AjoutProps) {
  const [texte, setTexte] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [choisie, setChoisie] = useState<Suggestion | null>(null);
  const [nom, setNom] = useState('');
  const idListe = useId();
  const idAdresse = useId();
  const idNom = useId();
  const champNom = useRef<HTMLInputElement>(null);
  const liste = useRef<HTMLUListElement>(null);
  // Bureau : le panneau défile jusqu'aux suggestions quand elles arrivent sous son bord (Figma 22:486).
  useEffect(() => {
    if (suggestions.length) liste.current?.scrollIntoView({ block: 'center' }); // « nearest » les laisse sous le compte collé
  }, [suggestions]);

  // Recherche 300 ms après la dernière frappe ; la réponse d'un texte dépassé est ignorée.
  useEffect(() => {
    if (choisie || texte.trim().length < MIN_CARACTERES) {
      setSuggestions([]);
      return;
    }
    const arret = new AbortController();
    const minuterie = setTimeout(() => {
      rechercher(texte, arret.signal).then(setSuggestions, () => !arret.signal.aborted && setSuggestions([])); // panne : message en tâche 3
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
    onAjouter(choisie, nom);
    setTexte('');
    setNom('');
    setChoisie(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={idAdresse} className="text-secondaire text-muted-foreground">
        Adresse ou ville
      </label>
      <input
        id={idAdresse}
        type="text"
        autoComplete="off"
        autoFocus={focus}
        aria-controls={idListe}
        value={texte}
        disabled={inactif}
        onChange={(e) => {
          setTexte(e.target.value);
          setChoisie(null);
        }}
        className={CHAMP}
      />
      <ul ref={liste} id={idListe} aria-label="Suggestions" hidden={suggestions.length === 0} className="flex flex-col rounded-base border border-border bg-card shadow-panneau">
          {suggestions.map((s) => {
            const [l1, l2] = lignesDe(s);
            return (
              <li key={`${s.libelle}|${s.point.join(',')}`}>
                <button
                  type="button"
                  aria-label={l2 ? `${l1}, ${l2}` : l1}
                  onClick={() => choisir(s)}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-base p-2 text-left hover:bg-background"
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
      <Button className="self-start" disabled={!choisie || inactif} onClick={ajouter}>
        Ajouter
      </Button>
    </div>
  );
}

type Props = {
  proches: Proche[];
  onAjouter: (lieu: Suggestion, nom: string) => void;
  onPlafond: (id: number, minutes: number) => void;
  onRetirer: (id: number) => void;
  /** Pendant le chargement de la page : les points des mairies ne sont pas encore là. */
  inactif: boolean;
};

export function Proches({ proches, onAjouter, onPlafond, onRetirer, inactif }: Props) {
  // D13 : dès un proche, le champ est replié derrière « + Ajouter un proche ».
  const [ouvert, setOuvert] = useState(false);
  const vide = proches.length === 0;
  // Après « Ajouter », le champ se replie : le focus passe au lien qui le rouvre, plutôt que de se perdre.
  const lien = useRef<HTMLButtonElement>(null);
  const refocus = useRef(false);
  useEffect(() => {
    if (refocus.current && lien.current) lien.current.focus();
    refocus.current = false;
  });
  return (
    <section aria-labelledby="titre-proches">
      <Categorie titre="Tes proches" resume={vide ? 'Aucun' : String(proches.length)} idTitre="titre-proches">
        {vide ? (
          <p className="text-secondaire text-muted-foreground">Ajoute l'adresse d'un proche : la carte calcule le temps en voiture jusqu'à chaque commune.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {proches.map((p) => (
              <LigneProche key={p.id} proche={p} onPlafond={(v) => onPlafond(p.id, v)} onRetirer={() => onRetirer(p.id)} />
            ))}
          </ul>
        )}
        {vide || ouvert ? (
          <Ajout
            inactif={inactif}
            focus={ouvert}
            onAjouter={(lieu, nom) => {
              onAjouter(lieu, nom);
              refocus.current = true;
              setOuvert(false);
            }}
          />
        ) : (
          <Button ref={lien} variant="lien" className="self-start" onClick={() => setOuvert(true)}>
            + Ajouter un proche
          </Button>
        )}
      </Categorie>
    </section>
  );
}
