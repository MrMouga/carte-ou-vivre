import * as L from './lib.mjs';
const mobile=process.argv[2]==='m'; const tag=mobile?'390':'bureau';
const br=await L.lancer(); const pg=await L.ouvrir(br,mobile);
const tap=async(l)=>mobile?l.tap():l.click();
const url=()=>new URL(pg.url()).pathname+new URL(pg.url()).search;
const ch=()=>pg.getByRole('combobox',{name:'Chercher une commune'});
const lignes=async()=>L.nb(await pg.evaluate(()=>[...document.querySelectorAll('p,li,div,h2')].filter(e=>e.children.length===0&&/mer|montagne|Mer /i.test(e.textContent)&&e.textContent.length<140).map(e=>e.textContent).join(' | ')));
async function choisir(q,nom,fn){
  if(!(await ch().count())) await tap(pg.getByRole('button',{name:'Chercher une commune'}));
  await pg.waitForTimeout(300);
  await ch().fill(''); await ch().pressSequentially(q,{delay:10}); await pg.waitForTimeout(250);
  const t0=Date.now();
  await tap(pg.getByRole('option').filter({hasText:nom}).first());
  await pg.waitForTimeout(1800);
  L.log(`>> ${q}/${nom}`,'url',url(),'|',await lignes());
  await pg.screenshot({path:`${L.OUT}/qa2-${tag}-fiche-${fn}.png`});
}
await choisir('bordeaux','Bordeaux (33)','bordeaux');
await choisir('caen','Caen (14)','caen');
await choisir('aspremont','Aspremont (06)','aspremont');
await choisir('arles','Arles (13)','arles');
await choisir('le havre','Le Havre','lehavre');
await choisir('les sables','Les Sables-d\'Olonne','sables');
// 30 min
if(mobile){ await pg.getByRole('tab',{name:/Critères/}).tap().catch(()=>{}); }
await tap(pg.getByRole('group',{name:'Mer à moins de'}).getByRole('button',{name:'30 min'}));
await pg.waitForTimeout(1200);
L.log('apres 30min url',url());
await choisir('33000','Bordeaux','bordeaux-30');
L.log('raisons?',L.nb(await pg.evaluate(()=>document.body.innerText.split('\n').filter(l=>/plafond|Mer /.test(l)).join(' | '))));
await choisir('caen','Caen (14)','caen-30');
await choisir('aspremont','Aspremont (06)','aspremont-30');
L.log('raisons?',L.nb(await pg.evaluate(()=>document.body.innerText.split('\n').filter(l=>/plafond|Mer |≈/.test(l)).join(' | '))));
await choisir('arles','Arles (13)','arles-30');
L.log('raisons?',L.nb(await pg.evaluate(()=>document.body.innerText.split('\n').filter(l=>/plafond|Mer |≈/.test(l)).join(' | '))));
L.log('errs',pg.errs.length,'reqs ext',[...new Set(pg.reqs)]);
await br.close();
