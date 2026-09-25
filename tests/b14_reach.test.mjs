// Bloque 14 — Pilar de los Ecos: alcanzabilidad a pie (docs/CAMPANA.md B14 y §2.5: G10 fondos con Buceo; la mazmorra
// de Antea por capas). BFS con la pasabilidad real del mundo (tiles + eventos sólidos + saltos de saliente) y, si se
// indica, las aristas de Trepar de las raíces y las corrientes que empujan (se tratan como muro mientras estén activas).
// Comprueba que ninguna puerta de historia se salta en ninguna capa, que no hay casillas trampa, que objetos, células
// y entrenadores se alcanzan en su momento y que la Bramaluna Alfa (patrulla determinista) nunca ve las caracolas ni
// los puntos de interacción y deja paso: BFS en el tiempo sobre su reloj.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { World } from '../game/src/world/world.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import {
  ROOMS, ROOM1, ROOM2, ROOM3, ROOM4, FOSA, ARRECIFE, CAMPANA_INT, FONDO, PATROLS, roomMap,
} from '../game/src/content/maps/b14/layout.js';
import { F, V } from '../game/src/content/events/b14_common.js';
import { patrolAt, patrolPeriod, SIGHT } from '../game/src/content/events/b14_bramaluna.js';

const DV = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };
const key = (x, y) => `${x},${y}`;

/**
 * Mundo de un mapa con estado. opts: flags, vars, climb (aristas de las paredes climbWall activas), currents (prefijos
 * de id de corrientes: con página activa, su casilla es muro), block (casillas-muro).
 */
async function setup(mapId, { flags = [], vars = {}, climb = false, currents = [], block = [] } = {}) {
  const state = GameState.create({ name: 'Prueba' });
  for (const f of flags) state.setFlag(f);
  for (const [k, v] of Object.entries(vars)) state.setVar(k, v);
  const { entry } = await buildMapNode(mapId);
  const world = new World({ state });
  world.setCurrent({ ...entry, events: null });
  const blocked = new Set(block.map(([x, y]) => key(x, y)));
  for (const ev of world.events) {
    if (ev.page && !ev.erased && currents.some((p) => String(ev.id).startsWith(p))) blocked.add(key(ev.x, ev.y));
  }
  const climbEdges = new Map();
  if (climb) {
    for (const ev of world.events) {
      const to = ev.def?.to;
      if (ev.erased || !ev.page || !Array.isArray(to) || ev.def?.type !== 'climbWall') continue;
      const fx = ev.x + Math.sign(ev.x - to[0]);
      const fy = ev.y + Math.sign(ev.y - to[1]);
      const k = key(fx, fy);
      if (!climbEdges.has(k)) climbEdges.set(k, []);
      climbEdges.get(k).push(to);
    }
  }
  return { state, world, map: entry.map, blocked, climbEdges };
}

function neighbours(env, x, y) {
  const { world, map, blocked, climbEdges } = env;
  const p = world.player;
  const out = [];
  for (const d of [2, 4, 6, 8]) {
    let nx = x + DV[d][0];
    let ny = y + DV[d][1];
    if (!map.valid(nx, ny) || blocked.has(key(nx, ny))) continue;
    p.x = x; p.y = y;
    if (!p.passable(x, y, d)) continue;
    if (map.terrainTagAt(nx, ny, 0).ledge) { nx += DV[d][0]; ny += DV[d][1]; }
    if (map.valid(nx, ny)) out.push([nx, ny]);
  }
  for (const to of climbEdges.get(key(x, y)) || []) out.push(to);
  return out;
}

