import test from 'node:test';
import assert from 'node:assert/strict';
import {runB21} from '../tools/e2e_campaign_b21.mjs';
import {F,V} from '../game/src/content/events/b21_common.js';
import {completeArceus,arceusRetryChoice,arceusRetreatError,arceusLossError,arceusHealedError,arceusResultError} from '../tools/e2e_campaign_b21_retry.mjs';
import {BATTLE_TEXT} from '../game/src/content/events/b21_texts.js';
import {COLUMNA} from '../game/src/content/maps/b21/layout.js';
import {CampaignDriver} from '../tools/e2e_campaign_driver.mjs';
import {loadMapDefinition} from '../game/src/content/maps/index.js';
import {GameState} from '../game/src/core/state.js';
import {createPokemon,healed,maxHP,totalPP} from '../game/src/battle/core/pokemon.js';
import {db} from './battle_helpers.mjs';

async function steps() {
  let result;
  await runB21({page:{waitForFunction:async()=>{},evaluate:async()=>{}},liveTicker:true,
    stages:async(_,s)=>{result=s;}});
  return result;
}

test('campaign B21: resume an awake Arceus with the joined Zygarde and heal through the real spring',async()=>{
  const state={map:'columna_lanza',x:14,y:9,flags:{[F.zygardeAsked]:true,[F.zygardeJoined]:true,[F.arceusAwake]:true},
    vars:{[V.phase]:1,[V.tries]:99},pokemon:[{species:'GOLEM',hp:0,maxHP:195,status:null},{species:'ZYGARDE',hp:150,maxHP:383,status:null}],
    battles:[],money:92040},before=structuredClone(state),stop=Error('normal spring interaction reached');
  const d={want:[],snap:async()=>state,snapState:async()=>state,
    talk:async id=>{assert.equal(id,'b21_manantial_2_1');throw stop;},
    walkTo:async()=>assert.fail('Zygarde already joined: do not repeat the question or the Arca gift')};
  await assert.rejects(()=>(steps().then(s=>s.cumbre(d))),e=>e===stop);
  assert.deepEqual(state,before);
});

const loss={species:'ARCEUS',level:75,outcome:'lose',canLose:true,noMoneyLoss:true,moneyBefore:92040,moneyAfter:92040};
const ready=()=>({map:'columna_lanza',...COLUMNA.retreat,flags:{[F.zygardeJoined]:true,[F.arceusAwake]:true},
  vars:{[V.phase]:1,[V.tries]:99},money:92040,pokemon:[{species:'ZYGARDE',hp:383,maxHP:383,status:null}],battles:[]});

function model(results=['retreat','win'],phases=[]) {
  let state=ready(),attempts=0;const controls=[],checks=[];
  const d={want:[],snap:async()=>structuredClone(state),
    talk:async id=>{controls.push(['talk',id]);state={...state,pokemon:state.pokemon.map(p=>({...p,hp:p.maxHP,status:null}))};},
    walkTo:async(x,y,{face})=>{controls.push(['walk',x,y,face]);state={...state,x,y};},
    interact:async options=>{
      const result=results[attempts]??'retreat',phase=phases[attempts]??state.vars[V.phase];attempts++;
      assert.deepEqual(d.want,state.flags[F.zygardeJoined]?['Sí']:['Sí','Sí']);d.want=[];
      if(result==='win'||result==='falseWin') {
        state={...state,map:'villa_alba',flags:{...state.flags,[F.arceusDone]:true},
          battles:[...state.battles,{...loss,outcome:result==='win'?'win':'lose'}]};return;
      }
      state={...state,choices:[...BATTLE_TEXT.options],battles:[...state.battles,{...loss}]};
      assert.equal(CampaignDriver.prototype.pickChoice.call(d,state,options.choose),0);
      assert.equal(CampaignDriver.prototype.pickChoice.call(d,state,options.choose),0,'the same choice frame does not consume another retry');
      state={...state,battles:[...state.battles,{...loss}]};
      assert.equal(CampaignDriver.prototype.pickChoice.call(d,state,options.choose),1);
      state={...state,...COLUMNA.retreat,vars:{...state.vars,[V.phase]:phase,[V.tries]:state.vars[V.tries]+2},
        flags:{...state.flags,[F.zygardeJoined]:true,[F.arceusAwake]:true},choices:[],
        pokemon:state.pokemon.map(p=>({...p,hp:p.maxHP,status:null}))};
    },
    choiceRules:[],milestone:async(name,check)=>{checks.push(name);const error=await check(state);if(error)throw Error(error);}};
  return {d,controls,checks,state:()=>state,set:s=>{state=s;},attempts:()=>attempts};
}

