import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PNG} from 'pngjs';
import * as THREE from 'three';
import {GameState} from '../game/src/core/state.js';
import {World} from '../game/src/world/world.js';
import {mapFromRows} from './world_helpers.mjs';

globalThis.location??={search:''};
const {engine}=await import('../game/src/core/engine.js');
const {loadCharset}=await import('../game/src/render/charsets.js');
const {CharacterSprite}=await import('../game/src/render/characterSprite.js');

function deferred() {let resolve;const promise=new Promise(r=>{resolve=r;});return {promise,resolve};}

async function fixture(gender,runKey) {
  const prior={image:engine.assets.image,document:globalThis.document},gates=new Map(),requests=[];
  engine.assets.image=async url=>{
    requests.push(url);if(gates.has(url))await gates.get(url).promise;
    const name=url.split('/').at(-1).split('?')[0];
    if(name==='defaultShadow.png')return {width:16,height:8,pixels:new Uint8Array(16*8*4).fill(255)};
    const png=PNG.sync.read(fs.readFileSync(new URL(`../game/assets/characters/${name}`,import.meta.url)));
    return {width:png.width,height:png.height,pixels:png.data};
  };
  globalThis.document={createElement:()=>{let image;return {getContext:()=>({drawImage:img=>{image=img;},getImageData:()=>({data:image.pixels})})};}};
  const base=gender==='F'?'protagonista_f':'protagonista_m',world=new World({state:GameState.create({name:'Isolated sprite test',gender})});
  world.setCurrent({id:'fixture',def:{id:'fixture',events:[]},map:mapFromRows(Array.from({length:8},()=> '........')),offset:{x:0,y:0},events:null});
  const player=world.player;player.setCharsets({walk:base,run:runKey??`${base}_run`,surf:base});player.moveTo(3,3);
  const parent=new THREE.Group(),sprite=new CharacterSprite(parent);sprite.sync(player);await sprite.loading;await sprite.loadShadow();sprite.sync(player);
  return {player,sprite,parent,gates,requests,base,
    gate:key=>{const d=deferred();gates.set(`assets/${key.replace(/^asset:/,'')}`,d);return d;},
    close:async()=>{for(const d of gates.values())d.resolve();await sprite.loading;await new Promise(setImmediate);sprite.dispose();engine.assets.image=prior.image;globalThis.document=prior.document;}};
}

function visibleFrame(sprite,label) {
  assert.equal(sprite.mesh.visible,true,`${label}: sprite invisible`);
  assert.ok(sprite.sheet,`${label}: no display sheet`);
  const s=sprite.sheet,u=sprite.material.uniforms.uRect.value,img=s.tex.image;
  const [x0,y0,x1,y1]=[u.x*s.width,u.y*s.height,u.z*s.width,u.w*s.height].map(Math.round);
  let opaque=0;for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(img.pixels[(y*img.width+x)*4+3])opaque++;
  assert.ok(opaque>0,`${label}: empty selected frame`);
  assert.ok(sprite.material.uniforms.map.value===s.tex,'texture and frame geometry belong to the same sheet');
  assert.equal(sprite.mesh.scale.x,s.frameW*s.scale);assert.equal(sprite.mesh.scale.y,s.frameH*s.scale);
  assert.equal(sprite.shadow.visible,true,`${label}: shadow flickered`);
}

for(const gender of ['M','F']) {
  test(`player ${gender}: cold idle→run keeps a visible approved frame until the delayed image arrives`,async()=>{
    const f=await fixture(gender),run=`${f.base}_run`,gate=deferred();f.gates.set(`assets/characters/${run}.png`,gate);
    try {
      visibleFrame(f.sprite,'idle');f.player.setMovementType('running');
      for(let frame=0;frame<4;frame++) {f.player.pattern=frame;f.player.direction=[2,4,6,8][frame];f.sprite.sync(f.player);visibleFrame(f.sprite,`pending run ${frame}`);}
      assert.equal(f.sprite.sheet.key,f.base,'use previous walking sheet during cold load');
      gate.resolve();await f.sprite.loading;f.sprite.sync(f.player);visibleFrame(f.sprite,'run loaded');assert.equal(f.sprite.sheet.key,run);
    } finally {await f.close();}
  });
  test(`player ${gender}: cached walk↔run transitions swap texture in the same frame with no hidden mesh`,async()=>{
    const f=await fixture(gender);
    try {
      await loadCharset(`${f.base}_run`);
      const requests=f.requests.length;
      for(let cycle=0;cycle<3;cycle++)for(const movement of ['running','walking'])for(const direction of [2,4,6,8]) {
        f.player.setMovementType(movement);f.player.direction=direction;f.player.pattern=cycle%4;f.sprite.sync(f.player);
        visibleFrame(f.sprite,`${movement} ${cycle}/${direction}`);
        assert.equal(f.sprite.sheet.key,f.player.characterName,'cached sheet must replace the old pose synchronously');
      }
      assert.equal(f.requests.length,requests,'later races do not request the image again');
    } finally {await f.close();}
  });
}

