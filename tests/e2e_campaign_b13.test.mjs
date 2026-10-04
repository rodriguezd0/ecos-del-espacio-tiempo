import test from 'node:test';
import assert from 'node:assert/strict';
import { installB13Observer } from '../tools/e2e_campaign_b13_page.mjs';
import { canSurfFreely, TERRAIN_NONE, TERRAIN_BY_ID } from '../game/src/world/terrain.js';
import { canOfferSwim } from '../game/src/world/waterAccess.js';
import * as campaignB13 from '../tools/e2e_campaign_b13.mjs';
import { POND } from '../game/src/content/maps/b10/mnemos_layout.js';
import {PILOTES} from '../game/src/content/maps/b13/talasa_pilotes.js';
import {World} from '../game/src/world/world.js';
import * as MAR from '../game/src/content/maps/b13/mar_layout.js';

async function withIslet({ followers = [], bridge = false, events=[] } = {}, check) {
  const original = globalThis.window;
  const map = {
    width: 3, height: 3, def: {}, valid: (x, y) => x >= 0 && y >= 0 && x < 3 && y < 3,
    terrainTagAt: (x, y) => x === 1 && y === 1 ? bridge ? TERRAIN_BY_ID.Bridge : TERRAIN_NONE : TERRAIN_BY_ID.StillWater,
    playerPassable: (x, y) => x === 1 && y === 1,counter:()=>false,
  };
  const player = { x: 1, y: 1, direction: 8, surfing: false,
    passable(x, y, dir) {
      const [dx, dy] = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] }[dir];
      return map.valid(x + dx, y + dy) && (this.surfing || map.playerPassable(x + dx, y + dy));
    },
  };
  const world = { map, player, followers, events, bridge: 0, eventsInFront:World.prototype.eventsInFront,
    env() { return { surfing: this.player.surfing, bridge: this.bridge }; } };
  globalThis.window = { __map: { world }, __campaign: { engine: {}, canSurfFreely, canOfferSwim, battles: [] } };
  try {
    await installB13Observer({ evaluate: async fn => fn() });
    await check({ world, player, observer: window.__b13 });
  } finally { globalThis.window = original; }
}

const follower = (x, y, visible = true) => ({ x, y, visible, busy: () => false });
const finishedTalasa=()=>({flags:{b13_talasa:true,b13_talasa_n4:true,zyg_core_4:true,b13_nilo_porygon:true},
 party:['PORYGON:40'],hour:19,cells:['cell_talasa_1','cell_talasa_2'],
 battles:[{trainers:['b13_casia','b13_garrido'],format:'double',ally:'Alerce',phases:1,outcome:'win'}]});

test('campaign B13: an islet departure chooses water free of the visible follower that receives A', async () => {
  await withIslet({ followers: [follower(1, 2)] }, ({ player, observer }) => {
    const before = { ...player };
    assert.deepEqual(observer.shoreFor(1, 3), { x: 1, y: 1, face: 4, score: 3 });
    assert.deepEqual(player, before, 'planning does not move or turn the real player');
  });
});

test('campaign B13: invisible followers do not obstruct the ordinary departure', async () => {
  await withIslet({ followers: [follower(1, 2, false)] }, ({ observer }) => {
    assert.deepEqual(observer.shoreFor(1, 3), { x: 1, y: 1, face: 2, score: 1 });
  });
});

test('campaign B13: the swimming shore avoids a decorative Pokémon that receives the actual action button',async()=>{
 const bird={x:1,y:2,through:true,trigger:'action',erased:false,at:(x,y)=>x===1&&y===2,jumping:()=>false,overTrigger:()=>false};
 await withIslet({events:[bird]},({observer})=>assert.deepEqual(observer.shoreFor(1,3),{x:1,y:1,face:4,score:3}));
});

test('campaign B13: a bridge cannot be selected as an ordinary swimming shore', async () => {
  await withIslet({ bridge: true }, ({ observer }) => assert.equal(observer.shoreFor(1, 3), null));
});

