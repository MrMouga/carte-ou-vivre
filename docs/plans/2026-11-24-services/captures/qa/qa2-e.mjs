import * as L from './qa2-lib.mjs';
const { navigateur, journal, nbsp, W, H, fiche, choisir, OUT } = L;
const b = await (await navigateur.newContext({ viewport: { width: W, height: H } })).newPage();
for (const [nom, u] of [['mende-ordre', '/?loyer=400&mer=10&services=gare-regionale:20,medecin:5'], ['mende-sans-plafond', '/?services=gare-regionale:20']]) {
  try {
    await choisir(b, u, '48095');
    const t = nbsp(await fiche(b).innerText()).replace(/\n+/g, ' | ');
    journal(nom, u, '\n  ', t.slice(0, t.indexOf('SERVICES EN VOITURE')).slice(0, 420));
    await b.screenshot({ path: `${OUT}/qa2-fiche-${nom}-1440.png` });
  } catch (e) { journal('ECHEC', nom, e.message.split('\n')[0]); }
}
await navigateur.close();
