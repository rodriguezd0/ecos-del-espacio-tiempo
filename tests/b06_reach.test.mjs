// Bloque 6 — Pilar del Impulso: alcanzabilidad a pie en los mapas (docs/CAMPANA.md §1.4 y §2.5, puertas G3 y la
// puerta del Parque). BFS con la pasabilidad real del mundo (tiles + eventos sólidos + saltos de saliente):
//   · Ruta 5: sin romper los troncos no se llega a la Meseta (Embestida); rotos, sí; el otero del sureste se sube.
//   · Meseta: el recinto del Parque solo se alcanza por la puerta que guardan los técnicos (combate doble).
//   · Todos los objetos del bloque tienen una casilla alcanzable desde la que cogerlos.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { World } from '../game/src/world/world.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import { RUTA5, MESETA, P3_VERTICAL } from '../game/src/content/maps/b06/layout.js';

const DV = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };

/**
 * Casillas alcanzables a pie desde `start`. opts: flags (se activan), erase (prefijos de id de evento que se dan por
 * retirados), block (casillas [x, y] que se tratan como muro: p. ej. los disparadores de una escena).
 */
async function reach(mapId, start, { flags = [], erase = [], block = [] } = {}) {
  const state = GameState.create({ name: 'Prueba' });
  for (const f of flags) state.setFlag(f);
  const { entry } = await buildMapNode(mapId);
  const world = new World({ state });
  world.setCurrent({ ...entry, events: null });
  for (const ev of world.events) if (erase.some((p) => String(ev.id).startsWith(p))) ev.erased = true;
  const blocked = new Set(block.map(([x, y]) => `${x},${y}`));
  const p = world.player;
  const map = entry.map;
  const seen = new Set([`${start[0]},${start[1]}`]);
  const queue = [start];
  while (queue.length) {
    const [x, y] = queue.shift();
    for (const d of [2, 4, 6, 8]) {
      let nx = x + DV[d][0];
      let ny = y + DV[d][1];
      if (!map.valid(nx, ny) || blocked.has(`${nx},${ny}`)) continue;
      p.x = x; p.y = y;
      if (!p.passable(x, y, d)) continue;
      if (map.terrainTagAt(nx, ny, 0).ledge) { nx += DV[d][0]; ny += DV[d][1]; }
      const k = `${nx},${ny}`;
      if (!map.valid(nx, ny) || seen.has(k)) continue;
      seen.add(k);
      queue.push([nx, ny]);
    }
  }
  return { has: (x, y) => seen.has(`${x},${y}`), world, size: seen.size };
}

/** ¿Se puede coger un objeto en (x, y)? (pisándolo o mirándolo desde una vecina alcanzable) */
const canPick = (r, x, y) => r.has(x, y) || [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => r.has(x + dx, y + dy));

/** Casilla de entrada de la Ruta 5 desde Villa Brontia. */
const R5west = () => [RUTA5.west.x + 2, RUTA5.west.y0 + 1];

test('Ruta 5: los troncos son el único paso hacia la Meseta (Embestida)', async () => {
  const closed = await reach('ruta_5', R5west());
  for (let y = RUTA5.east.y0; y <= RUTA5.east.y1; y++) assert.ok(!closed.has(RUTA5.east.x, y), `sin Embestida se llega a (${RUTA5.east.x},${y})`);
  const open = await reach('ruta_5', R5west(), { erase: ['troncos_paso', 'tronco_rincon'] });
  assert.ok(open.has(RUTA5.east.x, RUTA5.east.y0), 'con los troncos rotos se llega a la Meseta');
});

test('Meseta: al recinto del Parque solo se entra por la puerta guardada', async () => {
  const start = [MESETA.west.x + 2, MESETA.west.y0 + 1];
  const door = [MESETA.colector.door.x, MESETA.colector.door.y + 1];
  // Disparadores de la escena del combate doble: la franja delante de la puerta y la casilla de la puerta.
  const triggers = [[MESETA.gate.x0, MESETA.gate.y + 2], [MESETA.gate.x0 + 1, MESETA.gate.y + 2], [MESETA.gate.x1, MESETA.gate.y + 2], [MESETA.gate.x0 + 1, MESETA.gate.y + 1]];
  const guarded = await reach('meseta_impulso', start, { flags: ['b06_meseta_intro'], block: triggers });
  assert.ok(!guarded.has(...door), 'se puede llegar a la nave del Colector sin pasar por los técnicos');
  const after = await reach('meseta_impulso', start, { flags: ['b06_meseta_intro', 'b06_doble_ganado'] });
  assert.ok(after.has(...door), 'tras el combate doble la nave es accesible');
  assert.ok(after.has(MESETA.ringGate.x, MESETA.ringGate.y + 1), 'la escalinata del Anillo es accesible');
});

test('objetos del bloque: todos tienen una casilla alcanzable', async () => {
  const cases = [
    ['ruta_5', R5west(), { erase: ['troncos_paso', 'tronco_rincon'] }],
    ['meseta_impulso', [MESETA.west.x + 2, MESETA.west.y0 + 1], { flags: ['b06_meseta_intro', 'b06_doble_ganado'] }],
    ['anillo_vientos_base', [P3_VERTICAL.entry.x, P3_VERTICAL.entry.y], { flags: ['p3_restored'] }],
  ];
  for (const [id, start, opts] of cases) {
    const r = await reach(id, start, opts);
    const items = r.world.events.filter((e) => e.def?.item || /^objeto_/.test(String(e.id)));
    assert.ok(items.length > 0, `${id}: sin objetos`);
    for (const ev of items) assert.ok(canPick(r, ev.x, ev.y), `${id}: objeto ${ev.id} en (${ev.x},${ev.y}) inalcanzable`);
  }
});

test('P3: las nuevas plantas permiten volver abajo y la franja de Abril cubre todo paso al núcleo', async () => {
  const start = [P3_VERTICAL.entry.x, P3_VERTICAL.entry.y];
  const base = await reach('anillo_vientos_base', start);
  assert.ok(base.has(P3_VERTICAL.up.x, P3_VERTICAL.up.y), 'se llega a las galerías');
  assert.ok(base.has(P3_VERTICAL.down.x, P3_VERTICAL.down.y), 'salida a la Meseta');
  const guarded = await reach('anillo_vientos_nucleo', start, { flags: ['b06_campanas'], block: P3_VERTICAL.challenge });
  assert.ok(!canPick(guarded, P3_VERTICAL.pedestal.x, P3_VERTICAL.pedestal.y), 'se puede saltar el reto de Abril');
  assert.ok(guarded.has(P3_VERTICAL.down.x, P3_VERTICAL.down.y), 'se puede salir antes de combatir');
  const open = await reach('anillo_vientos_nucleo', start, { flags: ['b06_campanas', 'b06_abril_vencida'] });
  assert.ok(canPick(open, P3_VERTICAL.pedestal.x, P3_VERTICAL.pedestal.y), 'núcleo tras la Guardiana');
});
