import { chromium } from '/Users/mouga/git-repository/carte-ou-vivre/node_modules/playwright/index.mjs';
export const OUT='/Users/mouga/git-repository/carte-ou-vivre/docs/plans/2026-11-25-recherche-et-mer/captures/qa';
export const BASE='http://localhost:5173';
export const nb=(t)=>(t??'').replace(/[  ]/g,' ');
export const lancer=()=>chromium.launch({channel:'chromium',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
export async function ouvrir(br,mobile,path='/',routes){
  const ctx=await br.newContext(mobile?{viewport:{width:390,height:844},hasTouch:true,isMobile:true}:{viewport:{width:1280,height:800}});
  const pg=await ctx.newPage(); pg.errs=[]; pg.on('console',m=>{if(m.type()==='error')pg.errs.push(m.text().slice(0,150))});
  pg.reqs=[]; pg.on('request',r=>{const u=new URL(r.url()); if(u.origin!==BASE) pg.reqs.push(u.origin)});
  if(routes) await routes(pg);
  await pg.goto(BASE+path);
  await pg.locator('[data-carte-prete]').first().waitFor({state:'attached',timeout:90000});
  await pg.waitForTimeout(2500);
  return pg;
}
export const log=(...a)=>console.log(...a.map(x=>typeof x==='string'?nb(x):x));
