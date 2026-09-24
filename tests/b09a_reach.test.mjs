// Bloque 9a — Ruta 7, Ciudad Lúmina, Reserva del Delta y Museo de las Eras: alcanzabilidad a pie (docs/CAMPANA.md
// §2.5 puerta G6 y B09 parte A). BFS con la pasabilidad real del mundo (tiles + eventos sólidos + saltos de saliente):
//   · Ruta 7: el Paso del Derrumbe corta el valle hasta p4_restored; la vía no se pisa; C041 exige Terreno.
//   · Lúmina: la escalinata del museo no se sube sin pasar por Gael (B3); el museo por dentro, el sótano solo de
//     noche con T06 (el vigilante tapa la escalera).
//   · Reserva: sin permiso no se entra (la franja de la puerta lanza la escena); dentro se alcanzan la colmena y las
//     tres flores; la Reserva interior está cerrada por el enjambre hasta T07; la laguna exige Nadar.
//   · Ninguna casilla alcanzable es una trampa (desde todas se puede volver a la entrada) y todos los objetos,
//     células y entrenadores obligatorios se alcanzan con las capacidades de su momento.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { World } from '../game/src/world/world.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import { PASS, RAIL, PLATFORM, EXITS as R7 } from '../game/src/content/maps/b09a/ruta_7_layout.js';
import { SPOTS as LS, STAIRS, BUILDINGS, EXITS as LX } from '../game/src/content/maps/b09a/lumina_layout.js';
import { FENCE, RESERVE, FLOWERS, BRIDGES, SPOTS as RS, EXITS as RX } from '../game/src/content/maps/b09a/ruta_14_layout.js';
import { HALL, BASEMENT } from '../game/src/content/maps/b09a/museo_layout.js';
import { B09A_CELLS } from '../game/src/content/events/b09a_cells.js';

const DV = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };

/** Mundo con el estado pedido: flags, variables, capacidades de Zygarde y hora. */
async function worldFor(mapId, { flags = [], vars = {}, abilities = [], hour = 12, erase = [] } = {}) {
  const state = GameState.create({ name: 'Prueba' });
  for (const f of flags) state.setFlag(f);
  for (const [k, v] of Object.entries(vars)) state.setVar(k, v);
  for (const a of abilities) state.setZygardeAbility(a, true);
  if (hour !== 12) state.advanceMinutes(((hour - state.hour + 24) % 24) * 60);
  const { entry } = await buildMapNode(mapId);
  const world = new World({ state });
  world.setCurrent({ ...entry, events: null });
  for (const ev of world.events) if (erase.some((p) => String(ev.id).startsWith(p))) ev.erased = true;
  return { world, map: entry.map, state };
}

/** Pasos posibles desde (x, y): [nx, ny] (con salto de saliente). */
function steps(ctx, x, y, blocked) {
  const { world, map } = ctx;
  const p = world.player;
  const out = [];
  for (const d of [2, 4, 6, 8]) {
    let nx = x + DV[d][0];
    let ny = y + DV[d][1];
    if (!map.valid(nx, ny) || blocked.has(`${nx},${ny}`)) continue;
    p.x = x; p.y = y;
    if (!p.passable(x, y, d)) continue;
    if (map.terrainTagAt(nx, ny, 0).ledge) { nx += DV[d][0]; ny += DV[d][1]; }
    if (!map.valid(nx, ny)) continue;
    out.push([nx, ny]);
  }
  return out;
}

/** Casillas alcanzables desde `start`; `block` = casillas que se tratan como muro (disparadores de escenas). */
function reach(ctx, start, { block = [] } = {}) {
  const blocked = new Set(block.map(([x, y]) => `${x},${y}`));
  const seen = new Set([`${start[0]},${start[1]}`]);
  const queue = [start];
  const edges = new Map();
  while (queue.length) {
    const [x, y] = queue.shift();
    const next = steps(ctx, x, y, blocked);
    edges.set(`${x},${y}`, next.map(([a, b]) => `${a},${b}`));
    for (const [nx, ny] of next) {
      const k = `${nx},${ny}`;
      if (seen.has(k)) continue;
      seen.add(k);
      queue.push([nx, ny]);
    }
  }
  return { has: (x, y) => seen.has(`${x},${y}`), size: seen.size, seen, edges };
}

/** Casillas alcanzables desde las que NO se puede volver a `start` (trampas). */
function traps(r, start) {
  const rev = new Map();
  for (const [from, list] of r.edges) for (const to of list) { if (!rev.has(to)) rev.set(to, []); rev.get(to).push(from); }
  const back = new Set([`${start[0]},${start[1]}`]);
  const q = [`${start[0]},${start[1]}`];
  while (q.length) { const k = q.shift(); for (const f of rev.get(k) || []) if (!back.has(f)) { back.add(f); q.push(f); } }
  return [...r.seen].filter((k) => !back.has(k));
}

