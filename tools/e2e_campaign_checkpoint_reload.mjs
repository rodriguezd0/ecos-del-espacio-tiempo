import fs from 'node:fs';
import path from 'node:path';
import {refreshDriver} from './e2e_campaign_refresh.mjs';
import {saveKey,SAVE_SLOTS} from '../game/src/core/state.js';

/** Proyección JSON completa: no altera la partida; conserva identidad, Pokémon y posiciones de las cajas. */
export function persistentSaveData(data) {
 const copy=JSON.parse(JSON.stringify(data));delete copy.clock;delete copy.playTimeFrames;
 const ordered=value=>Array.isArray(value)?value.map(ordered):value&&typeof value==='object'
  ?Object.fromEntries(Object.keys(value).sort().map(key=>[key,ordered(value[key])])):value;
 return ordered(copy);
}

export function readPersistentSaveData(d) {
 return d.eval(()=>JSON.parse(JSON.stringify(window.__campaign.engine.state.data)));
}

/** Lee el archivo exacto escrito por Guardar: el reloj vivo ya puede haber avanzado al cerrar el menú. */
export async function readSavedSlotData(d) {
 const slotValue=await d.eval(()=>localStorage.getItem('ecos.lastSlot')),slot=Number(slotValue);
 if(!slotValue||!Number.isInteger(slot)||slot<1||slot>SAVE_SLOTS)throw Error('ranura del último guardado inválida');
 const raw=await d.eval(key=>localStorage.getItem(key),saveKey(slot));
 if(!raw)throw Error('payload de la ranura ausente');
 const data=JSON.parse(raw);
 if(!Number.isSafeInteger(data?.savedAt)||data.savedAt<=0)throw Error('payload sin fecha de guardado válida');
 const live=await readPersistentSaveData(d);
 if(data.player?.name!==live.player?.name||data.player?.id!==live.player?.id)throw Error('identidad del payload distinta a la partida viva');
 if(JSON.stringify(persistentSaveData(data))!==JSON.stringify(persistentSaveData(live)))throw Error('payload distinto a la partida viva');
 const clockError=clockReloadError(data,live);if(clockError)throw Error(clockError);
 return data;
}

/** El reloj de la partida puede avanzar al cerrar menús; no puede perder la hora guardada. */
export function clockReloadError(beforeData,afterData) {
 const a=beforeData.clock?.minutes,b=afterData.clock?.minutes;
 if(![a,b].every(n=>Number.isInteger(n)&&n>=0&&n<1440))return 'reloj guardado ausente o inválido';
 if((b-a+1440)%1440>15)return 'la hora guardada retrocedió o cambió demasiado';
 return null;
}

export function checkpointReloadError(before,after,name) {
 if(after.playerName!==name)return 'se cargó otra partida';
 for(const key of ['map','x','y','pokemon','partyFull','boxedPokemon','cells','cores','fragments','tablets',
  'money','bag','keyItems','abilities','zygarde','flags','vars']) {
  if(JSON.stringify(before[key])!==JSON.stringify(after[key]))return `${key} distinto tras recargar el checkpoint`;
 }
 return null;
}

/** Guardado y Continuar/Cargar ordinarios, conservando solo metadatos de evidencia entre documentos. */
export async function reloadCheckpoint(d,name,label) {
 await d.save(label);
 const before=await d.snap(),log=await d.log(),beforeSaveData=await readPersistentSaveData(d),savedData=await readSavedSlotData(d);
 fs.writeFileSync(path.join(d.outDir,`campaign_${label.toLowerCase()}_before_reload.json`),JSON.stringify(before,null,2));
 fs.writeFileSync(path.join(d.outDir,`campaign_${label.toLowerCase()}_before_reload_save.json`),JSON.stringify(beforeSaveData,null,2));
 fs.writeFileSync(path.join(d.outDir,`campaign_${label.toLowerCase()}_before_reload_slot.json`),JSON.stringify(savedData,null,2));
 await d.page.reload({waitUntil:'load'});await refreshDriver(d);
 await d.until(s=>s.top==='TitleScene',{what:'título tras recargar el checkpoint'});
 await d.wait(800);await d.press('KeyZ',700);
 await d.until(s=>s.titleStage==='menu',{what:'Continuar de la misma QA'});
 await d.wait(200);await d.press('KeyZ',700);
 await d.until(s=>s.top==='SaveLoadScene',{what:'ranura de la misma QA'});
 await d.press('KeyZ',400);await d.until(s=>s.top==='ChoiceScene',{what:'Cargar checkpoint'});
 await d.press('KeyZ',700);await d.until(s=>s.top==='MapScene'&&s.ready,{timeout:30000,what:'checkpoint cargado'});
 await d.settle();
 // Son registros de la prueba; no se escriben GameState, guiones ni inventario.
 await d.eval(({log,battles})=>{window.__campaign.log.unshift(...log);window.__campaign.battles.unshift(...battles);},{log,battles:before.battles});
 const afterSaveData=await readPersistentSaveData(d);
 fs.writeFileSync(path.join(d.outDir,`campaign_${label.toLowerCase()}_after_reload_save.json`),JSON.stringify(afterSaveData,null,2));
 const fullError=JSON.stringify(persistentSaveData(savedData))===JSON.stringify(persistentSaveData(afterSaveData))?null:'GameState completo distinto tras recargar';
 await d.milestone(`${label.toLowerCase()}_recargado`,s=>checkpointReloadError(before,s,name)||fullError||clockReloadError(savedData,afterSaveData));
 fs.writeFileSync(path.join(d.outDir,`campaign_${label.toLowerCase()}_after_reload.json`),JSON.stringify(await d.snap(),null,2));
 d.optionsConfigured=false;await d.page.keyboard.up('ShiftLeft');await d.configureOptions();
}