test('campaign B21: one retry followed by a UI retreat, then walk back to an awake Arceus',async()=>{
  const f=model(),flags=structuredClone(f.state().flags);await completeArceus(f.d,{timeout:900000});
  assert.equal(f.attempts(),2);assert.equal(f.d.arceusRetreats.get(1),1);
  assert.deepEqual(f.controls,[['walk',14,9,8],['walk',14,9,8]]);
  assert.deepEqual(f.checks,['arceus_retirada_1_1']);assert.equal(f.state().money,92040);
  for(const flag of Object.keys(flags))assert.equal(f.state().flags[flag],flags[flag]);
});

test('campaign B21: initial low HP uses the real spring before continuing the saved phase',async()=>{
  const f=model(['win']);f.set({...f.state(),pokemon:[{species:'ZYGARDE',hp:150,maxHP:383,status:'POISON'}]});
  await completeArceus(f.d);assert.deepEqual(f.controls,[['talk','b21_manantial_2_1'],['walk',14,9,8]]);
  assert.deepEqual(f.checks,['arceus_manantial']);assert.equal(f.state().vars[V.phase],1);
});

test('campaign B21: the first awakening chooses the two real confirmations, while a completed fight is not repeated',async()=>{
  const f=model(['win']);f.set({...f.state(),flags:{},vars:{}});await completeArceus(f.d);
  assert.equal(f.attempts(),1);const controls=f.controls.length;await completeArceus(f.d);assert.equal(f.controls.length,controls);
});

test('campaign B21: three retreats stop before another fight and the phase counter survives reentry',async()=>{
  const f=model();f.d.arceusRetreats=new Map([[1,2]]);
  await assert.rejects(()=>completeArceus(f.d),/Tres retiradas reales/);
  assert.equal(f.attempts(),1);assert.equal(f.d.arceusRetreats.get(1),3);
  await assert.rejects(()=>completeArceus(f.d),/Tres retiradas reales/);assert.equal(f.attempts(),1);
  assert.equal(arceusHealedError(f.state()),null);
});

test('campaign B21: a newly reached phase keeps its own bounded retreat count',async()=>{
  const f=model(['retreat','win'],[2]);f.d.arceusRetreats=new Map([[1,2]]);
  await completeArceus(f.d);assert.equal(f.d.arceusRetreats.get(1),2);assert.equal(f.d.arceusRetreats.get(2),1);
  assert.equal(f.state().vars[V.phase],2);assert.equal(f.attempts(),2);
});

test('campaign B21: retry choice needs a new protected loss and ignores unrelated menus',()=>{
  const before=ready(),choose=arceusRetryChoice(before),s={...before,choices:[...BATTLE_TEXT.options]};
  assert.equal(choose({...s,choices:['Sí','No']}),0);
  assert.throws(()=>choose(s),/sin derrota nueva/);
  assert.throws(()=>choose({...s,battles:[{...loss,species:'PIKACHU'}]}),/sin derrota protegida/);
  for(const change of [{species:'DIALGA'},{level:74},{outcome:'win'},{canLose:false},{noMoneyLoss:false}])
    assert.match(arceusLossError({...loss,...change}),/sin derrota protegida/);
  assert.match(arceusLossError(undefined),/sin derrota protegida/);
  for(const change of [{moneyBefore:undefined},{moneyAfter:undefined},{moneyBefore:NaN},{moneyAfter:'92040'},{moneyBefore:-1},{moneyAfter:92041}])
    assert.match(arceusLossError({...loss,...change}),/dinero/);
});

