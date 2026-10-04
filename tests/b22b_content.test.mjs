import test from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { db } from './battle_helpers.mjs';
import { createPokemon } from '../game/src/battle/core/pokemon.js';
import { Battle, HeadlessBattleUI } from '../game/src/battle/core/index.js';
import { buildBattleConfig } from '../game/src/battle/scene/setup.js';
import { resolveBackdrop } from '../game/src/battle/scene/setup.js';
import fs from 'node:fs';
import { Img, strayPixels, splitSheet } from '../tools/pixel.mjs';
import { buildB22bAssets } from '../tools/b22b_assets.mjs';
import { applyRest } from '../game/src/world/rest.js';
import { LEGENDS, hintFlag, condition, legendAvailable, fieldMoves, beastSeen, encounterRequest } from '../game/src/content/events/b22b_common.js';
import { legendFight, openSeal, sighting } from '../game/src/content/events/b22b_encounters.js';
import { giveHint, withB22bHints } from '../game/src/content/events/b22b_hints.js';

function state() {
  const s = GameState.create({ name: 'Prueba' });
  s.setFlag('game_cleared'); s.setFlag('b21_fin');
  s.setParty([createPokemon(db, 'CHARIZARD', 75, { rng: () => 0.5, moves: ['FLAMETHROWER', 'ROCKSLIDE', 'SURF'] })]);
  return s;
}
function ctx(s, { outcome = 'caught', choices = [0] } = {}) {
  const log = [], battles = [];
  return { state: s, db, map: { id: 'prueba' }, log, battles, heals: 0,
    flag: (...a) => s.flag(...a), var: (...a) => s.var(...a), setFlag: (...a) => s.setFlag(...a), setVar: (...a) => s.setVar(...a),
    say: async (text) => log.push(text), choice: async () => choices.shift() ?? -1, confirm: async () => true,
    heal() { this.heals++; }, battle: async (req) => { battles.push(req); return outcome; }, requestRefresh() {},
  };
}

test('B22b: nueve legendarios, niveles de campaña, captura normal y equipo individual', () => {
  assert.equal(Object.keys(LEGENDS).length, 9);
  for (const [key, L] of Object.entries(LEGENDS)) {
    const req = encounterRequest(key);
    assert.equal(req.wild.species, key.toUpperCase());
    assert.equal(req.wild.level, key === 'landorus' ? 72 : 70);
    assert.equal(req.type, 'wild'); assert.equal(req.noCoop, true);
    assert.notEqual(req.rules?.noBag, true); assert.equal(req.rules?.catchCondition, undefined);
    assert.equal(req.link, undefined);
    assert.ok(db.species[L.species]);
    for (const move of req.wild.moves) assert.ok(db.moves[move], `${key}: movimiento real ${move}`);
    req.wild.moves.pop(); assert.equal(encounterRequest(key).wild.moves.length, 4, 'peticiones independientes');
  }
});

test('antes de despertar del epílogo, no se ven ni se activan los encuentros', async () => {
  const s = GameState.create({}); s.setFlag('game_cleared');
  for (const key of Object.keys(LEGENDS)) {
    assert.equal(legendAvailable(s, key), false);
    assert.equal(condition(s, key), 'story');
    const c = ctx(s); await legendFight(c, key); assert.equal(c.battles.length, 0);
  }
  const c = ctx(s); await giveHint(c, 'abril'); assert.equal(s.flag(hintFlag('tornadus')), false);
});

test('las pistas se obtienen de los Guardianes y se conservan en la partida', async () => {
  const s = state();
  for (const [who, keys] of Object.entries({ abril: ['tornadus','zapdos'], fermin: ['thundurus'], rosendo: ['articuno'], brasa: ['moltres'] })) {
    const c = ctx(s); await giveHint(c, who);
    for (const key of keys) assert.ok(s.flag(hintFlag(key)), key);
    assert.ok(c.log.length);
  }
  const loaded = new GameState(JSON.parse(JSON.stringify(s.data)));
  assert.ok(loaded.flag(hintFlag('articuno')));
});

