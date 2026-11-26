import * as L from './lib.mjs';
const mobile=process.argv[2]==='m'; const tag=mobile?'390':'bureau';
const br=await L.lancer();
const tap=async(l)=>mobile?l.tap():l.click();
const texte=async(pg)=>L.nb(await pg.evaluate(()=>[...document.querySelectorAll('[role=status],[role=alert],[aria-live]')].map(e=>e.innerText).filter(Boolean).join(' ## ')));
// 1. codes lents (13 s) puis erreur
let pg=await L.ouvrir(br,mobile,'/',async p=>{ let n=0; await p.route('**/data/codes-postaux.json',async r=>{n++; p.n=n; await new Promise(s=>setTimeout(s,13000)); r.abort().catch(()=>{});}); });
let ch=pg.getByRole('combobox',{name:'Chercher une commune'});
await tap(pg.getByRole('button',{name:'Chercher une commune'})); await pg.waitForTimeout(300);
await ch.pressSequentially('33000',{delay:20}); await pg.waitForTimeout(600);
L.log('lent t+0.6s:',await texte(pg)); await pg.screenshot({path:`${L.OUT}/qa2-${tag}-codes-chargement.png`});
await pg.waitForTimeout(10500); L.log('t+11s:',await texte(pg)); await pg.screenshot({path:`${L.OUT}/qa2-${tag}-codes-indispo.png`});
await ch.fill(''); await ch.pressSequentially('auch',{delay:20}); await pg.waitForTimeout(300);
L.log('par nom pendant indispo:',await pg.locator('[role=option]').count());
L.log('requêtes codes:',pg.n);
// nouvel essai à la prochaine prise de focus
await pg.getByRole('button',{name:'Annuler'}).click().catch(()=>{}); 
// 2. échec immédiat
const pg2=await L.ouvrir(br,mobile,'/',async p=>{ p.c=0; await p.route('**/data/codes-postaux.json',r=>{p.c++; r.fulfill({status:500,body:'x'});}); });
ch=pg2.getByRole('combobox',{name:'Chercher une commune'});
await tap(pg2.getByRole('button',{name:'Chercher une commune'})); await pg2.waitForTimeout(300);
await ch.pressSequentially('33000',{delay:20}); await pg2.waitForTimeout(1500);
L.log('erreur 500:',await texte(pg2),'| appels',pg2.c);
await pg2.screenshot({path:`${L.OUT}/qa2-${tag}-codes-500.png`});
// refocus => nouvel essai
await pg2.getByRole('button',{name:'Annuler'}).click(); await pg2.waitForTimeout(300);
L.log('focus après Annuler:',await pg2.evaluate(()=>document.activeElement.getAttribute('aria-label')||document.activeElement.tagName));
await tap(pg2.getByRole('button',{name:'Chercher une commune'})); await pg2.waitForTimeout(300);
await ch.pressSequentially('33000',{delay:20}); await pg2.waitForTimeout(1000);
L.log('après réouverture: appels',pg2.c,await texte(pg2));
// 3. effacer / annuler / loupe
const pg3=await L.ouvrir(br,mobile);
ch=pg3.getByRole('combobox',{name:'Chercher une commune'});
await tap(pg3.getByRole('button',{name:'Chercher une commune'})); await pg3.waitForTimeout(300);
await ch.pressSequentially('bordeaux',{delay:20}); await tap(pg3.getByRole('option').first()); await pg3.waitForTimeout(1500);
await pg3.screenshot({path:`${L.OUT}/qa2-${tag}-bordeaux-choisie.png`});
const loupe=pg3.getByRole('button',{name:'Chercher une commune'});
L.log('loupe présente après choix:',await loupe.count(),'champ:',await ch.count());
if(await ch.count()){ L.log('val',await ch.inputValue()); 
 await tap(pg3.getByRole('button',{name:'Effacer la recherche'})); await pg3.waitForTimeout(500);
 L.log('après Effacer: val',await ch.inputValue(),'fiche encore?',await pg3.getByText('de la mer en voiture').count(),'focus',await pg3.evaluate(()=>document.activeElement.getAttribute('aria-label')||document.activeElement.tagName));
 await tap(pg3.getByRole('button',{name:'Annuler'})); await pg3.waitForTimeout(500);
 L.log('après Annuler: champ',await ch.count(),'focus',await pg3.evaluate(()=>document.activeElement.getAttribute('aria-label')||document.activeElement.tagName),'fiche?',await pg3.getByText('de la mer en voiture').count());
}
L.log('404 urls: voir script e7');
await br.close();
