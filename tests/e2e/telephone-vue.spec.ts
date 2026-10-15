import { expect, test } from '@playwright/test';
import { attendreCouleurs, METROPOLE, ouvrir, vue } from './lib/carte';

// R16 (interface-telephone, D2) : à l'ouverture, sur téléphone, la France entière tient au-dessus de la feuille et ses
// communes sont peintes, sans aucun geste. Le défaut n'apparaît qu'à l'échelle de la métropole et dans la fenêtre réelle de
// Safari (H41) : jeu « métropole » (les 5 carrés aux latitudes de la France, deux communes qui ne passent pas aux coins
// de l'emprise), fenêtres de 390 × 664 et 375 × 548. Zoom de départ ≈ 3,7 et ≈ 3,4 : sous le zoom 4 des tuiles d'avant.
const FENETRES = [
  { width: 390, height: 664 },
  { width: 375, height: 548 },
];
const EMPRISE = { ouest: -5.2, sud: 41.3, est: 9.6, nord: 51.1 };

for (const fenetre of FENETRES) {
  test.describe(`${fenetre.width} × ${fenetre.height}`, () => {
    test.use({ viewport: fenetre, hasTouch: true });

    test(`AC-1 ouverture à ${fenetre.width} × ${fenetre.height} : toute l'emprise au-dessus de la feuille ; Portmer, Quaibleu et Grandeville peintes (paliers 4, 3, 2) ; Montcher et Terrebasse non peintes`, async ({ page }, info) => {
      test.skip(info.project.name !== 'mobile', 'fenêtres de téléphone fixées par le test : une seule fois, dans le projet mobile');
      await ouvrir(page, '/?loyer=1200&mer=50', { jeu: METROPOLE });

      // Toute l'emprise dans la bande au-dessus de la feuille ouverte (cadrage calculé comme fitBounds de MapLibre).
      const { ecran } = vue(page, METROPOLE);
      const [no, se] = [ecran(EMPRISE.ouest, EMPRISE.nord), ecran(EMPRISE.est, EMPRISE.sud)];
      const feuille = (await page.getByTestId('feuille').boundingBox())!;
      expect(no.x).toBeGreaterThanOrEqual(0);
      expect(no.y).toBeGreaterThanOrEqual(0);
      expect(se.x).toBeLessThanOrEqual(fenetre.width);
      expect(se.y).toBeLessThanOrEqual(feuille.y);

      // L'indicateur « Chargement de la carte… » reste au moins 300 ms, au centre de la bande, sur Quaibleu à cette échelle.
      await expect(page.getByText('Chargement de la carte…')).toBeHidden();
      // Les ronds du top 10 (22 px) couvrent les carrés de 0,5° à cette échelle : on lit la couleur de la carte dessous.
      // Les boutons de zoom aussi : à 390 × 664 (feuille à 45 %, tâche 2), « Zoomer » couvre le coin nord-est (R2).
      await page.addStyleTag({ content: '.maplibregl-marker, [aria-label="Zoomer"], [aria-label="Dézoomer"] { visibility: hidden; }' });
      await attendreCouleurs(
        page,
        { A: 'score-4', E: 'score-3', B: 'score-2', C: null, D: null, R1: null, R2: null },
        { jeu: METROPOLE, au: 'centre' },
      );
    });
  });
}
