import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { mon, play } from './battle_helpers.mjs';
import { db, fieldWorld, fieldCtx } from './b18_helpers.mjs';
import { buildBattleConfig, pokemonFromSpec } from '../game/src/battle/scene/setup.js';
import { F, LEGENDS, available } from '../game/src/content/events/b22c_common.js';
import { requestFor, fightLegend } from '../game/src/content/events/b22c_encounters.js';
import { buildB22cAssets } from '../tools/b22c_assets.mjs';
import { Img } from '../tools/pixel.mjs';

test('B22c: los siete permiten captura real, consumen una Ball y conservan niveles/movimientos',async()=>{
 for(const[key,L]of Object.entries(LEGENDS)) {
  const req=requestFor(key);
  assert.ok(fs.existsSync(new URL(`../Pokemon Anil V4.13/Graphics/Characters/Followers/${L.species}.png`,import.meta.url)),L.species);
  const {config}=buildBattleConfig({...req,seed:223,
    player:{party:[mon('BLISSEY',100,['SPLASH'])],bag:{MASTERBALL:1}},opponent:{party:[pokemonFromSpec(db,req.wild,{rng:()=>0.5})]}},{db});
  const {result,ui}=await play(config,{script:[{action:'item',item:'MASTERBALL'}]});
  assert.equal(result.outcome,'caught');assert.equal(result.caught.species,L.species);assert.equal(result.caught.level,L.level);
  assert.equal(result.bag.MASTERBALL,undefined);assert.ok(ui.events.some(e=>e.type==='throwBall'&&e.caught));
  for(const move of result.caught.moves)assert.ok(db.moves[move.id]);
  if(key==='rayquaza')assert.ok(result.caught.moves.some(m=>m.id==='DRAGONASCENT'));
 }
});

test('B22c: una derrota del motor real cura y permite reintentar sin pérdida ni captura ficticia',async()=>{
 const t=await fieldWorld('cerro_alba',{flags:['game_cleared','b21_fin',F.brazier]});t.state.data.clock.minutes=7*60;
 const c=fieldCtx(t);c.battle=async req=>{
  const {config}=buildBattleConfig({...req,seed:223,player:{party:[mon('MAGIKARP',1,['SPLASH'])],bag:{}},
    opponent:{party:[pokemonFromSpec(db,req.wild,{rng:()=>0.5})]}},{db});
  const {result}=await play(config);assert.equal(result.outcome,'lose');return result.outcome;
 };
 const before={money:t.state.player.money,heal:t.state.healPoint};
 assert.equal(await fightLegend(c,'hooh'),'lose');assert.equal(c.log.heals,1);assert.ok(available(t.state,'hooh'));
 assert.equal(t.state.player.money,before.money);assert.deepEqual(t.state.healPoint,before.heal);assert.ok(!t.state.flag(LEGENDS.hooh.caught));
});

test('B22c: arte propio reproducible y reliquias/movimientos válidos en la base del juego',()=>{
 for(const[id,img]of Object.entries(buildB22cAssets())) {
  const actual=Img.load(new URL(`../game/assets/objects/${id}.png`,import.meta.url));
  assert.equal(actual.w,128);assert.equal(actual.h,128);assert.ok(Buffer.from(actual.data).equals(Buffer.from(img.data)));
 }
 for(const item of ['SACREDASH','BLUEORB','REDORB','SOULDEW','LATIASITE','LATIOSITE'])assert.ok(db.items[item],item);
 for(const L of Object.values(LEGENDS))for(const move of L.moves)assert.ok(db.moves[move],move);
});
