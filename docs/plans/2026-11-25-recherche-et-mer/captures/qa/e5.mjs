import * as L from './lib.mjs';
const mobile=process.argv[2]==='m'; const tag=mobile?'390':'bureau';
const br=await L.lancer();
const raisons=async(pg)=>L.nb(await pg.evaluate(()=>document.body.innerText.split('\n').filter(l=>/plafond|≈/.test(l)).join(' | ')));
for (const [mer,q,nom,fn] of [[30,'33000','Bordeaux','bordeaux30'],[15,'arles','Arles (13)','arles15'],[15,'aspremont','Aspremont (06)','aspremont15'],[60,'caen','Caen (14)','caen60']]){
  const pg=await L.ouvrir(br,mobile,`/?loyer=1200&mer-min=${mer}`);
  const tap=async(l)=>mobile?l.tap():l.click();
  await tap(pg.getByRole('button',{name:'Chercher une commune'})); await pg.waitForTimeout(300);
  await pg.getByRole('combobox',{name:'Chercher une commune'}).pressSequentially(q,{delay:10});
  await tap(pg.getByRole('option').filter({hasText:nom}).first()); await pg.waitForTimeout(1500);
  L.log(`mer-min=${mer} ${nom}:`,await raisons(pg));
  await pg.screenshot({path:`${L.OUT}/qa2-${tag}-raisons-${fn}.png`});
}
// liste et colonne sans temps (≈)
const pg=await L.ouvrir(br,mobile,'/?loyer=1200');
// temps de réaction d'une pastille
const g=pg.getByRole('group',{name:'Mer à moins de'});
if(mobile){ await pg.getByRole('button',{name:'Critères'}).tap().catch(()=>{}); }
const btn=g.getByRole('button',{name:'30 min'});
await btn.scrollIntoViewIfNeeded();
const mesures=[];
for(let i=0;i<6;i++){
  const t=await pg.evaluate(()=>new Promise(res=>{ window.__t0=performance.now(); res(0)}));
  const handle=await btn.elementHandle();
  const ms=await pg.evaluate(async(el)=>{
    const avant=document.body.innerText.match(/[\d  ]+ communes?/)?.[0];
    const t0=performance.now(); el.click();
    return await new Promise(res=>{const f=()=>{const now=document.body.innerText.match(/[\d  ]+ communes?/)?.[0]; if(now!==avant||performance.now()-t0>3000) res(performance.now()-t0); else requestAnimationFrame(f)}; f();});
  },handle);
  mesures.push(Math.round(ms)); await pg.waitForTimeout(800);
}
L.log('réaction pastille 30 min (clic -> compte mis à jour), ms:',mesures.join(', '));
// bas de Critères
if(mobile){
  await pg.evaluate(()=>{const els=[...document.querySelectorAll('*')].filter(e=>e.scrollHeight>e.clientHeight+50&&getComputedStyle(e).overflowY.match(/auto|scroll/)); els.forEach(e=>e.scrollTop=e.scrollHeight)});
  await pg.waitForTimeout(500);
  await pg.screenshot({path:`${L.OUT}/qa2-390-criteres-bas.png`});
  L.log('bas critères:',L.nb(await pg.evaluate(()=>document.body.innerText.split('\n').slice(-12).join(' | '))));
}
await br.close();
