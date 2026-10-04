import test from 'node:test';
import assert from 'node:assert/strict';
import { runB15, walkSenda } from '../tools/e2e_campaign_b15.mjs';
import { GameState } from '../game/src/core/state.js';
import { World } from '../game/src/world/world.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import { CampaignDriver } from '../tools/e2e_campaign_driver.mjs';
import { SENDA, wrongTops, correctStair, stairColumn, footRow } from '../game/src/content/maps/b15/layout_senda.js';
import { RUTA11 } from '../game/src/content/maps/b15/layout_ruta11.js';
import { F, V } from '../game/src/content/events/b15_common.js';

// Capture exactly the stages runB15 installs. Browser installers are deliberately
// inert in this isolated Node fixture; the continuous campaign is never consulted.
async function b15Stages() {
  let stages;
  const d = { page: { waitForFunction: async () => {}, evaluate: async () => {} }, liveTicker: true,
    stages: async (block, steps) => { assert.equal(block, 'B15'); stages = steps; } };
  await runB15(d);
  return stages;
}

const checkpoint = new Error('isolated fixture reached checkpoint');
async function ruta11Fixture(flags, check) {
  const state = GameState.create({ name: 'B15_FLAGS_FIXTURE' });
  for (const flag of flags) state.setFlag(flag);
  const view = { map: 'ruta_11', flags: state.data.flags }, calls = [];
  const d = { walkTo: async (x,y) => calls.push([x,y]), expectSaid: async () => {},
    milestone: async (name, callback) => {
      const error = callback(view); if (error) throw Error(error);
      if (name === 'desvinculacion') throw checkpoint;
    } };
  await check({ state, view, calls, run: () => b15Stages().then(s => s.ruta11(d)) });
}

test('campaign B15: the actual Ruta 11 checkpoint accepts both observed story flags', async () => {
  await ruta11Fixture([F.unbound,F.r11Intro], async ({ state,calls,run }) => {
    const before = structuredClone(state.data);
    await assert.rejects(run, error => error === checkpoint);
    assert.deepEqual(calls, [[14,RUTA11.unbound.trigger.y-1]]);
    assert.deepEqual(state.data,before,'validation does not manufacture progress');
  });
});

test('campaign B15: either missing Ruta 11 flag rejects the checkpoint before the cell excursion', async () => {
  for (const flags of [[],[F.unbound],[F.r11Intro]]) await ruta11Fixture(flags, async ({ state,calls,run }) => {
    const before = structuredClone(state.data);
    await assert.rejects(run,/sin la desvinculación/);
    assert.equal(calls.length,1); assert.deepEqual(state.data,before);
  });
});

const DV = Object.freeze({2:[0,1],4:[-1,0],6:[1,0],8:[0,-1]});
const key = (x,y) => `${x},${y}`;
function route(world,tx,ty,avoid=[],{onto=true}={}) {
  const p=world.player,bad=new Set(avoid),queue=[[p.x,p.y]],prev=new Map([[key(p.x,p.y),null]]);
  for (let n=0;n<queue.length;n++) {
    const [x,y]=queue[n];
    if (onto ? x===tx&&y===ty : Math.abs(x-tx)+Math.abs(y-ty)===1) {
      const path=[];for(let k=key(x,y);prev.get(k);){const [parent,dir]=prev.get(k);path.unshift(dir);k=parent;}return path;
    }
    const view=Object.create(p);Object.defineProperties(view,{x:{value:x},y:{value:y}});
    for(const [dir,[dx,dy]] of Object.entries(DV)) {
      const nx=x+dx,ny=y+dy,k=key(nx,ny);
      if(prev.has(k)||bad.has(k)||!world.map.valid(nx,ny)||!view.passable(x,y,Number(dir)))continue;
      prev.set(k,[key(x,y),Number(dir)]);queue.push([nx,ny]);
    }
  }
  return null;
}

