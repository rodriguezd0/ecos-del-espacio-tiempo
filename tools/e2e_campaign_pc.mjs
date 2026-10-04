import fs from 'node:fs';
import path from 'node:path';
import {readPersistentSaveData} from './e2e_campaign_checkpoint_reload.mjs?slot=1';

const allPokemon=data=>[...data.party,...data.boxes.flat().filter(Boolean)];
/** Confirma el traslado real, incluidos datos íntegros, identidad y posiciones de los demás Pokémon del PC. */
export function pcSwapError(before,after,depositSpecies,withdrawSpecies) {
 const deposited=before.party.find(p=>p.species===depositSpecies)
  ||(before.party.length===5?before.boxes.flat().find(p=>p?.species===depositSpecies):null);
 const withdrawn=before.boxes.flat().find(p=>p?.species===withdrawSpecies);
 if(!deposited||!withdrawn)return 'Pokémon elegidos ausentes del equipo o de las cajas';
 for(const data of [before,after]) {
  const list=allPokemon(data),uids=list.map(p=>p.uid);
  if(uids.some(uid=>!uid)||new Set(uids).size!==uids.length)return 'UID ausente o duplicado en el PC';
 }
 const inventory=data=>allPokemon(data).sort((a,b)=>a.uid.localeCompare(b.uid)).map(p=>JSON.stringify(p));
 if(JSON.stringify(inventory(before))!==JSON.stringify(inventory(after)))return 'Pokémon o datos completos distintos tras usar el PC';
 const expected=[...before.party.filter(p=>p.uid!==deposited.uid).map(p=>p.uid),withdrawn.uid];
 if(JSON.stringify(after.party.map(p=>p.uid))!==JSON.stringify(expected))return 'equipo distinto al traslado elegido';
 for(let b=0;b<before.boxes.length;b++)for(let i=0;i<before.boxes[b].length;i++) {
  const p=before.boxes[b][i];
  if(p&&p.uid!==withdrawn.uid&&after.boxes[b]?.[i]?.uid!==p.uid)return 'otro Pokémon cambió de posición en la caja';
 }
 return null;
}

/** Usa exclusivamente los botones del PC; todas las consultas de scene/state son de solo lectura. */
export async function withdrawFromPC(d,species) {
 const before=await readPersistentSaveData(d);
 if(before.party.some(p=>p.species===species))return;
 if(before.party.length>=6)throw Error('El equipo está completo: falta un hueco para retirar del PC.');
 const box=before.boxes.findIndex(b=>b.some(p=>p?.species===species));
 if(box<0)throw Error(`${species} no está en las cajas del PC.`);
 const slot=before.boxes[box].findIndex(p=>p?.species===species),uid=before.boxes[box][slot].uid;
 await d.faceEvent('pc_0');await d.press('KeyZ',250);
 await d.dialogUntil('ChoiceScene','sistema de almacenamiento');await d.press('KeyZ',250);
 await d.until(s=>s.top==='StorageScene',{what:'PC real'});
 for(let n=0;n<60;n++) {
  const nav=await d.eval(()=>{const s=window.__campaign.engine.scenes.top;return {box:s.box,slot:s.sel};});
  if(nav.box!==box){await d.press('KeyE',150);continue;}
  if(nav.slot===slot)break;
  if(nav.slot<0)throw Error('El cursor no está dentro de la caja del PC.');
  const sameRow=Math.floor(nav.slot/6)===Math.floor(slot/6);
  await d.press(sameRow?(nav.slot<slot?'ArrowRight':'ArrowLeft'):(nav.slot<slot?'ArrowDown':'ArrowUp'),150);
 }
 const selected=await d.eval(()=>{const s=window.__campaign.engine.scenes.top;return s.boxes[s.box]?.[s.sel]?.uid;});
 if(selected!==uid)throw Error('El cursor del PC no seleccionó el UID elegido.');
 await d.press('KeyZ',200);await d.dialogUntil('ChoiceScene','retirar Pokémon');
 for(let n=0;n<10;n++) {
  const s=await d.snap(),target=s.choiceItems.indexOf('Retirar');
  if(target<0)throw Error('Falta Retirar en el menú del PC.');
  if(s.choiceIndex===target)break;
  await d.press(s.choiceIndex<target?'ArrowDown':'ArrowUp',150);
 }
 await d.press('KeyZ',200);
 for(let n=0;n<40;n++) {
  if((await d.snap()).top==='StorageScene'&&!await d.eval(()=>window.__campaign.engine.scenes.top.busy))break;
  if((await d.snap()).top==='MessageScene')await d.press('KeyZ',120);else await d.wait(100);
 }
 await d.until(s=>s.top==='StorageScene',{what:'retirada del PC'});
 await d.shot('retirada_pc');await d.press('KeyX',200);
 await d.dialogUntil('ChoiceScene','apagar PC');await d.press('ArrowDown',150);await d.press('KeyZ',200);await d.settle();
 const after=await readPersistentSaveData(d);
 if(after.party.at(-1)?.uid!==uid||after.boxes.flat().some(p=>p?.uid===uid))throw Error('El PC no retiró el UID elegido.');
}

export async function prepareB16(d) {
 await d.travel('boreal_centro');
 const before=await readPersistentSaveData(d);
 if(!before.party.some(p=>p.species==='ROARINGMOON')) {
  if(before.party.some(p=>p.species==='RAMPARDOS'))await d.depositAtPC('RAMPARDOS');
  else if(before.party.length!==5||!before.boxes.flat().some(p=>p?.species==='RAMPARDOS'))throw Error('El depósito pendiente no conserva los cinco Pokémon del equipo y Rampardos en caja.');
  await withdrawFromPC(d,'ROARINGMOON');
  const after=await readPersistentSaveData(d),error=pcSwapError(before,after,'RAMPARDOS','ROARINGMOON');
  if(d.outDir)fs.writeFileSync(path.join(d.outDir,'campaign_b16_pc_exchange.json'),JSON.stringify({before,after,error},null,2));
  if(error)throw Error(error);
 }
 await d.talk('enfermera');await d.travel('villa_boreal');
}