/** ¿Se puede usar algo en (x, y)? (pisándolo o mirándolo desde una vecina alcanzable) */
const canUse = (r, x, y) => r.has(x, y) || [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => r.has(x + dx, y + dy));
const strip = (x0, x1, y) => Array.from({ length: x1 - x0 + 1 }, (_, i) => [x0 + i, y]);
const P4 = ['p1_restored', 'p2_restored', 'p3_restored', 'p4_restored'];
const ZYG = ['run', 'ram', 'terrain'];

// ------------------------------------------------------------ Ruta 7
test('Ruta 7: el Paso del Derrumbe corta el valle hasta p4_restored (puerta G6)', async () => {
  const east = [R7.east.x - 2, R7.east.y0 + 1];
  const west = [2, R7.west.y0 + 1];
  const closed = reach(await worldFor('ruta_7', { abilities: ZYG, flags: ['b09_r7_llegada'] }), east);
  assert.ok(!closed.has(...west), 'sin p4_restored se llega de Estrato a Lúmina');
  assert.ok(!closed.has(PASS.x0 - 1, PASS.y0 + 2), 'sin p4_restored se cruza el Paso');
  const open = reach(await worldFor('ruta_7', { abilities: ZYG, flags: [...P4, 'b09_r7_llegada'] }), east);
  assert.ok(open.has(...west), 'con p4_restored el valle queda abierto');
  assert.deepEqual(traps(open, east), [], 'hay casillas sin vuelta en la Ruta 7');
});

test('Ruta 7: la vía no se pisa (salvo el paso a nivel) y el norte está cerrado', async () => {
  const west = [2, R7.west.y0 + 1];
  const r = reach(await worldFor('ruta_7', { abilities: ZYG, flags: [...P4, 'b09_r7_llegada'] }), west);
  for (let x = RAIL.x0; x <= RAIL.x1; x++) {
    if (RAIL.crossings.includes(x)) continue;
    assert.ok(!r.has(x, RAIL.y), `se puede andar por la vía en (${x},${RAIL.y})`);
  }
  assert.ok(r.has(RAIL.crossings[1], RAIL.y), 'el paso a nivel no se alcanza');
  for (let x = R7.north.x0; x <= R7.north.x1; x++) assert.ok(!r.has(x, 0), `el Mirador de la Calzada no está cerrado en x ${x}`);
});

test('Ruta 7: C041 bajo el andén exige Terreno complicado; entrenadores y objetos alcanzables', async () => {
  const west = [2, R7.west.y0 + 1];
  const c041 = B09A_CELLS.find((c) => c.code === 'C041');
  const noTerrain = reach(await worldFor('ruta_7', { abilities: ['run', 'ram'], flags: [...P4, 'b09_r7_llegada'] }), west);
  assert.ok(!canUse(noTerrain, c041.x, c041.y), 'C041 se coge sin Terreno');
  const ctx = await worldFor('ruta_7', { abilities: ZYG, flags: [...P4, 'b09_r7_llegada'] });
  const r = reach(ctx, west);
  assert.ok(r.has(c041.x, c041.y), 'C041 inalcanzable con Terreno');
  const items = ctx.world.events.filter((e) => e.def?.item || /^objeto_/.test(String(e.id)));
  assert.ok(items.length >= 4);
  for (const ev of items) assert.ok(canUse(r, ev.x, ev.y), `objeto ${ev.id} en (${ev.x},${ev.y}) inalcanzable`);
  const trainers = ctx.world.events.filter((e) => e.def?.trainer);
  assert.equal(trainers.length, 5);
  for (const ev of trainers) assert.ok(canUse(r, ev.x, ev.y), `entrenador ${ev.id} inalcanzable`);
  assert.ok(canUse(r, PLATFORM.sign.x, PLATFORM.sign.y), 'el cartel del apeadero no se lee');
});

// ------------------------------------------------------------ Lúmina
const LUMINA_IN = [LX.east.x - 1, LX.east.y0 + 1];
const GALA = ['b09_gala_invitacion', 'b09_gala', ...P4];

