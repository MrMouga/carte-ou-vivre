import { useEffect, useMemo, useState } from 'react';
import { MapView } from './map/MapView';
import { PALIERS } from './map/style';
import type { Formes } from './map/view';
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

  const resultat = useMemo(() => (donnees ? evaluer(donnees.communes, reglages) : null), [donnees, reglages]);
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
      {donnees && <MapView formes={donnees.formes} couleurs={couleurs} />}
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
          <List resultat={resultat} />
        </div>
      )}
      <Legend className="absolute bottom-4 left-4" sansPlafond={resultat ? !resultat.actif : false} />
    </main>
  );
}
