import { useEffect, useMemo, useState } from 'react';
import { MapView } from './map/MapView';
import { PALIERS } from './map/style';
import { centre, type Formes } from './map/view';
import type { Rond } from './map/RankMarkers';
import { Fiche } from './ui/Fiche';
import { evaluer, REGLAGES_DEPART, type Commune, type Reglages } from './domain/score';
import { Settings } from './ui/Settings';
import { Legend } from './ui/Legend';
import { List } from './ui/List';
import { SizeChips } from './ui/SizeChips';
import { compte } from './domain/format';
import { color } from './theme/tokens';

type Donnees = { communes: Commune[]; formes: Formes };
type Ligne = [string, string, string, number | null, number | null, boolean, number | null];

async function charger(): Promise<Donnees> {
  const [c, formes] = await Promise.all([
    fetch('/data/communes.json').then((r) => r.json()) as Promise<{ communes: Ligne[] }>,
    fetch('/data/formes-1000m.json').then((r) => r.json()) as Promise<Formes>,
  ]);
  const communes = c.communes.map(([code, nom, dep, population, loyerM2, estimationPropre, merKm]) => ({
    code,
    nom,
    dep,
    population,
    loyerM2,
    estimationPropre,
    merKm,
  }));
  return { communes, formes };
}

export function App() {
  const [donnees, setDonnees] = useState<Donnees | null>(null);
  const [reglages, setReglages] = useState<Reglages>(REGLAGES_DEPART);

  useEffect(() => {
    void charger().then(setDonnees);
  }, []);

  const [choisie, setChoisie] = useState<string | null>(null);
  const [retour, setRetour] = useState<string | null>(null);
  const index = useMemo(() => new Map(donnees?.communes.map((c, i) => [c.code, i])), [donnees]);

  const resultat = useMemo(() => (donnees ? evaluer(donnees.communes, reglages) : null), [donnees, reglages]);
  const ronds = useMemo<Rond[]>(
    () =>
      donnees && resultat
        ? resultat.classement.slice(0, 10).map((e) => {
            const i = index.get(e.commune.code)!;
            return { index: i, rang: e.rang!, nom: `${e.commune.nom} (${e.commune.dep})`, lngLat: centre(donnees.formes.features[i].geometry) };
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
      {donnees && (
        <MapView
          formes={donnees.formes}
          couleurs={couleurs}
          choisie={choisie == null ? null : index.get(choisie)!}
          ronds={ronds}
          onChoisir={(i) => setChoisie(donnees.communes[i].code)}
        />
      )}
      <div className="absolute left-4 top-4 w-reglages">
        <Settings reglages={reglages} onChange={setReglages}>
          <SizeChips tailles={reglages.tailles} onChange={(tailles) => setReglages({ ...reglages, tailles })} />
          {/* Compte annoncé aux lecteurs d'écran (D17) ; absent sans plafond. */}
          <p role="status" className="text-texte-fort">
            {resultat?.actif ? compte(resultat.classement.length) : ''}
          </p>
        </Settings>
      </div>
      {resultat && (
        <div className="absolute right-4 top-4 w-liste">
          {choisie ? (
            <Fiche evaluation={resultat.parCode.get(choisie)!} resultat={resultat} onRetour={() => { setRetour(choisie); setChoisie(null); }} />
          ) : (
            <List resultat={resultat} onChoisir={setChoisie} focusCode={retour} />
          )}
        </div>
      )}
      <Legend className="absolute bottom-4 left-4" sansPlafond={resultat ? !resultat.actif : false} />
    </main>
  );
}