async function reach(mapId, start, opts = {}) {
  const env = await setup(mapId, opts);
  const seen = new Set([key(start.x ?? start[0], start.y ?? start[1])]);
  const s0 = [start.x ?? start[0], start.y ?? start[1]];
  const queue = [s0];
  while (queue.length) {
    const [x, y] = queue.shift();
    for (const [nx, ny] of neighbours(env, x, y)) {
      const k = key(nx, ny);
      if (seen.has(k)) continue;
      seen.add(k);
      queue.push([nx, ny]);
    }
  }
  const has = (x, y) => seen.has(key(x, y));
  const traps = () => {
    const back = new Map();
    for (const k of seen) {
      const [x, y] = k.split(',').map(Number);
      for (const [nx, ny] of neighbours(env, x, y)) {
        const nk = key(nx, ny);
        if (!back.has(nk)) back.set(nk, []);
        back.get(nk).push(k);
      }
    }
    const ok = new Set([key(...s0)]);
    const q = [key(...s0)];
    while (q.length) for (const pk of back.get(q.shift()) || []) if (!ok.has(pk)) { ok.add(pk); q.push(pk); }
    return [...seen].filter((k) => !ok.has(k));
  };
  return { has, seen, env, traps, size: seen.size };
}

/** ¿Se puede interactuar con (x, y)? (pisándolo o desde una vecina alcanzable) */
const canUse = (r, x, y) => r.has(x, y) || [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => r.has(x + dx, y + dy));
/** Objetos, células y entrenadores del mundo del mapa. */
const pickables = (world) => world.events.filter((e) => e.page && !e.erased && (e.def?.item || e.def?.cell || e.def?.trainer));

const stand = (c) => [c.stand.x, c.stand.y];

// ───────────────────────────── Arrecife y campana ─────────────────────────────

test('Arrecife del Eco: la Puerta de Antea solo se abre cuando la jefa aparta la draga; campana y fondo alcanzables', async () => {
  const A = ARRECIFE;
  const closed = await reach('arrecife_eco', A.arrival);
  assert.ok(!canUse(closed, A.gate.door.x, A.gate.door.y), 'se llega a la Puerta de Antea con el cabezal delante');
  assert.ok(closed.has(A.hatch.x, A.hatch.y + 1), 'la escotilla de la campana');
  for (let y = A.east.y0; y <= A.east.y1; y++) assert.ok(closed.has(A.east.x, y), `paso al fondo (43,${y})`);
  for (const ev of pickables(closed.env.world)) assert.ok(canUse(closed, ev.x, ev.y), `arrecife: ${ev.id} en (${ev.x},${ev.y}) inalcanzable`);
  assert.deepEqual(closed.traps(), [], 'casillas trampa en el arrecife');
  const open = await reach('arrecife_eco', A.arrival, { flags: [F.dredgeAside] });
  assert.ok(open.has(A.gate.arrival.x, A.gate.arrival.y) && canUse(open, A.gate.door.x, A.gate.door.y), 'con el cabezal apartado se entra en las ruinas');
  assert.deepEqual(open.traps(), [], 'casillas trampa con la draga apartada');
});

test('Campana de dragado: técnicos, jefa, consola y salida alcanzables', async () => {
  const C = CAMPANA_INT;
  const r = await reach('arrecife_campana', C.entry);
  const w = r.env.world;
  for (const id of ['jefa_adela', 'tecnico_rufino', 'tecnica_eulalia', 'consola_draga']) {
    const ev = w.events.find((e) => e.id === id);
    assert.ok(ev && canUse(r, ev.x, ev.y), `${id} inalcanzable`);
  }
  for (const m of C.exitMat) assert.ok(r.has(m.x, m.y), 'felpudo de la escotilla');
  assert.deepEqual(r.traps(), [], 'casillas trampa en la campana');
});

// ───────────────────────────── Sala 1: la estatua ─────────────────────────────

