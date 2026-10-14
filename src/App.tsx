import { useEffect, useMemo, useRef, useState } from 'react';
import { MapView, type Fond } from './map/MapView';
import { PALIERS } from './map/style';
import { paddingCarte, type Repere } from './map/view';
import type { Rond } from './map/RankMarkers';
import { Fiche } from './ui/Fiche';
import { evaluer, type Commune, type Reglages } from './domain/score';
import { ecrireAdresse, lireAdresse, lirePrix } from './domain/url';
import { joindreAchats, type AchatJson } from './domain/prix';
import { Settings } from './ui/Settings';
import { Legend } from './ui/Legend';
import { List } from './ui/List';
import { SizeChips } from './ui/SizeChips';
import { compte, nomAffiche } from './domain/format';
import { color, layout, space } from './theme/tokens';
import { avecDelai, DELAI_DONNEES_MS, indicateur } from './domain/chargement';
import { Status, type Message } from './ui/Status';
import { Mentions } from './ui/Mentions';
import { cn } from './lib/cn';
import { useProches } from './proches/useProches';
import { Proches } from './ui/Proches';
import { Pastilles } from './ui/Pastilles';
import type { RepereProche } from './map/ProcheMarkers';
import { FeuilleMobile, type Onglet } from './ui/FeuilleMobile';

type Donnees = { communes: Commune[]; reperes: Repere[] };
const REPRISE_ADRESSE_MS = 1000;
type Ligne = [string, string, string, number | null, number | null, boolean, number | null, number | null, boolean | null];

/** Largeur de bureau (≥ 1 024 px) : panneaux posés sur la carte ; en dessous, la feuille mobile (D1 d'interface-telephone). */
const REQUETE_BUREAU = `(min-width: ${layout['largeur-bureau']}px)`;
function useBureau() {
  const [bureau, setBureau] = useState(() => matchMedia(REQUETE_BUREAU).matches);
  useEffect(() => {
    const m = matchMedia(REQUETE_BUREAU);
    const maj = () => setBureau(m.matches);
    m.addEventListener('change', maj);
    return () => m.removeEventListener('change', maj);
  }, []);
  return bureau;
}