test('el decorador conserva las páginas de campaña y entrega pistas sin desplazar NPC', async () => {
  let original = 0;
  const events = [{ id: 'rosendo', x: 2, y: 3, pages: [{ when: (s) => s.flag('casa'), script: async () => original++ }] }];
  const wrapped = withB22bHints(events);
  assert.equal(events[0].pages.length, 1);
  assert.deepEqual([wrapped[0].x, wrapped[0].y], [2,3]);
  const s = state(); await wrapped[0].pages[0].script(ctx(s));
  assert.equal(original, 1); assert.ok(s.flag(hintFlag('articuno')));
  assert.equal(wrapped[0].pages[0].when, events[0].pages[0].when);
});

test('los avisos B22d que dan pistas no las repiten, incluso con la pista ya guardada', async () => {
  for (const guardian of ['fermin','rosendo']) {
    const s = state();
    await giveHint(ctx(s),guardian);
    const c=ctx(s);
    const [ev]=withB22bHints([{id:`b22d_${guardian}_aviso`,x:0,y:0,
      script:async(ctx)=>{await ctx.say('Aviso del Guardián');await giveHint(ctx,guardian);}}]);
    await ev.script(c);
    assert.equal(c.log.length,2,'aviso y una sola pista');
  }
});

test('Tornadus requiere la pista y alcanzarlo montado; Thundurus, los tres rayos', () => {
  const s = state();
  assert.equal(condition(s, 'tornadus', { mounted: true }), 'hint');
  s.setFlag(hintFlag('tornadus'));
  assert.equal(condition(s, 'tornadus'), 'mount');
  assert.equal(condition(s, 'tornadus', { mounted: true }), 'ready');
  s.setFlag(hintFlag('thundurus'));
  assert.equal(condition(s, 'thundurus'), 'lightning');
  s.setVar('b22b_rayos', 3);
  assert.equal(condition(s, 'thundurus'), 'ready');
});

test('Landorus exige ambos capturados, no solo vistos ni vencidos', () => {
  const s = state();
  s.data.dex.seen.TORNADUS = true; s.data.dex.seen.THUNDURUS = true;
  assert.equal(condition(s, 'landorus'), 'clouds');
  s.setVar(LEGENDS.tornadus.rest, 0); s.setVar(LEGENDS.thundurus.rest, 0);
  assert.equal(condition(s, 'landorus'), 'clouds');
  s.setFlag(LEGENDS.tornadus.caught);
  assert.equal(condition(s, 'landorus'), 'clouds');
  s.setFlag(LEGENDS.thundurus.caught);
  assert.equal(condition(s, 'landorus'), 'ready');
});

test('movimientos de campo: solo aprendidos, con PP, de Pokémon despiertos y sin huevos', () => {
  const s = state();
  const a = s.party[0];
  s.setParty([{ ...a, hp: 0 }, { ...a, egg: true }, { ...a, moves: [{ id: 'FLAMETHROWER', pp: 0 }, { id: 'SURF', pp: 5 }] }]);
  assert.deepEqual(fieldMoves(s, db, ['FIRE']), []);
  assert.deepEqual(fieldMoves(s, db, ['WATER']).map((m) => [m.partyIndex, m.move]), [[2,'SURF']]);
  assert.deepEqual(fieldMoves(s, db, ['ICE','ROCK']), []);
});

test('aves: falta pista o movimiento y cancelar no rompe sellos ni inicia combates', async () => {
  for (const [key, move] of [['articuno','FLAMETHROWER'],['zapdos','ROCKSLIDE'],['moltres','SURF']]) {
    const s = state(); const c = ctx(s);
    assert.equal(await openSeal(c, key), false);
    s.setFlag(hintFlag(key));
    s.setParty([{ ...s.party[0], moves: [] }]);
    assert.equal(await openSeal(c, key), false);
    s.setParty([createPokemon(db, 'CHARIZARD', 70, { moves: [move] })]);
    const cancel = ctx(s, { choices: [1] });
    assert.equal(await openSeal(cancel, key), false);
    assert.equal(s.flag(LEGENDS[key].open), false);
    assert.equal(cancel.battles.length, 0);
    const accept = ctx(s);
    assert.equal(await openSeal(accept, key), true);
    assert.ok(s.flag(LEGENDS[key].open));
    assert.match(accept.log.join('\n'), /ha usado/);
    assert.equal(condition(s, key), 'ready');
  }
});

test('Zapdos admite un movimiento de Hielo además de Roca', async () => {
  const s = state(); s.setFlag(hintFlag('zapdos'));
  s.setParty([createPokemon(db, 'LAPRAS', 70, { moves: ['ICEBEAM'] })]);
  assert.equal(await openSeal(ctx(s), 'zapdos'), true);
});

