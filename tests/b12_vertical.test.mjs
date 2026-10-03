// P6 vertical (X36): tres pisos de puzzles, sin combate; descensos y guardados existentes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { World } from '../game/src/world/world.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import { F, EXT } from '../game/src/content/events/b12_common.js';
import { VESTIBULO, MIRADA, SUMIDERO } from '../game/src/content/maps/b12/layout.js';
import { FACET_ROOM_IDS, facetMapId, facetRoom, MARGIN } from '../game/src/content/maps/b12/rooms.js';
import { facetMasks, isVoidCell, ANCHOR_VAR, decodeAnchor } from '../game/src/world/impossible/logic.js';
import { ImpossibleField } from '../game/src/world/impossible/field.js';
import { extraTiles } from '../game/src/content/stamps/extraTiles.js';

const FLOORS = [
  ['pilar_invertido', 1],
  ...FACET_ROOM_IDS.flatMap((id) => [[facetMapId(id, 0), 1], [facetMapId(id, 1), 1]]),
  ['pilar_invertido_mirada', 2], ['pilar_invertido_sumidero', 3], ['pilar_invertido_nucleo', 3],
];

function context(state = GameState.create({ name: 'Prueba' })) {
  const warps = [];
  const ctx = {
    state, warps, flag: (f) => state.flag(f), setFlag: (f, value = true) => state.setFlag(f, value),
    say: async () => {}, se: () => {},
    warp: async (...args) => { warps.push(args); },
  };
  return ctx;
}

async function event(map, id) {
  const { def } = await buildMapNode(map);
  const ev = def.events.find((e) => e.id === id);
  assert.ok(ev, `${map}: ${id}`);
  return ev;
}

test('P6: exactamente tres pisos de Cara Vuelta, Mirada y Sumidero/sello, sin Pokémon ni Guardián', async () => {
  for (const [id, floor] of FLOORS) {
    const { def, warnings } = await buildMapNode(id);
    assert.deepEqual(def.pillar, { id: 'P6', floor }, id);
    assert.deepEqual(warnings, [], `${id}: construcción limpia`);
    assert.ok(!def.encounters && !def.encounterZones?.length, `${id}: sin encuentros`);
    assert.ok(!def.events.some((e) => e.trainer || e.type === 'pokemon' || e.type === 'wildPokemon'), `${id}: solo puzzles`);
  }
});

test('P6: el ascenso del primer piso exige resolver Cara Vuelta; las partidas restauradas pueden revisitar', async () => {
  const up = await event('pilar_invertido', 'b12_subida_mirada');
  const ctx = context();
  await up.script(ctx);
  assert.equal(ctx.warps.length, 0, 'sin Cara Vuelta no se salta el puzzle');
  ctx.state.setFlag(F.caraVueltaHecha);
  await up.script(ctx);
  assert.deepEqual(ctx.warps[0].slice(0, 4), ['pilar_invertido_mirada', MIRADA.start.x, MIRADA.start.y, MIRADA.start.dir]);
  const old = context();
  old.state.setFlag(EXT.restored);
  await up.script(old);
  assert.equal(old.warps[0][0], 'pilar_invertido_mirada', 'restauración anterior basta para volver a subir');
});

test('P6: descender por cada escalera es posible antes de restaurar y llega fuera del paso de ascenso', async () => {
  const cases = [
    ['pilar_invertido_mirada', 'b12_baja_cara', 'pilar_invertido', VESTIBULO.portalCara],
    ['pilar_invertido_sumidero', 'b12_baja_mirada', 'pilar_invertido_mirada', MIRADA.exit],
    ['pilar_invertido_nucleo', 'b12_vuelve_sumidero', 'pilar_invertido_sumidero', SUMIDERO.exit],
  ];
  for (const [map, id, target, up] of cases) {
    const ev = await event(map, id);
    const { entry } = await buildMapNode(map);
    assert.ok(!isVoidCell(entry.map, ev.x, ev.y), `${id}: escalera sobre piedra`);
    const ctx = context();
    await ev.script(ctx);
    assert.equal(ctx.warps[0][0], target);
    const [, x, y] = ctx.warps[0];
    const { entry: arrival } = await buildMapNode(target);
    assert.ok(!isVoidCell(arrival.map, x, y), `${id}: llegada sobre piedra`);
    assert.notDeepEqual([x, y], [up.x, up.y], `${id}: sin rebote al piso superior`);
    assert.ok(!ctx.state.flag(EXT.restored), 'bajar no restaura ni concede recompensas');
    if (map === 'pilar_invertido_nucleo') {
      // Las cascadas solo suben: una llegada en la isla alta quedaría atrapada en su propia Ancla.
      const world = new World({ state: ctx.state });
      world.setCurrent({ ...arrival, events: null });
      const seen = new Set([`${x},${y}`]);
      const q = [[x, y]];
      for (let i = 0; i < q.length; i++) for (const [d, dx, dy] of [[2, 0, 1], [4, -1, 0], [6, 1, 0], [8, 0, -1]]) {
        const [cx, cy] = q[i];
        const [nx, ny] = [cx + dx, cy + dy];
        const key = `${nx},${ny}`;
        if (seen.has(key) || isVoidCell(arrival.map, nx, ny) || !world.player.passable(cx, cy, d)) continue;
        seen.add(key); q.push([nx, ny]);
      }
      const down = arrival.def.events.find((e) => e.id === 'b12_baja_mirada');
      assert.ok(seen.has(`${down.x},${down.y}`), 'desde el sello se alcanza el descenso al segundo piso sin depender de una Ancla anterior');
    }
  }
});

