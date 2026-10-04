import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMapNode, tilesetDB, loadLibrary, isEmptyFor, anilMapLoader } from '../tools/lib/map_node.mjs';
import { buildMap, createEntry } from '../game/src/world/mapLoader.js';
import { World } from '../game/src/world/world.js';
import { GameState } from '../game/src/core/state.js';
import { LOCATIONS, SIGHTINGS, WIND_ROUTE, RAYS, LAKE } from '../game/src/content/maps/b22b/layout.js';
import lakeDef from '../game/src/content/maps/b22b/escarcha_lago_interior.js';
import { LEGENDS } from '../game/src/content/events/b22b_common.js';
import { escapeRoute } from '../game/src/content/events/b22b_encounters.js';

const moves = [[2,0,1],[4,-1,0],[6,1,0],[8,0,-1]];
test('la costra fría desaparece al abrir el paso de Moltres y deja de mostrar su diálogo antiguo', async () => {
  const t = await field('tizon_crater');
  t.s.setFlag(LEGENDS.moltres.open); t.w.refreshEvents();
  const pieces = t.w.events.filter((e) => e.id.startsWith('costra_fria_'));
  assert.equal(pieces.length, 12);
  for (const e of pieces) {
    assert.equal(e.page.sprite, null, e.id);
    assert.equal(e.page.script, null, e.id);
    assert.equal(e.page.trigger, null, e.id);
    assert.equal(e.page.through, true, e.id);
  }
});
async function field(id, postgame = true) {
  const s = GameState.create({});
  for (const block of ['b04','b06','b07','b08','b13','b15','b16']) {
    const { F } = await import(`../game/src/content/events/${block}_common.js`);
    for (const flag of Object.values(F)) if(typeof flag==='string')s.setFlag(flag);
  }
  for (let n=1;n<=10;n++) s.setFlag(`p${n}_restored`);
  s.setFlag('game_cleared',postgame); s.setFlag('b21_fin',postgame);
  for (const L of Object.values(LEGENDS)) if (L.hint) s.setFlag(L.hint);
  s.setVar('b22b_rayos',3);
  if(id==='cerro_plomo'){s.setFlag(LEGENDS.tornadus.caught);s.setFlag(LEGENDS.thundurus.caught);}
  for (const k of ['raikou','entei','suicune']) s.setVar(`b22b_${k}_avistamientos`,['a','b','c']);
  s.setZygardeForm('complete'); for(const a of ['run','ram','terrain','swim','climb','detect','rebuild'])s.setZygardeAbility(a,true);
  let built;
  if (id === lakeDef.id) {
    const ts = tilesetDB().tilesets[lakeDef.tileset];
    const lib = await loadLibrary(lakeDef.tileset);
    const map = buildMap(lakeDef,{...lib,isEmpty:isEmptyFor(ts),anilMap:anilMapLoader});
    built={def:lakeDef,entry:createEntry(lakeDef,map,ts)};
  } else built=await buildMapNode(id);
  const w=new World({state:s}); w.setCurrent(built.entry);
  return {s,w,p:w.player,m:w.map,def:built.def};
}
function reach(t,start=t.def.start) {
  const q=[[start.x,start.y]], seen=new Set(q.map(([x,y])=>`${x},${y}`));
  for(let n=0;n<q.length;n++){
    const [x,y]=q[n]; t.p.moveTo(x,y);
    for(const [d,dx,dy]of moves){const nx=x+dx,ny=y+dy,k=`${nx},${ny}`;
      if(t.m.valid(nx,ny)&&!seen.has(k)&&t.p.passable(x,y,d)){seen.add(k);q.push([nx,ny]);}
    }
  }
  const near=(x,y)=>moves.map(([,dx,dy])=>({x:x+dx,y:y+dy})).find(p=>seen.has(`${p.x},${p.y}`));
  return {has:(x,y)=>seen.has(`${x},${y}`),use:(x,y)=>Boolean(near(x,y)),near};
}

