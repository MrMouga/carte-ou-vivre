import * as L from './lib.mjs';
const br=await L.lancer(); const pg=await L.ouvrir(br,false);
await pg.getByRole('button',{name:'Chercher une commune'}).click();
const ch=pg.getByRole('combobox',{name:'Chercher une commune'});
await ch.pressSequentially('auch',{delay:20}); await pg.keyboard.press('Escape'); await pg.waitForTimeout(300);
console.log('expanded',await ch.getAttribute('aria-expanded'),'visibles',await pg.locator('[role=option]:visible').count(), 'listbox visible', await pg.locator('[role=listbox]:visible').count());
await pg.screenshot({path:`${L.OUT}/qa2-bureau-echap1.png`,clip:{x:0,y:0,width:400,height:300}});
await br.close();