async function sendaFixture(check) {
  const state=GameState.create({name:'B15_SENDA_FIXTURE'});
  state.setFlag(F.p7);state.data.zygarde.form='50';
  for(const ability of ['run','terrain','climb','swim','ram'])state.setZygardeAbility(ability,true);
  // These two optional trainers were beaten earlier in this declared fixture.
  for(const id of ['excursionista_telmo','aspirante_ximena'])state.setSelfSwitch('ruta_12_senda_lazo',id,'A',true);
  const {entry,warnings}=await buildMapNode('ruta_12_senda_lazo');assert.deepEqual(warnings,[]);
  const world=new World({state,rng:()=>0.99,hooks:{encountersEnabled:()=>false}});
  world.setCurrent({...entry,events:null});world.player.moveTo(SENDA.start.x,SENDA.start.y);
  const log=[],walked=[],requests=[];let busy=false;
  world.scriptBusyFn=()=>busy;
  const snap=()=>({map:world.map.id,x:world.player.x,y:world.player.y,dir:world.player.direction,
    flags:state.data.flags,vars:state.data.vars,cells:state.data.zygarde.cells,battles:[],
    top:'MapScene',busy,playerBusy:world.player.busy(),healPoint:{}});
  const drain=async()=>{
    for(let n=0;n<20;n++) {
      const event=world.takeStartingEvent();if(!event)return;
      busy=true;event.lock();
      const ctx={state,player:world.player,flag:f=>state.flag(f),setFlag:(f,v=true)=>state.setFlag(f,v),
        var:(v,f)=>state.var(v,f),setVar:(v,n)=>state.setVar(v,n),say:async text=>log.push(String(text)),
        selfSwitch:k=>state.selfSwitch(world.map.id,event.id,k),setSelfSwitch:(k,v)=>state.setSelfSwitch(world.map.id,event.id,k,v),
        giveItem:async(id,n=1)=>state.addItem(id,n),se:()=>{},flash:async()=>{},fade:async()=>{},
        warp:async(map,x,y,dir)=>{assert.equal(map,world.map.id);world.player.moveTo(x,y);world.player.direction=dir;},
        requestRefresh:()=>world.refreshEvents()};
      try{await event.script(ctx);}finally{event.unlock();busy=false;world.refreshEvents();}
    }
    assert.fail('fixture contact events did not finish');
  };
  const step=async dir=>{
    assert.equal(world.player.moveGeneric(dir),true,`blocked real step ${dir} from (${world.player.x},${world.player.y})`);
    for(let n=0;n<120&&world.player.busy();n++)world.update(1/60);
    assert.equal(world.player.busy(),false);walked.push([world.player.x,world.player.y]);await drain();
  };
  const original=globalThis.window;
  globalThis.window={__e2e:{route:(x,y,opts)=>route(world,x,y,[],opts)},
    __b15:{routeAvoid:(x,y,avoid,opts)=>{requests.push([...avoid]);return route(world,x,y,avoid,opts);},items:id=>state.itemCount(id)}};
  const d={snap:snap,snapState:snap,eval:async(fn,arg)=>fn(arg),step,settle:async()=>{await drain();return snap();},
    turn:async face=>{world.player.direction={up:8,down:2,left:4,right:6}[face]||face;},
    whiteout:()=>false,walkTo:CampaignDriver.prototype.walkTo,
    expectSaid:async re=>assert.ok(log.some(text=>re.test(text)),`missing transcript ${re}`),
    interact:async()=>{world.actionButton();await drain();},
    milestone:async(name,callback)=>{const error=callback(snap());if(error)throw Error(error);if(name==='senda_mirador')throw checkpoint;}};
  try{await check({world,state,log,walked,requests,d,run:()=>b15Stages().then(s=>s.senda(d))});}
  finally{if(original===undefined)delete globalThis.window;else globalThis.window=original;}
}

test('campaign B15: the real Senda stage tries one false stair and then reaches the mirador via the four true stairs',async()=>{
  await sendaFixture(async({world,state,walked,requests,run})=>{
    await assert.rejects(run,error=>error===checkpoint);
    assert.equal(state.var(V.loops),1,'safe planning does not repeat the voluntary false ascent');
    assert.equal(state.flag(F.sendaTop),true);assert.equal(state.itemCount('TYRANITARITE'),1);
    assert.equal(state.data.zygarde.form,'50');assert.equal(world.map.id,'ruta_12_senda_lazo');
    assert.ok(walked.some(([x,y])=>x===stairColumn(0,'O')&&y===footRow(0)));
    for(let k=0;k<4;k++)assert.ok(walked.some(([x,y])=>x===correctStair(k).top[0]&&y===correctStair(k).top[1]));
    const wrong=new Set(wrongTops().map(p=>key(p.x,p.y)));
    assert.equal(walked.filter(p=>wrong.has(key(...p))).length,1);
    assert.ok(requests.length>0);assert.deepEqual(new Set(requests[0]),wrong);
  });
});