test('Sala 1: la estatua caída tapa la boca norte hasta moverla en Antea; C082 en el camino', async () => {
  const R = ROOMS[1];
  const p0 = await reach(roomMap(1, 'presente'), R.south.arrival);
  assert.ok(!canUse(p0, R.north.door.x, R.north.door.y), 'la boca norte se alcanza con la estatua caída delante');
  assert.ok(p0.has(ROOM1.cell.x, ROOM1.cell.y), 'C082 en el camino de la plaza');
  assert.ok(p0.has(...stand(R.caracolas[0])), 'la caracola desde la entrada');
  assert.ok(p0.has(ROOM1.ruin.breach.x, ROOM1.ruin.breach.y), 'la brecha de la casa derrumbada');
  for (const ev of pickables(p0.env.world)) assert.ok(canUse(p0, ev.x, ev.y), `sala 1: ${ev.id} inalcanzable`);
  assert.deepEqual(p0.traps(), [], 'casillas trampa (presente)');
  const a = await reach(roomMap(1, 'antea'), stand(R.caracolas[0]));
  assert.ok(a.has(ROOM1.statue.push.x, ROOM1.statue.push.y), 'en Antea se llega a empujar la estatua');
  assert.ok(!canUse(a, 16, 3), 'en Antea la puerta alta no deja pasar');
  for (const ev of pickables(a.env.world)) assert.ok(canUse(a, ev.x, ev.y), `sala 1 Antea: ${ev.id} inalcanzable`);
  assert.deepEqual(a.traps(), [], 'casillas trampa (Antea)');
  const p1 = await reach(roomMap(1, 'presente'), R.south.arrival, { vars: { [V.statue]: 1 } });
  assert.ok(canUse(p1, R.north.door.x, R.north.door.y) && p1.has(R.north.arrival.x, R.north.arrival.y), 'movida la estatua, la boca norte queda libre');
  assert.deepEqual(p1.traps(), [], 'casillas trampa con la estatua movida');
});

// ───────────────────────────── Sala 2: Fausto y el aljibe ─────────────────────────────

test('Sala 2: la corriente del aljibe impide pasar hasta cerrar la compuerta en Antea; Fausto y la rueda alcanzables', async () => {
  const R = ROOMS[2];
  const currents = ['corriente_aljibe_'];
  const open = await reach(roomMap(2, 'presente'), R.south.arrival, { currents });
  assert.ok(!canUse(open, R.north.door.x, R.north.door.y), 'se cruza el aljibe con la corriente');
  assert.ok(open.has(...stand(R.caracolas[0])), 'caracola de la calle');
  assert.ok(canUse(open, ROOM2.gear.x, ROOM2.gear.y), 'el equipo de Fausto');
  for (const ev of pickables(open.env.world)) assert.ok(canUse(open, ev.x, ev.y), `sala 2: ${ev.id} inalcanzable`);
  assert.deepEqual(open.traps(), [], 'casillas trampa con la corriente');
  const dry = await reach(roomMap(2, 'presente'), R.south.arrival, { currents, flags: [F.cistern] });
  assert.ok(canUse(dry, R.north.door.x, R.north.door.y), 'con la compuerta cerrada el aljibe lleva a la sala 3');
  assert.deepEqual(dry.traps(), [], 'casillas trampa con el aljibe seco');
  const a = await reach(roomMap(2, 'antea'), stand(R.caracolas[0]));
  for (const s of ROOM2.stops) assert.ok(a.has(s.player.x, s.player.y), `parada ${s.key}: casilla del jugador`);
  assert.ok(canUse(a, ROOM2.wheel.x, ROOM2.wheel.y), 'la rueda de la compuerta');
  assert.ok(!a.has(16, 5), 'en Antea no se entra al aljibe');
  for (const ev of pickables(a.env.world)) assert.ok(canUse(a, ev.x, ev.y), `sala 2 Antea: ${ev.id} inalcanzable`);
  assert.deepEqual(a.traps(), [], 'casillas trampa (Antea)');
});

// ───────────────────────────── Sala 3: el helecho y la raíz ─────────────────────────────

