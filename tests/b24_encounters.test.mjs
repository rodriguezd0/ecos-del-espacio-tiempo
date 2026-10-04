import test from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { createPokemon, healed } from '../game/src/battle/core/pokemon.js';
import { Battle, HeadlessBattleUI } from '../game/src/battle/core/index.js';
import { buildBattleConfig } from '../game/src/battle/scene/setup.js';
import { db } from './battle_helpers.mjs';
import { EXPEDITIONS, activate } from '../game/src/content/events/b24_registry.js';
import { LEGENDS, encounterRequest } from '../game/src/content/events/b24_conditions.js';
import { legendFight } from '../game/src/content/events/b24_encounters.js';
const fixture = (outcome = 'caught') => {
  const state = GameState.create({ name: 'Axis' }); for (const f of ['game_cleared','b21_fin','dlc2_registro_abierto'])state.setFlag(f);
  activate(state,'SHAYMIN'.toLowerCase()); state.setFlag('dlc2_shaymin_indicio'); state.setFlag('dlc2_shaymin_confirmada');
  state.setParty([createPokemon(db,'MEWTWO',80,{rng:()=>0.5})]);
  const requests=[]; const ctx={state,db,world:{},player:{},map:{id:'b24_isla_petalo'},say:async()=>{},confirm:async()=>true,cry(){},requestRefresh(){},
    battle:async(r)=>{requests.push(r);return outcome;},heal:()=>state.setParty(state.party.map((p)=>healed(db,p))),flag:(f)=>state.flag(f),setFlag:(f,v)=>state.setFlag(f,v),var:(k,d)=>state.var(k,d),setVar:(k,v)=>state.setVar(k,v),giveItem:async(id,n)=>state.addItem(id,n)};
  return{state,ctx,requests};
};
test('B24: cancelar y requisitos incompletos no empiezan un combate ni gastan recursos',async()=>{
  const{state,ctx,requests}=fixture();state.setFlag('dlc2_shaymin_confirmada',false);await legendFight(ctx,'SHAYMIN');assert.equal(requests.length,0);
  state.setFlag('dlc2_shaymin_confirmada');ctx.confirm=async()=>false;await legendFight(ctx,'SHAYMIN');assert.equal(requests.length,0);
});
test('B24: captura completa Hallazgo; no se vuelve a combatir al hablar otra vez',async()=>{
  const{state,ctx,requests}=fixture();assert.equal(await legendFight(ctx,'SHAYMIN'),'caught');assert.ok(state.flag('dlc2_shaymin_capturado'));assert.ok(state.flag('dlc2_shaymin_hallazgo'));
  await legendFight(ctx,'SHAYMIN');assert.equal(requests.length,1);
});
test('B24: KO espera descanso; descansar habilita el mismo encuentro',async()=>{
  const{state,ctx,requests}=fixture('win');await legendFight(ctx,'SHAYMIN');assert.equal(state.var('dlc2_shaymin_descanso'),0);assert.ok(!state.flag('dlc2_shaymin_hallazgo'));
  await legendFight(ctx,'SHAYMIN');assert.equal(requests.length,1);state.setVar('rest_count',1);await legendFight(ctx,'SHAYMIN');assert.equal(requests.length,2);
});
for(const outcome of ['lose','run','forfeit'])test('B24: '+outcome+' no completa ni retira permanentemente el encuentro',async()=>{
  const{state,ctx,requests}=fixture(outcome);state.party[0].hp=1;await legendFight(ctx,'SHAYMIN');await legendFight(ctx,'SHAYMIN');assert.equal(requests.length,2);assert.ok(!state.flag('dlc2_shaymin_hallazgo'));
  if(outcome!=='run')assert.equal(state.party[0].hp,healed(db,state.party[0]).hp);
});
test('B24: todos los legendarios se capturan en el motor normal con una Ball consumida',async()=>{
  class CaptureUI extends HeadlessBattleUI{async chooseAction(){return 'bag';}async chooseItem(){return {item:'MASTERBALL',target:0,move:-1};}}
  for(const species of Object.keys(LEGENDS)){
    const raw=encounterRequest(species);const req={...raw,opponent:{party:[raw.wild]},player:{party:[createPokemon(db,'MEWTWO',90,{rng:()=>0.5})],bag:{MASTERBALL:1}}};
    const{config}=buildBattleConfig(req,{db});const result=await new Battle({...config,rng:()=>0.99},new CaptureUI()).run();
    assert.equal(result.outcome,'caught',species);assert.equal(result.caught.species,species);assert.equal(result.bag.MASTERBALL||0,0);
  }
});
