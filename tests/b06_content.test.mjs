// Bloque 6 — Pilar del Impulso: contenido (mapas, células, entrenadores, encuentros, combate doble con aliado) y
// guiones clave con un ctx simulado (campanas, pastor y Wooloo, boca de las galerías). docs/CAMPANA.md B06.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { MAPS } from '../game/src/content/maps/index.js';
import { TRAINERS } from '../game/src/content/trainers/index.js';
import { GameState } from '../game/src/core/state.js';
import { World } from '../game/src/world/world.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import { cellByKey } from '../game/src/content/zygarde/cells.js';
import { B06_CELLS, COLECTOR_CELLS } from '../game/src/content/events/b06_cells.js';
import { F, V, gaelAllyParty, scriptedBattle, trainerLater } from '../game/src/content/events/b06_common.js';
import { bellEvents, pedestalEvent, LONG_FRAMES } from '../game/src/content/events/b06_nucleo.js';
import { woolooStray, pastorEvent, PASTOR_REWARD } from '../game/src/content/events/b06_wooloo.js';
import { RUTA_5, MESETA_IMPULSO, GALERIAS_SOPLO } from '../game/src/content/encounters/b06.js';
import { buildBattleConfig } from '../game/src/battle/scene/setup.js';
import { Battle, HeadlessBattleUI } from '../game/src/battle/core/index.js';
import { createPokemon } from '../game/src/battle/core/pokemon.js';
import { getTrainer } from '../game/src/content/trainers/index.js';
import { baseOnEnter } from '../game/src/content/events/b06_vertical.js';
import { P3_VERTICAL } from '../game/src/content/maps/b06/layout.js';

const B06_MAPS = ['ruta_5', 'meseta_impulso', 'parque_eolico', 'anillo_vientos', 'galerias_soplo', 'anillo_vientos_base', 'anillo_vientos_nucleo'];
const load = (f) => JSON.parse(fs.readFileSync(new URL(`../game/data/${f}`, import.meta.url), 'utf8'));
const db = {
  species: load('species.json'), moves: load('moves.json'), abilities: load('abilities.json'), types: load('types.json'),
  items: { ...load('items.json'), ...load('items_axis.json') }, trainerTypes: load('trainer_types.json'),
};

/** ctx mínimo para guiones de evento (sin DOM). */
function mockCtx(state, extra = {}) {
  const said = [];
  const ctx = {
    state, said,
    say: async (t) => { said.push(t); },
    choice: async () => 0,
    confirm: async () => true,
    flag: (k) => state.flag(k),
    setFlag: (k, v = true) => state.setFlag(k, v),
    var: (k, d = 0) => state.var(k, d),
    setVar: (k, v) => state.setVar(k, v),
    wait: async () => {},
    se: () => {}, me: () => {}, cry: () => {}, bgm: () => {},
    flash: async () => {}, shake: () => {}, tone: async () => {},
    move: async () => {}, erase: () => {}, face: () => {}, requestRefresh: () => {},
    giveItem: async (id, n = 1) => { state.addItem(id, n); },
    zygarde: (k) => state.zygardeAbility(k),
    world: { events: [], input: { held: () => false } },
    event: { direction: 2, stepAnime: false },
    ...extra,
  };
  return ctx;
}

test('mapas del bloque: registrados, construyen y crean sus eventos', async () => {
  for (const id of B06_MAPS) {
    assert.ok(MAPS[id], `${id} registrado`);
    const { def, entry, warnings } = await buildMapNode(id);
    assert.equal(def.id, id);
    assert.deepEqual(warnings, [], `${id}: avisos de construcción`);
    const world = new World({ state: GameState.create({ name: 'Prueba' }) });
    world.setCurrent({ ...entry, events: null });
    assert.ok(world.events.length > 0, `${id}: eventos`);
  }
});

