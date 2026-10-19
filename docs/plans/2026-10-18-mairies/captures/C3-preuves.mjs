// Corrections 3 de mairies (démo 2 du 2026-10-19) : « Sans étiquette » en 3e colonne de la ligne de « Droite », phrase de
// D8 sous la grille, reliée au groupe. Preuves sur la version construite servie par `npx vite preview --port 4180`
// (vraies données) ; helpers repris de C2-preuves.mjs. Usage : OUT=<dossier> node C3-preuves.mjs
import { chromium } from '/Users/mouga/git-repository/carte-ou-vivre/node_modules/playwright/index.mjs';
const BASE = process.env.BASE ?? 'http://localhost:4180';
const OUT = process.env.OUT;
const navigateur = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const journal = (...a) => console.log(new Date().toLocaleTimeString('fr-FR'), ...a);
const nbsp = (t) => (t ?? '').replace(/[  ]/g, ' ');
const verdict = (ok) => (ok ? 'OK' : 'ÉCART');

async function ouvrir(p, chemin) {
  for (let essai = 0; essai < 3; essai++) {
    await p.goto(BASE + chemin);
    await p.locator('[data-testid="carte"][data-carte-prete="1"]').waitFor({ timeout: 60000 });
    await p.waitForTimeout(2500);
    if (!(await p.getByText('Fond de carte indisponible').isVisible())) return;
  }
  journal('  fond de secours (IGN sans réponse en 8 s) pour', chemin);
}
const mobile = (p) => p.viewportSize().width < 1024;
const adresse = (p) => new URL(p.url()).pathname + new URL(p.url()).search;
const groupe = (p) => p.getByRole('group', { name: 'Mairie élue en 2026' });
const pastille = (p, nom) => groupe(p).getByRole('button', { name: nom, exact: true });
const onglet = (p, nom) => p.getByRole('tab', { name: nom, exact: true });
const voirCriteres = async (p) => { if (mobile(p)) { await onglet(p, 'Critères').click(); await p.waitForTimeout(300); } };
const BLOCS = ['Gauche', 'Divers', 'Centre', 'Droite', 'Extrême droite', 'Sans étiquette'];
const PHRASE = 'Moins de 3 500 habitants : le ministère ne classe pas les listes.';
const libelles = async (p) => (await groupe(p).getByRole('button').allInnerTexts()).map((t) => nbsp(t).trim());
const cochees = (p) => groupe(p).getByRole('button', { pressed: true }).allInnerTexts();
const r = (b) => `x${Math.round(b.x)} y${Math.round(b.y)} ${Math.round(b.width)}×${Math.round(b.height)}`;
/** Position de la liste d'onglets et défilement de `main` (leçon du 2026-10-14 : la feuille ne doit pas glisser). */
const feuille = async (p) => p.evaluate(() => {
  const t = document.querySelector('[role=tablist]');
  const b = t?.getBoundingClientRect();
  return { onglets: b ? Math.round(b.y) : null, mainScroll: document.querySelector('main')?.scrollTop ?? null };
});

