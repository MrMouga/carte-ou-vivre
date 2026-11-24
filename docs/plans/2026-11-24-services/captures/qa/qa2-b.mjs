import * as L from './qa2-lib.mjs';
const { navigateur, journal, nbsp, W, H, chemin, fiche, reglagesZone, temps, niveau, typeGare, titreServices, categorie, etatReglages, bas, ouvrir, choisir, lireFiche, OUT, BASE } = L;
const sec = async (n, f) => { try { await f(); } catch (e) { journal('ECHEC', n, e.message.split('\n')[0]); } };
const ctx = await navigateur.newContext({ viewport: { width: W, height: H } });
const b = await ctx.newPage();
// Clavier dans la catégorie
await sec('clavier', async () => {
  await ouvrir(b, '/?loyer=1200');
  await b.getByRole('button', { name: /^5\smin$/ }).first().focus();
  const lire = () => b.evaluate(() => { const e = document.activeElement; const cs = getComputedStyle(e); const g = e.closest('[role=group]'); const r = e.getBoundingClientRect(); return `${g?.getAttribute('aria-label') ?? '-'}/${(e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 25)}[${e.getAttribute('aria-pressed')}] outline=${cs.outlineStyle} ${cs.outlineWidth} y=${Math.round(r.y)} ${r.y < 0 || r.bottom > innerHeight ? 'HORS-ECRAN' : ''}`; });
  const seq = [];
  // le premier bouton 5 min est-il Médecin ? on part de Services : focus sur le premier bouton du groupe Médecin
  await categorie(b).getByRole('group', { name: 'Médecin', exact: true }).getByRole('button').first().focus();
  seq.push('départ ' + await lire());
  for (let i = 0; i < 20; i++) { await b.keyboard.press('Tab'); seq.push(await lire()); if (i === 8) await b.screenshot({ path: `${OUT}/qa2-bureau-focus-gare-1440.png` }); }
  journal('Tab dans Services:\n  ' + seq.join('\n  '));
  const c = await categorie(b).getByRole('group', { name: 'Médecin', exact: true }).getByRole('button').first();
  await c.focus(); await b.keyboard.press('Enter'); await b.waitForTimeout(500);
  journal('Entrée sur Médecin 5', chemin(b), await lire());
  await b.keyboard.press('Tab'); await b.keyboard.press('Space'); await b.waitForTimeout(500);
  journal('Tab+Espace (10 doit remplacer 5)', chemin(b), await lire());
  await b.keyboard.press('ArrowRight'); journal('ArrowRight', await lire());
  await b.screenshot({ path: `${OUT}/qa2-bureau-clavier-1440.png` });
});
// R57 retardé
await sec('retard', async () => {
  const p = await (await navigateur.newContext({ viewport: { width: W, height: H } })).newPage();
  let libere; const porte = new Promise((r) => (libere = r));
  await p.route('**/data/services.json', async (r) => { await porte; await r.continue(); });
  await p.goto(BASE + '/?loyer=1200');
  await p.locator('[data-testid="carte"][data-carte-prete="1"]').waitFor({ timeout: 60000 });
  await p.waitForTimeout(2000);
  const etat = await p.evaluate(() => ({ off: [...document.querySelectorAll('section[aria-label="Réglages"] button')].filter((x) => x.disabled).length, tot: document.querySelectorAll('section[aria-label="Réglages"] button').length, nbDisabledServices: [...document.querySelectorAll('[aria-label="Type de gare"] button')].map((x) => x.disabled) }));
  journal('retard: boutons', JSON.stringify(etat));
  await bas(p); await p.waitForTimeout(300);
  await p.screenshot({ path: `${OUT}/qa2-bureau-retard-categorie-1440.png` });
  journal('retard: texte catégorie', nbsp(await p.locator('section[aria-label="Réglages"]').innerText()).split('SERVICES')[1]?.replace(/\n+/g, ' | ').slice(0, 200));
  await p.getByRole('region', { name: 'Les 10 premières' }).getByRole('listitem').first().getByRole('button').first().click();
  await fiche(p).waitFor({ timeout: 10000 });
  await p.waitForTimeout(500);
  journal('retard: fiche', nbsp(await fiche(p).innerText()).replace(/\n+/g, ' | ').slice(-250));
  await p.mouse.move(0, 0);
  await p.screenshot({ path: `${OUT}/qa2-bureau-retard-fiche-1440.png` });
  libere(); await p.waitForTimeout(2500);
  journal('retard: après arrivée', nbsp(await fiche(p).innerText()).replace(/\n+/g, ' | ').slice(-200));
  await p.context().close();
});
// services= dans l'adresse + fichier retardé
await sec('retard-adresse', async () => {
  const p = await (await navigateur.newContext({ viewport: { width: W, height: H } })).newPage();
  let libere; const porte = new Promise((r) => (libere = r));
  await p.route('**/data/services.json', async (r) => { await porte; await r.continue(); });
  await p.goto(BASE + '/?loyer=1200&services=medecin:5');
  await p.waitForTimeout(6000);
  journal('retard+adresse: liste présente', await p.getByRole('region', { name: 'Les 10 premières' }).count(), 'carte prête', await p.locator('[data-testid="carte"][data-carte-prete="1"]').count(), 'URL', chemin(p));
  journal('retard+adresse: texte', nbsp(await p.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 200));
  await p.screenshot({ path: `${OUT}/qa2-bureau-retard-adresse-1440.png` });
  libere(); await p.locator('[data-testid="carte"][data-carte-prete="1"]').waitFor({ timeout: 60000 }); await p.waitForTimeout(2000);
  journal('retard+adresse: après', chemin(p), nbsp(await p.getByRole('region', { name: 'Les 10 premières' }).innerText()).replace(/\s+/g, ' ').slice(0, 90));
  await p.context().close();
  // erreur avec services= dans l'adresse
  const q = await (await navigateur.newContext({ viewport: { width: W, height: H } })).newPage();
  await q.route('**/data/services.json', (r) => r.fulfill({ status: 500, body: '' }));
  await q.goto(BASE + '/?loyer=1200&services=medecin:5');
  await q.waitForTimeout(8000);
  journal('erreur+adresse: texte', nbsp(await q.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 250), 'URL', chemin(q));
  await q.screenshot({ path: `${OUT}/qa2-bureau-erreur-adresse-1440.png` });
  await q.context().close();
});
// erreur puis Réessayer dans la fiche
await sec('reessayer-fiche', async () => {
  const p = await (await navigateur.newContext({ viewport: { width: W, height: H } })).newPage();
  await p.route('**/data/services.json', (r) => r.fulfill({ status: 500, body: '' }));
  await p.goto(BASE + '/?loyer=1200');
  await p.locator('[data-testid="carte"][data-carte-prete="1"]').waitFor({ timeout: 60000 });
  await p.getByRole('alert').first().waitFor({ timeout: 20000 });
  await p.getByRole('region', { name: 'Les 10 premières' }).getByRole('listitem').first().getByRole('button').first().click();
  await fiche(p).getByRole('alert').waitFor({ timeout: 10000 });
  journal('fiche erreur', nbsp(await fiche(p).innerText()).replace(/\n+/g, ' | ').slice(-150), 'alertes', await p.getByRole('alert').count());
  await p.unroute('**/data/services.json');
  await fiche(p).getByRole('button', { name: 'Réessayer' }).click();
  await fiche(p).getByText(/^Temps en voiture/).waitFor({ timeout: 20000 });
  await p.waitForTimeout(800);
  journal('après Réessayer (fiche): alertes', await p.getByRole('alert').count(), 'focus', await p.evaluate(() => document.activeElement?.tagName + ' ' + (document.activeElement?.textContent ?? '').slice(0, 30)), 'gare activée', await p.evaluate(() => { const x = document.querySelector('[aria-label="Type de gare"] button'); return x && !x.disabled; }));
  await p.screenshot({ path: `${OUT}/qa2-bureau-reessayer-fiche-1440.png` });
  await p.context().close();
});
await navigateur.close();