test('Sala 3: la terraza alta solo por la raíz de Antea (helecho plantado en la era primigenia) y Trepar', async () => {
  const R = ROOMS[3];
  const [c3a, c3b] = R.caracolas;
  const low = await reach(roomMap(3, 'presente'), R.south.arrival);
  assert.ok(!low.has(ROOM3.cell.x, ROOM3.cell.y) && !canUse(low, R.north.door.x, R.north.door.y), 'terraza alta alcanzable en el presente');
  assert.ok(low.has(...stand(c3a)), 'caracola del barrio bajo');
  assert.deepEqual(low.traps(), [], 'trampas en el barrio bajo');
  const a0 = await reach(roomMap(3, 'antea'), stand(c3a), { climb: true });
  assert.ok(!a0.has(...stand(c3b)), 'sin helecho se sube a la terraza en Antea');
  const a1 = await reach(roomMap(3, 'antea'), stand(c3a), { climb: true, flags: [F.fern3] });
  assert.ok(a1.has(...stand(c3b)) && canUse(a1, R.north.door.x, R.north.door.y), 'con la raíz se llega a la terraza y a la salida norte');
  assert.deepEqual(a1.traps(), [], 'trampas en Antea con la raíz');
  const x = await reach(roomMap(3, 'primigenia'), stand(c3a));
  assert.ok(x.has(ROOM3.sprout.x - 1, ROOM3.sprout.y), 'arboleda del brote');
  assert.ok(x.has(ROOM3.soil.x, ROOM3.soil.y + 1), 'tierra húmeda al pie del risco');
  assert.ok(!x.has(...stand(c3b)), 'meseta alcanzable desde el valle primigenio');
  assert.deepEqual(x.traps(), [], 'trampas en la era primigenia');
  const top = await reach(roomMap(3, 'presente'), stand(c3b));
  assert.ok(top.has(ROOM3.cell.x, ROOM3.cell.y), 'C083 en la terraza alta (presente)');
  assert.ok(canUse(top, R.north.door.x, R.north.door.y), 'boca norte desde la terraza (presente)');
  for (const ev of pickables(top.env.world)) {
    if (ev.y <= 9) assert.ok(canUse(top, ev.x, ev.y), `sala 3 arriba: ${ev.id} inalcanzable`);
  }
  const xt = await reach(roomMap(3, 'primigenia'), stand(c3b));
  assert.ok(xt.has(R.northPrimal.tile.x, R.northPrimal.tile.y), 'senda norte de la meseta primigenia');
});

// ───────────────────────────── Sala 4: la boca de la Fosa ─────────────────────────────

test('Sala 4: la Fosa solo con el aliviadero cerrado en Antea (balcón por la raíz); C084 y el manantial', async () => {
  const R = ROOMS[4];
  const c4 = R.caracolas[0];
  const currents = ['corriente_fosa_'];
  const p0 = await reach(roomMap(4, 'presente'), R.south.arrival, { currents });
  assert.ok(!canUse(p0, R.north.door.x, R.north.door.y), 'se baja a la Fosa con la corriente');
  assert.ok(p0.has(ROOM4.cell.x, ROOM4.cell.y), 'C084 ante la boca');
  assert.ok(p0.has(ROOM4.springStand.x, ROOM4.springStand.y), 'manantial del eco');
  assert.ok(p0.has(...stand(c4)), 'caracola');
  assert.deepEqual(p0.traps(), [], 'trampas en el presente');
  const p1 = await reach(roomMap(4, 'presente'), R.south.arrival, { currents, flags: [F.spillway] });
  assert.ok(canUse(p1, R.north.door.x, R.north.door.y), 'con el aliviadero cerrado se baja a la Fosa');
  const a0 = await reach(roomMap(4, 'antea'), stand(c4), { climb: true });
  assert.ok(!a0.has(ROOM4.leverFrom.x, ROOM4.leverFrom.y), 'balcón del aliviadero sin la raíz');
  assert.ok(a0.has(R.south.arrival.x, R.south.arrival.y), 'salida sur en Antea');
  const a1 = await reach(roomMap(4, 'antea'), stand(c4), { climb: true, flags: [F.fern4] });
  assert.ok(a1.has(ROOM4.leverFrom.x, ROOM4.leverFrom.y), 'con la raíz se llega a la palanca');
  assert.deepEqual(a1.traps(), [], 'trampas en Antea con la raíz');
  for (const ev of pickables(a1.env.world)) assert.ok(canUse(a1, ev.x, ev.y), `sala 4 Antea: ${ev.id} inalcanzable`);
  const x = await reach(roomMap(4, 'primigenia'), stand(c4));
  assert.ok(x.has(ROOM4.sprout.x - 1, ROOM4.sprout.y), 'brote de la sala 4');
  assert.ok(x.has(ROOM4.soil.x, ROOM4.soil.y + 1), 'tierra húmeda del risco');
  assert.ok(x.has(R.southPrimal.tile.x, R.southPrimal.tile.y), 'senda sur primigenia');
  assert.deepEqual(x.traps(), [], 'trampas en la era primigenia');
});

