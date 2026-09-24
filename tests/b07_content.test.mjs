// Bloque 7 — Ruta 6 y la Cantería Solano: contenido (mapas, enlaces, células, entrenadores, encuentros) y guiones
// clave con un ctx simulado (Mega Aro, piedra activadora). Comprueba además que la Megaevolución solo funciona en
// combate después de recibir el Mega Aro (docs/CAMPANA.md B07 y X14; POKEDEX_DISTRIBUCION §7.3 y §7.7; BALANCE.md).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { MAPS } from '../game/src/content/maps/index.js';
import { TRAINERS, getTrainer } from '../game/src/content/trainers/index.js';
import { GameState } from '../game/src/core/state.js';
import { World } from '../game/src/world/world.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import { cellByKey } from '../game/src/content/zygarde/cells.js';
import { B07_CELLS } from '../game/src/content/events/b07_cells.js';
import { F } from '../game/src/content/events/b07_common.js';
import { giveMegaRing, ringScene } from '../game/src/content/events/b07_megaring.js';
import { stoneAndExit } from '../game/src/content/events/b07_galerias.js';
import { RUTA_6, GALERIAS_CANTERIA } from '../game/src/content/encounters/b07.js';
import { buildBattleConfig } from '../game/src/battle/scene/setup.js';
import { Battle, HeadlessBattleUI } from '../game/src/battle/core/index.js';
import { createPokemon } from '../game/src/battle/core/pokemon.js';
import { JOURNAL_BLOCKS } from '../game/src/content/story/journal.js';

const B07_MAPS = ['ruta_6', 'canteria_solano', 'canteria_herreria'];
const load = (f) => JSON.parse(fs.readFileSync(new URL(`../game/data/${f}`, import.meta.url), 'utf8'));
const db = {
  species: load('species.json'), moves: load('moves.json'), abilities: load('abilities.json'), types: load('types.json'),
  items: { ...load('items.json'), ...load('items_axis.json') }, trainerTypes: load('trainer_types.json'),
};

function mockCtx(state, extra = {}) {
  const said = [];
  return {
    state, said,
    say: async (t) => { said.push(t); },
    choice: async () => 0, confirm: async () => true,
    flag: (k) => state.flag(k), setFlag: (k, v = true) => state.setFlag(k, v),
    var: (k, d = 0) => state.var(k, d), setVar: (k, v) => state.setVar(k, v),
    wait: async () => {}, se: () => {}, me: () => {}, cry: () => {}, bgm: () => {},
    flash: async () => {}, shake: () => {}, fade: async () => {}, warp: async () => {},
    move: async () => {}, movePlayerTo: async () => {}, erase: () => {}, face: () => {}, requestRefresh: () => {},
    world: { events: [] }, player: { x: 0, y: 0 },
    ...extra,
  };
}

test('mapas del bloque: registrados, construyen sin avisos y crean sus eventos', async () => {
  for (const id of B07_MAPS) {
    assert.ok(MAPS[id], `${id} registrado`);
    const { def, entry, warnings } = await buildMapNode(id);
    assert.equal(def.id, id);
    assert.deepEqual(warnings, [], `${id}: avisos de construcción`);
    const world = new World({ state: GameState.create({ name: 'Prueba' }) });
    world.setCurrent({ ...entry, events: null });
    assert.ok(world.events.length > 0, `${id}: eventos`);
  }
});

test('enlaces: Ruta 6 ↔ Villa Brontia (offset acordado con B05) y ↔ Ciudad Estrato si existe (simétricos)', async () => {
  const r6 = (await MAPS.ruta_6()).default;
  const toVB = r6.connections.find((c) => c.to === 'villa_brontia');
  assert.deepEqual([toVB.dir, toVB.offset], ['north', -7]);
  if (MAPS.villa_brontia) {
    const vb = (await MAPS.villa_brontia()).default;
    const back = vb.connections.find((c) => c.to === 'ruta_6');
    assert.ok(back, 'Villa Brontia debe conectar con la Ruta 6 en cuanto existe (maps/b05/links.js)');
    assert.deepEqual([back.dir, back.offset], ['south', 7]);
  }
  if (MAPS.ciudad_estrato) {
    const toE = r6.connections.find((c) => c.to === 'ciudad_estrato');
    assert.ok(toE, 'la Ruta 6 conecta con Ciudad Estrato cuando está registrada');
    const es = (await MAPS.ciudad_estrato()).default;
    const back = (es.connections || []).find((c) => c.to === 'ruta_6');
    if (back) assert.equal(back.offset + toE.offset, 0, 'offsets simétricos con Ciudad Estrato');
  }
});

test('células C035 y C056 como en el registro global (mapa, etapa)', () => {
  for (const c of B07_CELLS) {
    const reg = cellByKey(c.id);
    assert.ok(reg, `${c.id} en content/zygarde/cells.js`);
    assert.equal(reg.id, c.code);
    assert.equal(reg.map, c.map);
    assert.equal(reg.stage, c.stage);
  }
});

