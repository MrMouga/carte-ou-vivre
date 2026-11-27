import { chromium } from '/Users/mouga/git-repository/carte-ou-vivre/node_modules/playwright/index.mjs';
const n = await chromium.launch({ args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
for (const ch of ['/','/?loyer=1200&services=commerce:5,medecin:10']) {
const p = await (await n.newContext({viewport:{width:1440,height:900}})).newPage();
p.on('response', r => { if (r.status()>=400) console.log(ch, r.status(), r.url()); });
await p.goto('http://localhost:5190'+ch);
await p.locator('[data-testid="carte"][data-carte-prete="1"]').waitFor({timeout:60000});
await p.waitForTimeout(5000);
}
await n.close();
