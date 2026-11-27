import { readFileSync } from 'node:fs';
import { chromium } from '/Users/mouga/git-repository/carte-ou-vivre/node_modules/playwright/index.mjs';
const BASE = 'http://localhost:5190';
const OUT = '/Users/mouga/git-repository/carte-ou-vivre/docs/plans/2026-11-26-services-revision/captures/qa';
const communes = JSON.parse(readFileSync('/Users/mouga/git-repository/carte-ou-vivre/public/data/communes.json', 'utf8')).communes;
const nav = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const log = (...a) => console.log(...a);
const vis = (t) => (t ?? '').replace(/ /g, '<NBSP>').replace(/ /g, '<NNBSP>');
const chemin = (pg) => new URL(pg.url()).pathname + new URL(pg.url()).search;
const reglages = (pg) => pg.getByRole('region', { name: 'Réglages' });
const titreServices = (pg) => reglages(pg).getByRole('heading', { level: 2, name: /^Services/ });
const cat = (pg) => titreServices(pg).locator('xpath=../..');
const fiche = (pg) => pg.getByRole('region', { name: /\(\w+\)$/ });
const errs = [];
async function ouvrir(pg, ch) {
  for (let i = 0; i < 3; i++) {
    await pg.goto(BASE + ch);
    await pg.locator('[data-testid="carte"][data-carte-prete="1"]').waitFor({ timeout: 60000 });
    await pg.waitForFunction(() => { const b = document.querySelector('[aria-label="Type de gare"] button'); return b && !b.disabled; }, null, { timeout: 30000 });
    await pg.waitForTimeout(2000);
    return;
  }
}
async function choisir(pg, ch, code) {
  const [, nom, dep] = communes.find((c) => c[0] === code);
  await ouvrir(pg, ch);
  await pg.getByRole('button', { name: 'Chercher une commune', exact: true }).click();
  await pg.getByRole('combobox', { name: 'Chercher une commune', exact: true }).fill(nom);
  await pg.getByRole('listbox', { name: 'Suggestions de communes' }).getByRole('option', { name: `${nom} (${dep})`, exact: true }).click();
  await fiche(pg).waitFor({ timeout: 10000 });
  await fiche(pg).getByRole('heading', { level: 3, name: 'Services en voiture' }).waitFor({ timeout: 20000 });
  await pg.waitForTimeout(1000);
}
async function lire(pg) {
  const t = (await fiche(pg).locator('h3, p, li').allTextContents()).map((x) => vis(x).replace(/\s+/g, ' ').trim());
  const j = t.indexOf('Services en voiture');
  const i = t.indexOf('Ne passe pas tes critères');
  return { raisons: i < 0 ? [] : t.slice(i + 1, j), lignes: t.slice(j + 1, j + 12), apres: t.slice(j + 12) };
}
const ctxs = [
  ['1440', { viewport: { width: 1440, height: 900 } }],
  ['390', { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }],
  ['375', { viewport: { width: 375, height: 548 }, hasTouch: true, isMobile: true }],
];
for (const [nom, opt] of ctxs) {
  const pg = await (await nav.newContext(opt)).newPage();
  pg.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(`${nom} ${m.type()}: ${m.text().slice(0, 200)}`); });
  pg.on('pageerror', (e) => errs.push(`${nom} pageerror ${e.message}`));
  log(`===== ${nom} =====`);
  await ouvrir(pg, '/');
  const lignes = await cat(pg).getByRole('group').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')));
  log('groupes catégorie:', JSON.stringify(lignes));
  log('texte catégorie:', vis((await cat(pg).innerText()).replace(/\n+/g, ' | ')));
  await titreServices(pg).evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await pg.waitForTimeout(400);
  await pg.screenshot({ path: `${OUT}/${nom}-categorie.jpg`, type: 'jpeg', quality: 70 });
  // coches
  const b = (n, m) => reglages(pg).getByRole('group', { name: n, exact: true }).getByRole('button', { name: new RegExp(`^${m}\\smin$`) });
  await b('Médecin', 10).click(); await b('Urgences', 30).click(); await b('Supermarché', 5).click();
  await pg.waitForTimeout(800);
  log('coché:', chemin(pg));
  await b('Urgences', 30).click(); await pg.waitForTimeout(500);
  log('décoché urgences:', chemin(pg));
  await b('Urgences', 45).click(); await b('Urgences', 15).click(); await pg.waitForTimeout(500);
  log('urgences 15 après 45:', chemin(pg), await b('Urgences', 45).getAttribute('aria-pressed'));
  await pg.screenshot({ path: `${OUT}/${nom}-coche.jpg`, type: 'jpeg', quality: 70 });
  // fiches
  for (const [code, n] of [['32013', 'auch'], ['05157', 'saint-veran'], ['85113', 'yeu']]) {
    const ch = code === '05157' ? '/?services=urgences:30' : '/';
    await choisir(pg, ch, code);
    const l = await lire(pg);
    log(`fiche ${n}:`, JSON.stringify(l));
    const h = fiche(pg).getByRole('heading', { level: 3, name: 'Services en voiture' });
    await h.evaluate((el) => el.scrollIntoView({ block: 'start' }));
    // faire défiler la fiche vers le bas
    await fiche(pg).evaluate((el) => { let p = el; while (p) { if (p.scrollHeight > p.clientHeight + 5) p.scrollTop = p.scrollHeight; p = p.parentElement; } });
    await pg.waitForTimeout(500);
    await pg.screenshot({ path: `${OUT}/${nom}-fiche-${n}.jpg`, type: 'jpeg', quality: 70 });
    const last = fiche(pg).locator('li, p').last();
    const bb = await last.boundingBox();
    log(`  dernier élément visible dans la fenêtre:`, bb && bb.y + bb.height <= opt.viewport.height, JSON.stringify(bb));
  }
  // ancien lien
  await ouvrir(pg, '/?loyer=1200&services=commerce:5,medecin:10');
  await pg.waitForTimeout(800);
  log('ancien lien →', chemin(pg), 'commerce dans la page:', (await pg.getByText(/commerce alimentaire/i).count()));
  await titreServices(pg).evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await pg.screenshot({ path: `${OUT}/${nom}-ancien-lien.jpg`, type: 'jpeg', quality: 70 });
  if (nom === '1440') {
    // clavier
    await ouvrir(pg, '/');
    await reglages(pg).getByRole('group', { name: 'Médecin', exact: true }).getByRole('button').first().focus();
    const ordre = [];
    for (let i = 0; i < 20; i++) {
      const d = await pg.evaluate(() => { const a = document.activeElement; const g = a.closest('[role=group]'); const cs = getComputedStyle(a); return `${g?.getAttribute('aria-label') ?? '-'} / ${a.textContent.trim().slice(0, 20)} / outline=${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor} shadow=${cs.boxShadow.slice(0, 40)}`; });
      ordre.push(vis(d));
      await pg.keyboard.press('Tab');
    }
    log('tab:\n' + ordre.join('\n'));
    await reglages(pg).getByRole('group', { name: 'Urgences', exact: true }).getByRole('button').first().focus();
    await pg.keyboard.press('ArrowRight');
    log('après flèche droite sur Urgences 15:', await pg.evaluate(() => document.activeElement.textContent));
    await pg.keyboard.press('Space'); await pg.waitForTimeout(500);
    log('après Espace:', chemin(pg));
    await pg.keyboard.press('Space'); await pg.waitForTimeout(500);
    log('2e Espace:', chemin(pg));
    await pg.keyboard.press('Enter'); await pg.waitForTimeout(500);
    log('Entrée:', chemin(pg));
    await pg.screenshot({ path: `${OUT}/1440-clavier.jpg`, type: 'jpeg', quality: 70 });
  }
  await pg.context().close();
}
log('console:', JSON.stringify(errs));
await nav.close();