test('P3 vertical: entrenadores abajo, puzzle en el segundo piso y Abril junto al núcleo del tercero', async () => {
  const loadFloor = async (id, floor) => {
    assert.ok(MAPS[id], `${id} registrado`);
    const def = (await MAPS[id]()).default;
    assert.deepEqual(def.pillar, { id: 'P3', floor });
    assert.ok(!def.outdoor, `${id}: interior del Pilar`);
    return def;
  };
  const base = await loadFloor('anillo_vientos_base', 1);
  const galleries = await loadFloor('galerias_soplo', 2);
  const bells = await loadFloor('anillo_vientos', 2);
  const core = await loadFloor('anillo_vientos_nucleo', 3);
  assert.deepEqual(base.events.filter((e) => e.trainer).map((e) => e.trainer).sort(), ['b06_mecanica_sonia', 'b06_veterana_julia']);
  assert.ok(!bells.events.some((e) => e.id === 'nucleo_impulso'), 'el puzzle no restaura el Pilar');
  assert.ok(core.events.some((e) => e.id === 'abril_sala'));
  assert.ok(core.events.some((e) => e.id === 'nucleo_impulso'));
  assert.equal(galleries.warps[0].to, base.id, 'las galerías bajan a entrenadores');
  const pedestal = core.events.find((e) => e.id === 'nucleo_impulso');
  const state = GameState.create({ name: 'P' });
  state.setFlag(F.bells);
  assert.ok(!pedestal.pages[1].when(state), 'las campanas no sustituyen el combate con Abril');
  state.setFlag(F.abril);
  assert.ok(pedestal.pages[1].when(state));
});

test('P3: las partidas anteriores conservan entrenadores/objetos y el campamento se migra a suelo seguro', async () => {
  const state = GameState.create({ name: 'P' });
  state.setSelfSwitch('meseta_impulso', 'veterana_julia');
  state.setSelfSwitch('anillo_vientos', 'objeto_anillo_2');
  await baseOnEnter(mockCtx(state));
  assert.ok(state.selfSwitch('anillo_vientos_base', 'veterana_julia'));
  assert.ok(state.selfSwitch('anillo_vientos_base', 'objeto_anillo_2'));
  const bells = (await MAPS.anillo_vientos()).default;
  const calls = [];
  await bells.onEnter(mockCtx(state, { player: { x: 37, y: 28 }, warp: async (...args) => calls.push(args) }));
  assert.deepEqual(calls, [['anillo_vientos_base', P3_VERTICAL.entry.x, P3_VERTICAL.entry.y, 8]]);
});

test('P3: Abril se despide andando hasta la escalera del nuevo núcleo', async () => {
  const state = GameState.create({ name: 'P' });
  for (const f of [F.bells, F.abril, F.abrilSala]) state.setFlag(f);
  const { entry } = await buildMapNode('anillo_vientos_nucleo');
  const world = new World({ state });
  world.setCurrent({ ...entry, events: null });
  const P = P3_VERTICAL;
  world.player.moveTo(P.pedestal.x, P.pedestal.y + 1);
  const abril = world.events.find((e) => e.id === 'abril_sala');
  abril.moveTo(P.guardian.x + 2, P.guardian.y);
  let erased = false;
  const ctx = mockCtx(state, {
    world, player: world.player,
    setFlag: (f) => {
      if (f === F.abrilAfter) assert.deepEqual([abril.x, abril.y], [P.down.x, P.down.y], 'llega antes de su despedida');
      state.setFlag(f);
    },
    move: async (actor, route) => {
      const ev = typeof actor === 'string' ? world.events.find((e) => e.id === actor) : actor;
      for (const step of route) {
        const [dir, dx, dy] = { up: [8, 0, -1], down: [2, 0, 1], left: [4, -1, 0], right: [6, 1, 0] }[step];
        assert.ok(!state.flag(F.abrilAfter), 'sigue visible mientras camina');
        assert.ok(world.map.passable(ev.x, ev.y, dir, ev) && world.map.passable(ev.x + dx, ev.y + dy, 10 - dir, ev), 'camina por el suelo');
        ev.moveTo(ev.x + dx, ev.y + dy);
      }
    },
    erase: (ev) => {
      assert.deepEqual([ev.x, ev.y], [P.down.x, P.down.y], 'se oculta en la escalera');
      erased = true;
    },
    story: {
      restorePillar: async (id, opts) => {
        assert.equal(id, 3);
        state.setFlag(F.restored);
        world.refreshEvents();
        await opts.onRestored(ctx);
        return true;
      },
      openClue: async () => {},
    },
  });
  await pedestalEvent().pages[1].script(ctx);
  assert.ok(state.flag(F.abrilAfter) && erased);
});

