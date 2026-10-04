import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PNG } from 'pngjs';
import { measureCharsetFootprint, registerCharsetFootprint, charsetFootprint, followerBounds, followerGapTiles } from '../game/src/world/followerSpacing.js';

test('huella opaca asimétrica: ancla, escala, offset y cuatro patrones sin márgenes transparentes',()=> {
  const w=32,h=32,data=new Uint8Array(w*h*4);
  for(let row=0;row<4;row++) for(let col=0;col<4;col++)
    data[((row*8+3)*w+col*8+2+col)*4+3]=255;
  const footprint=measureCharsetFootprint(data,w,h,{scale:0.75,offset:true});
  for(const dir of [2,4,6,8]) assert.deepEqual(footprint.directions[dir],{left:-1.5,right:1.5,top:12.25,bottom:13});
  assert.equal(registerCharsetFootprint('huella_offset_test',footprint),true);
  const f={characterName:'huella_offset_test',direction:4,width:1,xOffset:3,yOffset:2,bobHeight:2,
    screenX:()=>100,screenY:()=>200};
  assert.deepEqual(followerBounds(f),{left:98.5,right:101.5,top:210.25,bottom:211});
  assert.deepEqual(followerBounds(f,{x:1,y:2,dir:6}),{left:49.5,right:52.5,top:108.25,bottom:109});
});
test('RGBA inválido, hoja vacía y caché inválida no introducen NaN ni cambian la reserva válida',()=> {
  assert.equal(measureCharsetFootprint(null,4,4),null);
  assert.equal(measureCharsetFootprint(new Uint8Array(64),5,4),null);
  assert.equal(measureCharsetFootprint(new Uint8Array(64),4,4,{scale:NaN}),null);
  assert.equal(measureCharsetFootprint(new Uint8Array(64),4,4,{scale:0}),null);
  assert.equal(measureCharsetFootprint(new Uint8Array(64),4,4),null);
  for(const value of [null,{directions:{}},{directions:{3:{left:0,right:1,top:0,bottom:1}}},
    {directions:{2:{left:NaN,right:1,top:0,bottom:1}}},{directions:{2:{left:2,right:1,top:0,bottom:1}}}])
    assert.equal(registerCharsetFootprint('invalid_footprint_test',value),false);
  assert.equal(registerCharsetFootprint('',{directions:{}}),false);
  assert.equal(registerCharsetFootprint(42,{directions:{}}),false);
  const b={left:-10,right:10,top:-30,bottom:-2};
  registerCharsetFootprint('immutable_footprint_test',{scale:1,directions:{2:b}}); b.right=1000;
  assert.equal(charsetFootprint({characterName:'immutable_footprint_test'},6).right,10);
  assert.equal(followerGapTiles({characterName:'unloaded_actor_test'},{isFollower:true,characterName:'unloaded_follower_test'}),4);
});
test('loadCharset publica la huella de su textura real una vez y conserva escala/tex/raster',async()=> {
  globalThis.location ||= {search:''};
  const {engine}=await import('../game/src/core/engine.js');
  const {loadCharset}=await import('../game/src/render/charsets.js');
  const previousImage=engine.assets.image,previousData=engine.data,previousDocument=globalThis.document;
  const inputs={
    'ONIX.png':'Pokemon Anil V4.13/Graphics/Characters/Followers/ONIX.png',
    'YANMA.png':'Pokemon Anil V4.13/Graphics/Characters/Followers/YANMA.png',
    'protagonista_m.png':'game/assets/characters/protagonista_m.png',
    'protagonista_f_fish_offset.png':'game/assets/characters/protagonista_f_fish_offset.png',
  };
  let scans=0,loads=0;
  engine.data={species:{ONIX:{height:8.8},YANMA:{height:1.2}}};
  engine.assets.image=async url=> {
    loads++; const file=inputs[decodeURIComponent(url).split('/').at(-1)];
    if(!file) throw Error('fixture no disponible');
    const img=PNG.sync.read(fs.readFileSync(file));
    return {width:img.width,height:img.height,pixels:img.data};
  };
  globalThis.document={createElement:()=> {
    let image;
    return {getContext:()=>({drawImage:img=>{image=img;},getImageData:()=>{scans++;return{data:image.pixels};}})};
  }};
  try {
    for(const [key,scale] of [['follower:ONIX:0:0',0.5],['follower:YANMA:0:0',0.75],['protagonista_m',1],['protagonista_f_fish_offset',1]]) {
      const loaded=await loadCharset(key), again=await loadCharset(key);
      assert.equal(loaded,again); assert.equal(loaded.scale,scale); assert.equal(loaded.tex.image.width,loaded.width);
      assert.equal(loaded.frameW,loaded.width/4); assert.equal(loaded.frameH,loaded.height/4);
      const expected=measureCharsetFootprint(loaded.tex.image.pixels,loaded.width,loaded.height,{scale,offset:loaded.offset});
      assert.deepEqual(charsetFootprint({characterName:key,direction:8}),expected.directions[8]);
    }
    assert.equal(scans,4); assert.equal(loads,4,'sin recargar ni releer píxeles por update');
    assert.equal(await loadCharset(''),null);
    const warnings=[],warn=console.warn;
    console.warn=(...args)=>warnings.push(args);
    try {
      assert.equal(await loadCharset('asset:fixture_missing.png'),null);
      globalThis.document={createElement:()=>{throw Error('canvas inaccesible');}};
      const unmeasured=await loadCharset('asset:characters/protagonista_m.png');
      assert.equal(unmeasured.scale,1); assert.ok(warnings.length>=2);
    } finally {console.warn=warn;}
  } finally {
    engine.assets.image=previousImage;engine.data=previousData;globalThis.document=previousDocument;
  }
});
