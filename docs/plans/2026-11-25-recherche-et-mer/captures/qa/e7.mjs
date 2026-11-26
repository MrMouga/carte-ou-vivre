import * as L from './lib.mjs';
const br=await L.lancer(); const pg=await L.ouvrir(br,false);
const f=new Set(); pg.on('response',r=>{if(r.status()>=400)f.add(r.status()+' '+r.url().slice(0,110))});
await pg.getByRole('button',{name:'Chercher une commune'}).click();
await pg.getByRole('combobox',{name:'Chercher une commune'}).pressSequentially('auch',{delay:20});
await pg.getByRole('option').first().click(); await pg.waitForTimeout(3000);
console.log([...f].slice(0,6));
await br.close();
