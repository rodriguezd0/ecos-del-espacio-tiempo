import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../game/src/world/world.js';
import { GameState } from '../game/src/core/state.js';
import { mapFromRows, T } from './world_helpers.mjs';

function setup(distance = 3) {
  const talked=[], map=mapFromRows(Array.from({length:9},()=>'.'.repeat(15)));
  const world=new World({state:GameState.create(),hooks:{followerTalk:f=>talked.push(f.id)}});
  world.setCurrent({id:map.id,def:{id:map.id},map});
  world.player.setCharsets({walk:'protagonista_m'}); world.player.moveTo(4,4); world.player.direction=6;
  world.core.setGraphic('follower:ZYGARDE:0:0'); world.core.moveTo(4+distance,4);
  world.follower.setGraphic('');
  return {world,map,talked};
}

test('A conserva la interacción adyacente original',()=> {
  const {world,talked}=setup(1);
  assert.equal(world.actionButton(),true); assert.deepEqual(talked,['core']);
});
test('A alcanza al seguidor visible a la nueva distancia de formación',()=> {
  const {world,talked}=setup(3);
  assert.equal(world.actionButton(),true); assert.deepEqual(talked,['core']);
});
test('A exige dirección, rango, visibilidad y reposo',()=> {
  for(const mode of ['sideways','far','hidden','transparent','busy','scriptBusy']) {
    const {world,talked}=setup(3), f=world.core;
    if(mode==='sideways') f.moveTo(7,5);
    if(mode==='far') f.moveTo(12,4);
    if(mode==='hidden') f.hidden=true;
    if(mode==='transparent') f.transparent=true;
    if(mode==='busy') f.startStep(6);
    if(mode==='scriptBusy') world.scriptBusyFn=()=>true;
    assert.equal(world.actionButton(),false,mode); assert.deepEqual(talked,[],mode);
  }
});
test('A no habla a través de muros, agua inaccesible ni personajes sólidos',()=> {
  for(const mode of ['wall','water','npc']) {
    const {world,map,talked}=setup(3);
    if(mode==='npc') world.spawnEvent({id:'obstaculo',x:6,y:4,sprite:'anil:joven',trigger:'action',script:async()=>{}});
    else map.layers[1][6+4*map.width]=mode==='wall'?T.WALL:T.WATER;
    assert.equal(world.actionButton(),false,mode); assert.deepEqual(talked,[],mode);
  }
});
test('eventos bajo los pies y delante conservan prioridad sobre el seguidor',()=> {
  for(const x of [4,5]) {
    const {world,talked}=setup(3);
    const event=world.spawnEvent({id:'prioridad',x,y:4,through:x===4,sprite:'anil:joven',trigger:'action',script:async()=>{}});
    assert.equal(world.actionButton(),true); assert.deepEqual(talked,[]); assert.equal(event.starting,true);
  }
});
test('dos seguidores: A alcanza primero al Core y luego al Pokémon cuando el Core se oculta',()=> {
  const {world,talked}=setup(3);
  world.follower.setPokemon({species:'PIKACHU'}); world.follower.moveTo(10,4);
  assert.equal(world.actionButton(),true); assert.deepEqual(talked,['core']);
  world.core.hidden=true; world.follower.moveTo(7,4);
  assert.equal(world.actionButton(),true); assert.deepEqual(talked,['core','follower']);
});
