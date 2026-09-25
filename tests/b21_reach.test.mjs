// Bloque 21 — Final: alcanzabilidad a pie (docs/CAMPANA.md B21; §2.5 puerta G17). BFS con la pasabilidad real del
// mundo (tiles + eventos sólidos + saltos de saliente), como tests/b06_reach.test.mjs:
//   · Columna Lanza: nunca se pisa el vacío (topes en todo el borde); a la cumbre solo se sube por la franja de la
//     pregunta de Zygarde (no se salta); desde cualquier casilla alcanzable se vuelve al nodo (sin casillas trampa);
//     objetos, manantial, estela, zócalos, altar y punto de retirada alcanzables.
//   · Nodo del Origen (maqueta) y epílogo: las casillas de las escenas de Villa Alba, la casa de Gael y el salón están
//     unidas a pie; las tomas del montaje colocan a cada Guardián en suelo pisable de su Pilar.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { World } from '../game/src/world/world.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import { MAPS } from '../game/src/content/maps/index.js';
import { COLUMNA, SOCKETS, isFloor, floorCells, W, H } from '../game/src/content/maps/b21/layout.js';
import { DEV_NODE } from '../game/src/content/maps/b21/dev_nodo_origen.js';
import { EPI } from '../game/src/content/events/b21_epilogo.js';
import { MONTAGE_SHOTS } from '../game/src/content/events/b21_cine.js';
import { F } from '../game/src/content/events/b21_common.js';

const DV = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };
const key = (x, y) => `${x},${y}`;

/** Mundo con el mapa cargado y los flags dados (páginas de eventos según ese estado). */
async function worldFor(mapId, flags = []) {
  const state = GameState.create({ name: 'Prueba' });
  for (const f of flags) state.setFlag(f);
  const { entry } = await buildMapNode(mapId);
  const world = new World({ state });
  world.setCurrent({ ...entry, events: null });
  return { world, map: entry.map };
}

/** Casillas alcanzables desde `start` (block: casillas tratadas como muro). */
function reachFrom(world, map, start, { block = [] } = {}) {
  const blocked = new Set(block.map(([x, y]) => key(x, y)));
  const p = world.player;
  const seen = new Set([key(...start)]);
  const queue = [start];
  while (queue.length) {
    const [x, y] = queue.shift();
    for (const d of [2, 4, 6, 8]) {
      let nx = x + DV[d][0];
      let ny = y + DV[d][1];
      if (!map.valid(nx, ny) || blocked.has(key(nx, ny))) continue;
      p.x = x; p.y = y;
      if (!p.passable(x, y, d)) continue;
      if (map.terrainTagAt(nx, ny, 0).ledge) { nx += DV[d][0]; ny += DV[d][1]; }
      const k = key(nx, ny);
      if (!map.valid(nx, ny) || seen.has(k)) continue;
      seen.add(k);
      queue.push([nx, ny]);
    }
  }
  return { has: (x, y) => seen.has(key(x, y)), cells: [...seen].map((k) => k.split(',').map(Number)), size: seen.size };
}

async function reach(mapId, start, { flags = [], block = [] } = {}) {
  const { world, map } = await worldFor(mapId, flags);
  return { ...reachFrom(world, map, start, { block }), world, map };
}

const canUse = (r, x, y) => r.has(x, y) || [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => r.has(x + dx, y + dy));

// ───────────────────────────── Columna Lanza ─────────────────────────────

const ARRIVED = [F.jumpDone, F.lanzaArrival, F.p10Restored];
const START = [COLUMNA.arrival.x, COLUMNA.arrival.y];

test('Columna Lanza: el vacío no se pisa nunca (topes en todo el borde) y el mapa mide 30×40', async () => {
  const r = await reach('columna_lanza', START, { flags: ARRIVED });
  assert.equal(W, 30);
  assert.equal(H, 40);
  const outside = r.cells.filter(([x, y]) => !isFloor(x, y));
  assert.deepEqual(outside, [], `casillas de vacío alcanzables: ${JSON.stringify(outside.slice(0, 6))}`);
  assert.ok(r.size > 250, `superficie pisable pequeña (${r.size})`);
});

test('Columna Lanza: a la cumbre solo se llega por la franja de la pregunta de Zygarde (no se puede saltar)', async () => {
  const q = COLUMNA.question;
  const strip = [];
  for (let x = q.x0; x <= q.x1; x++) strip.push([x, q.y]);
  const walled = await reach('columna_lanza', START, { flags: ARRIVED, block: strip });
  assert.ok(!walled.has(COLUMNA.flute.x, COLUMNA.flute.y), 'se llega al altar sin pisar la franja');
  for (const s of SOCKETS) assert.ok(!walled.has(s.x, s.y), `zócalo ${s.k} alcanzable sin pasar por la pregunta`);
  const open = await reach('columna_lanza', START, { flags: ARRIVED });
  assert.ok(open.has(COLUMNA.flute.x, COLUMNA.flute.y), 'el sitio de la Flauta es alcanzable');
  assert.ok(!open.has(COLUMNA.arceus.x, COLUMNA.arceus.y), 'Arceus ocupa su casilla (sólido)');
  for (const x of [q.x0, q.x1]) assert.ok(open.has(x, q.y), `la franja cubre la escalinata (${x})`);
});