test('los nueve encuentros fijos se pueden usar desde las entradas sin abrir atajos',async()=>{
  for(const [key,at]of Object.entries(LOCATIONS)){
    const t=await field(at.map), r=reach(t);
    const event=t.w.events.find(e=>e.id===`b22b_${key}`);
    assert.ok(event,`${key}: encuentro integrado en ${at.map}`);
    assert.ok(event.page,`${key}: visible con los requisitos cumplidos`);
    assert.ok(r.use(at.x,at.y),`${key}: aproximación desde la llegada`);
    assert.ok(reach(t,r.near(at.x,at.y)).has(t.def.start.x,t.def.start.y),`${key}: retorno al acceso`);
  }
});

test('los avistamientos, las tres descargas y la ruta del vendaval están en suelo transitable',async()=>{
  for(const site of [...Object.values(SIGHTINGS).flat(),...RAYS]){
    const t=await field(site.map);
    assert.ok(reach(t).use(site.x,site.y),`${site.map} ${site.x},${site.y}`);
  }
  const t=await field('meseta_impulso');
  for(const at of WIND_ROUTE)assert.ok(reach(t).use(at.x,at.y),'vendaval alcanzable');
});

test('lago interior: salida, capullo y llegada se conectan con suelo continuo',async()=>{
  const t=await field(lakeDef.id),r=reach(t);
  assert.ok(r.has(LAKE.entry.x,LAKE.entry.y));
  assert.ok(r.has(LAKE.exit.x,LAKE.exit.y));
  assert.ok(r.use(LOCATIONS.articuno.x,LOCATIONS.articuno.y));
  assert.equal(t.def.warps[0].to,'gruta_escarcha_2');
  assert.notDeepEqual([t.def.warps[0].tx,t.def.warps[0].ty],[LAKE.access.x,LAKE.access.y],'el retorno no vuelve a disparar el acceso');
});

test('los añadidos de B22b quedan invisibles fuera del postgame',async()=>{
  const ids=new Set([...Object.values(LOCATIONS).map(a=>a.map),...Object.values(SIGHTINGS).flat().map(a=>a.map),'gruta_escarcha_2']);
  for(const id of ids){const t=await field(id,false);
    for(const e of t.w.events.filter(e=>e.id.startsWith('b22b_')))assert.equal(Boolean(e.page),false,`${id}:${e.id}`);
  }
});

test('cada sitio de avistamiento está integrado y desaparece después de verlo',async()=>{
  for(const [key,sites]of Object.entries(SIGHTINGS))for(const site of sites){
    const t=await field(site.map);t.s.setVar(`b22b_${key}_avistamientos`,[]);t.w.refreshEvents();
    const e=t.w.events.find(e=>e.id===`b22b_avistamiento_${key}_${site.id}`);
    assert.ok(e?.page,`${key}:${site.id}: avistamiento activo`);
    t.s.setVar(`b22b_${key}_avistamientos`,[site.id]);t.w.refreshEvents();
    assert.equal(Boolean(e.page),false,'el Pokémon ha huido');
    assert.ok(t.w.events.find(e=>e.id===`b22b_rastro_${key}_${site.id}`)?.page,'queda su rastro');
  }
});

test('las huídas de las bestias y las marcas que se examinan bajo los pies no se atascan',async()=>{
  for(const [key,sites]of Object.entries(SIGHTINGS))for(const site of sites){
    const t=await field(site.map);t.s.setVar(`b22b_${key}_avistamientos`,[]);t.w.refreshEvents();
    const e=t.w.events.find(e=>e.id===`b22b_avistamiento_${key}_${site.id}`);
    for(const [,px,py]of moves){
      if(!t.m.passable(site.x+px,site.y+py,0,t.p,t.w.env()))continue;
      t.p.moveTo(site.x+px,site.y+py);
      const route=escapeRoute(e,t.p);
      assert.equal(route.length,2,`${key}:${site.id}: huída visible de dos pasos`);
      let x=site.x,y=site.y;
      for(const step of route){
        const [dir,dx,dy]=moves.find(([d])=>({2:'down',4:'left',6:'right',8:'up'})[d]===step);
        assert.ok(e.passable(x,y,dir),'no atraviesa pared ni jugador');x+=dx;y+=dy;
      }
      assert.notDeepEqual([x,y],[site.x,site.y],'se aleja en vez de volver a su sitio');
    }
  }
  for(const at of RAYS){const t=await field(at.map);assert.ok(reach(t).has(at.x,at.y),'se puede pisar la descarga para examinarla');}
});
