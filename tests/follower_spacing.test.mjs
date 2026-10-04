import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PNG } from 'pngjs';
import { World } from '../game/src/world/world.js';
import { GameState } from '../game/src/core/state.js';
import { mapFromRows } from './world_helpers.mjs';
import { placeChainBehind, followChain } from '../game/src/world/follower.js';
import { registerCharsetFootprint } from '../game/src/world/followerSpacing.js';
import { measureCharsetFootprint, followerBounds, boundsSeparated } from '../game/src/world/followerSpacing.js';
import { followerScale, sheetContentExtent } from '../game/src/render/followerSize.js';
import { syncMount, setRiding } from '../game/src/world/zygarde/mount.js';
import { Character } from '../game/src/world/character.js';
import { miniWorld, step as advanceCharacter } from './world_helpers.mjs';
import { followerFormation } from '../game/src/world/followerFormation.js';

// Oráculo independiente: RGBA real, ancla abajo-centro y escala aprobada 1 para estos tres gráficos.
const files = {
  protagonista_m: 'game/assets/characters/protagonista_m.png',
  'follower:ZYGARDE:0:0': 'Pokemon Anil V4.13/Graphics/Characters/Followers/ZYGARDE.png',
  'follower:TORTERRA:0:0': 'Pokemon Anil V4.13/Graphics/Characters/Followers/TORTERRA.png',
  'follower:ZYGARDE:1:0': 'Pokemon Anil V4.13/Graphics/Characters/Followers/ZYGARDE_1.png',
  'follower:ONIX:0:0': 'Pokemon Anil V4.13/Graphics/Characters/Followers/ONIX.png',
  'follower:YANMA:0:0': 'Pokemon Anil V4.13/Graphics/Characters/Followers/YANMA.png',
  'follower:PIKACHU:0:0': 'Pokemon Anil V4.13/Graphics/Characters/Followers/PIKACHU.png',
  zygarde_core: 'game/assets/characters/zygarde_core.png',
};
const heights = { ONIX:8.8,YANMA:1.2,PIKACHU:0.4,TORTERRA:2.2,ZYGARDE:5 };
function readImage(file) { return PNG.sync.read(fs.readFileSync(new URL('../' + file, import.meta.url))); }
function bounds(file, key) {
  const img = readImage(file), species = key?.split(':')[1];
  const scale = species ? followerScale(sheetContentExtent(img.data,img.width,img.height),heights[species],species) : 1;
  const fw = img.width / 4, fh = img.height / 4, result = {};
  for (let row = 0; row < 4; row++) {
    let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
    for (let col = 0; col < 4; col++) for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) {
      if (!img.data[((row * fh + y) * img.width + col * fw + x) * 4 + 3]) continue;
      left = Math.min(left, (x - fw / 2)*scale); right = Math.max(right, (x + 1 - fw / 2)*scale);
      top = Math.min(top, (y - fh)*scale); bottom = Math.max(bottom, (y + 1 - fh)*scale);
    }
    result[2 + row * 2] = { left, top, right, bottom };
  }
  return result;
}
const measured = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, bounds(file,key)]));
function box(ch) {
  const b = measured[ch.characterName][ch.direction];
  return { left: ch.screenX() + b.left, right: ch.screenX() + b.right,
    top: ch.screenY() + b.top, bottom: ch.screenY() + b.bottom };
}
function assertSeparated(world, context, requireAll = true) {
  const shown = [world.player, ...world.followers.filter(f => f.visible)];
  if (requireAll) assert.equal(shown.length, 3, context + ': los tres actores se ven en espacio abierto ' + JSON.stringify(world.followers.map(f=>({x:f.x,y:f.y,dir:f.direction,busy:f.busy(),transparent:f.transparent}))));
  for (let i = 0; i < shown.length; i++) for (let j = i + 1; j < shown.length; j++) {
    const a = box(shown[i]), b = box(shown[j]);
    assert.ok(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top,
      `${context}: ${shown[i].characterName} y ${shown[j].characterName} se solapan: ${JSON.stringify({a,b})}`);
  }
}
function setup({rows=null,x=20,y=15,dir=8,core='follower:ZYGARDE:0:0',species='TORTERRA'} = {}) {
  for (const [key, directions] of Object.entries(measured)) registerCharsetFootprint(key, { scale: 1, directions });
  const map = mapFromRows(rows || Array.from({length: 30}, () => '.'.repeat(40)));
  const world = new World({ state: GameState.create(), hooks: { encountersEnabled: () => false } });
  world.setCurrent({ id: map.id, def: { id: map.id }, map });
  world.player.setCharsets({ walk: 'protagonista_m', run: 'protagonista_m', surf: 'protagonista_m' });
  world.player.moveTo(x, y); world.player.direction = dir;
  world.core.setGraphic(core);
  world.follower.setPokemon({ species, hp: 10 });
  placeChainBehind(world.player, world.followers);
  return world;
}
function settle(world, frames = 30) { for (let i = 0; i < frames; i++) world.update(1 / 60); }
function walk(world, dir) {
  assert.equal(world.player.moveGeneric(dir), true);
  world.followLeader(); settle(world);
}