test('Columna Lanza: sin casillas trampa (desde cualquier casilla alcanzable se vuelve al nodo)', async () => {
  const { world, map } = await worldFor('columna_lanza', ARRIVED);
  const all = reachFrom(world, map, START);
  for (const [x, y] of all.cells) {
    const back = reachFrom(world, map, [x, y]);
    assert.ok(back.has(...START), `(${x},${y}) no vuelve al nodo`);
  }
});

test('Columna Lanza: objetos, manantial, estela, zócalos, altar y retirada alcanzables', async () => {
  const r = await reach('columna_lanza', START, { flags: ARRIVED });
  for (const it of COLUMNA.items) assert.ok(canUse(r, it.x, it.y), `objeto ${it.item} en (${it.x},${it.y}) inalcanzable`);
  const s = COLUMNA.spring;
  assert.ok(canUse(r, s.x + s.w, s.y + 1), 'manantial');
  assert.ok(canUse(r, COLUMNA.chronicle.x, COLUMNA.chronicle.y + 1), 'estela de la Crónica');
  for (const z of SOCKETS) assert.ok(r.has(z.x, z.y), `zócalo ${z.k} (${z.x},${z.y})`);
  assert.ok(r.has(COLUMNA.retreat.x, COLUMNA.retreat.y), 'punto de retirada');
  assert.ok(r.has(COLUMNA.node.cx, COLUMNA.node.cy), 'nodo');
  const events = r.world.events.filter((e) => e.def?.type === 'item');
  assert.equal(events.length, COLUMNA.items.length);
  for (const [x, y] of floorCells()) assert.ok(x >= 0 && y >= 0 && x < W && y < H);
});

test('Columna Lanza: los objetos están en suelo libre y cada arista apoya la base en el enlosado', async () => {
  const { map } = await worldFor('columna_lanza', ARRIVED);
  for (const it of COLUMNA.items) {
    assert.ok(isFloor(it.x, it.y), `${it.item} en (${it.x},${it.y}) fuera del enlosado`);
    assert.ok(map.playerPassable(it.x, it.y, 2, {}), `${it.item} en (${it.x},${it.y}) encima de una pieza que bloquea`);
  }
  for (const c of COLUMNA.crystals) assert.ok(isFloor(c.x, c.y + 1), `arista (${c.x},${c.y}) con la base en el vacío`);
});

// ───────────────────────────── Nodo del Origen (maqueta) ─────────────────────────────

test('maqueta del Nodo del Origen: el hexágono es alcanzable y se usa desde encima', async () => {
  const r = await reach('dev_nodo_origen', [9, 12], { flags: ['p10_restored'] });
  assert.ok(r.has(DEV_NODE.x, DEV_NODE.y), 'el nodo se pisa (se usa con A encima)');
  const ev = r.world.events.find((e) => e.id === 'b21_nodo_origen');
  assert.ok(ev?.page, 'el nodo está activo con p10_restored');
  const off = await reach('dev_nodo_origen', [9, 12]);
  assert.ok(!off.world.events.find((e) => e.id === 'b21_nodo_origen')?.page, 'sin P10 el nodo no se activa');
});

// ───────────────────────────── epílogo ─────────────────────────────

test('Villa Alba: las casillas del epílogo están unidas a pie (verja → puerta de casa → casa de Gael → laboratorio)', async () => {
  const flags = [F.epilogueBack, 'b01_escorted', 'b01_dex_received', 'b01_left_town', 'b01_starter_chosen'];
  const r = await reach('villa_alba', [EPI.gate.x, EPI.gate.y], { flags });
  assert.ok(r.has(EPI.meet.x, EPI.meet.y), 'de la verja a la puerta de casa');
  assert.ok(r.has(EPI.alerceFrom.x, EPI.alerceFrom.y) && r.has(EPI.alerceAt.x, EPI.alerceAt.y), 'camino de Alerce');
  assert.ok(r.has(9, 13), 'puerta de la casa de Gael');
  assert.ok(r.has(10, 26) === false, 'Mamá ocupa la puerta de casa durante el epílogo');
  const gael = await reach('casa_gael', [7, 10], { flags: [F.epilogueBack] });
  assert.ok(canUse(gael, EPI.gaelTable.x, EPI.gaelTable.y), 'la nota y el huevo de Gael se alcanzan');
  const home = await reach('casa_prota_1f', [7, 10]);
  assert.ok(home.has(EPI.tv.x, EPI.tv.y), 'ante la tele');
  const room = await reach('casa_prota_2f', [EPI.bed.x, EPI.bed.y]);
  assert.ok(room.has(EPI.bed.x, EPI.bed.y));
  const lab = await worldFor('laberinto_profundidad');
  assert.ok(lab.map.valid(EPI.labyrinth.x, EPI.labyrinth.y), 'la piedra del Laberinto');
});

test('montaje: cada Guardián aparece en suelo pisable de su Pilar y el jugador invisible también', async () => {
  for (const shot of MONTAGE_SHOTS) {
    if (!MAPS[shot.map]) continue;
    const { map } = await worldFor(shot.map);
    for (const [x, y, what] of [[shot.x, shot.y, 'Guardián'], [shot.player[0], shot.player[1], 'jugador']]) {
      assert.ok(map.valid(x, y), `${shot.map}: ${what} fuera del mapa`);
      assert.ok(map.playerPassable(x, y, 2, {}) || map.playerPassable(x, y, 8, {}), `${shot.map}: ${what} en (${x},${y}) no es suelo`);
    }
  }
});