test('campaign B13: no interaction-free departure is reported when companions cover every water side', async () => {
  await withIslet({ followers: [follower(1, 2), follower(0, 1), follower(2, 1), follower(1, 0)] }, ({ observer }) => {
    assert.equal(observer.shoreFor(1, 3), null);
  });
});

test('campaign B13: mixed routes require actual swimming and keep hypothetical positions separate', async () => {
  await withIslet({}, ({ player, observer }) => {
    assert.equal(observer.routeMixed(0, 0), null);
    player.surfing = true; // separate unit fixture; the QA browser is not involved
    const before = { ...player };
    const path = observer.routeMixed(0, 0);
    assert.equal(path.length, 2);
    assert.deepEqual(player, before);
  });
});

test('campaign B13: retry after the cell pickup leaves the Mnemos islet with the normal swim controls', async () => {
  const state = { map: 'aldea_mnemos', x: POND.islet.x, y: POND.islet.y, surfing: false }, calls = [];
  const d = {
    snap: async () => ({ ...state }),
    swimTo: async (x, y) => { calls.push(['swim', x, y]); state.x = x; state.y = y; state.surfing = false; },
    settle: async () => state,
    milestone: async (name, check) => { assert.equal(check(state), null); calls.push(['milestone', name]); },
  };
  await campaignB13.recoverMnemosIslet(d);
  assert.deepEqual(calls, [['swim', POND.islet.x, POND.y - 1], ['milestone', 'mnemos_regreso_islote']]);
});

test('campaign B13: islet recovery leaves every other real position alone', async () => {
  for (const state of [{ map: 'ruta_4', x: POND.islet.x, y: POND.islet.y }, { map: 'aldea_mnemos', x: 15, y: 24 }]) {
    await campaignB13.recoverMnemosIslet({ snap: async () => state, swimTo: async () => assert.fail('unexpected swim') });
  }
});

test('campaign B13: a real Talasa whiteout returns from the nurse through shore and sea before retrying', async () => {
  const state = { map: 'caleta_centro', healPoint: { mapId: 'caleta_centro' }, battles: [{ outcome: 'lose' }] }, calls = [];
  const d = {
    snap: async () => ({ ...state }),
    talk: async id => calls.push(['talk', id]),
    travel: async map => { calls.push(['travel', map]); state.map = map; },
    swimTo: async (x, y) => calls.push(['swim', x, y]),
    crossEdge: async (dir, map) => { calls.push(['edge', dir, map]); state.map = map; },
    settle: async () => state,
    milestone: async (name,check) => assert.equal(check(state),null),
    whiteout: (before, after) => before.map !== after.map && after.map === after.healPoint.mapId && after.battles.at(-1).outcome === 'lose',
  };
  await campaignB13.completeTalasa(d, { run: async driver => { calls.push(['talasa', (await driver.snap()).map]);Object.assign(state,finishedTalasa()); } });
  assert.deepEqual(calls.slice(0, 2), [['talk', 'enfermera'], ['travel', 'caleta_sonda']]);
  assert.deepEqual(calls.filter(c => c[0] === 'edge'), [['edge', 'down', 'mar_del_sur'], ['edge', 'down', 'estacion_talasa']]);
  assert.deepEqual(calls.at(-1), ['talasa', 'estacion_talasa']);
});

test('campaign B13: a new ordinary trainer loss retries real progress without swallowing unrelated route errors', async () => {
  const state = { map: 'estacion_talasa', healPoint: { mapId: 'caleta_centro' }, battles: [] }; let attempts = 0;
  const d = {
    snap: async () => ({ ...state }), talk: async () => {},
    travel: async map => { state.map = map; }, swimTo: async () => {},
    crossEdge: async (dir, map) => { state.map = map; }, settle: async () => state,
    milestone: async (name,check) => assert.equal(check(state),null),
    whiteout: (before, after) => before.map !== after.map && after.map === after.healPoint.mapId && after.battles.at(-1)?.outcome === 'lose',
  };
  await campaignB13.completeTalasa(d, { run: async () => {
    if (++attempts === 1) { state.map = 'caleta_centro'; state.battles.push({ outcome: 'lose' }); throw Error('old local route'); }
    Object.assign(state,finishedTalasa());
  } });
  assert.equal(attempts, 2);
  state.flags={};
  await assert.rejects(campaignB13.completeTalasa(d, { run: async () => { throw Error('unrelated route'); } }), /unrelated route/);
});

