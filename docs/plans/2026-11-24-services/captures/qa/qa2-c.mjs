import * as L from './qa2-lib.mjs';
const { navigateur, journal, nbsp, W, H, chemin, fiche, ouvrir, choisir, OUT, BASE, categorie, temps } = L;
const sec = async (n, f) => { try { await f(); } catch (e) { journal('ECHEC', n, e.message.split('\n')[0]); } };
const b = await (await navigateur.newContext({ viewport: { width: W, height: H } })).newPage();
const txt = async () => nbsp(await fiche(b).innerText()).replace(/\n+/g, ' | ');
const cas = [
  ['auch', '32013', '/?loyer=1200'],
  ['lehavre', '76351', '/?loyer=1200'],
  ['sables', '85194', '/?loyer=1200'],
  ['yeu', '85113', '/?loyer=1200'],
  ['yeu-ecartee', '85113', '/?loyer=1200&services=gare:10'],
  ['mende-ecartee', '48095', '/?loyer=200&services=medecin:5,gare-regionale:20'],
  ['yeu-medecin', '85113', '/?loyer=1200&services=medecin:5,commerce:5'],
  ['auch-multi', '32013', '/?loyer=100&services=medecin:5,creche:5,gare-grandes-lignes:10'],
];
for (const [nom, code, u] of cas) await sec(nom, async () => {
  await choisir(b, u, code);
  const t = await txt();
  const i = t.indexOf('SERVICES EN VOITURE');
  journal(`FICHE ${nom} ${u}\n  avant: ${t.slice(0, i).slice(-420)}\n  bloc: ${t.slice(i)}`);
  await b.screenshot({ path: `${OUT}/qa2-fiche-${nom}-1440.png` });
  if (['auch', 'yeu', 'mende-ecartee'].includes(nom)) {
    await b.setViewportSize({ width: 390, height: 844 }); await b.waitForTimeout(1200);
    await fiche(b).getByRole('heading', { level: 3, name: 'Services en voiture' }).evaluate((el) => el.scrollIntoView({ block: 'start' })); await b.waitForTimeout(500);
    await b.screenshot({ path: `${OUT}/qa2-fiche-${nom}-390.png` });
    await b.setViewportSize({ width: W, height: H }); await b.waitForTimeout(800);
  }
});
// focus Gare caché par la barre collante ?
await sec('focus-gare', async () => {
  await ouvrir(b, '/?loyer=1200');
  await categorie(b).getByRole('group', { name: 'Scolarité', exact: true }).getByRole('button').last().focus();
  for (let i = 0; i < 4; i++) {
    await b.keyboard.press('Tab'); await b.waitForTimeout(200);
    const r = await b.evaluate(() => { const e = document.activeElement; const r = e.getBoundingClientRect(); const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return { n: e.textContent.trim().slice(0, 20), y: Math.round(r.y), b: Math.round(r.bottom), cover: top === e || e.contains(top) ? 'visible' : 'COUVERT par ' + (top?.textContent ?? '').slice(0, 30) }; });
    journal('focus', JSON.stringify(r));
  }
  await b.screenshot({ path: `${OUT}/qa2-bureau-focus-gare2-1440.png` });
});
await navigateur.close();