for (const [W, H] of [[1440, 900], [390, 844]]) {
  const ctx = await navigateur.newContext({ viewport: { width: W, height: H } });
  const p = await ctx.newPage();
  const tag = `${W}x${H}`;
  journal(`===== ${tag}`);
  await ouvrir(p, '/');
  await voirCriteres(p);
  const avant = await feuille(p);
  const g = groupe(p);
  await g.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await p.waitForTimeout(500);
  const l = await libelles(p);
  journal('adresse', adresse(p), '· pastilles', JSON.stringify(l), '· cochées', JSON.stringify(await cochees(p)),
    verdict(adresse(p) === '/?loyer=1200' && JSON.stringify(l) === JSON.stringify(BLOCS)));
  const boites = await Promise.all((await g.getByRole('button').all()).map((b) => b.boundingBox()));
  journal('grille', boites.map((b, i) => `${l[i]} ${r(b)}`).join(' | '));
  const ligne = (a) => new Set(a.map((b) => Math.round(b.y))).size === 1;
  const grille = ligne(boites.slice(0, 3)) && ligne(boites.slice(3)) && boites[3].y > boites[0].y
    && [0, 1, 2].every((i) => Math.round(boites[i + 3].x) === Math.round(boites[i].x)) && boites.every((b) => b.height >= 44);
  journal('Gauche · Divers · Centre / Droite · Extrême droite · Sans étiquette, cases ≥ 44 px', verdict(grille));
  const ph = p.getByText(/^Moins de 3\s500 habitants/);
  const bp = await ph.boundingBox();
  const sous = bp.y >= boites[5].y + boites[5].height && Math.round(bp.x) === Math.round(boites[0].x)
    && Math.round(bp.x + bp.width) === Math.round(boites[2].x + boites[2].width);
  journal('phrase', r(bp), '« ' + nbsp(await ph.innerText()) + ' » sous la grille, toute la largeur', verdict(sous && nbsp(await ph.innerText()) === PHRASE));
  const dansVue = bp.y + bp.height <= H && boites[0].y >= 0;
  journal('grille et phrase dans la fenêtre', verdict(dansVue));
  const desc = await g.evaluate((el) => {
    const ids = (el.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean);
    return ids.map((i) => document.getElementById(i)?.textContent).join(' ');
  });
  const descBouton = await pastille(p, 'Sans étiquette').getAttribute('aria-describedby');
  journal('description du groupe « ' + nbsp(desc) + ' » · aria-describedby de « Sans étiquette » :', String(descBouton),
    verdict(nbsp(desc) === PHRASE && descBouton === null));
  await p.screenshot({ path: `${OUT}/C3-vie-locale-${tag}.png` });

  // Clavier : Tab de case en case, dans l'ordre de R38.
  await pastille(p, 'Gauche').focus();
  const ordre = [];
  for (let i = 0; i < 6; i++) {
    ordre.push(nbsp(await p.evaluate(() => document.activeElement?.textContent ?? '')).trim());
    await p.keyboard.press('Tab');
  }
  const apres = nbsp(await p.evaluate(() => `${document.activeElement?.tagName} « ${(document.activeElement?.textContent ?? '').trim().slice(0, 40)} »`));
  journal('Tab depuis « Gauche » :', ordre.join(' → '), '→ puis', apres, verdict(JSON.stringify(ordre) === JSON.stringify(BLOCS)));
  await pastille(p, 'Gauche').focus();
  await p.keyboard.press('Shift+Tab');
  journal('Maj+Tab depuis « Gauche » :', nbsp(await p.evaluate(() => `${document.activeElement?.tagName} « ${(document.activeElement?.textContent ?? '').trim().slice(0, 40)} »`)));

  // « Gauche » et « Sans étiquette » cochées, au clavier (Espace).
  for (const nom of ['Gauche', 'Sans étiquette']) {
    await pastille(p, nom).focus();
    await p.keyboard.press('Space');
    await p.waitForTimeout(2000);
  }
  await g.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await p.waitForTimeout(500);
  const c = await cochees(p);
  journal('adresse', adresse(p), '· cochées', JSON.stringify(c),
    verdict(adresse(p) === '/?loyer=1200&mairie=gauche,sans-etiquette' && JSON.stringify(c) === '["Gauche","Sans étiquette"]'));
  const fin = await feuille(p);
  journal('liste d\'onglets y', avant.onglets, '→', fin.onglets, '· main.scrollTop', avant.mainScroll, '→', fin.mainScroll,
    verdict(avant.onglets === fin.onglets && fin.mainScroll === 0));
  await p.screenshot({ path: `${OUT}/C3-gauche-sans-etiquette-${tag}.png` });
  await ctx.close();
}
await navigateur.close();
