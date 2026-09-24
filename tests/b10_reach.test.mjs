// Bloque 10 — Pilar de la Memoria: alcanzabilidad a pie en los mapas (docs/CAMPANA.md §2.5: G7 niebla del
// Neblino hasta P5, Terreno y Trepar; puertas de historia del bloque). BFS con la pasabilidad real del mundo (tiles +
// eventos sólidos + saltos de saliente), con aristas extra para Trepar y el nado cuando la capacidad se da:
//   · Mnemos: la niebla cierra el camino del norte hasta el P5; la puerta del Archivo está cerrada hasta repartir las
//     notas; el risco de la Losa del Olvido solo se sube trepando; C074 solo se alcanza nadando; C045 y los objetos
//     de a pie, sí; no hay casillas trampa sin salida.
//   · Archivo de papel: de la entrada se llega a la escalera del Hondo rodeando a los técnicos.
//   · Archivo Hondo: cada estancia solo se abre con la anterior (Suelo Olvidado por el camino del custodio, Dos Manos,
//     Lectura, Rollos, Mural, Olvido); C046 está en el paso obligatorio; todo objeto se alcanza en su momento y
//     ninguna casilla alcanzable deja al jugador sin vuelta a la escalera.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { World } from '../game/src/world/world.js';
import { canSurfFreely } from '../game/src/world/terrain.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import {
  EXITS, FOG_WALL_Y, BUILDINGS, BAMBOO, POND, RISCO, ARRIVAL, INTERIOR_ENTRIES, HONEY_TREE,
} from '../game/src/content/maps/b10/mnemos_layout.js';
import { ARCHIVO_ROOM } from '../game/src/content/maps/b10/archivo_layout.js';
import {
  SUELO, MANOS, LECTURA, ROLLOS, MURAL, NUCLEO, ENTRY, FLOORS, HONDO_ITEMS, HONDO_TRAINERS, sueloTraps, rectCells,
} from '../game/src/content/maps/b10/hondo_layout.js';
import { F } from '../game/src/content/events/b10_common.js';

const DV = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };
const key = (x, y) => `${x},${y}`;

async function world(mapId, { flags = [], vars = {} } = {}) {
  const state = GameState.create({ name: 'Prueba' });
  for (const f of flags) state.setFlag(f);
  for (const [k, v] of Object.entries(vars)) state.setVar(k, v);
  const { entry } = await buildMapNode(mapId);
  const w = new World({ state });
  w.setCurrent({ ...entry, events: null });
  return { w, map: entry.map, p: w.player, state };
}

/**
 * Casillas alcanzables desde `start`. opts: block (casillas que se tratan como muro, p. ej. trampas o disparadores),
 * links ([[desde, hacia]…] aristas extra: Trepar), swim (se puede entrar al agua y nadar). Devuelve también las
 * aristas recorridas para la comprobación inversa (sin trampas sin salida).
 */
function bfs({ map, p }, start, { block = [], links = [], swim = false } = {}) {
  const blocked = new Set(block.map(([x, y]) => key(x, y)));
  const extra = new Map();
  for (const [a, b] of links) extra.set(key(...a), [...(extra.get(key(...a)) || []), b]);
  const water = (x, y) => canSurfFreely(map.terrainTagAt(x, y)) && !map.playerPassable(x, y, 0, {});
  const seen = new Set([key(...start)]);
  const edges = [];
  const queue = [start];
  while (queue.length) {
    const [x, y] = queue.shift();
    const next = [];
    for (const d of [2, 4, 6, 8]) {
      let nx = x + DV[d][0];
      let ny = y + DV[d][1];
      if (!map.valid(nx, ny) || blocked.has(key(nx, ny))) continue;
      p.x = x; p.y = y;
      p.surfing = water(x, y);
      let ok = p.passable(x, y, d);
      if (!ok && swim && !p.surfing && water(nx, ny)) { p.surfing = true; ok = p.passable(x, y, d); }
      if (!ok && p.surfing) { p.surfing = false; ok = map.playerPassable(nx, ny, 10 - d, {}) && p.passable(x, y, d); }
      if (!ok) continue;
      if (!p.surfing && map.terrainTagAt(nx, ny, 0).ledge) { nx += DV[d][0]; ny += DV[d][1]; }
      next.push([nx, ny]);
    }
    for (const t of extra.get(key(x, y)) || []) next.push(t);
    for (const [nx, ny] of next) {
      if (!map.valid(nx, ny) || blocked.has(key(nx, ny))) continue;
      edges.push([key(x, y), key(nx, ny)]);
      if (seen.has(key(nx, ny))) continue;
      seen.add(key(nx, ny));
      queue.push([nx, ny]);
    }
  }
  return { has: (x, y) => seen.has(key(x, y)), size: seen.size, seen, edges };
}

