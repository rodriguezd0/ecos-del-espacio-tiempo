// Bloque 9b — Interludio 4B (Ruta 8 · Marisma y Palafitos, Ciudad Nexo, Ruta 15, Caleta Sonda): contenido (mapas,
// enlaces, células, entrenadores, encuentros) y los guiones clave con un ctx simulado: el arco T08 completo
// (Remedios → Alerce → bombas → lecturas → poza del origen → Tabla Tóxica y la marisma sanando), la Caña Buena, la
// Supercaña y las pistas T11/T12 en cola hasta tener Nadar (docs/CAMPANA.md B09 parte B; TABLILLAS T08, T11, T12).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { MAPS } from '../game/src/content/maps/index.js';
import { TRAINERS, getTrainer } from '../game/src/content/trainers/index.js';
import { GameState } from '../game/src/core/state.js';
import { World } from '../game/src/world/world.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import { cellByKey, cellsOnMap } from '../game/src/content/zygarde/cells.js';
import { storyApi } from '../game/src/content/story/api.js';
import { clueEntry } from '../game/src/content/story/clueLogic.js';
import { moneyKindOf, MONEY_BY_KIND } from '../game/src/content/trainerMoney.js';
import { F, V } from '../game/src/content/events/b09b_common.js';
import { t08Events, consistentPools, pumpsOff, allReadings, remediosTalk, T08_TEXT } from '../game/src/content/events/b09b_t08.js';
import { nexoEvents } from '../game/src/content/events/b09b_nexo.js';
import { STAKES, POOLS, PUMPS, readingLevel } from '../game/src/content/maps/b09b/ruta_8_layout.js';
import ENC, { MARISMA_GRASS, MARISMA_GRASS_RAIN, COAST_ROCKS } from '../game/src/content/encounters/b09b.js';

const B09B_MAPS = [
  'ruta_8_marisma', 'palafitos_remedios', 'palafitos_casa',
  'ciudad_nexo', 'nexo_centro', 'nexo_tienda', 'nexo_estacion', 'nexo_correos', 'nexo_casa_pescador', 'nexo_astillero', 'nexo_faro',
  'ruta_15', 'caleta_sonda', 'caleta_centro', 'caleta_tienda', 'caleta_faro', 'caleta_casa_buzos', 'caleta_algas',
];
const species = JSON.parse(fs.readFileSync(new URL('../game/data/species.json', import.meta.url), 'utf8'));

/** ctx mínimo para guiones (sin DOM). `answers`: respuestas de choice en orden (0 por defecto). */
function mockCtx(state, extra = {}, answers = []) {
  const said = [];
  const queue = [...answers];
  const self = new Map();
  const ctx = {
    state, said, map: { id: 'ruta_8_marisma' },
    say: async (t) => { said.push(String(t)); },
    choice: async () => (queue.length ? queue.shift() : 0),
    confirm: async () => true,
    flag: (k) => state.flag(k),
    setFlag: (k, v = true) => state.setFlag(k, v),
    var: (k, d = 0) => state.var(k, d),
    setVar: (k, v) => state.setVar(k, v),
    setSelfSwitch: (k, v) => self.set(k, v),
    wait: async () => {}, fade: async () => {}, flash: async () => {}, emote: async () => {}, shake: async () => {},
    se: () => {}, me: () => {}, cry: () => {}, bgm: () => {},
    move: async () => {}, erase: () => {}, face: () => {}, requestRefresh: () => {}, directionTo: () => 2,
    giveItem: async (id, n = 1) => { state.addItem(id, n); },
    heal: () => {},
    setHealPoint: (x, y, dir) => state.setHealPoint('palafitos_remedios', x, y, dir),
    zygarde: (k) => state.zygardeAbility(k),
    player: { x: 32, y: 37, direction: 2, moveTo(x, y) { this.x = x; this.y = y; } },
    world: {
      events: [{ id: 'alerce_puesto', x: 33, y: 37 }, { id: 'maletin_alerce', x: 34, y: 37 }],
      followers: [],
      spawnEvent: (d) => ({ ...d }),
      input: { held: () => false },
    },
    event: null,
    ui: { toast: () => {} },
    ...extra,
  };
  ctx.story = storyApi(ctx);
  return ctx;
}