test('Lúmina: sin combatir con Gael (B3) no se sube la escalinata del museo', async () => {
  const d = BUILDINGS.museo.door;
  const trig = strip(LS.gaelTrigger.x0, LS.gaelTrigger.x1, LS.gaelTrigger.y);
  const blocked = reach(await worldFor('ciudad_lumina', { flags: GALA, abilities: ZYG }), LUMINA_IN, { block: trig });
  assert.ok(!canUse(blocked, d.x, d.y), 'se llega a la puerta del museo sin pasar por Gael');
  assert.ok(!blocked.has(STAIRS.x + 1, STAIRS.y + 1), 'se sube la escalinata sin pasar por Gael');
  const after = reach(await worldFor('ciudad_lumina', { flags: [...GALA, 'b09_gael_b3'], abilities: ZYG }), LUMINA_IN);
  assert.ok(canUse(after, d.x, d.y), 'tras el B3 la puerta del museo es accesible');
  assert.deepEqual(traps(after, LUMINA_IN), [], 'hay casillas sin vuelta en Lúmina');
});

test('Lúmina: puertas, salidas, parque, célula C042 y objetos alcanzables', async () => {
  const ctx = await worldFor('ciudad_lumina', { flags: [...GALA, 'b09_gael_b3'], abilities: ZYG });
  const r = reach(ctx, LUMINA_IN);
  for (const [k, b] of Object.entries(BUILDINGS)) if (b.door && ['centro', 'almacenes', 'hotel', 'guarderia', 'trastos', 'pasteleria', 'estacion'].includes(k)) {
    // Las puertas de Exterior2 no se pisan: se empujan desde la casilla de abajo (world.js activa el warp).
    assert.ok(r.has(b.door.x, b.door.y + 1), `puerta de ${k} en (${b.door.x},${b.door.y}) inalcanzable`);
  }
  for (let x = LX.south.x0; x <= LX.south.x1; x++) assert.ok(r.has(x, LX.south.y), `salida sur x ${x}`);
  assert.ok(r.has(LX.west.x, LX.west.y0 + 1), 'salida oeste (Ruta 8)');
  for (let x = LX.north.x0; x <= LX.north.x1; x++) assert.ok(!r.has(x, 0), 'la verja del Mirador Sur no cierra');
  const c042 = B09A_CELLS.find((c) => c.code === 'C042');
  assert.ok(r.has(c042.x, c042.y), 'C042 inalcanzable');
  const items = ctx.world.events.filter((e) => e.def?.item);
  assert.ok(items.some((e) => e.def.item === 'GALLADITE'), 'falta la Galladita');
  for (const ev of items) assert.ok(canUse(r, ev.x, ev.y), `objeto ${ev.id} inalcanzable`);
  assert.ok(canUse(r, LS.tutor.x, LS.tutor.y), 'tutor inalcanzable');
});

test('Museo: la escalera del personal solo se baja la noche de T06; el sótano se recorre entero', async () => {
  // Dos alas separadas por el mostrador: la izquierda (exposición y galería) y la derecha (taller y sótano).
  const leftIn = [19, 16];
  const rightIn = [28, 16];
  const tile = HALL.stairsDownTile;
  const day = reach(await worldFor('lumina_museo', { flags: GALA }), rightIn);
  assert.ok(!day.has(tile.x, tile.y), 'de día se baja al sótano (el vigilante no tapa la escalera)');
  const night = reach(await worldFor('lumina_museo', { flags: [...GALA, 'b09_t06_noche'], hour: 22 }), rightIn);
  assert.ok(night.has(tile.x, tile.y), 'de noche con T06 no se llega a la escalera del sótano');
  assert.ok(night.has(HALL.exits[1].x0, HALL.exits[1].y), 'el ala derecha no tiene salida');
  assert.deepEqual(traps(night, rightIn), [], 'hay casillas sin vuelta en el ala derecha');
  const left = reach(await worldFor('lumina_museo', { flags: [...GALA, 'b09_t06_noche'], hour: 22 }), leftIn);
  assert.ok(left.has(HALL.stairsUp.x, HALL.stairsUp.y), 'la escalera de la galería no se alcanza');
  assert.ok(left.has(HALL.exits[0].x0, HALL.exits[0].y), 'el ala izquierda no tiene salida');
  assert.deepEqual(traps(left, leftIn), [], 'hay casillas sin vuelta en el ala izquierda');
  const ctx = await worldFor('lumina_museo_taller', { flags: [...GALA, 'b09_t06_noche'], hour: 22 });
  const b = reach(ctx, [BASEMENT.arrival.x, BASEMENT.arrival.y]);
  for (const [x, y] of BASEMENT.pallets) assert.ok(canUse(b, x, y), `palé (${x},${y}) inalcanzable`);
  for (const p of [BASEMENT.scale, BASEMENT.ficha1962, BASEMENT.fichaLaguna]) assert.ok(canUse(b, p.x, p.y), `(${p.x},${p.y}) inalcanzable`);
  assert.ok(b.has(BASEMENT.stairsUp.x, BASEMENT.stairsUp.y), 'la escalera de subida no se alcanza');
  assert.ok(b.has(BASEMENT.dockEntry.x, BASEMENT.dockEntry.y), 'el muelle de carga no se alcanza');
  assert.deepEqual(traps(b, [BASEMENT.arrival.x, BASEMENT.arrival.y]), [], 'hay casillas sin vuelta en el sótano');
});