/** Casillas alcanzadas desde las que NO se puede volver a `home` (trampas sin salida). */
function dead(r, home) {
  const back = new Map();
  for (const [a, b] of r.edges) back.set(b, [...(back.get(b) || []), a]);
  const ok = new Set([key(...home)]);
  const queue = [key(...home)];
  while (queue.length) {
    const k = queue.shift();
    for (const a of back.get(k) || []) if (!ok.has(a)) { ok.add(a); queue.push(a); }
  }
  return [...r.seen].filter((k) => !ok.has(k));
}

/** ¿Se puede coger/usar algo en (x, y)? (pisándolo o desde una vecina alcanzable) */
const canUse = (r, x, y) => r.has(x, y) || [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => r.has(x + dx, y + dy));

// ───────────────────────────── Aldea Mnemos ─────────────────────────────

const START = [ARRIVAL.x, ARRIVAL.y];
const ENTERED = [F.arrival];
/** Trepar: la pared con vetas (desde su pie hasta lo alto) y la bajada (de lo alto a su pie). */
const CLIMB = [[[RISCO.wall.x, RISCO.wall.y + 1], RISCO.wall.top], [[RISCO.down.x, RISCO.down.y - 1], RISCO.down.bottom]];

test('Mnemos: la niebla cierra el camino del norte hasta el P5 (G7)', async () => {
  const before = bfs(await world('aldea_mnemos', { flags: ENTERED }), START);
  for (let x = EXITS.north.x0; x <= EXITS.north.x1; x++) {
    assert.ok(before.has(x, FOG_WALL_Y + 1), `(${x},${FOG_WALL_Y + 1}) al pie del muro de niebla alcanzable`);
    assert.ok(!before.has(x, FOG_WALL_Y - 1), `sin el P5 se cruza la niebla en x ${x}`);
    assert.ok(!before.has(x, EXITS.north.y), `sin el P5 se llega al borde norte en x ${x}`);
  }
  const after = bfs(await world('aldea_mnemos', { flags: [...ENTERED, F.restored] }), START);
  assert.ok(after.has(EXITS.north.x0, EXITS.north.y), 'tras el P5 el camino del norte llega al borde');
  assert.ok(after.has(EXITS.south.x0, EXITS.south.y), 'el borde sur (Marisma) sigue abierto');
});

test('Mnemos: la puerta del Archivo solo se abre tras repartir las notas', async () => {
  const d = BUILDINGS.archivo.door;
  const closed = await world('aldea_mnemos', { flags: ENTERED });
  const ev = closed.w.events.find((e) => e.id === 'puerta_archivo');
  assert.ok(ev && ev.page && ev.solid && ev.trigger === 'touch', 'sin notas, un evento sólido tapa la puerta (su guion no lleva al Archivo)');
  assert.equal(ev.x, d.x); assert.equal(ev.y, d.y);
  const r = bfs(closed, START);
  assert.ok(!r.has(d.x, d.y), 'no se puede pisar el warp del Archivo con la puerta cerrada');
  assert.ok(canUse(r, d.x, d.y), 'la puerta se alcanza para leer el aviso');
  const open = await world('aldea_mnemos', { flags: [...ENTERED, F.olvidoMet, F.notes, F.archivoOpen] });
  const ev2 = open.w.events.find((e) => e.id === 'puerta_archivo');
  assert.ok(ev2.through && !ev2.solid, 'con el Archivo abierto la puerta deja pasar');
  assert.ok(bfs(open, START).has(d.x, d.y) || canUse(bfs(open, START), d.x, d.y), 'la puerta del Archivo es alcanzable');
  // El Archivo de papel solo tiene la entrada de la aldea; el Hondo, la escalera del Archivo de papel.
  const def = (await buildMapNode('aldea_mnemos')).def;
  assert.equal(def.warps.filter((w) => w.to === 'mnemos_archivo').length, 1);
});

test('Mnemos: el risco de la Losa del Olvido solo se sube trepando; C074 solo nadando', async () => {
  const m = await world('aldea_mnemos', { flags: [...ENTERED, F.restored] });
  const onFoot = bfs(m, START);
  const losa = RISCO.losa.event;
  assert.ok(!canUse(onFoot, losa.x, losa.y), 'a pie se llega a la Losa del Olvido');
  assert.ok(!canUse(onFoot, RISCO.item.x, RISCO.item.y), 'a pie se coge el objeto del risco');
  assert.ok(onFoot.has(RISCO.wall.x, RISCO.wall.y + 1), 'el pie de la pared con vetas es alcanzable');
  const climbing = bfs(m, START, { links: CLIMB });
  assert.ok(canUse(climbing, losa.x, losa.y), 'trepando se llega a la Losa');
  assert.ok(canUse(climbing, RISCO.item.x, RISCO.item.y), 'trepando se coge el objeto del risco');
  assert.deepEqual(dead(climbing, START), [], 'el risco tiene bajada (Trepar hacia abajo)');
  const islet = POND.islet;
  assert.ok(!canUse(onFoot, islet.x, islet.y), 'C074 (etapa F) se alcanza sin Nadar');
  assert.ok(bfs(m, START, { swim: true }).has(islet.x, islet.y), 'nadando se llega al islote de C074');
});