test('campaign B21: retreat proof rejects stale losses, wrong position, lost phase, money and missing healing',()=>{
  const before=ready(),after={...ready(),battles:[{...loss}],vars:{[V.phase]:1,[V.tries]:101}};
  assert.equal(arceusRetreatError(before,after),null);
  for(const change of [{map:'villa_alba'},{x:12},{y:29}])assert.match(arceusRetreatError(before,{...after,...change}),/fuera de la retirada/);
  for(const flag of [F.zygardeJoined,F.arceusAwake])assert.match(arceusRetreatError(before,{...after,flags:{...after.flags,[flag]:false}}),/fase o progreso/);
  assert.match(arceusRetreatError(before,{...after,flags:{...after.flags,[F.arceusDone]:true}}),/fase o progreso/);
  for(const phase of [0,-1,3,'1',NaN])assert.match(arceusRetreatError(before,{...after,vars:{[V.phase]:phase}}),/fase o progreso/);
  assert.match(arceusRetreatError(before,{...after,battles:[]}),/sin derrota nueva/);
  assert.match(arceusRetreatError(before,{...after,battles:[{...loss,outcome:'caught'}]}),/sin derrota protegida/);
  for(const money of [undefined,92039])assert.match(arceusRetreatError({...before,money},after),/dinero/);
  for(const pokemon of [[],[{hp:0,maxHP:383}],[{hp:383,maxHP:383,status:'POISON'}],[{hp:0,maxHP:0}]])
    assert.match(arceusRetreatError(before,{...after,pokemon}),/sin cura completa/);
});

test('campaign B21: failed paths, wrong map, phase or retreat cannot start an unobserved retry',async()=>{
  for(const change of [{map:'villa_alba'},{vars:{[V.phase]:3}},{money:undefined}]) {
    const f=model();f.set({...f.state(),...change});await assert.rejects(()=>completeArceus(f.d),/fuera de su columna, fase o dinero válido/);assert.equal(f.attempts(),0);
  }
  const path=model(),error=Error('path failed');path.d.walkTo=async()=>{throw error;};await assert.rejects(()=>completeArceus(path.d),e=>e===error);
  const bad=model();bad.d.interact=async()=>{};await assert.rejects(()=>completeArceus(bad.d),/fuera de la retirada/);assert.equal(bad.attempts(),0);
  const changed=model(['win']);changed.set({...changed.state(),pokemon:[]});changed.d.talk=async()=>{changed.set({...changed.state(),money:0});};
  await assert.rejects(()=>completeArceus(changed.d),/manantial cambió/);
});

test('campaign B21: a victory flag alone cannot replace the actual Arceus result',async()=>{
  const f=model(['falseWin']);await assert.rejects(()=>completeArceus(f.d),/sin victoria real de Arceus/);
  await assert.rejects(()=>completeArceus(f.d),/sin victoria real de Arceus/);
  const valid={...ready(),flags:{[F.arceusDone]:true},battles:[{...loss,outcome:'caught'}]};
  assert.equal(arceusResultError(valid),null);
  for(const change of [{level:74},{canLose:false},{noMoneyLoss:false}])
    assert.match(arceusResultError({...valid,battles:[{...valid.battles[0],...change}]}),/sin victoria real/);
  assert.match(arceusResultError({...valid,flags:{}}),/sin victoria real/);
  assert.match(arceusResultError({...valid,battles:[]}),/sin victoria real/);
  for(const change of [{moneyBefore:undefined},{moneyAfter:undefined},{moneyAfter:92039}])
    assert.match(arceusResultError({...valid,battles:[{...valid.battles[0],...change}]}),/dinero de la victoria/);
});

test('campaign B21: registered spring heals the real Pokemon and preserves the saved phase and money',async()=>{
  const def=await loadMapDefinition('columna_lanza'),spring=def.events.find(e=>e.id==='b21_manantial_2_1');
  assert.deepEqual([spring.x,spring.y],[COLUMNA.spring.x+2,COLUMNA.spring.y+1]);
  const st=GameState.create({name:'Isolated fixture'}),p=createPokemon(db,'ZYGARDE',70,{rng:()=>0.5});
  st.setParty([{...p,hp:150,status:'POISON',moves:p.moves.map(m=>({...m,pp:0}))}]);st.setVar(V.phase,1);
  const money=st.player.money;await spring.script({say:async()=>{},fade:async()=>{},wait:async()=>{},me:()=>{},
    heal:()=>st.setParty(st.party.map(p=>healed(db,p)))});
  assert.equal(arceusHealedError({pokemon:st.party.map(p=>({...p,maxHP:maxHP(db,p)}))}),null);
  assert.equal(st.var(V.phase),1);assert.equal(st.player.money,money);
  assert.ok(st.party.every(p=>p.moves.every(m=>m.pp===totalPP(db,m))));
});