test('conexiones: Ruta 5 ↔ Meseta simétricas; Ruta 5 ↔ Brontia con el offset acordado con B05', async () => {
  const r5 = (await MAPS.ruta_5()).default;
  const me = (await MAPS.meseta_impulso()).default;
  const east = r5.connections.find((c) => c.to === 'meseta_impulso');
  const west = me.connections.find((c) => c.to === 'ruta_5');
  assert.equal(east.dir, 'east');
  assert.equal(west.dir, 'west');
  assert.equal(east.offset, -west.offset);
  if (MAPS.villa_brontia) {
    const vb = (await MAPS.villa_brontia()).default;
    const toR5 = (vb.connections || []).find((c) => c.to === 'ruta_5');
    const toVB = r5.connections.find((c) => c.to === 'villa_brontia');
    if (toR5) {
      assert.ok(toVB, 'la Ruta 5 debe conectar con Villa Brontia cuando esta conecta con ella');
      assert.equal(toVB.offset + toR5.offset, 0);
    }
  }
});

test('células: C028, C033 y C034 en su mapa y casilla; C029–C032 por guion', async () => {
  for (const c of B06_CELLS) {
    const reg = cellByKey(c.id);
    assert.ok(reg, c.id);
    assert.equal(reg.id, c.code);
    assert.equal(reg.map, c.map);
    const def = (await MAPS[c.map]()).default;
    const ev = def.events.find((e) => e.type === 'zygardeCell' && e.cell === c.id);
    assert.ok(ev, `${c.id}: evento en ${c.map}`);
    assert.deepEqual([ev.x, ev.y], [c.x, c.y]);
  }
  assert.deepEqual(COLECTOR_CELLS.map((k) => cellByKey(k).id), ['C029', 'C030', 'C031', 'C032']);
  for (const k of COLECTOR_CELLS) assert.ok(cellByKey(k).scripted);
});

test('entrenadores: equipos y niveles del guion', () => {
  const lv = (id) => TRAINERS[id].party.map((p) => `${p.species}:${p.level}`).join(',');
  assert.equal(lv('b06_casia'), 'SOLOSIS:23,MAGNEMITE:24,ELGYEM:25');
  assert.equal(lv('b06_abril'), 'EMOLGA:26,DRIFLOON:26,STARAVIA:27,CYCLIZAR:28');
  assert.equal(lv('b06_tecnico_puerta'), 'MAGNEMITE:22');
  assert.equal(lv('b06_tecnica_puerta'), 'SOLOSIS:22');
  const s = GameState.create({ name: 'P' });
  s.setVar('gael_starter', 'SOBBLE');
  assert.deepEqual(gaelAllyParty(s), [{ species: 'STARAVIA', level: 24 }, { species: 'DRIZZILE', level: 25 }]);
  s.setVar('gael_starter', 'TURTWIG');
  assert.equal(gaelAllyParty(s)[1].species, 'GROTLE');
});

test('encuentros: especies existentes y pesos que suman 100', () => {
  for (const [name, table] of Object.entries({
    day: RUTA_5.grassDay, night: RUTA_5.grassNight, meseta: MESETA_IMPULSO.grassDay, cave: GALERIAS_SOPLO.cave,
  })) {
    assert.equal(table.reduce((a, e) => a + e[0], 0), 100, name);
    for (const [, sp, min, max] of table) {
      assert.ok(db.species[sp], sp);
      assert.ok(min >= 20 && max <= 27 && min <= max, `${name} ${sp}`);
    }
  }
});

test('combate doble con aliado (dos técnicos contra jugador y Gael) se configura y termina', async () => {
  const party = [createPokemon(db, 'GROTLE', 30), createPokemon(db, 'LUXIO', 28)];
  const { config, meta } = buildBattleConfig({
    type: 'trainer', format: 'double', trainers: ['b06_tecnico_puerta', 'b06_tecnica_puerta'], seed: 11,
    ally: { name: 'Gael', party: [{ species: 'STARAVIA', level: 24 }, { species: 'TORRACAT', level: 25 }] },
    player: { name: 'P', party },
  }, { db, getTrainer: (id) => getTrainer(id, null) });
  assert.equal(config.format, 'double');
  assert.equal(config.opponent.length, 2);
  assert.equal(config.ally.party.length, 2);
  assert.equal(meta.trainerSprites.length, 2);
  const r = await new Battle(config, new HeadlessBattleUI({})).run();
  assert.ok(['win', 'lose'].includes(r.outcome));
  assert.equal(r.playerParty.length, 2, 'el resultado devuelve solo el equipo del jugador');
  assert.equal(r.allyParty.length, 2);
});