test('huellas reales: las hojas conservan tamaño, transparencia y ancla originales', () => {
  assert.deepEqual(measured.protagonista_m[8], { left: -18, top: -62, right: 18, bottom: -2 });
  assert.deepEqual(measured['follower:ZYGARDE:0:0'][8], { left: -39, top: -80, right: 39, bottom: 0 });
  assert.deepEqual(measured['follower:TORTERRA:0:0'][8], { left: -22, top: -52, right: 22, bottom: 0 });
});

test('cadena vacía o sin seguidores activos: recolocar y seguir siguen siendo no-op sin GameMap', () => {
  const world = new World({ state: GameState.create() });
  const before = world.followers.map(f => [f.x, f.y, f.hidden, f.transparent, f.characterName]);
  for (const chain of [undefined, [], world.followers]) {
    assert.doesNotThrow(() => placeChainBehind(world.player, chain));
    assert.doesNotThrow(() => followChain(world.player, chain));
  }
  assert.deepEqual(world.followers.map(f => [f.x, f.y, f.hidden, f.transparent, f.characterName]), before);
  assert.equal(followerFormation(world.core), undefined, 'no prepara una formación ni consulta geometría');
  world.core.setGraphic('zygarde_core');
  assert.throws(() => placeChainBehind(world.player, world.followers), TypeError,
    'un seguidor real sí requiere un mapa; el no-op no oculta un error de geometría');
});

test('Z50 y segundo seguidor: llegada, caminar y parar dejan visibles los tres sprites completos', () => {
  const world = setup(); settle(world);
  assertSeparated(world, 'llegada');
  for (const dir of [8,8,8,6,6,6,2,2,2,4,4,4]) {
    walk(world, dir);
    assertSeparated(world, 'paso' + dir);
    const coordinates = world.followers.map(f => [f.x, f.y]);
    settle(world, 60);
    assert.deepEqual(world.followers.map(f => [f.x, f.y]), coordinates, 'formación estable al parar');
    assertSeparated(world, 'parada' + dir);
  }
});

test('Z50 y segundo seguidor: giros y marcha atrás nunca dejan actores visibles solapados', () => {
  const world = setup();
  for (const dir of [8,8,8,2,2,2,2,2,6,6,4,4,4,8,8,8]) {
    walk(world, dir);
    assertSeparated(world, 'reversa' + dir, false);
    for (const f of world.followers) assert.ok(f.map.passable(f.x, f.y, 0), 'permanece en suelo');
  }
  for (let i = 0; i < 10; i++) walk(world, 8);
  assertSeparated(world, 'recuperación tras reversa');
});

