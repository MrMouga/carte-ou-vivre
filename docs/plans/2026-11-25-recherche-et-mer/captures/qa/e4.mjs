import * as L from './lib.mjs';
const br=await L.lancer(); const pg=await L.ouvrir(br,true);
console.log(await pg.evaluate(()=>[...document.querySelectorAll('button,[role=tab]')].slice(0,15).map(e=>e.tagName+'|'+e.getAttribute('role')+'|'+(e.getAttribute('aria-label')||e.textContent.slice(0,25))+'|'+JSON.stringify(e.getBoundingClientRect().toJSON()).slice(0,60))));
await br.close();
