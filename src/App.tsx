import { useEffect, useMemo, useRef, useState } from 'react';
import { MapView, type Fond } from './map/MapView';
import { PALIERS } from './map/style';
import { paddingCarte, type Repere } from './map/view';
import type { Rond } from './map/RankMarkers';
import { Fiche } from './ui/Fiche';
import { evaluer, type Commune, type Reglages } from './domain/score';
import { ecrireAdresse, lireAdresse } from './domain/url';
import { Settings } from './ui/Settings';
import { Legend } from './ui/Legend';
import { List } from './ui/List';
import { SizeChips } from './ui/SizeChips';
import { compte } from './domain/format';
import { color } from './theme/tokens';
import { avecDelai, DELAI_DONNEES_MS, indicateur } from './domain/chargement';
import { Status, type Message } from './ui/Status';
import { Mentions } from './ui/Mentions';
import { cn } from './lib/cn';

type Donnees = { communes: Commune[]; reperes: Repere[] };
type Ligne = [string, string, string, number | null, number | null, boolean, number | null];

async function lire<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} : ${r.status}`);
  return (await r.json()) as T;
}

async function charger(): Promise<Donnees> {
  const [c, r] = await Promise.all([lire<{ communes: Ligne[] }>('/data/communes.json'), lire<{ reperes: Repere[] }>('/data/reperes.json')]);
  const communes = c.communes.map(([code, nom, dep, population, loyerM2, estimationPropre, merKm]) => ({
    code,
    nom,
    dep,
    population,
    loyerM2,
    estimationPropre,
    merKm,
  }));
  return { communes, reperes: r.reperes };
}

export function App() {
  const [donnees, setDonnees] = useState<Donnees | null>(null);
  const [reglages, setReglages] = useState<Reglages>(() => lireAdresse(location.search));
  // R7 : l'adresse reflète les réglages effectifs, sans ajouter d'entrée à l'historique.
  useEffect(() => history.replaceState(null, '', ecrireAdresse(reglages)), [reglages]);

  // États de la page (details.md) : chargement → prête ou erreur ; « Réessayer » relance tout (H9).
  const [essai, setEssai] = useState(0);
  const [erreur, setErreur] = useState(false);
  const [prete, setPrete] = useState(false);
  const [fond, setFond] = useState<Fond>('ign');
  useEffect(() => {
    let annule = false;
    setDonnees(null);
    setErreur(false);
    setPrete(false);
    avecDelai(charger(), DELAI_DONNEES_MS).then(
      (d) => !annule && setDonnees(d),
      () => !annule && setErreur(true),
    );
    return () => {
      annule = true;
    };
  }, [essai]);
  const [indicateurVisible, setIndicateurVisible] = useState(false);
  const ind = useMemo(() => indicateur(setIndicateurVisible), []);
  useEffect(() => (prete || erreur ? ind.fin() : ind.debut()), [ind, prete, erreur]);
  useEffect(() => () => ind.arreter(), [ind]);
  // Cadrage de la carte : à 390 px, la bande au-dessus de la feuille (sa hauteur réelle, fiche ou liste).
  const feuille = useRef<HTMLDivElement>(null);
  const padding = () => {
    const f = feuille.current?.getBoundingClientRect();
    return paddingCarte(innerWidth, innerHeight, f && f.height > 0 ? innerHeight - f.top : undefined);
  };
  const message: Message = erreur ? 'erreur' : indicateurVisible ? 'chargement' : prete && fond === 'secours' ? 'fond-indisponible' : null;

  const [choisie, setChoisie] = useState<string | null>(null);
  const [retour, setRetour] = useState<string | null>(null);
  const index = useMemo(() => new Map(donnees?.communes.map((c, i) => [c.code, i])), [donnees]);

  const resultat = useMemo(() => (donnees ? evaluer(donnees.communes, reglages) : null), [donnees, reglages]);
  const ronds = useMemo<Rond[]>(
    () =>
      donnees && resultat
        ? resultat.classement.slice(0, 10).map((e) => {
            const i = index.get(e.commune.code)!;
            return { index: i, rang: e.rang!, nom: `${e.commune.nom} (${e.commune.dep})`, lngLat: [donnees.reperes[i][0], donnees.reperes[i][1]] };
          })
        : [],
    [donnees, resultat, index],
  );
  // Couleur de chaque commune : palier de son score ; page « sans plafond » : sable si elle a la bonne taille (D5, D17).
  const couleurs = useMemo(() => {
    if (!donnees || !resultat) return [];
    return donnees.communes.map((c) => {
      const e = resultat.parCode.get(c.code)!;
      if (!resultat.actif) return e.passe ? color['area-unranked'] : null;
      return e.palier ? PALIERS[e.palier - 1] : null;
    });
  }, [donnees, resultat]);

  return (
    <main className="fixed inset-0 overflow-hidden bg-background text-foreground">
      {donnees && !erreur && (
        <MapView
          reperes={donnees.reperes}
          couleurs={couleurs}
          choisie={choisie == null ? null : index.get(choisie)!}
          ronds={ronds}
          onChoisir={(i) => setChoisie(donnees.communes[i].code)}
          onPrete={() => setPrete(true)}
          onErreur={() => setErreur(true)}
          onFond={setFond}
          padding={padding}
        />
      )}
      {/* Bureau : panneaux posés sur la carte (la boîte s'efface). 390 px : une feuille en bas qui défile, à 56 % de la
          hauteur avec la liste (Figma 7:343) ; une fiche ouverte remplace les réglages et la feuille prend sa hauteur (11:667). */}
      <div
        ref={feuille}
        data-testid="feuille"
        className={cn(
          'bureau:contents',
          'max-bureau:absolute max-bureau:inset-x-0 max-bureau:bottom-0 max-bureau:flex max-bureau:flex-col max-bureau:overflow-y-auto',
          'max-bureau:rounded-t-sheet max-bureau:bg-card max-bureau:pt-2 max-bureau:shadow-feuille',
          choisie ? 'max-bureau:max-h-feuille' : 'max-bureau:h-feuille',
        )}
      >
        <div className="mx-4 h-rail w-poignee-feuille shrink-0 rounded-full bg-border bureau:hidden" aria-hidden="true" />
        <div className={cn('bureau:absolute bureau:left-4 bureau:top-4 bureau:w-reglages', choisie && 'max-bureau:hidden')}>
          <Settings reglages={reglages} onChange={setReglages} inactif={!prete}>
            <SizeChips tailles={reglages.tailles} onChange={(tailles) => setReglages({ ...reglages, tailles })} disabled={!prete} />
            {/* Compte annoncé aux lecteurs d'écran (D17) ; absent sans plafond. À 390 px, il est écrit en tête de la liste. */}
            <p role="status" className="text-texte-fort max-bureau:sr-only">
              {resultat?.actif ? compte(resultat.classement.length) : ''}
            </p>
          </Settings>
        </div>
        {resultat && (
          <div className="bureau:absolute bureau:right-4 bureau:top-4 bureau:w-liste">
            {choisie ? (
              <Fiche evaluation={resultat.parCode.get(choisie)!} resultat={resultat} onRetour={() => { setRetour(choisie); setChoisie(null); }} />
            ) : (
              <List resultat={resultat} onChoisir={setChoisie} focusCode={retour} />
            )}
          </div>
        )}
        {!choisie && <Mentions className="mx-4 mb-4 bureau:hidden" />}
      </div>
      <Status message={message} onReessayer={() => setEssai((n) => n + 1)} />
      {/* Après la feuille, pour qu'au clavier les réglages et la liste passent avant les mentions. Légende puis mentions,
          en bas à gauche, sans passer sous le zoom ni la liste ; à 390 px, la légende seule, en haut à gauche. */}
      <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex items-end gap-4 max-bureau:bottom-auto max-bureau:left-3 max-bureau:top-3">
        <div className="flex min-w-0 flex-1 flex-col items-start gap-2 *:pointer-events-auto">
          <Legend sansPlafond={resultat ? !resultat.actif : false} fondIndisponible={fond === 'secours'} />
          <Mentions className="max-bureau:hidden" />
        </div>
        <div className="w-bouton-icone shrink-0 max-bureau:hidden" />
        <div className="w-liste shrink-0 max-bureau:hidden" />
      </div>
    </main>
  );
}
