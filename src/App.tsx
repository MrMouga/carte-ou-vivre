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
import { compte, nomAffiche } from './domain/format';
import { color, space } from './theme/tokens';
import { avecDelai, DELAI_DONNEES_MS, indicateur } from './domain/chargement';
import { Status, type Message } from './ui/Status';
import { Mentions } from './ui/Mentions';
import { cn } from './lib/cn';
import { useProches } from './proches/useProches';
import { Proches } from './ui/Proches';
import { Pastilles } from './ui/Pastilles';
import type { RepereProche } from './map/ProcheMarkers';

type Donnees = { communes: Commune[]; reperes: Repere[] };
const REPRISE_ADRESSE_MS = 1000;
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
  // R7 : l'adresse reflète les réglages effectifs, sans ajouter d'entrée à l'historique. Un curseur glissé dépasse
  // les limites des navigateurs : Safari lève une erreur après 100 réécritures en 30 s, Chrome ignore sans rien dire
  // au-delà de 200 en 10 s. On relit l'adresse et on réessaie plus tard, sans faire tomber la page.
  useEffect(() => {
    const voulue = ecrireAdresse(reglages);
    let reprise: ReturnType<typeof setTimeout> | undefined;
    const ecrire = () => {
      try {
        history.replaceState(null, '', voulue);
      } catch {
        // Safari : refusé, on réessaie ci-dessous.
      }
      if (location.pathname + location.search !== voulue) reprise = setTimeout(ecrire, REPRISE_ADRESSE_MS);
    };
    ecrire();
    return () => clearTimeout(reprise);
  }, [reglages]);

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
  // Bureau : hauteur réservée sous le panneau de réglages = de la légende au bas de l'écran, plus l'écart des panneaux.
  const pied = useRef<HTMLDivElement>(null);
  const [basReglages, setBasReglages] = useState(0);
  useEffect(() => {
    const el = pied.current!;
    const maj = () => setBasReglages(innerHeight - el.getBoundingClientRect().top + space['space-4']);
    const ro = new ResizeObserver(maj);
    ro.observe(el);
    addEventListener('resize', maj);
    return () => {
      ro.disconnect();
      removeEventListener('resize', maj);
    };
  }, []);
  const message: Message = erreur ? 'erreur' : indicateurVisible ? 'chargement' : prete && fond === 'secours' ? 'fond-indisponible' : null;

  const [choisie, setChoisie] = useState<string | null>(null);
  // 390 px : tant que l'ajout d'un proche a le focus, la feuille monte en haut, pour que le champ et ses suggestions
  // restent au-dessus du clavier (Figma 27:1160).
  const [ajout, setAjout] = useState(false);
  const [retour, setRetour] = useState<string | null>(null);
  const index = useMemo(() => new Map(donnees?.communes.map((c, i) => [c.code, i])), [donnees]);

  // Proches (spec proches) : gardés dans ce navigateur, hors de l'adresse de la page (D7, R12) ; les prêts comptent dans le score (R11).
  const codes = useMemo(() => donnees?.communes.map((c) => c.code) ?? null, [donnees]);
  const proches = useProches(donnees?.reperes ?? null, codes);
  // Repères des proches (D4) : au point de départ, quel que soit l'état.
  const reperesProches = useMemo<RepereProche[]>(
    () => proches.proches.map((p) => ({ id: p.id, nom: p.nom, etat: p.etat, lngLat: p.depart ?? p.lieu.point })),
    [proches.proches],
  );
  const resultat = useMemo(() => (donnees ? evaluer(donnees.communes, reglages, proches.prets) : null), [donnees, reglages, proches.prets]);
  const ronds = useMemo<Rond[]>(
    () =>
      donnees && resultat
        ? resultat.classement.slice(0, 10).map((e) => {
            const i = index.get(e.commune.code)!;
            return { index: i, rang: e.rang!, nom: nomAffiche(e.commune), lngLat: [donnees.reperes[i][0], donnees.reperes[i][1]] };
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
          sansPlafond={resultat?.actif === false}
          ronds={ronds}
          proches={reperesProches}
          onChoisir={(i) => setChoisie(donnees.communes[i].code)}
          onPrete={() => setPrete(true)}
          onErreur={() => setErreur(true)}
          onFond={setFond}
          padding={padding}
          sansZoom={ajout}
        />
      )}
      {donnees && !erreur && <Pastilles proches={proches.proches} commune={choisie == null ? null : index.get(choisie)!} />}
      {/* Bureau : panneaux posés sur la carte (la boîte s'efface). 390 px : une feuille en bas qui défile, à 56 % de la
          hauteur avec la liste (Figma 7:343) ; une fiche ouverte remplace les réglages et la feuille prend sa hauteur (11:667) ;
          pendant l'ajout d'un proche, elle monte jusqu'à la bande de carte du haut (27:1160). */}
      <div
        ref={feuille}
        data-testid="feuille"
        className={cn(
          'bureau:contents',
          'max-bureau:absolute max-bureau:inset-x-0 max-bureau:bottom-0 max-bureau:flex max-bureau:flex-col max-bureau:overflow-y-auto',
          'max-bureau:rounded-t-sheet max-bureau:bg-card max-bureau:shadow-feuille',
          choisie ? 'max-bureau:max-h-feuille' : ajout ? 'max-bureau:top-bande-carte max-bureau:z-3' : 'max-bureau:h-feuille',
        )}
      >
        {/* La poignée reste en haut quand la feuille défile : ce qui défile passe dessous, sans être coupé au bord. */}
        <div className="sticky top-0 z-1 shrink-0 bg-card pt-2 bureau:hidden" aria-hidden="true">
          <div className="mx-4 h-rail w-poignee-feuille rounded-full bg-border" />
        </div>
        {/* Bureau : le panneau s'arrête au-dessus de la légende et défile, le compte collé en bas (Figma 22:486). */}
        <div
          style={{ '--bas-reglages': `${basReglages}px` } as React.CSSProperties}
          className={cn(
            'bureau:pointer-events-none bureau:absolute bureau:left-4 bureau:top-4 bureau:bottom-(--bas-reglages) bureau:flex bureau:w-reglages bureau:flex-col bureau:*:pointer-events-auto',
            choisie && 'max-bureau:hidden',
          )}
        >
          <Settings reglages={reglages} onChange={setReglages} inactif={!prete}>
            <SizeChips tailles={reglages.tailles} onChange={(tailles) => setReglages({ ...reglages, tailles })} disabled={!prete} />
            <Proches
              proches={proches.proches}
              onAjouter={proches.ajouter}
              onPlafond={proches.regler}
              onReessayer={proches.reessayer}
              onRetirer={proches.retirer}
              onEffacer={proches.effacer}
              memoireRefusee={proches.memoireRefusee}
              inactif={!prete}
              onAjout={setAjout}
              monte={ajout}
            />
            {/* Compte annoncé aux lecteurs d'écran (D17) ; absent sans plafond. À 390 px, il est écrit en tête de la liste. */}
            <p role="status" className="text-texte-fort max-bureau:sr-only bureau:sticky bureau:bottom-0 bureau:-mx-4 bureau:border-t bureau:border-border bureau:bg-card bureau:p-4">
              {resultat?.actif ? compte(resultat.classement.length) : ''}
            </p>
          </Settings>
        </div>
        {resultat && (
          <div className="bureau:absolute bureau:right-4 bureau:top-4 bureau:w-liste">
            {choisie ? (
              <Fiche
                evaluation={resultat.parCode.get(choisie)!}
                total={resultat.classement.length}
                proches={proches.proches}
                index={index.get(choisie)!}
                onRetour={() => { setRetour(choisie); setChoisie(null); }}
              />
            ) : (
              <List resultat={resultat} onChoisir={setChoisie} focusCode={retour} avecProche={proches.prets.length > 0} />
            )}
          </div>
        )}
        {!choisie && <Mentions className="mx-4 mb-4 bureau:hidden" />}
        {/* Pendant l'ajout, de quoi faire défiler le champ jusqu'en haut même quand la liste est courte. */}
        {ajout && <div className="h-full shrink-0 bureau:hidden" aria-hidden="true" />}
      </div>
      <Status message={message} onReessayer={() => setEssai((n) => n + 1)} />
      {/* 390 px : la liste est sous les réglages, hors de l'écran ; la bande de carte dit pourquoi elle est vide (état
          « aucune commune »), comme « Fond de carte indisponible ». Déjà annoncé par le compte : caché aux lecteurs d'écran. */}
      {resultat?.actif && resultat.classement.length === 0 && !choisie && !ajout && message == null && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-4 bottom-feuille flex justify-center pb-2 bureau:hidden">
          <p data-testid="carte-vide" className="rounded-base border border-border bg-card px-2 py-1 text-secondaire">
            Aucune commune ne passe tes critères
          </p>
        </div>
      )}
      {/* Après la feuille, pour qu'au clavier les réglages et la liste passent avant les mentions. Légende puis mentions,
          en bas à gauche, sans passer sous le zoom ni la liste ; à 390 px, la légende seule, en haut à gauche. */}
      <div
        ref={pied}
        className={cn(
          'pointer-events-none absolute bottom-4 left-4 right-4 flex items-end gap-4 max-bureau:bottom-auto max-bureau:left-3 max-bureau:top-3',
          ajout && 'max-bureau:hidden', // la bande de carte au-dessus de la feuille montée est trop basse pour la légende
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col items-start gap-2 *:pointer-events-auto">
          <Legend sansPlafond={resultat?.actif === false} fondIndisponible={fond === 'secours'} />
          <Mentions className="max-bureau:hidden" />
        </div>
        <div className="w-bouton-icone shrink-0 max-bureau:hidden" />
        <div className="w-liste shrink-0 max-bureau:hidden" />
      </div>
    </main>
  );
}
