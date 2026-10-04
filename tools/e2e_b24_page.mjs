// Decisiones sobre el motor real, sin sustituir resultados ni condiciones de expedición.
import { installB22cHelpers } from './e2e_b22c_page.mjs';
export async function installB24Helpers(page,opts={}){
 await installB22cHelpers(page,opts);
 await page.evaluate(async()=>{
  const{engine}=await import('/src/core/engine.js');const registry=await import('/src/content/events/b24_registry.js');
  const s=engine.state,base=window.__b22c;
  if(!s.flag('dlc2_fixture_balls'))s.addItem('MASTERBALL',40);
  s.setFlag('dlc2_fixture_balls');
  const quest=id=>{const r=registry.activate(s,id);if(!['ok','active','done'].includes(r))throw new Error(`${id}: ${r}`);if(r!=='done'){s.setFlag(`dlc2_${id}_indicio`);s.setFlag(`dlc2_${id}_confirmada`);}window.__map.world.refreshEvents();};
  const preserveEggs=()=>{for(const egg of s.party.filter(p=>p.egg)){const bi=s.boxes.findIndex(box=>box.includes(null));if(bi<0)throw new Error('No hay hueco para guardar el Huevo real del recorrido');s.setBoxPokemon(bi,s.boxes[bi].indexOf(null),egg);}s.setParty(s.party.filter(p=>!p.egg));};
  const combatTeam=()=>{preserveEggs();base.combatTeam();};
  const capturedParty=list=>{
   combatTeam();for(const species of list){const bi=s.boxes.findIndex(box=>box.some(p=>p?.species===species&&!p.egg));if(bi<0)throw new Error('Falta captura real '+species);const pi=s.boxes[bi].findIndex(p=>p?.species===species&&!p.egg),pk=s.boxes[bi][pi];s.setBoxPokemon(bi,pi,null);s.addPokemon(pk);}window.__map.refreshFollower?.();window.__map.world.refreshEvents();
  };
  window.__b24={...base,quest,capturedParty,combatTeam,
   fieldTeam:()=>{preserveEggs();base.team([['MEW',100,['SURF','EMBER','RAINDANCE','THUNDER']],['JIGGLYPUFF',70,['SING']]]);},
   wild:species=>window.__map.runScript(ctx=>ctx.battle({type:'wild',noCoop:true,wild:{species,level:3},rules:{canCatch:true,canRun:true}})),
   use:async id=>{const{useBagItem}=await import('/src/ui/screens/bagUse.js');window.__map.runScript(()=>useBagItem(id));},
   hour:h=>{s.data.clock.minutes=h*60;window.__map.world.refreshEvents();},
   snap:()=>({...base.snap(),quests:registry.activeExpeditions(s),wave:registry.availableWave(s),hallazgos:registry.hallazgoCount(s),
    party:s.party.map(p=>({species:p.species,level:p.level,egg:!!p.egg,hp:p.hp,eggSteps:p.eggSteps})),daycare:s.daycare,
    partyIndex:engine.scenes.top?.constructor?.name==='PartyScene'?engine.scenes.top.index:null,darkness:window.__map.darkness,
    region:engine.scenes.top?.constructor?.name==='RegionMapScene'?{x:engine.scenes.top.cx,y:engine.scenes.top.cy,places:engine.scenes.top.map.places.map(p=>({id:p.id,x:p.x,y:p.y}))}:null})};
 });
}