test('campaign B13: both commanders must be present in the same real double victory',()=>{
 const s=finishedTalasa();s.battles[0].trainers=['b13_casia'];assert.ok(campaignB13.talasaResultError(s));
});

test('campaign B13: a successful normal runner must also prove the complete double and rewards',async()=>{
 const s={map:'estacion_talasa',flags:{},battles:[]};
 const d={snap:async()=>structuredClone(s),whiteout:()=>false,milestone:async(name,check)=>{
  const error=check(s);if(error)throw Error(error);
 }};
 await assert.rejects(campaignB13.completeTalasa(d,{run:async()=>{Object.assign(s,finishedTalasa());s.battles[0].trainers=['b13_casia'];}}),/victoria doble/);
});

test('campaign B13: a historical loss cannot turn an unrelated map change into a retry',async()=>{
 const s={map:'estacion_talasa',flags:{},healPoint:{mapId:'caleta_centro'},battles:[{outcome:'lose'}]};let attempts=0;
 const d={snap:async()=>structuredClone(s),talk:async()=>{},travel:async map=>{s.map=map;},swimTo:async()=>{},
  settle:async()=>s,crossEdge:async(dir,map)=>{s.map=map;},
  whiteout:(before,after)=>before.map!==after.map&&after.map===after.healPoint.mapId&&after.battles.at(-1).outcome==='lose'};
 await assert.rejects(campaignB13.completeTalasa(d,{run:async()=>{attempts++;s.map='caleta_centro';throw Error('unrelated failure');}}),/unrelated failure/);
 assert.equal(attempts,1);
});

test('campaign B13: repeated real whiteouts stop after three attempts without awarding progress', async () => {
  const state = { map: 'estacion_talasa', healPoint: { mapId: 'caleta_centro' }, battles: [], flags: {} }; let attempts = 0;
  const d = {
    snap: async () => ({ ...state }), talk: async () => {},
    travel: async map => { state.map = map; }, swimTo: async () => {},
    crossEdge: async (dir, map) => { state.map = map; }, settle: async () => state,
    whiteout: (before, after) => before.map !== after.map && after.map === after.healPoint.mapId && after.battles.at(-1)?.outcome === 'lose',
  };
  await assert.rejects(campaignB13.completeTalasa(d, { run: async () => {
    attempts++;state.map = 'caleta_centro';state.battles.push({ outcome: 'lose' });throw Error('lost');
  } }), /Tres derrotas reales/);
  assert.equal(attempts, 3);assert.deepEqual(state.flags, {});
});

test('campaign B13: historical single battle records expose a safe trainer list without changing the evidence',async()=>{
 await withIslet({},({observer})=>{
  const old={tag:'b01_gael',outcome:'win'};window.__campaign.battles.push(old);
  assert.deepEqual(observer.battles[0].trainers,[]);
  assert.equal(old.trainers,undefined);
  window.__campaign.battles.push({tag:'b13',trainers:['b13_casia','b13_garrido']});
  assert.deepEqual(observer.battles[1].trainers,['b13_casia','b13_garrido']);
 });
});

test('campaign B13: a completed real Talasa departure is verified without repeating its battles',async()=>{
 const state={flags:{b13_talasa:true,b13_talasa_n4:true,zyg_core_4:true,b13_nilo_porygon:true},party:['PORYGON:40'],hour:19,
  cells:['cell_talasa_1','cell_talasa_2'],battles:[{trainers:['b13_casia','b13_garrido'],format:'double',ally:'Alerce',phases:1,outcome:'win'}]};
 const d={snap:async()=>state,milestone:async(name,check)=>assert.equal(check(state),null)};
 await campaignB13.completeTalasa(d,{run:async()=>assert.fail('completed battle must not be repeated')});
 for(const change of [s=>s.flags.zyg_core_4=false,s=>s.flags.b13_nilo_porygon=false,s=>s.battles[0].outcome='lose',
  s=>s.battles[0].format='single',s=>s.battles[0].ally=false,s=>s.cells.pop(),s=>s.party=[],s=>s.hour=10]) {
  const broken=structuredClone(state);change(broken);assert.ok(campaignB13.talasaResultError(broken));
 }
});

