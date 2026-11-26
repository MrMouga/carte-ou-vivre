import * as L from './lib.mjs';
const br=await L.lancer();
for (const m of [false,true]){
const pg=await L.ouvrir(br,m);
await pg.screenshot({path:`${L.OUT}/qa2-explo-${m?'390':'bureau'}.png`});
console.log(m, await pg.evaluate(()=>[...document.querySelectorAll('button,input,[role]')].slice(0,40).map(e=>e.tagName+'|'+(e.getAttribute('role')||'')+'|'+(e.getAttribute('aria-label')||e.textContent.slice(0,30)))));
}
await br.close();