test('P6: volver al sello desde el rellano del Sumidero exige haber completado sus cascadas', async () => {
  const up = await event('pilar_invertido_sumidero', 'b12_subida_sello');
  const ctx = context();
  await up.script(ctx);
  assert.equal(ctx.warps.length, 0, 'sin completar el Sumidero no se salta C053 ni las cascadas');
  ctx.state.setFlag(F.sumideroHecho);
  await up.script(ctx);
  assert.equal(ctx.warps[0][0], 'pilar_invertido_nucleo', 'permite volver después de bajar del sello');
  const old = context();
  old.state.setFlag(EXT.restored);
  await up.script(old);
  assert.equal(old.warps[0][0], 'pilar_invertido_nucleo', 'las partidas restauradas pueden revisitar aunque falte el flag de paso');
});

test('P6: guardados de Cara Vuelta, también girados, conservan suelo y una salida de vuelta al primer piso', async () => {
  for (const id of FACET_ROOM_IDS) for (const orient of [0, 1]) {
    const map = facetMapId(id, orient);
    const { def, entry } = await buildMapNode(map);
    const room = facetRoom(id);
    const mask = facetMasks(room, orient, MARGIN);
    const [x, y] = mask.map(room.start.x, room.start.y);
    assert.ok(!isVoidCell(entry.map, x, y), `${map}: la llegada histórica sigue firme`);
    const back = def.events.find((e) => e.id === 'b12_cara_regreso');
    assert.ok(back, `${map}: regreso legible aunque se pierda la orientación`);
    assert.deepEqual([back.x, back.y], [x, y]);
    assert.equal(back.trigger, 'action', 'el regreso no interrumpe la llegada ni los giros');
    const ctx = context();
    await back.script(ctx);
    assert.equal(ctx.warps[0][0], 'pilar_invertido');
  }
});

test('P6: los descensos renuevan el punto seguro; las Anclas guardadas en los gemelos siguen válidas', async () => {
  const state = GameState.create({ name: 'Prueba' });
  const world = new World({ state });
  const field = new ImpossibleField({ state, world, transferring: false });
  for (const [map, x, y] of [['pilar_invertido_sumidero', 16, 42], ['pilar_invertido_mirada', 25, 5], ['pilar_invertido', 37, 19]]) {
    const { entry } = await buildMapNode(map);
    world.setCurrent({ ...entry, events: null });
    world.player.moveTo(x, y);
    field.onEnterMap(world.current);
    assert.deepEqual([decodeAnchor(state.var(ANCHOR_VAR)).map, decodeAnchor(state.var(ANCHOR_VAR)).x, decodeAnchor(state.var(ANCHOR_VAR)).y], [map, x, y]);
  }
  const { entry } = await buildMapNode('pilar_invertido_cara_2');
  const room = facetRoom('cara_2');
  const [ax, ay] = facetMasks(room, 1, MARGIN).map(room.start.x, room.start.y);
  const oldAnchor = `pilar_invertido_cara_2_giro|${ax}|${ay}|2`;
  state.setVar(ANCHOR_VAR, oldAnchor);
  world.setCurrent({ ...entry, events: null });
  field.onEnterMap(world.current);
  assert.equal(state.var(ANCHOR_VAR), oldAnchor, 'un guardado en el gemelo conserva su Ancla');
});

test('P6: columna visible detrás del brocal solo en B12, sin base sólida ni cambios al prólogo', async () => {
  const { entry } = await buildMapNode('montana_portal');
  const state = GameState.create({ name: 'Prueba' });
  const world = new World({ state });
  world.setCurrent({ ...entry, events: null });
  const column = world.events.find((e) => e.id === 'b12_columna_exterior');
  assert.ok(column, 'columna ligada a las páginas de la partida');
  const tiles = extraTiles('Exterior1').filter((t) => t.name === 'pilar_torre' && t.dy < 8);
  assert.equal(tiles.length, 56, 'tres pisos visibles, sin las filas de base y puerta');
  const before = tiles.map((t) => entry.map.passableStrict(14 + t.dx, t.dy));
  assert.ok(tiles.every((t) => entry.map.data(14 + t.dx, t.dy, 2) !== t.id), 'el prólogo conserva el estrado del aljibe');
  state.setFlag('b01_left_town');
  state.setFlag('p5_restored');
  world.refreshEvents();
  for (const t of tiles) assert.equal(entry.map.data(14 + t.dx, t.dy, 2), t.id, 'la columna se ve al volver para P6');
  assert.deepEqual(tiles.map((t) => entry.map.passableStrict(14 + t.dx, t.dy)), before, 'no introduce colisiones');
  assert.ok(entry.map.passableStrict(20, 11), 'el nodo postgame conserva su casilla');
});
