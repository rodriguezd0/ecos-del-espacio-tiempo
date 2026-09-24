// Pilar de la Corriente (CAMPANA B04): la Escalera de Estanques. Comprueba el modelo del agua, la solución de
// referencia EXACTA de CAMPANA (4 fases), que no hay trampas sin la palanca de reinicio, que la solución mínima es
// la de referencia y que el MAPA construido conecta sus zonas exactamente como dice el grafo en todos los estados.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL, puzzleState, applyAction, actionBlocked, reachableZones, CONTROLS, isFull, isOpen, cycleComplete, settle,
} from '../game/src/content/events/b04_hydraulics.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import { createEntry } from '../game/src/world/mapLoader.js';
import { expandEventDef } from '../game/src/world/eventTypes.js';
import { normalizeEventDef } from '../game/src/world/mapEvent.js';
import { GameState } from '../game/src/core/state.js';
import { POND_PATCHES, bridgePatch } from '../game/src/content/maps/b04/pilar_corriente_tiles.js';
import { PONDS, SPOTS } from '../game/src/content/maps/b04/pilar_corriente_layout.js';

const full = (p) => [0, 1, 2, 3, 4, 5].filter((i) => isFull(p.water, i)).map((i) => `E${i + 1}`);
const gate = (g) => ({ type: 'gate', gate: g });

test('estado inicial: todo cerrado, noria suelta, E1 y E4 llenos (dos unidades de agua)', () => {
  const p = puzzleState(INITIAL);
  assert.equal(p.gates, 0);
  assert.equal(p.noria, false);
  assert.deepEqual(full(p), ['E1', 'E4']);
  assert.deepEqual(settle(p).steps, [], 'el estado inicial ya está en reposo');
});

test('solución de referencia de CAMPANA: las cuatro fases producen exactamente lo descrito', () => {
  let p = puzzleState(INITIAL);
  // (1) abrir C1 y C2, C3 cerrada: E1 se vacía (y se cruza su fondo hasta el mando de C3).
  p = applyAction(p, gate(0)).state;
  p = applyAction(p, gate(1)).state;
  assert.ok(!isFull(p.water, 0), 'E1 vacío');
  assert.ok(!isOpen(p.gates, 2), 'C3 cerrada');
  assert.ok(reachableZones(p).has('c3'), 'por el fondo de E1 se llega al mando de C3');
  // (2) cerrar C2 y abrir C3: E4 se vacía y se engancha la noria.
  p = applyAction(p, gate(1)).state;
  p = applyAction(p, gate(2)).state;
  assert.ok(!isFull(p.water, 3), 'E4 vacío');
  assert.ok(reachableZones(p).has('e4'), 'se baja al fondo de E4');
  p = applyAction(p, { type: 'noria' }).state;
  assert.ok(p.noria);
  // (3) abrir C4: E6 se llena, la noria gira y suben las losas de E2.
  assert.ok(reachableZones(p).has('c4'));
  const r3 = applyAction(p, gate(3));
  assert.ok(r3.steps.some((s) => s.to === 5), 'E6 se llena');
  assert.ok(r3.noriaTurned, 'la noria gira');
  p = r3.state;
  assert.ok(isFull(p.water, 1), 'E2 lleno: suben sus losas');
  // (4) por esas losas se llega al mando de C2 y se abre: ciclo completo.
  assert.ok(reachableZones(p).has('c2'));
  const r4 = applyAction(p, gate(1));
  assert.ok(r4.cycle && cycleComplete(r4.state), 'ciclo E1→E6→noria→E1 con todas las compuertas abiertas');
  assert.ok(reachableZones(r4.state).has('nucleo'), 'la corriente abre el paso al núcleo');
});

test('si C2 sigue abierta al abrir C3, E3 vuelve a llenar E4 (por eso la fase 2 cierra C2)', () => {
  let p = puzzleState(INITIAL);
  for (const g of [0, 1, 2]) p = applyAction(p, gate(g)).state;
  assert.ok(isFull(p.water, 3), 'E4 sigue lleno');
});

test('trinquete: C4 no se abre con la noria suelta y la noria no se suelta con C4 abierta; reinicio', () => {
  const p = puzzleState(INITIAL);
  assert.equal(actionBlocked(p, gate(3)), 'c4_trabada');
  const q = puzzleState({ gates: 8, noria: true, water: 0 });
  assert.equal(actionBlocked(q, { type: 'noria' }), 'noria_trabada');
  assert.deepEqual(applyAction(q, { type: 'reset' }).state, puzzleState(INITIAL));
  const done = puzzleState({ gates: 15, noria: true, water: 6 });
  assert.equal(actionBlocked(done, gate(0)), 'ciclo');
});

/** Búsqueda en anchura sobre (estado del puzle, zona del jugador). */
function explore() {
  const key = (p, z) => `${p.gates}|${p.noria ? 1 : 0}|${p.water}|${z}`;
  const start = { p: puzzleState(INITIAL), z: 'entrada', path: [] };
  const seen = new Map([[key(start.p, start.z), start]]);
  const queue = [start];
  const wins = [];
  while (queue.length) {
    const s = queue.shift();
    const zones = reachableZones(s.p, s.z);
    for (const c of CONTROLS) {
      if (!zones.has(c.zone) || actionBlocked(s.p, c.action)) continue;
      const r = applyAction(s.p, c.action);
      // Si el fondo de E4 se llena con el jugador dentro, sale por la escalera sur (b04_pilar_puzzle.js#evacuate).
      const z = c.zone === 'e4' && isFull(r.state.water, 3) ? 'entrada' : c.zone;
      const n = { p: r.state, z, path: [...s.path, { id: c.id, before: s.p }] };
      if (r.cycle) { wins.push(n); continue; }
      const k = key(n.p, n.z);
      if (!seen.has(k)) { seen.set(k, n); queue.push(n); }
    }
  }
  return { states: [...seen.values()], wins };
}