/** Guion de la primera página de un evento de una lista (o de la página `page`). */
function scriptOf(events, id, page = 0) {
  const ev = events.find((e) => e.id === id);
  assert.ok(ev, `evento ${id}`);
  return ev.pages ? ev.pages[page].script : ev.script;
}

// ───────────────────────────── mapas y enlaces ─────────────────────────────

test('mapas del bloque: registrados, construyen sin avisos, eventos con id único', async () => {
  for (const id of B09B_MAPS) {
    assert.ok(MAPS[id], `${id} registrado`);
    const { def, entry, warnings } = await buildMapNode(id);
    assert.equal(def.id, id);
    assert.deepEqual(warnings, [], `${id}: avisos de construcción`);
    const world = new World({ state: GameState.create({ name: 'P' }) });
    world.setCurrent({ ...entry, events: null });
    assert.ok(world.events.length > 0, `${id}: eventos`);
    const ids = world.events.map((e) => e.id);
    assert.equal(new Set(ids).size, ids.length, `${id}: ids de evento repetidos`);
  }
});

test('enlaces: Ruta 8 ↔ Lúmina/Mnemos, Nexo ↔ Ruta 14/Ruta 15, Ruta 15 ↔ Caleta (simétricos cuando el vecino existe)', async () => {
  const pairs = [
    ['ruta_8_marisma', 'ciudad_lumina', 'east', 54], ['ruta_8_marisma', 'aldea_mnemos', 'north', 0],
    ['ciudad_nexo', 'ruta_14_reserva', 'north', 2], ['ciudad_nexo', 'ruta_15', 'west', 6], ['ruta_15', 'caleta_sonda', 'west', 2],
  ];
  const OPP = { north: 'south', south: 'north', east: 'west', west: 'east' };
  for (const [from, to, dir, offset] of pairs) {
    if (!MAPS[to]) continue;
    const a = (await MAPS[from]()).default;
    const link = (a.connections || []).find((c) => c.to === to);
    assert.ok(link, `${from} conecta con ${to}`);
    assert.deepEqual([link.dir, link.offset], [dir, offset], `${from} → ${to}`);
    const b = (await MAPS[to]()).default;
    const back = (b.connections || []).find((c) => c.to === from);
    if (!back) continue; // el vecino aún no enlaza (otro bloque): el borde muestra el aviso neutro
    assert.equal(back.dir, OPP[dir], `${to} → ${from}: dirección`);
    assert.equal(back.offset + link.offset, 0, `${to} → ${from}: offsets simétricos`);
  }
});

test('células del bloque (C044, C072, C075, C064, C086): cada evento coincide con el registro global', async () => {
  const expected = { ruta_8_marisma: ['cell_marisma_1', 'cell_marisma_2'], ciudad_nexo: ['cell_nexo_1'], caleta_sonda: ['cell_caleta_1'], caleta_algas: ['cell_caleta_2'] };
  for (const [mapId, keys] of Object.entries(expected)) {
    assert.deepEqual(cellsOnMap(mapId).map((c) => c.key).sort(), [...keys].sort(), `${mapId}: células del catálogo`);
    const { entry } = await buildMapNode(mapId);
    const world = new World({ state: GameState.create({ name: 'P' }) });
    world.setCurrent({ ...entry, events: null });
    for (const key of keys) {
      assert.ok(world.events.some((e) => e.id === key), `${mapId}: falta el evento ${key}`);
      assert.equal(cellByKey(key).map, mapId);
    }
  }
  assert.deepEqual(['cell_marisma_1', 'cell_marisma_2', 'cell_nexo_1', 'cell_caleta_1', 'cell_caleta_2'].map((k) => cellByKey(k).id),
    ['C044', 'C072', 'C075', 'C064', 'C086']);
});

// ───────────────────────────── entrenadores y encuentros ─────────────────────────────