test('player: cancelling a cold run back to idle ignores the eventual stale run load',async()=>{
  const run='asset:characters/protagonista_m_run.png?cancel',f=await fixture('M',run),gate=f.gate(run);
  try {
    f.player.setMovementType('running');f.sprite.sync(f.player);const pending=f.sprite.loading;
    f.player.setMovementType('walking');f.sprite.sync(f.player);visibleFrame(f.sprite,'cancelled run');
    gate.resolve();await pending;f.sprite.sync(f.player);assert.equal(f.sprite.sheet.key,f.base);visibleFrame(f.sprite,'late run ignored');
  } finally {await f.close();}
});

test('player: empty and transparent graphics stay hidden during a pending transition',async()=>{
  const run='asset:characters/protagonista_m_run.png?hidden',f=await fixture('M',run),gate=f.gate(run);
  try {
    f.player.setMovementType('running');f.player.transparent=true;f.sprite.sync(f.player);const pending=f.sprite.loading;
    assert.equal(f.sprite.mesh.visible,false);assert.equal(f.sprite.shadow.visible,false);
    f.player.characterName='';f.player.transparent=false;f.sprite.sync(f.player);assert.equal(f.sprite.mesh.visible,false);
    gate.resolve();await pending;f.sprite.sync(f.player);assert.ok(f.sprite.sheet===null);assert.equal(f.sprite.mesh.visible,false);assert.equal(f.sprite.shadow.visible,false);
    f.player.setMovementType('walking');f.player.opacity=0;f.sprite.sync(f.player);assert.equal(f.sprite.mesh.visible,false);
    f.player.opacity=255;f.sprite.sync(f.player,0,0,{visible:false});assert.equal(f.sprite.mesh.visible,false);
  } finally {await f.close();}
});

test('player: switching to a tile cancels a pending charset without resurrecting it',async()=>{
  const run='asset:characters/protagonista_m_run.png?tile',f=await fixture('M',run),gate=f.gate(run);
  try {
    f.player.setMovementType('running');f.sprite.sync(f.player);const pending=f.sprite.loading;
    f.player.tileId=384;const res={id:'tile-fixture',atlasSize:[256,256],atlasTex:new THREE.Texture({width:256,height:256})};
    f.sprite.sync(f.player,0,0,{tileRes:res});assert.equal(f.sprite.mesh.visible,true);assert.equal(f.sprite.shadow.visible,false);
    gate.resolve();await pending;assert.ok(f.sprite.sheet===null);assert.ok(f.sprite.material.uniforms.map.value===res.atlasTex);
  } finally {await f.close();}
});

test('player: disposing a sprite cancels its pending graphic, including subsequent sync calls',async()=>{
  const run='asset:characters/protagonista_m_run.png?dispose',f=await fixture('M',run),gate=f.gate(run);
  try {
    f.player.setMovementType('running');f.sprite.sync(f.player);const pending=f.sprite.loading;f.sprite.dispose();
    gate.resolve();await pending;assert.ok(f.sprite.sheet===null,'a completed loader must not write into a disposed sprite');
    f.sprite.sync(f.player);assert.equal(f.parent.children.length,0);assert.equal(f.sprite.mesh.visible,false);assert.equal(f.sprite.shadow.visible,false);
  } finally {await f.close();}
});

test('non-player graphics keep their existing hidden-while-loading contract',async()=>{
  const key='asset:characters/protagonista_m_run.png?npc',f=await fixture('M',key),gate=f.gate(key);
  try {
    f.player.isPlayer=false;f.player.characterName=key;f.sprite.sync(f.player);assert.equal(f.sprite.mesh.visible,false);assert.equal(f.sprite.shadow.visible,false);
    gate.resolve();await f.sprite.loading;f.sprite.sync(f.player);visibleFrame(f.sprite,'NPC loaded');
  } finally {await f.close();}
});