test('solucionador: sin trampas (siempre se vuelve a la palanca de reinicio) y la solución mínima es la de referencia', () => {
  const { states, wins } = explore();
  assert.ok(wins.length > 0, 'la Escalera tiene solución');
  for (const s of states) assert.ok(reachableZones(s.p, s.z).has('entrada'), `trampa en ${s.z}`);
  const best = Math.min(...wins.map((w) => w.path.length));
  const shortest = wins.filter((w) => w.path.length === best).map((w) => w.path.map((a) => a.id).join(' → '));
  assert.deepEqual(shortest, ['mando_c1 → mando_c3 → palanca_noria → mando_c4 → mando_c2']);
});

// ───────────────────────────── Mapa construido ─────────────────────────────

/** Casilla donde se pone el jugador para cada zona (junto al mando, en el fondo o sobre las losas). */
const PROBES = Object.freeze({
  entrada: [20, 36], este: [27, 20], norte: [20, 12], e1: [20, 8], c3: [17, 4], e2: [31, 9], c2: [35, 7],
  e3: [32, 25], e4: [20, 28], oeste: [13, 29], e5: [8, 24], paso: [8, 17], e6: [7, 9], c4: [3, 7], nucleo: [19, 15],
});

async function builtPilar() {
  const { def, built, tileset } = await buildMapNode('pilar_corriente');
  return { def, built, tileset };
}

/** Mapa con el agua de `p` (parches de estanque y puente) y casillas bloqueadas por eventos sólidos. */
function mapFor(ctx, p) {
  const { def, built, tileset } = ctx;
  const layers = built.layers.map((l) => l.slice());
  const put = (patch) => { for (const [x, y, l, id] of patch) layers[l][x + y * built.width] = id; };
  for (const pond of PONDS) put(POND_PATCHES[pond.id][isFull(p.water, Number(pond.id.slice(1)) - 1) ? 'full' : 'empty']);
  put(bridgePatch(cycleComplete(p)));
  const map = createEntry(def, { ...built, layers }, tileset).map;
  const state = GameState.create({ name: 'Prueba' });
  state.setFlag('b04_reto');
  const blocked = new Set();
  (def.events || []).forEach((raw, i) => {
    const ev = normalizeEventDef(expandEventDef(raw, def), i);
    const fake = { id: ev.id, x: ev.x, y: ev.y, selfSwitch: () => false };
    const page = [...ev.pages].reverse().find((pg) => !pg.when || pg.when(state, fake));
    if (page && !page.through && (page.solid || page.sprite)) blocked.add(`${ev.x},${ev.y}`);
  });
  return { map, blocked };
}

/** Casillas alcanzables a pie desde (x, y), con saltos de saliente hacia el sur. */
function walk({ map, blocked }, x0, y0) {
  const DIRS = [[2, 0, 1], [4, -1, 0], [6, 1, 0], [8, 0, -1]];
  const seen = new Set([`${x0},${y0}`]);
  const queue = [[x0, y0]];
  const free = (x, y) => map.valid(x, y) && !blocked.has(`${x},${y}`);
  while (queue.length) {
    const [x, y] = queue.shift();
    for (const [d, dx, dy] of DIRS) {
      let nx = x + dx; let ny = y + dy;
      if (!free(nx, ny)) continue;
      if (map.terrainTagAt(nx, ny).ledge) {
        if (d !== 2) continue;
        ny += 1;
        if (!free(nx, ny) || !map.playerPassable(nx, ny, 8, {})) continue;
      } else if (!map.playerPassable(x, y, d, {}) || !map.playerPassable(nx, ny, 10 - d, {})) continue;
      const k = `${nx},${ny}`;
      if (!seen.has(k)) { seen.add(k); queue.push([nx, ny]); }
    }
  }
  return seen;
}

test('el mapa construido conecta las zonas como el grafo en todos los estados alcanzables del agua', async () => {
  const ctx = await builtPilar();
  const { states } = explore();
  const waters = new Map();
  for (const s of states) waters.set(`${s.p.water}|${cycleComplete(s.p)}`, s.p);
  waters.set('fin', puzzleState({ gates: 15, noria: true, water: 6 }));
  for (const p of waters.values()) {
    const m = mapFor(ctx, p);
    for (const [from, [fx, fy]] of Object.entries(PROBES)) {
      const expected = reachableZones(p, from);
      // Solo se parte de zonas donde se puede estar (el fondo de un estanque lleno es agua).
      if (!m.map.playerPassable(fx, fy, 2, {}) && !m.map.playerPassable(fx, fy, 8, {})) continue;
      const cells = walk(m, fx, fy);
      for (const [zone, [zx, zy]] of Object.entries(PROBES)) {
        const got = cells.has(`${zx},${zy}`);
        assert.equal(got, expected.has(zone), `agua ${full(p).join(',') || '—'} ciclo ${cycleComplete(p)}: desde ${from}, ¿${zone}? mapa ${got} / grafo ${expected.has(zone)}`);
      }
    }
  }
});

test('la llegada del Pilar y el reto de Leandro están en el rellano de entrada', async () => {
  const { def } = await builtPilar();
  assert.deepEqual([def.start.x, def.start.y], [SPOTS.arrival.x, SPOTS.arrival.y]);
  assert.ok(def.events.some((e) => e.id === 'reto_leandro'));
  assert.equal(def.warps[0].to, 'garganta_albo');
});