test('campaign B15: a missing safe Senda route fails without marking the mirador or granting its stone',async()=>{
  await sendaFixture(async({state,d,run})=>{
    let looked=false;window.__b15.routeAvoid=()=>{looked=true;return null;};
    // The first inherited walk reaches the lower plaza; the guarded local route
    // must refuse the next climb rather than using the unsafe generic route.
    await assert.rejects(run,/Sin ruta/);
    assert.equal(looked,true);assert.equal(state.flag(F.sendaTop),false);assert.equal(state.itemCount('TYRANITARITE'),0);
  });
});

test('campaign B15: safe walking respects adjacent goals and turns after arriving',async()=>{
  await sendaFixture(async({world,d})=>{
    await walkSenda(d,SENDA.east.x,41,{onto:false,face:'right'});
    assert.deepEqual([world.player.x,world.player.y,world.player.direction],[38,41,6]);
  });
});

test('campaign B15: a busy scene settles with its watches before replanning on the real map',async()=>{
  await sendaFixture(async({world,d,requests})=>{
    let busy=true;const watch=[{name:'fixture',re:/script/}];
    d.snapState=async()=>({...d.snap(),busy});
    d.settle=async opts=>{assert.equal(opts.watch,watch);busy=false;return d.snap();};
    await walkSenda(d,36,41,{watch});
    assert.equal(world.player.x,36);assert.equal(busy,false);assert.ok(requests.length);
  });
});

test('campaign B15: stopWhen interrupts a safe route at the observed position',async()=>{
  await sendaFixture(async({world,state,d})=>{
    const form=state.data.zygarde.form;
    const end=await walkSenda(d,30,41,{stopWhen:s=>s.x===36});
    assert.equal(end.x,36);assert.equal(world.player.x,36);assert.equal(state.data.zygarde.form,form);
    assert.equal(state.flag(F.sendaTop),false);assert.equal(state.itemCount('TYRANITARITE'),0);
  });
});

test('campaign B15: after a real map replacement the safe walker returns without issuing stale steps',async()=>{
  await sendaFixture(async({world,d})=>{
    const {entry}=await buildMapNode('paso_del_norte');
    const step=d.step;let steps=0;
    d.step=async dir=>{steps++;await step(dir);world.setCurrent({...entry,events:null});};
    const end=await walkSenda(d,30,41);
    assert.equal(end.map,'paso_del_norte');assert.equal(steps,1);
  });
});

test('campaign B15: an explicit step limit stops safe navigation without awarding progress',async()=>{
  await sendaFixture(async({state,d,walked})=>{
    await assert.rejects(walkSenda(d,30,41,{maxSteps:1}),/demasiados pasos/);
    assert.equal(walked.length,1);assert.equal(state.flag(F.sendaTop),false);assert.equal(state.itemCount('TYRANITARITE'),0);
  });
});

test('campaign B15: a vanished route after an ordinary step is recalculated and refused',async()=>{
  await sendaFixture(async({state,d,requests,walked})=>{
    const original=window.__b15.routeAvoid;let queries=0;
    window.__b15.routeAvoid=(...args)=>++queries===1?original(...args):null;
    await assert.rejects(walkSenda(d,30,41),/Sin ruta/);
    assert.equal(queries,2);assert.equal(requests.length,1);assert.equal(walked.length,1);
    assert.equal(state.flag(F.sendaTop),false);assert.equal(state.data.zygarde.form,'50');
  });
});
test('campaign B15: ordinary north preparation heals through the real nurse and returns to the street',async()=>{
 const campaign=await import('../tools/e2e_campaign_b15.mjs'),calls=[];
 const d={travel:async map=>calls.push(['travel',map]),talk:async id=>calls.push(['talk',id])};
 await campaign.prepareB15(d);
 assert.deepEqual(calls,[['travel','lumina_centro'],['talk','enfermera'],['travel','ciudad_lumina']]);
});