test('huellas publicadas: todos los márgenes transparentes y escalas discretas coinciden con el PNG real', () => {
  for (const [key,file] of Object.entries(files)) {
    const img=readImage(file), sp=key.split(':')[1];
    const scale=sp?followerScale(sheetContentExtent(img.data,img.width,img.height),heights[sp],sp):1;
    const result=measureCharsetFootprint(img.data,img.width,img.height,{scale});
    assert.deepEqual(result.directions,measured[key],key);
    if (sp==='ONIX') assert.equal(scale,0.5);
    if (sp==='YANMA') assert.equal(scale,0.75);
  }
});

test('10 %, Completo, Core, Onix, Yanma y pequeño: marcha/parada global sin cambiar tamaños', () => {
  for (const core of ['follower:ZYGARDE:1:0','follower:ZYGARDE:0:0','zygarde_core']) {
    for (const species of ['ONIX','YANMA','PIKACHU']) {
      const world=setup({core,species});
      for (const dir of [8,8,6,6,2,2,4,4]) {
        walk(world,dir); settle(world,90);
        assertSeparated(world,core+'/'+species+'/'+dir);
        assert.equal(world.core.characterName,core);
        assert.equal(world.follower.characterName,`follower:${species}:0:0`);
      }
    }
  }
});

test('bob pequeño, giro en el sitio y reversa: ningún píxel opaco visible queda compartido', () => {
  const world=setup();
  for (const dir of [6,8,4,2]) {
    world.player.turnGeneric(dir); world.player.bobHeight=2;
    settle(world,60); assertSeparated(world,'giro '+dir);
  }
  for (const dir of [8,8,2,2,2,8,8,8,8]) {
    assert.equal(world.player.moveGeneric(dir),true); world.followLeader();
    for (let i=0;i<30;i++) {
      world.update(1/60);
      const shown=[world.player,...world.followers.filter(f=>f.visible)];
      for (let a=0;a<shown.length;a++) for(let b=a+1;b<shown.length;b++)
        assert.ok(boundsSeparated(followerBounds(shown[a]),followerBounds(shown[b]),0),'interpolación sin solape');
    }
  }
  settle(world,60); assertSeparated(world,'reversa recuperada');
});

test('habitación corta: presentación temporal, salida a ruta y recuperación sin alterar guardado', () => {
  const world=setup({rows:['#####','#...#','#...#','#...#','##.##','##.##','##.##','##.##','##.##','.....','.....','.....','.....','.....','.....'],x:2,y:2,dir:2});
  const before=JSON.stringify(world.state.data);
  settle(world,60);
  assert.ok(world.followers.some(f=>f.transparent),'tren que no cabe cede espacio');
  assert.equal(world.core.hidden,false); assert.equal(world.follower.hidden,false);
  for (let i=0;i<11;i++) walk(world,2);
  settle(world,60); assertSeparated(world,'fuera del pasillo');
  assert.equal(JSON.stringify(world.state.data),before,'presentación no modifica partida');
  for (const f of world.followers) assert.ok(f.map.passable(f.x,f.y,0),'nunca cruza muro');
});

test('forma y hoja tardía: reajuste automático en el mismo mapa, sin recolocación a través de paredes', () => {
  const world=setup({core:'zygarde_core',species:'PIKACHU'});
  world.core.setGraphic('follower:ZYGARDE:0:0');
  let old=world.followers.map(f=>({x:f.x,y:f.y}));
  for(let frame=0;frame<90;frame++) {
    world.update(1/60);
    world.followers.forEach((f,i)=> {
      assert.ok(Math.abs(f.x-old[i].x)+Math.abs(f.y-old[i].y)<=1,'reajuste con pasos');
      old[i]={x:f.x,y:f.y};
    });
  }
  assertSeparated(world,'50 % después del Core');
  world.core.setGraphic('follower:ZYGARDE:1:0'); settle(world,90);
  assertSeparated(world,'10 % después del 50 %');
  const f=world.follower, custom='asset:characters/late_follower_test.png';
  measured[custom]=measured['follower:PIKACHU:0:0'];
  f.setGraphic(custom); settle(world,90);
  registerCharsetFootprint(custom,{scale:1,directions:measured[custom]});
  settle(world,90); assertSeparated(world,'hoja tardía');
});

