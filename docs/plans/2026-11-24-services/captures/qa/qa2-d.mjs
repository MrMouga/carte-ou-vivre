import * as L from './qa2-lib.mjs';
const { navigateur, journal, nbsp, chemin, fiche, ouvrir, OUT, BASE, reglagesZone, temps, niveau, typeGare, titreServices, categorie, etatReglages } = L;
const sec = async (n, f) => { try { await f(); } catch (e) { journal('ECHEC', n, e.message.split('\n')[0]); } };
const m = await (await navigateur.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 })).newPage();
const phrase = m.getByText('Coche au moins un niveau et un temps.');
const haut = async (loc) => { const x = await loc.boundingBox(); return x ? `${Math.round(x.width)}x${Math.round(x.height)}` : 'nul'; };
await ouvrir(m, '/?loyer=1200');
await sec('taps', async () => {
  await titreServices(m).evaluate((el) => el.scrollIntoView({ block: 'start' })); await m.waitForTimeout(400);
  journal('tailles cibles', 'médecin5', await haut(temps(m, 'Médecin', 5)), 'École', await haut(niveau(m, 'École')), 'Scol10', await haut(temps(m, 'Scolarité', 10)), 'Régionale', await haut(typeGare(m, 'Régionale')), 'Gare10', await haut(temps(m, 'Gare', 10)));
  await niveau(m, 'École').tap(); await m.waitForTimeout(500);
  journal('École seule', chemin(m), 'phrase', await phrase.count());
  await m.screenshot({ path: `${OUT}/qa2-m390-scol-incomplete.png` });
  await temps(m, 'Scolarité', 10).tap(); await m.waitForTimeout(600);
  journal('+10', chemin(m), 'phrase', await phrase.count(), nbsp(await m.locator('body').innerText()).match(/[\d  ]+ communes passent[^\n]*/)?.[0]);
  await typeGare(m, 'Grandes lignes').tap(); await temps(m, 'Gare', 20).tap(); await m.waitForTimeout(600);
  journal('GL 20', chemin(m), nbsp(await m.locator('body').innerText()).match(/[\d  ]+ communes passent[^\n]*/)?.[0]);
  await titreServices(m).evaluate((el) => el.scrollIntoView({ block: 'start' })); await m.waitForTimeout(300);
  await m.screenshot({ path: `${OUT}/qa2-m390-actifs.png` });
  await temps(m, 'Gare', 20).tap(); await m.waitForTimeout(400);
  journal('Gare décochée', chemin(m));
  const bt = titreServices(m).getByRole('button'); await bt.tap(); await m.waitForTimeout(300);
  journal('replié', nbsp(await titreServices(m).innerText()).replace(/\n/g, ' | '));
  await bt.tap();
});
// retard à 390
await sec('retard390', async () => {
  const p = await (await navigateur.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 })).newPage();
  await p.route('**/data/services.json', (r) => r.fulfill({ status: 500, body: '' }));
  await p.goto(BASE + '/?loyer=1200'); await p.locator('[data-testid="carte"][data-carte-prete="1"]').waitFor({ timeout: 60000 });
  await p.getByRole('alert').first().waitFor({ timeout: 20000 });
  await titreServices(p).evaluate((el) => el.scrollIntoView({ block: 'start' })); await p.waitForTimeout(400);
  await p.screenshot({ path: `${OUT}/qa2-m390-erreur.png` });
  await p.unroute('**/data/services.json');
  await reglagesZone(p).getByRole('button', { name: 'Réessayer' }).tap();
  await p.waitForFunction(() => { const x = document.querySelector('[aria-label="Type de gare"] button'); return x && !x.disabled; }, null, { timeout: 30000 });
  journal('390 Réessayer rétabli', await p.getByRole('alert').count());
  await p.context().close();
});
// Proches : l'adresse d'un proche
await sec('proches', async () => {
  const p = await (await navigateur.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await ouvrir(p, '/?loyer=1200&services=medecin:10');
  const champ = p.getByRole('combobox', { name: /Adresse/ }).or(p.getByLabel('Adresse ou ville')).first();
  await champ.fill('Toulouse'); await p.waitForTimeout(3000);
  journal('proches: suggestions', await p.getByRole('option').count(), nbsp(await p.getByRole('listbox').innerText().catch(() => 'pas de listbox')).slice(0, 100));
  await p.screenshot({ path: `${OUT}/qa2-proches-1440.png` });
  await p.context().close();
});
await navigateur.close();