test('Mnemos: C045, objetos, entrenadores, vecinos y puertas alcanzables; sin trampas sin salida', async () => {
  const m = await world('aldea_mnemos', { flags: [...ENTERED, F.olvidoMet, F.notes, F.archivoOpen] });
  const r = bfs(m, START);
  assert.ok(r.has(BAMBOO.clearing.x, BAMBOO.clearing.y), 'el claro del bambú (C045) se alcanza a pie');
  for (const ev of m.w.events) {
    const id = String(ev.id);
    if (!ev.page) continue;
    if (/^objeto_mnemos/.test(id) || ev.def?.trainer || /^(fausta|bruno|pancham|nerea|monje|pescador|vecin|olvido_plaza|cartel_)/.test(id)) {
      assert.ok(canUse(r, ev.x, ev.y), `${id} en (${ev.x},${ev.y}) inalcanzable`);
    }
  }
  assert.ok(canUse(r, HONEY_TREE.trunk.x, HONEY_TREE.trunk.y), 'el árbol de miel se alcanza');
  for (const w of (await buildMapNode('aldea_mnemos')).def.warps) assert.ok(canUse(r, w.x, w.y), `puerta → ${w.to} en (${w.x},${w.y}) inalcanzable`);
  assert.ok(canUse(r, BUILDINGS.iker.door.x, BUILDINGS.iker.door.y), 'la puerta de la casa de Íker (T09, B11) se alcanza');
  assert.deepEqual(dead(r, START), [], 'casillas sin vuelta a la entrada');
});

// ───────────────────────────── Archivo de papel ─────────────────────────────

test('Archivo de papel: de la entrada a la escalera del Hondo, rodeando a los técnicos', async () => {
  const a = await world('mnemos_archivo', { flags: [F.archivoOpen, F.casia, F.olvidoDown] });
  const r = bfs(a, [ARCHIVO_ROOM.entry.x, ARCHIVO_ROOM.entry.y]);
  assert.ok(canUse(r, ARCHIVO_ROOM.stairsWarp.x, ARCHIVO_ROOM.stairsWarp.y), 'la escalera del Hondo se alcanza');
  for (const id of ['tecnico_archivo', 'tecnica_archivo']) {
    const ev = a.w.events.find((e) => e.id === id);
    assert.ok(canUse(r, ev.x, ev.y), `${id} se alcanza`);
  }
  assert.deepEqual(dead(r, [ARCHIVO_ROOM.entry.x, ARCHIVO_ROOM.entry.y]), []);
});

// ───────────────────────────── Archivo Hondo ─────────────────────────────

const HOME = [ENTRY.arrival.x, ENTRY.arrival.y];
const TRAPS = sueloTraps();
const DOWN = [F.olvidoDown];
/** Flags acumulados de cada estancia resuelta. */
const STAGES = [F.suelo, F.manos, F.lectura, F.rollos, F.mural, F.olvido];
const upTo = (n) => [...DOWN, ...STAGES.slice(0, n)];
const hondo = (flags) => world('archivo_hondo', { flags });
const inside = (r, rect) => rectCells(rect).some(([x, y]) => r.has(x, y));

test('Estancia 1: el Suelo Olvidado solo se cruza por el camino del custodio', async () => {
  const h = await hondo(DOWN);
  const safe = bfs(h, HOME, { block: TRAPS });
  assert.ok(safe.has(SUELO.exit.x, SUELO.exit.y), 'por el camino del custodio se llega a la salida');
  const noPath = bfs(h, HOME, { block: [...TRAPS, ...SUELO.path] });
  assert.ok(!noPath.has(SUELO.exit.x, SUELO.exit.y), 'hay otro camino sin pisar el del custodio');
  // Cada trampa devuelve al borde del rellano (evento de contacto): ninguna casilla trampa queda sin salida.
  for (const [x, y] of TRAPS) {
    const ev = h.w.events.find((e) => e.id === `suelo_trampa_${x}_${y}`);
    assert.ok(ev && ev.trigger === 'touch' && ev.through, `trampa (${x},${y}) sin evento de caída`);
  }
  assert.ok(safe.has(SUELO.start.x, SUELO.start.y), 'el punto de vuelta tras caer es alcanzable');
});

