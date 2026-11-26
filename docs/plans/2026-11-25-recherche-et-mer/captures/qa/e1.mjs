import * as L from './lib.mjs';
const mobile=process.argv[2]==='m'; const tag=mobile?'390':'bureau';
const br=await L.lancer(); const pg=await L.ouvrir(br,mobile);
const tap=async(l)=>mobile?l.tap():l.click();
await tap(pg.getByRole('button',{name:'Chercher une commune'}));
await pg.waitForTimeout(500);
const champ=pg.getByRole('combobox',{name:'Chercher une commune'});
L.log('combobox count',await champ.count());
L.log('attrs',JSON.stringify(await champ.evaluate(e=>[...e.attributes].map(a=>a.name+'='+a.value))));
L.log('focus sur champ',await champ.evaluate(e=>e===document.activeElement));
await pg.screenshot({path:`${L.OUT}/qa2-${tag}-ouvert.png`});
const sug=async()=>L.nb(await pg.evaluate(()=>[...document.querySelectorAll('[role=option]')].map(o=>o.innerText.replace(/\n/g,' / ')).join(' || ')));
const live=async()=>L.nb(await pg.evaluate(()=>[...document.querySelectorAll('[aria-live],[role=status],[role=alert]')].map(o=>o.getAttribute('role')+':'+o.innerText).join(' ## ')));
for (const q of ['a','auch','le havre','les sables','sables','st etienne','chateau','01300','75015','33000','33 000','330000','33 bordeaux','zzzx','--','75','Les Sables-d\'Olonne','grand']){
  await champ.fill(''); await champ.pressSequentially(q,{delay:10}); await pg.waitForTimeout(250);
  L.log(`[${q}] n=`,await pg.locator('[role=option]').count(),await sug(),'| live:',await live(),'| expanded',await champ.getAttribute('aria-expanded'));
  if(['auch','01300','75015','sables'].includes(q)) await pg.screenshot({path:`${L.OUT}/qa2-${tag}-saisie-${q.replace(/\W/g,'')}.png`});
}
L.log('errs',pg.errs,'reqs',pg.reqs);
await br.close();
