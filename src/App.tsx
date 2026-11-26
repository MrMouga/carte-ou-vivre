import { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { MapView, type Fond } from './map/MapView';
import { PALIERS } from './map/style';
import { paddingCarte, type Repere } from './map/view';
import type { Rond } from './map/RankMarkers';
import { Fiche } from './ui/Fiche';
import { communeDeLigne, evaluer, joindreBords, type Commune, type LigneCommunes, type MairiesJson, type NuancesJson, type Reglages } from './domain/score';
import { ecrireAdresse, garderMetiersConnus, lireAdresse, lirePrix } from './domain/url';
import { joindreAchats, type AchatJson, type Changement } from './domain/prix';
import { joindreEmploi, lireEmploi, type Emploi, type EmploiJson } from './domain/emploi';
import { Settings } from './ui/Settings';
import { Legend } from './ui/Legend';
import { List } from './ui/List';
import { compte, nomAffiche } from './domain/format';
import { color, layout, space } from './theme/tokens';
import { avecDelai, DELAI_DONNEES_MS, indicateur } from './domain/chargement';
import { Status, type Message } from './ui/Status';
import { Mentions } from './ui/Mentions';
import { cn } from './lib/cn';
import { useProches } from './proches/useProches';
import { Proches } from './ui/Proches';
import { Services as CategorieServices } from './ui/Services';
import { Pastilles } from './ui/Pastilles';
import type { RepereProche } from './map/ProcheMarkers';
import { FeuilleMobile, type Onglet } from './ui/FeuilleMobile';
import { lireServices, type EtatServices, type Services, type ServicesJson } from './domain/services';
import { chargerCodesPostaux, indexerCodes, indexerNoms, type CodesPostaux } from './domain/recherche';
import { BoutonLoupe, Recherche, type ChoixRecherche } from './ui/Recherche';

type Donnees = { communes: Commune[]; reperes: Repere[]; emploi: Emploi; services?: Services };
/** Codes postaux (H187) : pas encore demandés, demandés, arrivés ou indisponibles. */
type EtatCodes = { etat: 'attente' | 'chargement' | 'indisponible' } | { etat: 'pret'; codes: CodesPostaux };
const REPRISE_ADRESSE_MS = 1000;

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
/** Le fichier des temps des services, lu (R57) : avec les autres données, ou à part après la carte. */
const chargerTemps = () => lire<ServicesJson>('/data/services.json').then(lireServices);

// H68 : les prix d'achat se chargent avec les communes (même chargement, même erreur), joints par code INSEE ; H122 de
// mairies : de même pour les mairies élues en 2026 et leurs nuances ; H140 d'emploi : de même pour l'emploi, dont les
// villes principales à 30 km de chaque commune sont calculées ici, une fois. R57 de services : avec `services` dans
// l'adresse (`avecServices`), les temps se chargent aussi ici, même chargement et même erreur, pour ne jamais montrer une
// liste non filtrée.
async function charger(avecServices: boolean): Promise<Donnees> {
  const [c, r, a, m, n, e, s] = await Promise.all([
    lire<{ communes: LigneCommunes[] }>('/data/communes.json'),
    lire<{ reperes: Repere[] }>('/data/reperes.json'),
    lire<AchatJson>('/data/achat.json'),
    lire<MairiesJson>('/data/mairies.json'),
    lire<NuancesJson>('/data/nuances.json'),
    lire<EmploiJson>('/data/emploi.json'),
    avecServices ? chargerTemps() : undefined,
  ]);
  const communes = joindreEmploi(joindreBords(joindreAchats(c.communes.map(communeDeLigne), a), m, n), e);
  return { communes, reperes: r.reperes, emploi: lireEmploi(e, communes, r.reperes), services: s };
}

export function App() {
  const [donnees, setDonnees] = useState<Donnees | null>(null);
  const [reglages, setReglages] = useState<Reglages>(() => lireAdresse(location.search));
  // Réglage du prix (spec immobilier, R21, R26) : lu dans l'adresse ; son plafond est `reglages.loyer`.
  const [prix, setPrix] = useState(() => lirePrix(location.search));
  /** R21, R23 : un changement du réglage du prix porte aussi son plafond (mode et unité le changent). */
  const changerPrix = (c: Changement) => {
    setPrix(c.prix);
    setReglages((r) => ({ ...r, loyer: c.plafond }));
  };
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
  // R57 : l'adresse d'ouverture filtre-t-elle déjà sur un service (paramètre présent, même si ses entrées sont invalides) ?
  const [servicesOuverture] = useState(() => new URLSearchParams(location.search).has('services'));
  // Temps des services (R57) : leur état, à part de celui des autres données.
  const [temps, setTemps] = useState<EtatServices>({ etat: 'chargement' });
  useEffect(() => {
    let annule = false;
    setDonnees(null);
    setErreur(false);
    setPrete(false);
    avecDelai(charger(servicesOuverture), DELAI_DONNEES_MS).then(
      (d) => {
        if (annule) return;
        setDonnees(d);
        if (d.services) setTemps({ etat: 'pret', services: d.services });
        // R48 : les métiers de l'adresse sont gardés tels quels jusqu'ici ; les codes inconnus partent, deux au plus restent.
        setReglages((r) => garderMetiersConnus(r, new Set(d.emploi.metiers.keys())));
      },
      () => !annule && setErreur(true),
    );
    return () => {
      annule = true;
    };
  }, [essai, servicesOuverture]);
  // Temps des services (R57, D14) : sans `services` dans l'adresse, demandés quand la carte est prête, avec le délai des
  // autres données ; leur état est à part (la carte et la liste n'attendent pas) et « Réessayer » ne relance qu'eux.
  // Chargés une fois : un rechargement de la page (« Réessayer » de la carte) garde des temps déjà arrivés. Avec
  // `services` dans l'adresse, ils arrivent avec les autres données (ci-dessus), et cet effet ne fait rien.
  const [essaiServices, setEssaiServices] = useState(0);
  const reessayerServices = () => setEssaiServices((n) => n + 1);
  const tempsPrets = temps.etat === 'pret';
  useEffect(() => {
    if (!prete || tempsPrets) return;
    let annule = false;
    setTemps({ etat: 'chargement' });
    avecDelai(chargerTemps(), DELAI_DONNEES_MS).then(
      (services) => !annule && setTemps({ etat: 'pret', services }),
      () => !annule && setTemps({ etat: 'erreur' }),
    );
    return () => {
      annule = true;
    };
  }, [prete, tempsPrets, essaiServices]);
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
  // restent au-dessus du clavier (Figma 27:1160). De même pour un champ de métier (emploi, R20 d'interface-telephone) ;
  // chacun son état, pour que seul le champ qui a fait monter la feuille s'y place.
  const [ajoutProche, setAjoutProche] = useState(false);
  const [ajoutMetier, setAjoutMetier] = useState(false);
  const ajout = ajoutProche || ajoutMetier;
  // Recherche d'une commune (recherche-et-mer, H177) : ouverte par la loupe. En bureau, le champ prend la place du titre ;
  // sous 1 024 px, la feuille monte comme pendant l'ajout et la recherche remplace tout sous la poignée.
  const [rechercheOuverte, setRechercheOuverte] = useState(false);
  const monte = ajout || (rechercheOuverte && !bureau);
  const [retour, setRetour] = useState<string | null>(null);
  // Ni repli pendant le chargement, l'erreur, l'ajout ou la recherche : la feuille y est ouverte (details.md).
  const feuilleRepliee = !bureau && repliee && prete && !erreur && !monte;
  // Sous 1 024 px : l'onglet affiché de la feuille, « Critères » au départ (D5) ; le retour de la fiche mène à la liste (R19).
  const [onglet, setOnglet] = useState<Onglet>('criteres');
  const retourListe = () => {
    setRetour(choisie);
    setChoisie(null);
    setOnglet('liste');
  };
  // R19 : choisir une commune, sur la carte ou dans la liste, ouvre sa fiche et ouvre la feuille si elle était repliée.
  // H184 : une autre commune que celle de la recherche vide le champ.
  const [choixRecherche, setChoixRecherche] = useState<ChoixRecherche | null>(null);
  const choisir = (code: string) => {
    if (feuilleRepliee && code !== choisie) ouverture.current = true;
    setRepliee(false);
    setChoisie(code);
    if (code !== choixRecherche?.code) setChoixRecherche(null);
  };
  // R59 : une suggestion choisie l'est comme sur la carte ou dans la liste (même cadrage, fiche ouverte, adresse inchangée,
  // H185). Sous 1 024 px, la recherche se ferme et la feuille montre la fiche ; en bureau, le champ reste et la montre (H184).
  const choisirRecherche = (c: Commune) => {
    choisir(c.code);
    setChoixRecherche({ code: c.code, texte: nomAffiche(c) });
    if (!bureau) setRechercheOuverte(false);
  };
  // La loupe : le champ est monté et placé (feuille montée au téléphone) dans ce rendu même, puis prend le focus, avant la
  // fin du toucher (leçon 2026-10-13 « iOS clavier : champ à sa place avant le focus »).
  const ouvrirRecherche = () => flushSync(() => setRechercheOuverte(true));
  // « Annuler » : le focus revient à la loupe, une fois qu'elle est de nouveau affichée (la demande attend sa cible, leçon
  // 2026-11-21 « focus demandé consommé par un rendu intermédiaire »).
  const focusLoupe = useRef(false);
  const annulerRecherche = () => {
    focusLoupe.current = true;
    setRechercheOuverte(false);
  };
  useEffect(() => {
    if (!focusLoupe.current) return;
    const loupe = [...document.querySelectorAll<HTMLButtonElement>('button[data-loupe]')].find((b) => b.getClientRects().length > 0);
    if (!loupe) return;
    focusLoupe.current = false;
    loupe.focus({ preventScroll: true });
  });
  const index = useMemo(() => new Map(donnees?.communes.map((c, i) => [c.code, i])), [donnees]);
  // H179 : les noms normalisés et triés une fois, à l'arrivée des données.
  const indexNoms = useMemo(() => (donnees ? indexerNoms(donnees.communes) : null), [donnees]);
  // H187 : les codes postaux se chargent à la première prise de focus du champ, une fois ; indisponibles, nouvel essai à la
  // prochaine prise de focus. Leur état vit ici : fermer la recherche ne les oublie pas.
  const [codesPostaux, setCodesPostaux] = useState<EtatCodes>({ etat: 'attente' });
  const demandeCodes = useRef(false);
  const demanderCodes = () => {
    if (demandeCodes.current || codesPostaux.etat === 'pret') return;
    demandeCodes.current = true;
    setCodesPostaux({ etat: 'chargement' });
    chargerCodesPostaux(() => lire<CodesPostaux>('/data/codes-postaux.json'))
      .then(
        (codes) => setCodesPostaux({ etat: 'pret', codes }),
        () => setCodesPostaux({ etat: 'indisponible' }),
      )
      .finally(() => (demandeCodes.current = false));
  };
  const indexCodes = useMemo(
    () => (donnees && codesPostaux.etat === 'pret' ? indexerCodes(codesPostaux.codes, donnees.communes) : null),
    [donnees, codesPostaux],
  );
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
  // R53 : les temps ne servent à l'évaluation que si un service est réglé ; leur arrivée seule ne recalcule rien.
  const tempsFiltre = temps.etat === 'pret' && reglages.services ? temps.services : undefined;
  const resultat = useMemo(
    () => (donnees ? evaluer(donnees.communes, reglages, proches.prets, prix, donnees.emploi, tempsFiltre) : null),
    [donnees, reglages, proches.prets, prix, tempsFiltre],
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
  // Couleur de chaque commune : palier de son score ; couleur neutre (sable) si elle passe sans score, c'est-à-dire page
  // « sans plafond » (D5, D17) ou commune sans note (prix inconnu, R25 d'immobilier) ; non peinte si elle ne passe pas.
  const couleurs = useMemo(() => {
    if (!donnees || !resultat) return [];
    return donnees.communes.map((c) => {
      const e = resultat.parCode.get(c.code)!;
      if (e.palier) return PALIERS[e.palier - 1];
      return e.passe ? color['area-unranked'] : null;
    });
  }, [donnees, resultat]);

  // Compte annoncé aux lecteurs d'écran : l'unique zone `role=status` de la page, vide sans plafond (D17 de loyer-mer).
  const annonce = resultat?.actif ? compte(resultat.classement.length) : '';
  // H188 : loupe et champ inactifs pendant le chargement et l'erreur de la page, comme les réglages.
  const rechercheInactive = !prete || erreur;
  const loupe = <BoutonLoupe onClick={ouvrirRecherche} disabled={rechercheInactive} />;
  const recherche = rechercheOuverte ? (
    <Recherche
      index={indexNoms}
      codes={indexCodes ?? (codesPostaux.etat === 'indisponible' ? 'indisponible' : 'chargement')}
      onFocus={demanderCodes}
      choix={choixRecherche}
      onChoisir={choisirRecherche}
      onEffacer={() => setChoixRecherche(null)}
      onAnnuler={annulerRecherche}
      disabled={rechercheInactive}
      className={bureau ? 'shrink-0' : 'flex-1'}
    />
  ) : undefined;
  const reglagesUI = (pied?: React.ReactNode) => (
    <Settings
      loupe={bureau ? <div className="-my-2">{loupe}</div> : undefined}
      recherche={bureau ? recherche : undefined}
      reglages={reglages}
      onChange={setReglages}
      prix={prix}
      onPrix={changerPrix}
      metiers={donnees?.emploi.metiers ?? null}
      inactif={!prete}
      onAjoutMetier={setAjoutMetier}
      monteMetier={ajoutMetier}
    >
      <Proches
        proches={proches.proches}
        onAjouter={proches.ajouter}
        onPlafond={proches.regler}
        onRecalculer={proches.recalculer}
        onRetirer={proches.retirer}
        onEffacer={proches.effacer}
        memoireRefusee={proches.memoireRefusee}
        inactif={!prete}
        onAjout={setAjoutProche}
        monte={ajoutProche}
      />
      {/* H151 : la dernière catégorie, après « Tes proches » ; inactive tant que les temps ne sont pas arrivés (R57). */}
      <CategorieServices
        reglages={reglages}
        onChange={setReglages}
        disabled={!prete || temps.etat !== 'pret'}
        erreur={temps.etat === 'erreur'}
        onReessayer={reessayerServices}
      />
      {pied}
    </Settings>
  );
  const fiche =
    resultat && choisie ? (
      <Fiche
        evaluation={resultat.parCode.get(choisie)!}
        total={resultat.classement.length}
        prix={prix}
        proches={proches.proches}
        index={indexChoisie!}
        emploi={donnees!.emploi}
        metiers={reglages.metiers}
        temps={temps}
        onReessayerServices={reessayerServices}
        onRetour={retourListe}
      />
    ) : null;
  const liste = resultat && <List resultat={resultat} prix={prix} onChoisir={choisir} focusCode={retour} avecProche={proches.prets.length > 0} />;

  return (
    // `overflow-clip` et non `overflow-hidden` : la page ne défile jamais, même quand un élément se fait voir (`focus()`,
    // `scrollIntoView`) au bout d'un panneau de la feuille trop court pour le centrer ; elle glissait alors vers le haut.
    <main className="fixed inset-0 overflow-clip bg-background text-foreground">
      {donnees && !erreur && (
        <MapView
          reperes={donnees.reperes}
          couleurs={couleurs}
          choisie={indexChoisie}
          ronds={ronds}
          proches={reperesProches}
          onChoisir={(i) => choisir(donnees.communes[i].code)}
          onPrete={() => setPrete(true)}
          onErreur={() => setErreur(true)}
          onFond={setFond}
          padding={padding}
          sansZoom={monte}
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
              <>
                {/* Les mentions (R63 de recherche-et-mer, piste C) : au bas du panneau, avant le compte, plus sur la carte. Le
                    texte aligné sur celui des catégories (`-mx-2` compense le rembourrage du bloc). */}
                <Mentions className="-mx-2 mt-2" trimestre={donnees?.emploi.trimestre} />
                {/* Compte annoncé aux lecteurs d'écran (D17) ; absent sans plafond. */}
                <p role="status" className="sticky bottom-0 -mx-4 border-t border-border bg-card p-4 text-texte-fort">
                  {annonce}
                </p>
              </>,
            )}
          </div>
          {/* De haut en bas de l'écran sans bloquer la carte ; une fiche plus haute que l'écran y défile (bloc des services). */}
          {resultat && <div className="pointer-events-none absolute right-4 top-4 bottom-4 flex w-liste flex-col *:pointer-events-auto">{fiche ?? liste}</div>}
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
              <Mentions className="mx-4 mb-4" trimestre={donnees?.emploi.trimestre} />
            </>
          }
          liste={
            <>
              {!choisie && liste}
              <Mentions className="mx-4 mb-4" trimestre={donnees?.emploi.trimestre} />
            </>
          }
          fiche={fiche}
          repliee={feuilleRepliee}
          onRepliee={setRepliee}
          pret={prete && !erreur}
          loupe={loupe}
          recherche={recherche}
        />
      )}
      <Status message={message} onReessayer={() => setEssai((n) => n + 1)} repliee={feuilleRepliee} />
      {/* Sous 1 024 px : la bande de carte dit pourquoi elle est vide (état « aucune commune », H12 de loyer-mer), comme
          « Fond de carte indisponible ». Déjà annoncé par le compte : caché aux lecteurs d'écran. Feuille repliée, la barre
          le dit seule (H50). */}
      {resultat?.actif && resultat.classement.length === 0 && !choisie && !monte && !feuilleRepliee && message == null && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-4 bottom-feuille flex justify-center pb-2 bureau:hidden">
          <p data-testid="carte-vide" className="rounded-base border border-border bg-card px-2 py-1 text-secondaire">
            Aucune commune ne passe tes critères
          </p>
        </div>
      )}
      {/* La légende, en bas à gauche, sans passer sous le zoom ni la liste ; à 390 px, en haut à gauche. Les mentions n'y
          sont plus (recherche-et-mer, R63) : au bas du panneau de réglages en bureau, au bas des onglets au téléphone. */}
      <div
        ref={pied}
        className={cn(
          'pointer-events-none absolute bottom-4 left-4 right-4 flex items-end gap-4 max-bureau:bottom-auto max-bureau:left-3 max-bureau:top-3',
          monte && 'max-bureau:hidden', // la bande de carte au-dessus de la feuille montée est trop basse pour la légende
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col items-start gap-2 *:pointer-events-auto">
          <Legend sansPlafond={resultat?.actif === false} fondIndisponible={fond === 'secours'} />
        </div>
        <div className="w-bouton-icone shrink-0 max-bureau:hidden" />
        <div className="w-liste shrink-0 max-bureau:hidden" />
      </div>
    </main>
  );
}