test('entrenadores: 13, niveles del Interludio 4 (31–36) y dinero base de BALANCE.md por clase', () => {
  const ids = Object.keys(TRAINERS).filter((k) => k.startsWith('b09b_'));
  assert.equal(ids.length, 13);
  for (const id of ids) {
    const t = getTrainer(id, GameState.create({ name: 'P' }));
    for (const p of t.party) {
      assert.ok(p.level >= 31 && p.level <= 36, `${id}: nivel ${p.level}`);
      assert.ok(species[p.species], `${id}: especie ${p.species}`);
    }
    const kind = moneyKindOf(t);
    assert.ok(kind, `${id}: clase ${t.class} fuera de la tabla`);
    assert.equal(t.money, MONEY_BY_KIND[kind], `${id}: dinero ${t.money} (${t.class})`);
  }
  for (const n of [1, 2, 3]) {
    const pump = PUMPS.find((p) => p.n === n);
    assert.ok(TRAINERS[pump.tech.trainer], `técnico de la bomba ${n}`);
    assert.equal(getTrainer(pump.tech.trainer, GameState.create({ name: 'P' })).canLose, true, 'combate de guion sin pérdida');
  }
});

test('encuentros: tablas al 100 %, especies existentes; con lluvia Goomy sustituye a Skorupi', () => {
  const sum = (tab) => tab.reduce((n, [w]) => n + w, 0);
  for (const [mapId, tables] of Object.entries(ENC)) {
    for (const [kind, tab] of Object.entries(tables)) {
      if (!Array.isArray(tab)) continue;
      assert.equal(sum(tab), 100, `${mapId}.${kind}`);
      for (const [, sp, min, max] of tab) {
        assert.ok(species[sp], `${mapId}.${kind}: ${sp}`);
        assert.ok(min <= max, `${mapId}.${kind}: ${sp} ${min}–${max}`);
      }
    }
  }
  assert.equal(sum(MARISMA_GRASS_RAIN), 100);
  assert.ok(MARISMA_GRASS_RAIN.some((r) => r[1] === 'GOOMY') && !MARISMA_GRASS_RAIN.some((r) => r[1] === 'SKORUPI'));
  assert.ok(MARISMA_GRASS.some((r) => r[1] === 'WOOPER' && r[4] === 1), 'Wooper de Paldea (forma 1)');
  assert.equal(sum(COAST_ROCKS), 100);
});

// ───────────────────────────── T08: triangulación ─────────────────────────────

test('T08: las seis lecturas solo son coherentes con la poza del origen (q3)', () => {
  const source = POOLS.find((p) => p.source);
  assert.equal(source.id, 'q3');
  const levels = Object.fromEntries(STAKES.map((k) => [k.n, readingLevel(k)]));
  assert.deepEqual(consistentPools(levels), ['q3'], 'la triangulación debe señalar una sola poza');
  assert.ok(Object.values(levels).includes(5), 'alguna estaca marca el máximo');
  assert.ok(new Set(Object.values(levels)).size >= 3, 'las lecturas deben variar lo bastante para triangular');
});

test('T08: Remedios cura, fija el punto de cura y da la segunda pista (descubrimiento directo)', async () => {
  const s = GameState.create({ name: 'Prueba' });
  const ctx = mockCtx(s);
  await remediosTalk(ctx, { x: 6, y: 6, dir: 8 });
  assert.ok(s.flag(F.remedios));
  assert.ok(ctx.said.includes(T08_TEXT.healed));
  assert.equal(ctx.story.clueStatus('T08'), 'active');
  assert.equal(Number(clueEntry(s, 'T08').step), 2, 'segunda pista de T08');
});

test('T08: las estacas no miden sin Alerce ni con las bombas en marcha; luego guardan su nivel', async () => {
  const s = GameState.create({ name: 'Prueba' });
  const events = t08Events();
  const stake = STAKES[0];
  const run = (ctx) => scriptOf(events, `estaca_${stake.n}`)(ctx);
  let ctx = mockCtx(s);
  await run(ctx);
  assert.ok(ctx.said.includes(T08_TEXT.stakeBefore));
  assert.equal(Number(s.var(V.reading(stake.n), 0)), 0);
  s.setFlag(F.alerce);
  ctx = mockCtx(s);
  await run(ctx);
  assert.ok(ctx.said.includes(T08_TEXT.stakeNoisy), 'con las bombas en marcha la lectura baila');
  assert.equal(Number(s.var(V.reading(stake.n), 0)), 0);
  for (const p of PUMPS) s.setFlag(F.pump(p.n));
  assert.ok(pumpsOff(s));
  ctx = mockCtx(s);
  await run(ctx);
  assert.equal(Number(s.var(V.reading(stake.n))), readingLevel(stake));
  assert.ok(!allReadings(s));
});