test('Hondo: cada estancia solo se abre con la anterior (Dos Manos → Lectura → Rollos → Mural → Olvido)', async () => {
  const checks = [
    { stage: 1, room: FLOORS.lectura, what: 'la Estancia de la Lectura', gate: 'Dos Manos' },
    { stage: 2, room: FLOORS.rollos, what: 'la Estancia de los Rollos', gate: 'la puerta glífica' },
    { stage: 3, room: FLOORS.mural, what: 'la Sala del Mural', gate: 'los Rollos' },
    { stage: 4, room: FLOORS.pasillo56b, what: 'el pasillo de la Cámara del núcleo', gate: 'el Mural' },
  ];
  for (const c of checks) {
    const shut = bfs(await hondo(upTo(c.stage)), HOME, { block: TRAPS });
    assert.ok(!inside(shut, c.room), `se llega a ${c.what} sin resolver ${c.gate}`);
    const open = bfs(await hondo(upTo(c.stage + 1)), HOME, { block: TRAPS });
    assert.ok(inside(open, c.room), `resuelto ${c.gate}, ${c.what} sigue cerrada`);
  }
  // Olvido tapa la antesala: sin vencerla no se llega al pedestal; vencida, sí.
  const P = NUCLEO.front;
  assert.ok(!bfs(await hondo(upTo(5)), HOME, { block: TRAPS }).has(P.x, P.y), 'se llega al núcleo sin combatir con Olvido');
  assert.ok(bfs(await hondo(upTo(6)), HOME, { block: TRAPS }).has(P.x, P.y), 'vencida Olvido, el núcleo sigue cerrado');
});

test('Hondo: C046 está en el paso obligatorio de los Rollos al Mural', async () => {
  const h = await hondo(upTo(4));
  const r = bfs(h, HOME, { block: TRAPS });
  assert.ok(r.has(ROLLOS.cell.x, ROLLOS.cell.y), 'C046 alcanzable tras los Rollos');
  const skip = bfs(h, HOME, { block: [...TRAPS, [ROLLOS.cell.x, ROLLOS.cell.y]] });
  assert.ok(!inside(skip, FLOORS.mural), 'se llega al Mural sin pasar por C046');
});

test('Hondo: palancas, estela, puerta, huecos, paneles, manantial, objetos y entrenadores alcanzables a su tiempo', async () => {
  const at = async (n) => bfs(await hondo(upTo(n)), HOME, { block: TRAPS });
  const r1 = await at(1);
  for (const l of MANOS.levers) assert.ok(canUse(r1, l.x, l.y), `palanca (${l.x},${l.y})`);
  assert.ok(r1.has(MANOS.losa.x, MANOS.losa.y), 'losa de las Dos Manos');
  const r2 = await at(2);
  assert.ok(r2.has(LECTURA.losa.x, LECTURA.losa.y) && canUse(r2, LECTURA.door.x, LECTURA.door.y), 'losa y puerta glífica');
  const r3 = await at(3);
  for (const c of ROLLOS.cubbies) assert.ok(canUse(r3, c.x, c.y), `hueco (${c.x},${c.y})`);
  assert.ok(r3.has(ROLLOS.losa.x, ROLLOS.losa.y) && canUse(r3, ROLLOS.basket.x, ROLLOS.basket.y), 'losa y cesta de los Rollos');
  const r4 = await at(4);
  for (const pnl of MURAL.panels) assert.ok(canUse(r4, pnl.x, pnl.y), `panel (${pnl.x},${pnl.y})`);
  assert.ok(MURAL.springUse.some(([x, y]) => r4.has(x, y)), 'manantial');
  const all = await at(6);
  for (const it of HONDO_ITEMS) assert.ok(canUse(all, it.x, it.y), `objeto ${it.id} (${it.x},${it.y})`);
  for (const t of HONDO_TRAINERS) assert.ok(canUse(all, t.x, t.y), `entrenador ${t.id}`);
  assert.deepEqual(dead(all, HOME), [], 'casillas sin vuelta a la escalera');
  assert.ok(canUse(all, NUCLEO.stairsUp.x, NUCLEO.stairsUp.y - 2), 'escalera de los custodios');
});

test('Hondo: los interiores de Mnemos tienen salida desde su llegada', async () => {
  for (const [id, e] of Object.entries(INTERIOR_ENTRIES)) {
    const m = await world(id);
    const r = bfs(m, [e.x, e.y]);
    const exits = (await buildMapNode(id)).def.warps.filter((w) => w.to === 'aldea_mnemos');
    assert.ok(exits.length > 0, `${id} sin salida a la aldea`);
    assert.ok(exits.some((w) => r.has(w.x, w.y) || canUse(r, w.x, w.y)), `${id}: la salida no se alcanza`);
  }
});