test('bestias: solo tres avistamientos únicos, huida sin combate, rastros y cuarto fijo', async () => {
  for (const key of ['raikou','entei','suicune']) {
    const s = state(), c = ctx(s);
    assert.equal(condition(s, key), 'sightings');
    for (const site of ['uno','dos','tres']) assert.equal(await sighting(c, key, site), true);
    assert.equal(await sighting(c, key, 'uno'), false);
    assert.equal(await sighting(c, key, 'cuatro'), false);
    assert.deepEqual(beastSeen(s, key), ['uno','dos','tres']);
    assert.equal(c.battles.length, 0);
    assert.equal(condition(s, key), 'ready');
    const loaded = new GameState(JSON.parse(JSON.stringify(s.data)));
    assert.deepEqual(beastSeen(loaded, key), ['uno','dos','tres']);
  }
});

test('cada encuentro distingue captura, KO, huida y derrota; KO reaparece solo al descansar', async () => {
  for (const key of Object.keys(LEGENDS)) for (const outcome of ['caught','win','run','lose']) {
    const s = state(); s.setVar('rest_count', 7);
    for (const L of Object.values(LEGENDS)) if (L.hint) s.setFlag(L.hint);
    for (const k of ['tornadus','thundurus']) s.setFlag(LEGENDS[k].caught);
    s.setFlag(LEGENDS[key].caught, false);
    if (LEGENDS[key].open) s.setFlag(LEGENDS[key].open);
    s.setVar('b22b_rayos', 3);
    for (const beast of ['raikou','entei','suicune']) s.setVar(`b22b_${beast}_avistamientos`, ['a','b','c']);
    const c = ctx(s, { outcome }); c.world = { zygMount: { form: '10' } };
    assert.equal(await legendFight(c, key), outcome, key);
    assert.equal(s.flag(LEGENDS[key].caught), outcome === 'caught', key);
    assert.equal(c.heals, outcome === 'lose' ? 1 : 0, key);
    assert.equal(legendAvailable(s, key), ['run','lose'].includes(outcome), key);
    if (outcome === 'win') { applyRest(s, { slot: 'morning' }); assert.equal(legendAvailable(s, key), true, key); }
  }
});

test('motor real: los nueve permiten capturar con Ball y la consumen normalmente', async () => {
  for (const key of Object.keys(LEGENDS)) {
    const s = state(); s.addItem('MASTERBALL');
    const req = encounterRequest(key);
    class CaptureUI extends HeadlessBattleUI {
      async chooseAction() { return 'bag'; }
      async chooseItem() { return { item: 'MASTERBALL', target: 0, move: -1 }; }
    }
    const { config } = buildBattleConfig({ ...req, opponent: { party: [req.wild] } }, { db, state: s });
    const result = await new Battle({ ...config, rng: () => 0.99 }, new CaptureUI()).run();
    assert.equal(result.outcome, 'caught', key);
    assert.equal(result.caught.species, LEGENDS[key].species);
    assert.equal(result.caught.level, req.wild.level);
    assert.equal(result.bag.MASTERBALL || 0, 0);
  }
});

test('assets del bloque reproducibles, pixel×2 exacto, alfa opaco y fondos existentes',()=>{
  for(const [id,img]of Object.entries(buildB22bAssets())){
    const actual=Img.load(new URL(`../game/assets/objects/${id}.png`,import.meta.url));
    assert.deepEqual(actual.data,img.data,`${id}: exportado`);
    for(let y=0;y<img.h;y+=2)for(let x=0;x<img.w;x+=2){
      const c=img.get(x,y);assert.ok(c[3]===0||c[3]===255);
      for(const [dx,dy]of [[0,1],[1,0],[1,1]])assert.deepEqual(img.get(x+dx,y+dy),c,`${id}: píxel2×2`);
    }
    for(const row of splitSheet(img,img.w/4,img.h/4))for(const frame of row)assert.deepEqual(strayPixels(frame),[],`${id}: píxeles sueltos`);
  }
  for(const key of Object.keys(LEGENDS)){
    const backdrop=resolveBackdrop(encounterRequest(key));
    assert.ok(fs.existsSync(new URL(`../Pokemon Anil V4.13/${backdrop.file}`,import.meta.url)),`${key}: fondo real`);
  }
});
