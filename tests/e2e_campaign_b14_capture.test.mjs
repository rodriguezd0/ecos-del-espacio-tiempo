import test from 'node:test';
import assert from 'node:assert/strict';
import * as capture from '../tools/e2e_campaign_b14_capture.mjs';

function model() {
 const state={map:'fosa_eco',flags:{p7_restored:true,b14_bramaluna_eco:true},battles:[],partyList:['TORTERRA'],boxedPokemon:[]},calls=[];
 const lose={tag:'bramaluna_real',outcome:'lose',level:58,alpha:true,canRun:true,canLose:true,noMoneyLoss:true,catchRule:null,moneyBefore:34936,moneyAfter:34936};
 const caught={...lose,outcome:'caught'};
 const d={snap:async()=>structuredClone(state),faceEvent:async id=>calls.push(['face',id]),
  interact:async()=>{calls.push(['encounter']);state.battles.push(caught);state.boxedPokemon.push({species:'ROARINGMOON'});state.flags.b14_bramaluna_capturada=true;},
  milestone:async(name,check)=>{assert.equal(check(state),null);calls.push(['milestone',name]);}};
 return {state,calls,d,lose,caught};
}

test('campaign B14: the physical alpha is captured through its normal encounter and verified in the PC',async()=>{
 const {state,calls,d}=model();
 await capture.completeRealMoon(d);
 assert.deepEqual(calls,[['face','bramaluna_real'],['encounter'],['milestone','bramaluna_real']]);
 calls.length=0;await capture.completeRealMoon(d);
 assert.deepEqual(calls,[['milestone','bramaluna_real']]);
 assert.equal(state.flags.p7_restored,true);
});

test('campaign B14: a new protected physical-alpha defeat retries locally without repeating restoration',async()=>{
 const {state,calls,d,lose}=model();let attempts=0;
 const encounter=d.interact;
 d.interact=async()=>{
  attempts++;if(attempts===1){state.battles.push(lose);throw Error('retreated from nest');}
  await encounter();
 };
 await capture.completeRealMoon(d);
 assert.equal(attempts,2);assert.equal(state.flags.p7_restored,true);assert.equal(state.flags.b14_bramaluna_eco,true);
 assert.deepEqual(calls.filter(c=>c[0]==='face'),[['face','bramaluna_real'],['face','bramaluna_real']]);
});

test('campaign B14: a physical KO, old loss, unsafe money evidence or echo loss cannot masquerade as a capture retry',async()=>{
 for(const change of [{outcome:'win'},{tag:'bramaluna_eco'},{noMoneyLoss:false},{canLose:false},{moneyBefore:undefined,moneyAfter:undefined},{moneyBefore:'34936',moneyAfter:'34936'},{moneyAfter:-1},{moneyAfter:1},{map:'antea_4_presente'},{old:true}]){
  const {state,d,lose}=model();let attempts=0;if(change.old)state.battles.push(lose);
  d.interact=async()=>{attempts++;if(!change.old)state.battles.push({...lose,...change});if(change.map)state.map=change.map;throw Error('unrelated or unprotected');};
  await assert.rejects(capture.completeRealMoon(d),/unrelated or unprotected/);
  assert.equal(attempts,1);assert.equal(state.flags.p7_restored,true);assert.equal(state.flags.b14_bramaluna_capturada,undefined);
 }
});

test('campaign B14: physical-alpha retries are bounded and do not grant a catch after defeats',async()=>{
 const {state,d,lose}=model();let attempts=0;
 d.interact=async()=>{attempts++;state.battles.push({...lose});throw Error('retreated');};
 await assert.rejects(capture.completeRealMoon(d),/Tres retiradas reales/);
 assert.equal(attempts,3);assert.deepEqual(state.boxedPokemon,[]);assert.equal(state.flags.p7_restored,true);
 state.map='caleta_sonda';
 await assert.rejects(capture.completeRealMoon(d),/fuera del nido/);
});

test('campaign B14: a catch requires physical-alpha rules, the actual caught result and party or PC possession',()=>{
 const {state,caught}=model();state.flags.b14_bramaluna_capturada=true;state.battles=[caught];state.partyList.push('ROARINGMOON');
 assert.equal(capture.realCaptureError(state),null);
 for(const change of [{tag:'bramaluna_eco'},{outcome:'win'},{level:56},{alpha:false},{canRun:false},{canCatch:false},{catchRule:{allowed:false}}])
  assert.ok(capture.realCaptureError({...state,battles:[{...caught,...change}]}));
 assert.ok(capture.realCaptureError({...state,partyList:['TORTERRA']}));
 assert.ok(capture.realCaptureError({...state,flags:{p7_restored:true}}));
});