test('entrenadores: nivel 25–29 (POKEDEX §7.1) y dinero base de BALANCE.md', () => {
  const ids = Object.keys(TRAINERS).filter((k) => k.startsWith('b07_'));
  assert.equal(ids.length, 8);
  const expected = { Excursionista: 32, Montañero: 32, Minero: 32, Minera: 32, Veterana: 48, 'Técnico del Consorcio': 40, 'Técnica del Consorcio': 40 };
  for (const id of ids) {
    const t = getTrainer(id, GameState.create({ name: 'P' }));
    for (const p of t.party) assert.ok(p.level >= 25 && p.level <= 29, `${id}: nivel ${p.level}`);
    assert.equal(t.money, expected[t.class], `${id}: dinero ${t.money} (${t.class})`);
  }
});

test('encuentros de la Ruta 6 y de las galerías (POKEDEX_DISTRIBUCION «Ruta 6 y Cantería Solano»)', () => {
  const sum = (tab) => tab.reduce((n, [w]) => n + w, 0);
  assert.equal(sum(RUTA_6.grassDay), 100);
  assert.equal(sum(RUTA_6.grassNight), 100);
  assert.equal(sum(GALERIAS_CANTERIA.cave), 100);
  assert.deepEqual(RUTA_6.grassDay.map((r) => r[1]), ['GLIGAR', 'TIMBURR', 'RHYHORN', 'MEDITITE', 'NOSEPASS', 'MACHOKE', 'BOMBIRDIER', 'ABSOL']);
  assert.deepEqual(GALERIAS_CANTERIA.cave.map((r) => r[1]), ['GRAVELER', 'NACLI', 'TINKATINK', 'ONIX']);
  for (const tab of [RUTA_6.grassDay, RUTA_6.grassNight, GALERIAS_CANTERIA.cave]) {
    for (const [, sp, min, max] of tab) {
      assert.ok(db.species[sp], sp);
      assert.ok(min >= 24 && max <= 29);
    }
  }
});

test('Quino arranca la piedra activadora solo con la Tablilla y él fuera; y saca al jugador a la cantera', async () => {
  const s = GameState.create({ name: 'Prueba' });
  const warps = [];
  const ctx = mockCtx(s, { warp: async (...a) => { warps.push(a); } });
  await stoneAndExit(ctx);
  assert.ok(!s.flag(F.piedra), 'sin Quino ni Tablilla no hay piedra');
  s.setFlag(F.quino);
  s.setFlag(F.tablilla);
  await stoneAndExit(ctx);
  assert.ok(s.flag(F.piedra));
  assert.equal(warps[0][0], 'ruta_6');
});

test('Mega Aro: la escena de la herrería lo entrega (salida del bloque) y despeja el camino de Estrato', async () => {
  const s = GameState.create({ name: 'Prueba' });
  const ctx = mockCtx(s);
  await ringScene(ctx);
  assert.ok(!s.hasKeyItem('MEGARING'), 'antes del rescate no hay anillo');
  s.setFlag(F.rescate);
  await ringScene(ctx);
  assert.ok(s.hasKeyItem('MEGARING'));
  assert.ok(s.flag(F.megaring) && s.flag(F.ruta));
  assert.ok(ctx.said.some((t) => /Es una Piedra Activadora\. Responde a los lazos…/.test(t)));
  assert.ok(ctx.said.some((t) => /^Te va a hacer falta\.$/.test(t)));
  assert.equal(await giveMegaRing(ctx), false, 'no se duplica');
  assert.ok(JOURNAL_BLOCKS.some((b) => b.block === 'B07' && b.flag === F.megaring), 'el Diario usa la salida del bloque');
});

/** Combate sin escena contra un entrenador del bloque pidiendo megaevolucionar en cada turno. → mensajes */
async function battleAskingMega(state) {
  const { config } = buildBattleConfig({ type: 'trainer', trainer: 'b07_minero_tino', seed: 7 }, { db, state, getTrainer });
  const messages = [];
  class UI extends HeadlessBattleUI {
    async message(text, opts) { messages.push(String(text)); return super.message?.(text, opts); }
  }
  const ui = new UI({
    chooseMove: (_b, moves) => {
      const m = moves.find((x) => x.selectable && x.category !== 'Status') || moves.find((x) => x.selectable);
      return { index: m ? m.index : 0, mega: true };
    },
  });
  await new Battle(config, ui).run();
  return { config, messages };
}

test('Megaevolución en combate: imposible sin el Mega Aro, posible con él (Lucario con su Lucarita)', async () => {
  const s = GameState.create({ name: 'Prueba' });
  const lucario = { ...createPokemon(db, 'LUCARIO', 40, { ot: { name: 'P', id: 1 } }), heldItem: 'LUCARIONITE' };
  s.setParty([lucario]);
  const before = await battleAskingMega(s);
  assert.equal(before.config.player.megaRing, false);
  assert.ok(!before.messages.some((t) => /megaevolucionado/.test(t)), 'megaevoluciona sin Mega Aro');
  s.addKeyItem('MEGARING');
  s.setParty([lucario]);
  const after = await battleAskingMega(s);
  assert.equal(after.config.player.megaRing, true);
  assert.ok(after.messages.some((t) => /ha megaevolucionado/.test(t)), 'no megaevoluciona con el Mega Aro');
});