// ───────────────────────────── Fosa ─────────────────────────────

test('Fosa del Eco: al núcleo solo se llega cruzando la franja del nido (combate obligatorio)', async () => {
  const T = FOSA.trigger;
  const strip = [];
  for (let x = T.x0; x <= T.x1; x++) strip.push([x, T.y]);
  const blocked = await reach('fosa_eco', FOSA.arrival, { block: strip });
  assert.ok(!canUse(blocked, FOSA.core.x, FOSA.core.y), 'se esquiva la franja del nido y se llega al núcleo');
  const r = await reach('fosa_eco', FOSA.arrival, { flags: [F.echoBeaten, F.restored] });
  assert.ok(canUse(r, FOSA.core.x, FOSA.core.y), 'el núcleo');
  assert.ok(r.has(FOSA.upcurrent.x, FOSA.upcurrent.y) || canUse(r, FOSA.upcurrent.x, FOSA.upcurrent.y), 'la corriente ascendente');
  assert.ok(canUse(r, FOSA.nest.x, FOSA.nest.y), 'el nido (Bramaluna real)');
  assert.deepEqual(r.traps(), [], 'trampas en la Fosa');
});

// ───────────────────────────── Fondo del Mar del Sur ─────────────────────────────

test('Fondo del Mar del Sur: células C077–C081, objetos, respiraderos y haces alcanzables desde el arrecife', async () => {
  const r = await reach('fondo_mar_sur', [1, FONDO.west.y0 + 2]);
  for (const [k, c] of Object.entries(FONDO.cells)) assert.ok(r.has(c.x, c.y), `célula ${k} en (${c.x},${c.y})`);
  for (const v of FONDO.vents) assert.ok(r.has(v.x, v.y), `respiradero (${v.x},${v.y})`);
  for (const s of FONDO.surface) assert.ok(r.has(s.x, s.y), `haz de luz (${s.x},${s.y})`);
  for (const ev of pickables(r.env.world)) assert.ok(canUse(r, ev.x, ev.y), `fondo: ${ev.id} en (${ev.x},${ev.y}) inalcanzable`);
  assert.deepEqual(r.traps(), [], 'trampas en el fondo');
});

// ───────────────────────────── Bramaluna: patrulla y sigilo ─────────────────────────────

/** Casillas vistas por la Bramaluna en un fotograma (su posición de origen y de destino durante un paso). */
function visibleAt(env, ev, mapId, frame) {
  const s = patrolAt(mapId, frame);
  const spots = s.kind === 'move' ? [s.from, { x: s.x, y: s.y }] : [{ x: s.x, y: s.y }];
  const out = new Set();
  for (const pos of spots) {
    ev.x = pos.x; ev.y = pos.y; ev.direction = s.dir;
    let x = pos.x; let y = pos.y;
    for (let n = 0; n < SIGHT && ev.canMoveFromCoordinate(x, y, s.dir); n++) {
      x += DV[s.dir][0]; y += DV[s.dir][1];
      out.add(key(x, y));
    }
    out.add(key(pos.x, pos.y));
  }
  return out;
}

async function stealthEnv(mapId, flags = []) {
  const env = await setup(mapId, { flags });
  const ev = env.world.events.find((e) => e.id === `bramaluna_${mapId}`);
  assert.ok(ev, `${mapId}: falta la Bramaluna`);
  env.blocked.add('__dummy');
  return { env, ev };
}

/**
 * BFS en el tiempo: ¿se llega de `from` a `to` sin que la Bramaluna vea al jugador? Franjas de 8 fotogramas; un paso
 * del jugador ocupa dos franjas (16 fotogramas, más lento que el paso real de ~11) y se puede esperar en el sitio.
 */