// ------------------------------------------------------------ Ruta 14 y Reserva
const R14_IN = [RX.north.x0 + 1, 1];
const gateStrip = () => { const out = []; for (let y = FENCE.gate.y0; y <= FENCE.gate.y1; y++) out.push([FENCE.x, y]); return out; };

test('Ruta 14: de Lúmina a Nexo a pie; sin permiso no se entra en la Reserva', async () => {
  const r = reach(await worldFor('ruta_14_reserva', { flags: GALA, abilities: ZYG }), R14_IN, { block: gateStrip() });
  for (let x = RX.south.x0; x <= RX.south.x1; x++) assert.ok(r.has(x, RX.south.y - 1), `no se llega al sur en x ${x}`);
  // Los brazos se cruzan por el tablero de las pasarelas, no por una franja de arena pintada sobre el agua.
  for (const b of BRIDGES) {
    for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + 3; x++) assert.ok(r.has(x, y), `pasarela (${x},${y}) no se pisa`);
    const mid = b.y + Math.floor(b.h / 2);
    assert.ok(!r.has(b.x - 1, mid) && !r.has(b.x + 3, mid), `junto a la pasarela de (${b.x},${b.y}) se anda sobre el agua`);
  }
  assert.ok(!r.has(RESERVE.hiveFront.x, RESERVE.hiveFront.y), 'se entra en la Reserva sin pasar por la puerta');
  assert.deepEqual(traps(r, R14_IN), [], 'hay casillas sin vuelta en la Ruta 14');
});

test('Reserva: con permiso se alcanzan la colmena y las tres flores; el interior espera a T07; la laguna, a Nadar', async () => {
  const inside = await worldFor('ruta_14_reserva', { flags: [...GALA, 'b09_ivan', 'b09_reserva_paso', 'b09_t07_colmena'], abilities: ZYG });
  const r = reach(inside, R14_IN);
  assert.ok(r.has(RESERVE.hiveFront.x, RESERVE.hiveFront.y), 'la colmena no se alcanza');
  for (const z of Object.values(FLOWERS)) assert.ok(canUse(r, z.good.x, z.good.y), `flor (${z.good.x},${z.good.y}) inalcanzable`);
  const [ix, iy] = RESERVE.interior;
  assert.ok(!r.has(ix + 3, iy + 2), 'se entra en la Reserva interior con el enjambre');
  const c043 = B09A_CELLS.find((c) => c.code === 'C043');
  assert.ok(canUse(r, c043.x, c043.y), 'C043 (huerto) inalcanzable');
  assert.ok(canUse(r, RS.applin.x, RS.applin.y), 'Applin inalcanzable');
  assert.ok(canUse(r, RS.honeyTree.x, RS.honeyTree.y), 'árbol de miel inalcanzable');
  const c071 = B09A_CELLS.find((c) => c.code === 'C071');
  assert.ok(!canUse(r, c071.x, c071.y), 'C071 (laguna) se coge sin Nadar');
  assert.deepEqual(traps(r, R14_IN), []);
  const open = reach(await worldFor('ruta_14_reserva', { flags: [...GALA, 'b09_reserva_paso', 'b09_t07_tablilla', 'b09_reserva_abierta'], abilities: ZYG }), R14_IN);
  assert.ok(open.has(ix + 3, iy + 2), 'tras T07 la Reserva interior sigue cerrada');
  const ctx = await worldFor('ruta_14_reserva', { flags: [...GALA, 'b09_reserva_paso', 'b09_t07_tablilla', 'b09_reserva_abierta'], abilities: ZYG });
  const all = reach(ctx, R14_IN);
  const items = ctx.world.events.filter((e) => e.def?.item);
  for (const ev of items) {
    if (ev.id === 'objeto_r14_5') continue; // islote de la laguna: con Nadar (etapa F)
    assert.ok(canUse(all, ev.x, ev.y), `objeto ${ev.id} inalcanzable`);
  }
  for (const ev of ctx.world.events.filter((e) => e.def?.trainer)) assert.ok(canUse(all, ev.x, ev.y), `entrenador ${ev.id} inalcanzable`);
});