async function lire<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} : ${r.status}`);
  return (await r.json()) as T;
}

// H68 : les prix d'achat se chargent avec les communes (même chargement, même erreur), joints par code INSEE.
async function charger(): Promise<Donnees> {
  const [c, r, a] = await Promise.all([
    lire<{ communes: Ligne[] }>('/data/communes.json'),
    lire<{ reperes: Repere[] }>('/data/reperes.json'),
    lire<AchatJson>('/data/achat.json'),
  ]);
  const communes = c.communes.map(([code, nom, dep, population, loyerM2, estimationPropre, merKm, loyerM2Maison, estimationPropreMaison]) => ({
    code,
    nom,
    dep,
    population,
    loyerM2,
    estimationPropre,
    merKm,
    loyerM2Maison,
    estimationPropreMaison,
  }));
  return { communes: joindreAchats(communes, a), reperes: r.reperes };
}

export function App() {
  const [donnees, setDonnees] = useState<Donnees | null>(null);
  const [reglages, setReglages] = useState<Reglages>(() => lireAdresse(location.search));
  // Réglage du prix (spec immobilier, R21, R26) : lu dans l'adresse ; son bloc de réglage arrive en tâche 2.
  const [prix] = useState(() => lirePrix(location.search));
  // R7 : l'adresse reflète les réglages effectifs, sans ajouter d'entrée à l'historique. Un curseur glissé dépasse
  // les limites des navigateurs : Safari lève une erreur après 100 réécritures en 30 s, Chrome ignore sans rien dire
  // au-delà de 200 en 10 s. On relit l'adresse et on réessaie plus tard, sans faire tomber la page.
  useEffect(() => {
    const voulue = ecrireAdresse(reglages, prix);
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
  }, [reglages, prix]);

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
  const bureau = useBureau();
  // Cadrage de la carte : sous 1 024 px, la bande au-dessus de la feuille (sa hauteur réelle, onglets ou fiche). Une
  // commune choisie feuille repliée ouvre la feuille : on se cadre alors sur la hauteur de la feuille ouverte, calculée par
  // les jetons, et non sur la feuille en train de monter (R19).
  const feuille = useRef<HTMLDivElement>(null);
  const ouverture = useRef(false);
  const padding = () => {
    if (ouverture.current) {
      ouverture.current = false;
      return paddingCarte(innerWidth, innerHeight);
    }
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
  // Sous 1 024 px : feuille repliée en une barre (R17), ouverte au départ (D3). Plier ou déplier ne bouge pas la carte (D8).
  const [repliee, setRepliee] = useState(false);
  // 390 px : tant que l'ajout d'un proche a le focus, la feuille monte en haut, pour que le champ et ses suggestions
  // restent au-dessus du clavier (Figma 27:1160).
  const [ajout, setAjout] = useState(false);
  const [retour, setRetour] = useState<string | null>(null);
  // Ni repli pendant le chargement, l'erreur ou l'ajout : la feuille y est ouverte (details.md).
  const feuilleRepliee = !bureau && repliee && prete && !erreur && !ajout;
  // Sous 1 024 px : l'onglet affiché de la feuille, « Critères » au départ (D5) ; le retour de la fiche mène à la liste (R19).
  const [onglet, setOnglet] = useState<Onglet>('criteres');
  const retourListe = () => {
    setRetour(choisie);
    setChoisie(null);
    setOnglet('liste');
  };
  // R19 : choisir une commune, sur la carte ou dans la liste, ouvre sa fiche et ouvre la feuille si elle était repliée.
  const choisir = (code: string) => {
    if (feuilleRepliee && code !== choisie) ouverture.current = true;
    setRepliee(false);
    setChoisie(code);
  };
  const index = useMemo(() => new Map(donnees?.communes.map((c, i) => [c.code, i])), [donnees]);
  /** Index de la commune choisie dans communes.json (ordre des repères et des temps des proches), ou null. */
  const indexChoisie = choisie == null ? null : index.get(choisie)!;

  // Proches (spec proches) : gardés dans ce navigateur, hors de l'adresse de la page (D7, R12) ; les prêts comptent dans le score (R11).
  const codes = useMemo(() => donnees?.communes.map((c) => c.code) ?? null, [donnees]);
  const proches = useProches(donnees?.reperes ?? null, codes);
  // Repères des proches (D4) : au point de départ, quel que soit l'état.
  const reperesProches = useMemo<RepereProche[]>(
    () => proches.proches.map((p) => ({ id: p.id, nom: p.nom, etat: p.etat, lngLat: p.depart ?? p.lieu.point })),
    [proches.proches],
  );
  const resultat = useMemo(
    () => (donnees ? evaluer(donnees.communes, reglages, proches.prets, prix) : null),
    [donnees, reglages, proches.prets, prix],
  );
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

  // Compte annoncé aux lecteurs d'écran : l'unique zone `role=status` de la page, vide sans plafond (D17 de loyer-mer).
  const annonce = resultat?.actif ? compte(resultat.classement.length) : '';
  const reglagesUI = (pied?: React.ReactNode) => (
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
      {pied}
    </Settings>
  );
  const fiche =
    resultat && choisie ? (
      <Fiche evaluation={resultat.parCode.get(choisie)!} total={resultat.classement.length} proches={proches.proches} index={indexChoisie!} onRetour={retourListe} />
    ) : null;
  const liste = resultat && <List resultat={resultat} onChoisir={choisir} focusCode={retour} avecProche={proches.prets.length > 0} />;

  return (
    // `overflow-clip` et non `overflow-hidden` : la page ne défile jamais, même quand un élément se fait voir (`focus()`,
    // `scrollIntoView`) au bout d'un panneau de la feuille trop court pour le centrer ; elle glissait alors vers le haut.
    <main className="fixed inset-0 overflow-clip bg-background text-foreground">
      {donnees && !erreur && (
        <MapView
          reperes={donnees.reperes}
          couleurs={couleurs}
          choisie={indexChoisie}
          sansPlafond={resultat?.actif === false}
          ronds={ronds}
          proches={reperesProches}
          onChoisir={(i) => choisir(donnees.communes[i].code)}
          onPrete={() => setPrete(true)}
          onErreur={() => setErreur(true)}
          onFond={setFond}
          padding={padding}
          sansZoom={ajout}
        />
      )}
      {donnees && !erreur && <Pastilles proches={proches.proches} commune={indexChoisie} />}
      {bureau ? (
        // Bureau : panneaux posés sur la carte (la boîte s'efface), réglages à gauche, liste ou fiche à droite.
        <div ref={feuille} data-testid="feuille" className="contents">
          {/* Le panneau s'arrête au-dessus de la légende et défile, le compte collé en bas (Figma 22:486). */}
          <div
            style={{ '--bas-reglages': `${basReglages}px` } as React.CSSProperties}
            className="pointer-events-none absolute left-4 top-4 bottom-(--bas-reglages) flex w-reglages flex-col *:pointer-events-auto"
          >
            {reglagesUI(
              // Compte annoncé aux lecteurs d'écran (D17) ; absent sans plafond.
              <p role="status" className="sticky bottom-0 -mx-4 border-t border-border bg-card p-4 text-texte-fort">
                {annonce}
              </p>,
            )}
          </div>
          {resultat && <div className="absolute right-4 top-4 w-liste">{fiche ?? liste}</div>}
        </div>
      ) : (
        <FeuilleMobile
          ref={feuille}
          onglet={onglet}
          onOnglet={setOnglet}
          ajout={ajout}
          compte={resultat?.actif === false ? 'Aucun plafond fixé' : annonce}
          annonce={annonce}
          criteres={
            <>
              {reglagesUI()}
              <Mentions className="mx-4 mb-4" />
            </>
          }
          liste={
            <>
              {!choisie && liste}
              <Mentions className="mx-4 mb-4" />
            </>
          }
          fiche={fiche}
          repliee={feuilleRepliee}
          onRepliee={setRepliee}
          pret={prete && !erreur}
        />
      )}
      <Status message={message} onReessayer={() => setEssai((n) => n + 1)} repliee={feuilleRepliee} />
      {/* Sous 1 024 px : la bande de carte dit pourquoi elle est vide (état « aucune commune », H12 de loyer-mer), comme
          « Fond de carte indisponible ». Déjà annoncé par le compte : caché aux lecteurs d'écran. Feuille repliée, la barre
          le dit seule (H50). */}
      {resultat?.actif && resultat.classement.length === 0 && !choisie && !ajout && !feuilleRepliee && message == null && (
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