export function stealthPath(env, ev, mapId, from, to) {
  const period = patrolPeriod(mapId);
  const step = 8;
  assert.equal(period % step, 0, `${mapId}: el periodo de la patrulla (${period}) debe ser múltiplo de ${step}`);
  const n = period / step;
  const vis = [];
  for (let i = 0; i < n; i++) {
    const set = new Set();
    for (let f = i * step; f < (i + 1) * step; f += 2) for (const k of visibleAt(env, ev, mapId, f)) set.add(k);
    vis.push(set);
  }
  const V = (i) => vis[((i % n) + n) % n];
  // Mover la Bramaluna fuera del mapa para que no bloquee los pasos del jugador en el cálculo de vecinos.
  ev.x = -10; ev.y = -10;
  const seen = new Set();
  const q = [];
  for (let i = 0; i < n; i++) if (!V(i).has(key(...from))) q.push([from[0], from[1], i]);
  while (q.length) {
    const [x, y, i] = q.shift();
    if (x === to[0] && y === to[1]) return true;
    const push = (nx, ny, ni) => {
      const k = `${nx},${ny},${ni % n}`;
      if (seen.has(k)) return;
      seen.add(k);
      q.push([nx, ny, ni % n]);
    };
    if (!V(i + 1).has(key(x, y))) push(x, y, i + 1);
    for (const [nx, ny] of neighbours(env, x, y)) {
      if (V(i + 1).has(key(x, y)) || V(i + 1).has(key(nx, ny)) || V(i + 2).has(key(nx, ny))) continue;
      push(nx, ny, i + 2);
    }
  }
  return false;
}

for (const [mapId, room, targets] of [
  [roomMap(3, 'primigenia'), 3, [[ROOM3.sprout.x - 1, ROOM3.sprout.y], [ROOM3.soil.x, ROOM3.soil.y + 1]]],
  [roomMap(4, 'primigenia'), 4, [[ROOM4.sprout.x - 1, ROOM4.sprout.y], [ROOM4.soil.x, ROOM4.soil.y + 1], [ROOM4.springStand.x, ROOM4.springStand.y]]],
]) {
  test(`${mapId}: la patrulla vuelve a su inicio, nunca ve las caracolas ni los puntos de interacción y deja paso`, async () => {
    const { env, ev } = await stealthEnv(mapId);
    const period = patrolPeriod(mapId);
    assert.ok(period > 0 && PATROLS[mapId], 'patrulla definida');
    // Toda la ruta es transitable para ella.
    for (let f = 0; f < period; f += 4) {
      const s = patrolAt(mapId, f);
      assert.ok(env.map.passableStrict(s.x, s.y), `la patrulla pisa una casilla bloqueada (${s.x},${s.y})`);
    }
    const safe = [...ROOMS[room].caracolas.map(stand), ...targets];
    for (let f = 0; f < period; f += 2) {
      const vis = visibleAt(env, ev, mapId, f);
      for (const [x, y] of safe) assert.ok(!vis.has(key(x, y)), `la Bramaluna ve (${x},${y}) en el fotograma ${f}`);
    }
    const c = stand(ROOMS[room].caracolas[0]);
    for (const t of targets) {
      assert.ok(stealthPath(env, ev, mapId, c, t), `sin paso a escondidas de la caracola a (${t})`);
      assert.ok(stealthPath(env, ev, mapId, t, c), `sin paso a escondidas de (${t}) a la caracola`);
    }
  });
}

test('Los cambios de capa aparecen en casilla transitable: el acceso a cada caracola existe en todas las capas de su sala', async () => {
  for (const n of [1, 2, 3, 4]) {
    for (const era of ROOMS[n].eras) {
      const env = await setup(roomMap(n, era), { flags: [F.fern3, F.fern4] });
      for (const c of ROOMS[n].caracolas) {
        assert.ok(env.map.passableStrict(c.stand.x, c.stand.y), `${roomMap(n, era)}: el acceso a ${c.id} (${c.stand.x},${c.stand.y}) no es transitable`);
        const ev = env.world.events.find((e) => e.id === c.id);
        assert.ok(ev && ev.page && ev.x === c.x && ev.y === c.y, `${roomMap(n, era)}: falta ${c.id}`);
      }
    }
  }
});