test('montaje/desmontaje real: núcleo oculto por montura, segundo seguidor y formación recuperada', () => {
  const world=setup({core:'follower:ZYGARDE:1:0',species:'PIKACHU'});
  world.current.def.mount=true; world.state.data.zygarde.form='10'; world.state.setZygardeAbility('run',true);
  setRiding(world,true); syncMount(world,{onFormChange:(_prev,form)=>{world.core.hidden=Boolean(form);}});
  assert.equal(world.zygMount.form,'10');
  assert.equal(world.core.hidden,true);
  for(let i=0;i<6;i++) walk(world,6);
  assert.ok(world.follower.visible); assert.equal(world.follower.pokemon.species,'PIKACHU');
  setRiding(world,false); syncMount(world,{onFormChange:(_prev,form)=>{world.core.hidden=Boolean(form);}});
  placeChainBehind(world.player,world.followers); settle(world,90);
  assert.equal(world.zygMount.form,null); assertSeparated(world,'desmontaje');
});

test('saliente real: ambos seguidores saltan la misma casilla, sin pisarla ni saltar paredes',()=> {
  const world=setup({rows:Array.from({length:20},(_,y)=>y===7?'L':'.'),x:0,y:6,dir:2,core:'zygarde_core',species:'PIKACHU'});
  assert.equal(world.player.moveGeneric(2),true); assert.equal(world.player.y,8);
  world.followLeader(); settle(world,90);
  assert.equal(world.core.y,6); assert.equal(world.follower.y,4);
  walk(world,2); assert.equal(world.core.y,6,'espera antes del saliente');
  assert.equal(world.player.moveGeneric(2),true); world.followLeader();
  assert.equal(world.core.y,8); assert.equal(world.core.jumping(),true);
  settle(world,90);
  for(let i=0;i<4;i++) {walk(world,2);settle(world,30);}
  for(const f of world.followers) assert.ok(f.y>7&&!f.map.terrainTagAt(f.x,f.y).ledge);
  assertSeparated(world,'saliente');
});

test('costura real: trayectoria y huellas se rebasan junto a los actores, con regreso y warp',()=> {
  const world=setup({rows:Array.from({length:20},()=>'.'.repeat(16)),x:12,y:8,dir:6,species:'PIKACHU'});
  const map2=mapFromRows(Array.from({length:20},()=>'.'.repeat(16)),'vecino');
  world.addNeighbor({id:'vecino',def:{id:'vecino'},map:map2,offset:{x:16,y:0}});
  for(let i=0;i<8;i++) {walk(world,6);settle(world,30);assertSeparated(world,'costura avance');}
  assert.equal(world.map.id,'vecino');
  for(const f of world.followers) assert.ok(world.entryAt(f.x,f.y),'seguidor está en el mapa actual o su vecino');
  for(let i=0;i<8;i++) {walk(world,4);settle(world,30);}
  settle(world,90); assert.equal(world.map.id,'prueba'); assertSeparated(world,'costura retorno');
  const arrival=mapFromRows(Array.from({length:15},()=>'.'.repeat(15)),'llegada');
  world.setCurrent({id:'llegada',def:{id:'llegada'},map:arrival});world.player.moveTo(7,7);
  placeChainBehind(world.player,world.followers); settle(world,90);
  assertSeparated(world,'warp'); assert.ok(world.followers.every(f=>f.map===arrival));
});

