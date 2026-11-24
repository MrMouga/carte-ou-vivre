import * as L from './qa2-lib.mjs';
const { navigateur, journal, nbsp, W, H, chemin, reglagesZone, temps, niveau, typeGare, titreServices, categorie, etatReglages, bas, ouvrir, OUT, BASE } = L;
const b = await (await navigateur.newContext({ viewport: { width: W, height: H } })).newPage();
const err = []; b.on('console', (m) => { if (m.type() === 'error') err.push(m.text().slice(0, 150)); });
const liste = async () => nbsp((await b.getByRole('region', { name: /Les 10 premières/ }).innerText().catch(() => '?'))).replace(/\s+/g, ' ').slice(0, 160);
const compte = async () => nbsp(await b.locator('body').innerText()).match(/[\d  ]+ communes?[^.\n]{0,40}/g)?.slice(0, 3);
const sec = async (n, f) => { try { await f(); } catch (e) { journal('ECHEC', n, e.message.split('\n')[0]); } };
await ouvrir(b, '/');
await bas(b);
journal('1 départ', chemin(b), JSON.stringify(await etatReglages(b)), await compte());
await sec('toggles', async () => {
  await temps(b, 'Médecin', 10).click(); await b.waitForTimeout(700);
  journal('médecin10', chemin(b), JSON.stringify(await etatReglages(b)), await compte(), await liste());
  await temps(b, 'Médecin', 5).click(); await b.waitForTimeout(500);
  journal('médecin5 (remplace 10)', chemin(b), (await etatReglages(b)).services);
  await temps(b, 'Médecin', 5).click(); await b.waitForTimeout(500);
  journal('médecin5 redécoché', chemin(b), (await etatReglages(b)).services, await compte());
  await temps(b, 'Commerce alimentaire', 15).click(); await b.waitForTimeout(500);
  await temps(b, 'Médecin', 10).click(); await b.waitForTimeout(500);
  journal('commerce15+médecin10', chemin(b), (await etatReglages(b)).services, await compte(), await liste());
  await typeGare(b, 'Grandes lignes').click(); await b.waitForTimeout(300);
  journal('type grandes lignes sans temps', chemin(b), await typeGare(b, 'Grandes lignes').getAttribute('aria-pressed'));
  await temps(b, 'Gare', 10).click(); await b.waitForTimeout(600);
  journal('gare10 GL', chemin(b), await compte());
  await typeGare(b, 'Régionale').click(); await b.waitForTimeout(600);
  journal('gare10 Rég', chemin(b), await compte());
  await typeGare(b, 'Toutes').click(); await b.waitForTimeout(600);
  journal('gare10 Toutes', chemin(b), await compte());
  await temps(b, 'Gare', 10).click(); await b.waitForTimeout(500);
  journal('gare décochée', chemin(b), 'type', (await categorie(b).getByRole('button', { pressed: true }).allTextContents()).map(nbsp));
  await bas(b); await b.mouse.move(0, 0); await b.screenshot({ path: `${OUT}/qa2-bureau-toggles-1440.png` });
});
await sec('resume', async () => {
  const bt = titreServices(b).getByRole('button');
  journal('résumé déplié', nbsp(await titreServices(b).innerText()).replace(/\n/g, ' | '));
  await bt.click(); await b.waitForTimeout(300);
  journal('résumé replié (2 choix: commerce15, médecin10)', nbsp(await titreServices(b).innerText()).replace(/\n/g, ' | '));
  await b.screenshot({ path: `${OUT}/qa2-bureau-replie-1440.png` });
  await bt.click(); await temps(b, 'Médecin', 10).click(); await b.waitForTimeout(300); await bt.click();
  journal('replié 1 choix', nbsp(await titreServices(b).innerText()).replace(/\n/g, ' | '));
  await bt.click(); await temps(b, 'Commerce alimentaire', 15).click(); await b.waitForTimeout(300); await bt.click();
  journal('replié 0', nbsp(await titreServices(b).innerText()).replace(/\n/g, ' | '));
  await bt.click();
});
await sec('scolarité', async () => {
  const phrase = b.getByText('Coche au moins un niveau et un temps.');
  const etat = async (t) => journal(t, chemin(b), 'phrase', await phrase.count(), await compte());
  await niveau(b, 'École').click(); await b.waitForTimeout(500); await etat('École seule');
  await bas(b); await b.screenshot({ path: `${OUT}/qa2-bureau-scol-incomplete-1440.png` });
  await niveau(b, 'Lycée').click(); await b.waitForTimeout(300); await etat('École+Lycée');
  await temps(b, 'Scolarité', 10).click(); await b.waitForTimeout(600); await etat('+10 min active');
  await niveau(b, 'École').click(); await niveau(b, 'Lycée').click(); await b.waitForTimeout(500); await etat('niveaux retirés, temps seul');
  await temps(b, 'Scolarité', 10).click(); await b.waitForTimeout(500); await etat('tout décoché');
  await niveau(b, 'Crèche').click(); await niveau(b, 'Supérieur').click(); await temps(b, 'Scolarité', 20).click(); await b.waitForTimeout(600); await etat('Crèche+Sup 20 active');
  const bt = titreServices(b).getByRole('button'); await bt.click();
  journal('replié scolarité active', nbsp(await titreServices(b).innerText()).replace(/\n/g, ' | ')); await bt.click();
  await bas(b); await b.screenshot({ path: `${OUT}/qa2-bureau-scol-active-1440.png` });
});
await sec('clavier', async () => {
  await b.goto(BASE + '/?loyer=1200'); await b.locator('[data-testid="carte"][data-carte-prete="1"]').waitFor({ timeout: 60000 });
  await b.waitForFunction(() => { const x = document.querySelector('[aria-label="Type de gare"] button'); return x && !x.disabled; });
  await b.waitForTimeout(1500);
  await b.getByRole('slider', { name: 'Loyer maximum' }).focus();
  const lire = () => b.evaluate(() => { const e = document.activeElement; const cs = getComputedStyle(e); const g = e.closest('[role=group]'); return { n: (e.getAttribute('aria-label') || e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30), g: g?.getAttribute('aria-label'), p: e.getAttribute('aria-pressed'), out: cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor, sh: cs.boxShadow.slice(0, 40), r: (() => { const r = e.getBoundingClientRect(); return [Math.round(r.y), Math.round(r.height)]; })() }; });
  const seq = [];
  for (let i = 0; i < 30; i++) { await b.keyboard.press('Tab'); const s = await lire(); seq.push(`${s.g ?? '-'}/${s.n}[${s.p}] ${s.out.includes('none') ? 'SANS-CONTOUR' : s.out} ${s.sh.startsWith('none') ? '' : 'sh'}`); if (i === 6) await b.screenshot({ path: `${OUT}/qa2-bureau-focus-1440.png` }); }
  journal('Tab depuis le curseur:\n  ' + seq.join('\n  '));
  // retour à Médecin 5, Espace puis Entrée
  await b.getByRole('slider', { name: 'Loyer maximum' }).focus();
  for (let i = 0; i < 40; i++) { await b.keyboard.press('Tab'); const s = await lire(); if (s.g === 'Médecin') break; }
  const s0 = await lire(); journal('arrivé', JSON.stringify(s0));
  await b.keyboard.press('Space'); await b.waitForTimeout(500); journal('Espace', chemin(b), (await lire()).p);
  await b.keyboard.press('Tab'); await b.keyboard.press('Enter'); await b.waitForTimeout(500); journal('Tab+Entrée', chemin(b), JSON.stringify(await lire()));
  await b.keyboard.press('Shift+Tab'); journal('Shift+Tab', JSON.stringify(await lire()));
  await b.keyboard.press('Space'); await b.waitForTimeout(400);
  journal('Espace sur coché', chemin(b), JSON.stringify(await lire()));
  // sortie: tabulation au-delà de la dernière
  for (let i = 0; i < 30; i++) { await b.keyboard.press('Tab'); }
  journal('après 30 Tab de plus', JSON.stringify(await lire()));
});
journal('console erreurs', JSON.stringify(err));
await navigateur.close();