test('T08: la poza pide las seis lecturas; la equivocada no penaliza; la del origen da la Tabla Tóxica y sana la marisma', async () => {
  const s = GameState.create({ name: 'Prueba' });
  s.setZygardeAbility('terrain', true);
  s.data.zygarde.form = s.data.zygarde.form || 'cell';
  const events = t08Events();
  s.setFlag(F.remedios); s.setFlag(F.alerce);
  for (const p of PUMPS) s.setFlag(F.pump(p.n));
  // Sin lecturas: no se excava.
  let ctx = mockCtx(s);
  await scriptOf(events, 'poza_q3')(ctx);
  assert.ok(ctx.said.includes(T08_TEXT.poolNeedReadings));
  assert.ok(!s.flag(F.tablet));
  // Las seis estacas.
  for (const k of STAKES) await scriptOf(events, `estaca_${k.n}`)(mockCtx(s));
  assert.ok(allReadings(s) && s.flag(F.readings));
  // Poza equivocada.
  ctx = mockCtx(s);
  await scriptOf(events, 'poza_q1')(ctx);
  assert.ok(ctx.said.includes(T08_TEXT.poolWrong));
  assert.ok(!s.flag(F.tablet) && !s.hasItem('TOXICPLATE'));
  // Poza del origen: Tablilla, escena final y regalo de Remedios.
  ctx = mockCtx(s);
  await scriptOf(events, 'poza_q3')(ctx);
  assert.ok(s.hasItem('TOXICPLATE'), 'Tabla Tóxica en la mochila');
  assert.ok(s.flag(F.tablet) && s.flag(F.healed), 'la marisma empieza a sanar');
  assert.equal(ctx.story.clueStatus('T08'), 'solved');
  assert.equal(s.itemCount('REVIVALHERB'), 2);
  assert.ok(ctx.said.includes(T08_TEXT.finaleRemedios) && ctx.said.includes(T08_TEXT.finaleAlerceReply));
  const clock = s.data.clock.minutes;
  assert.ok(clock >= 17 * 60, `la escena final es por la tarde (${clock})`);
  // Repetir no vuelve a dar nada.
  ctx = mockCtx(s);
  await scriptOf(events, 'poza_q3')(ctx);
  assert.equal(s.itemCount('REVIVALHERB'), 2);
});

test('T08: parar las bombas antes de Remedios no cita el lector de la Pokédex, y Alerce ya no pide pararlas', async () => {
  const s = GameState.create({ name: 'Prueba' });
  const events = t08Events();
  const fight = { battle: async () => 'win', approach: async () => {}, turnToPlayer: () => {}, event: { id: 'tecnico' } };
  const said = [];
  for (const p of PUMPS) {
    const ctx = mockCtx(s, fight);
    await scriptOf(events, `tecnico_bomba_${p.n}`)(ctx);
    said.push(...ctx.said);
  }
  assert.ok(pumpsOff(s) && s.flag(F.pumps));
  assert.ok(said.includes(T08_TEXT.pumpsAllOffEarly), 'aviso neutro sin el lector');
  assert.ok(!said.includes(T08_TEXT.pumpsAllOff), 'el lector aún no existe');
  s.setFlag(F.remedios);
  const ctx = mockCtx(s);
  await scriptOf(events, 'alerce_llegada')(ctx);
  assert.ok(s.flag(F.alerce));
  assert.ok(ctx.said.includes(T08_TEXT.alercePumpsOff) && !ctx.said.includes(T08_TEXT.alercePumpsOn));
});