test('migas largas se podan sin perder formación, ni cambiar flags, huevos, colisión o capacidades',()=> {
  const world=setup({rows:Array.from({length:20},()=>'.'.repeat(150)),x:10,y:8,dir:6,species:'PIKACHU'});
  const data=JSON.stringify(world.state.data);
  for(let i=0;i<100;i++) walk(world,6);
  const formation=followerFormation(world.core);
  assert.ok(formation.nodes.length<=40);
  assertSeparated(world,'camino largo');
  assert.ok(world.followers.every(f=>f.through));assert.equal(world.player.through,false);
  assert.equal(JSON.stringify(world.state.data),data);
});

test('rutas forzadas de escenas conservan posición, orientación y presentación bajo su propio control',async()=> {
  const world=setup(); const f=world.core;
  const controlled=new Character(miniWorld(world.map),{map:world.map,x:f.x,y:f.y,dir:f.direction,speed:f.moveSpeed});
  controlled.through=true;
  const commands=['right',{wait:40},'left'];
  const done=f.forceMoveRoute(commands), expected=controlled.forceMoveRoute(commands);
  assert.equal(world.player.moveGeneric(8),true);world.followLeader();
  for(let frame=0;frame<120;frame++) {
    const forcing=f.moveRouteForcing;
    world.update(1/60);advanceCharacter(controlled); await Promise.resolve();
    if(forcing&&f.moveRouteForcing) {
      assert.deepEqual([f.x,f.y,f.direction,f.realX,f.realY],[controlled.x,controlled.y,controlled.direction,controlled.realX,controlled.realY]);
      assert.equal(f.transparent,false,'guion no enmascarado por formación');
    }
  }
  await Promise.all([done,expected]);settle(world,120);
  assertSeparated(world,'fin de guion');
});

test('Core fuera de las migas después del guion: vuelve por los pasos reales de su ruta y reanuda la cadena',async()=> {
  const world=setup(),f=world.core,original={x:f.x,y:f.y};
  const done=f.forceMoveRoute(['right','right']);
  assert.equal(world.player.moveGeneric(8),true);world.followLeader();
  for(let i=0;i<70;i++) {world.update(1/60);await Promise.resolve();}
  await done;
  let previous={x:f.x,y:f.y};
  for(let i=0;i<120;i++) {
    world.update(1/60);
    assert.ok(Math.abs(f.x-previous.x)+Math.abs(f.y-previous.y)<=1,'regreso interpolado, sin recolocar');
    assert.ok(f.x===original.x || f.y===original.y,'regreso por la ruta realmente recorrida');
    previous={x:f.x,y:f.y};
  }
  assert.equal(f.x,world.player.x,'reanuda la fila tras abandonar el control del guion');
  assertSeparated(world,'guion fuera de migas');
  for(let i=0;i<4;i++) walk(world,8);
  assertSeparated(world,'seguir después del guion');
});

test('costura durante ruta del Core: rebase de su recorrido y recuperación al terminar el guion',async()=> {
  const world=setup({rows:Array.from({length:20},()=>'.'.repeat(16)),x:12,y:8,dir:6,species:'PIKACHU'});
  const neighbor=mapFromRows(Array.from({length:20},()=>'.'.repeat(16)),'vecino');
  world.addNeighbor({id:'vecino',def:{id:'vecino'},map:neighbor,offset:{x:16,y:0}});
  const done=world.core.forceMoveRoute(['down',{wait:240}]);
  for(let i=0;i<4;i++) walk(world,6);
  assert.equal(world.map.id,'vecino');assert.equal(world.core.moveRouteForcing,true);
  for(let i=0;i<320;i++) {world.update(1/60);await Promise.resolve();}
  await done; settle(world,120);
  assert.equal(world.core.y,world.player.y,'desanda la ruta en las coordenadas nuevas');
  for(let i=0;i<6;i++) walk(world,6);
  assertSeparated(world,'guion y costura recuperados');
});