test('campanas: Norte larga, Este corta, Oeste corta → vendaval calmado; un golpe corto en la Norte da pista', async () => {
  const s = GameState.create({ name: 'P' });
  const bells = Object.fromEntries(bellEvents().map((e) => [e.bell, e]));
  const strike = async (bell, frames) => {
    let n = frames;
    const ctx = mockCtx(s, { world: { events: [], input: { held: () => n-- > 0 } } });
    await bells[bell].pages[0].script(ctx);
    return ctx.said;
  };
  let said = await strike('N', 2);
  assert.ok(said.some((t) => /sostener el golpe/.test(t)), 'pista del golpe largo');
  assert.equal(s.var(V.bellStep, 0), 0);
  said = await strike('N', LONG_FRAMES + 5);
  assert.equal(s.var(V.bellStep, 0), 1);
  await strike('E', 1);
  assert.equal(s.var(V.bellStep, 0), 2);
  said = await strike('W', 1);
  assert.ok(s.flag(F.bells), 'b06_campanas');
  assert.ok(said.some((t) => /suenan a la vez/.test(t)));
  // El pedestal responde tras las campanas y la Guardiana del tercer piso.
  const ped = pedestalEvent();
  assert.equal(ped.pages[0].when, undefined);
  assert.ok(!ped.pages[1].when(s));
  s.setFlag(F.abril);
  assert.ok(ped.pages[1].when(s));
});

test('encargo del pastor: dos Wooloo perdidas vuelven al redil y el pastor da su regalo', async () => {
  const s = GameState.create({ name: 'P' });
  const pastor = pastorEvent({ x: 1, y: 1 });
  let ctx = mockCtx(s);
  await pastor.script(ctx);
  assert.ok(ctx.said.some((t) => /Me faltan dos Wooloo/.test(t)));
  for (const n of [1, 2]) {
    const stray = woolooStray(n, { x: 0, y: 0 });
    assert.ok(stray.pages[0].when(s));
    await stray.pages[0].script(mockCtx(s));
    assert.ok(!stray.pages[0].when(s));
  }
  ctx = mockCtx(s);
  await pastor.script(ctx);
  assert.equal(s.itemCount(PASTOR_REWARD), 1);
  assert.ok(s.flag(F.woolooReward));
});

test('combates de guion: perder no quita dinero ni punto de cura; cura y devuelve a la casilla de reintento', async () => {
  const s = GameState.create({ name: 'P' });
  s.setHealPoint('villa_brontia', 4, 14, 2);
  for (const result of ['lose', 'win']) {
    const calls = { request: null, heal: 0, warp: null };
    const ctx = mockCtx(s, {
      map: { id: 'parque_eolico' },
      battle: async (req) => { calls.request = req; return result; },
      heal: () => { calls.heal += 1; },
      warp: async (...args) => { calls.warp = args; },
    });
    const out = await scriptedBattle(ctx, { trainer: 'b06_casia' }, { x: 35, y: 13, dir: 8 });
    assert.equal(out, result);
    assert.ok(calls.request.canLose && calls.request.rules.canLose && calls.request.rules.noMoneyLoss);
    assert.equal(calls.request.trainer, 'b06_casia');
    if (result === 'lose') {
      assert.equal(calls.heal, 1);
      assert.deepEqual(calls.warp, ['parque_eolico', 35, 13, 8]);
    } else {
      assert.equal(calls.heal, 0);
      assert.equal(calls.warp, null);
    }
  }
  assert.deepEqual(s.healPoint, { mapId: 'villa_brontia', x: 4, y: 14, dir: 2 }, 'el punto de cura del jugador no cambia');
});

test('entrenadores con frase posterior al P3: tercera página solo tras vencerlos y con el Pilar restaurado', () => {
  const ev = trainerLater({ id: 't', trainer: 'b06_mecanica_sonia', name: 'Sonia', sprite: 'anil:mecanica', x: 0, y: 0, after: 'antes' },
    (st) => st.flag(F.restored), 'después');
  assert.equal(ev.pages.length, 3);
  assert.equal(ev.trainer, 'b06_mecanica_sonia');
  const s = GameState.create({ name: 'P' });
  let beaten = false;
  const fakeEv = { selfSwitch: () => beaten };
  assert.ok(!ev.pages[2].when(s, fakeEv));
  beaten = true;
  assert.ok(!ev.pages[2].when(s, fakeEv));
  s.setFlag(F.restored);
  assert.ok(ev.pages[2].when(s, fakeEv));
});