test('campaign B13: completed Pilotes progress survives a real loss on the return sea',async()=>{
 const state={map:'caleta_centro',cells:[PILOTES.cell.key],flags:{b13_dive_resonance:true,b13_t11_ramon:true}},calls=[];
 const d={snap:async()=>state,talk:async id=>calls.push(['talk',id]),
  travel:async map=>{calls.push(['travel',map]);state.map=map;},
  milestone:async(name,check)=>{assert.equal(check(state),null);calls.push(['milestone',name]);}};
 await campaignB13.completePilotesTrip(d);
 assert.deepEqual(calls,[['talk','enfermera'],['travel','caleta_sonda'],['milestone','pilotes_regreso_cura']]);
});

function tizonRecoveryDriver() {
 const state={map:'volcan_tizon',flags:{},healPoint:{mapId:'caleta_centro'},battles:[]},calls=[];
 const d={snap:async()=>structuredClone(state),talk:async id=>calls.push(['talk',id]),
  travel:async map=>{calls.push(['travel',map]);state.map=map;},
  swimTo:async(x,y)=>calls.push(['swim',x,y]),crossEdge:async(dir,map)=>{calls.push(['edge',dir,map]);state.map=map;},
  whiteout:(before,after)=>before.map!==after.map&&after.map===after.healPoint.mapId&&after.battles.at(-1)?.outcome==='lose'};
 return {state,calls,d};
}

test('campaign B13: a new Tizón whiteout heals by UI and returns through the actual sea link',async()=>{
 const {state,calls,d}=tizonRecoveryDriver();let attempts=0;
 await campaignB13.completeTizon(d,{run:async(driver,options)=>{
  assert.equal(options.retry,false);calls.push(['tizon',state.map]);
  if(++attempts===1){state.map='caleta_centro';state.battles.push({tag:'b13_tecnica_perforacion',outcome:'lose'});throw Error('route after whiteout');}
 }});
 assert.equal(attempts,2);
 assert.deepEqual(calls.filter(c=>['talk','travel','edge','tizon'].includes(c[0])),[
  ['tizon','volcan_tizon'],['talk','enfermera'],['travel','caleta_sonda'],['edge','down','mar_del_sur'],['tizon','mar_del_sur'],
 ]);
 assert.ok(calls.some(c=>c[0]==='swim'&&c[1]===MAR.CELLS.c066.x&&c[2]===MAR.CELLS.c066.y),'the sea return reaches the actual C066 shore before land walking');
 assert.deepEqual(state.flags,{},'the recovery never grants a puzzle, victory or reward');
});

test('campaign B13: Tizón recovery rejects an unrelated failure after a historical loss',async()=>{
 const {state,d}=tizonRecoveryDriver();state.battles.push({outcome:'lose'});let attempts=0;
 await assert.rejects(campaignB13.completeTizon(d,{run:async()=>{attempts++;state.map='caleta_centro';throw Error('unrelated failure');}}),/unrelated failure/);
 assert.equal(attempts,1);
});

test('campaign B13: Tizón whiteouts stop after three real attempts without altering progress',async()=>{
 const {state,d}=tizonRecoveryDriver();let attempts=0;
 await assert.rejects(campaignB13.completeTizon(d,{run:async()=>{
  attempts++;state.map='caleta_centro';state.battles.push({outcome:'lose'});throw Error('lost');
 }}),/Tres derrotas reales en Tizón/);
 assert.equal(attempts,3);assert.deepEqual(state.flags,{});
});