test('T08: una poza equivocada ya removida no vuelve a preguntar', async () => {
  const s = GameState.create({ name: 'Prueba' });
  s.setZygardeAbility('terrain', true);
  s.setFlag(F.readings);
  const events = t08Events();
  await scriptOf(events, 'poza_q2')(mockCtx(s));
  assert.equal(Number(s.var(V.dug('q2'), 0)), 1);
  let asked = false;
  const ctx = mockCtx(s, { choice: async () => { asked = true; return 0; } });
  await scriptOf(events, 'poza_q2')(ctx);
  assert.ok(!asked && ctx.said.includes(T08_TEXT.poolDugAlready));
});

test('T08: si la losa aparece de noche, la escena de Remedios espera a la tarde siguiente (18:00)', async () => {
  const s = GameState.create({ name: 'Prueba' });
  s.setZygardeAbility('terrain', true);
  s.setFlag(F.readings);
  s.advanceMinutes(((23 * 60) - s.data.clock.minutes + 24 * 60) % (24 * 60));
  assert.equal(s.hour, 23);
  await scriptOf(t08Events(), 'poza_q3')(mockCtx(s));
  assert.ok(s.flag(F.healed));
  assert.equal(s.data.clock.minutes, 18 * 60);
});

test('T08: una vez sana, la marisma cambia de página (bombas, técnicos, espuma, pozas)', () => {
  const s = GameState.create({ name: 'Prueba' });
  const events = t08Events();
  const lastPage = (id) => {
    const ev = events.find((e) => e.id === id);
    const fake = { selfSwitch: () => false };
    return ev.pages.map((p, i) => [p, i]).filter(([p]) => !p.when || p.when(s, fake)).pop()[1];
  };
  assert.equal(lastPage('tecnico_bomba_1'), 0);
  assert.equal(lastPage('espuma_0'), 0);
  s.setFlag(F.pump(1));
  assert.equal(lastPage('tecnico_bomba_1'), 1);
  assert.equal(lastPage('bomba_1'), 1);
  s.setFlag(F.tablet); s.setFlag(F.healed);
  assert.equal(lastPage('tecnico_bomba_1'), 2, 'los técnicos se van');
  assert.equal(lastPage('espuma_0'), 1, 'la espuma desaparece');
  assert.equal(lastPage('poza_q3'), 3, 'queda el hueco de la losa');
  assert.equal(lastPage('poza_q1'), 2, 'el lodo se asienta');
});

// ───────────────────────────── Nexo y Caleta ─────────────────────────────

test('Nexo: el pescador da la Caña Buena una vez; el mercado abre T12 en cola sin Nadar', async () => {
  const s = GameState.create({ name: 'Prueba' });
  const events = nexoEvents();
  await scriptOf(events, 'pescador_cana_buena')(mockCtx(s));
  await scriptOf(events, 'pescador_cana_buena')(mockCtx(s));
  assert.equal(s.itemCount('GOODROD'), 1);
  const ctx = mockCtx(s);
  await scriptOf(events, 'puesto_herreros')(ctx);
  assert.equal(ctx.story.clueStatus('T12'), 'queued', 'T12 espera a Nadar');
  assert.ok(s.flag(F.t12));
});

test('Caleta: la tienda de pesca regala la Supercaña; Ramón abre T11 en cola hasta tener Nadar', async () => {
  const s = GameState.create({ name: 'Prueba' });
  const tienda = (await MAPS.caleta_tienda()).default;
  const faro = (await MAPS.caleta_faro()).default;
  const tEvents = typeof tienda.events === 'function' ? tienda.events() : tienda.events;
  const fEvents = typeof faro.events === 'function' ? faro.events() : faro.events;
  await scriptOf(tEvents, 'pescador_supercana')(mockCtx(s));
  await scriptOf(tEvents, 'pescador_supercana')(mockCtx(s));
  assert.equal(s.itemCount('SUPERROD'), 1);
  const ctx = mockCtx(s);
  await scriptOf(fEvents, 'ramon')(ctx);
  assert.equal(ctx.story.clueStatus('T11'), 'queued');
  assert.ok(s.flag(F.t11));
});
