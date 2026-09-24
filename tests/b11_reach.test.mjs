// Bloque 11 — alcanzabilidad a pie (docs/CAMPANA.md §1.4 y §2.5: G7 niebla del Neblino hasta P5, G8 paredes con
// Trepar; B11: perímetro del campamento hasta que Genesis se va). BFS con la pasabilidad real del mundo (tiles +
// eventos sólidos + saltos de saliente) y, si se tiene Trepar, las aristas de cada pared `climbWall` (de la casilla
// de enfrente a su destino). Comprueba que ninguna puerta de capacidad o de historia se salta, que no hay casillas
// trampa (todo lo alcanzable puede volver a la entrada) y que objetos, células y entrenadores se alcanzan con las
// capacidades de su momento. El sigilo del T10 se resuelve con un BFS en el tiempo sobre el reloj de los centinelas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { World } from '../game/src/world/world.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import { RUTA10, NEBLINO, CAMP, CERRO, IKER, POZO } from '../game/src/content/maps/b11/layout.js';
import { SENTINELS, sentinelDir, SIGHT } from '../game/src/content/events/b11_t10.js';
import { sightReach } from '../game/src/content/events/b01_north_stealth.js';
import { B11_CELLS } from '../game/src/content/events/b11_cells.js';

const DV = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };
const key = (x, y) => `${x},${y}`;

/**
 * Mundo del mapa con flags. opts: flags, erase (prefijos de id que se dan por retirados), block (casillas-muro),
 * blockPrefix (prefijos de id cuyas casillas se tratan como muro: p. ej. las franjas de niebla), climb (Trepar).
 */
async function setup(mapId, { flags = [], erase = [], block = [], blockPrefix = [], climb = false } = {}) {
  const state = GameState.create({ name: 'Prueba' });
  for (const f of flags) state.setFlag(f);
  const { entry } = await buildMapNode(mapId);
  const world = new World({ state });
  world.setCurrent({ ...entry, events: null });
  for (const ev of world.events) if (erase.some((p) => String(ev.id).startsWith(p))) ev.erased = true;
  const blocked = new Set(block.map(([x, y]) => key(x, y)));
  for (const ev of world.events) {
    if (ev.page && !ev.erased && blockPrefix.some((p) => String(ev.id).startsWith(p))) blocked.add(key(ev.x, ev.y));
  }
  const climbEdges = new Map();
  if (climb) {
    for (const ev of world.events) {
      const to = ev.def?.to;
      if (ev.erased || !Array.isArray(to) || ev.def?.type !== 'climbWall') continue;
      const fx = ev.x + Math.sign(ev.x - to[0]);
      const fy = ev.y + Math.sign(ev.y - to[1]);
      const k = key(fx, fy);
      if (!climbEdges.has(k)) climbEdges.set(k, []);
      climbEdges.get(k).push(to);
    }
  }
  return { state, world, map: entry.map, blocked, climbEdges };
}

/** Vecinos a pie (y por Trepar) de (x, y). */
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
  const seen = new Set([key(...start)]);
  const queue = [start];
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
  /** Casillas alcanzables desde las que no se puede volver a `start` (trampas). */
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
    const ok = new Set([key(...start)]);
    const q = [key(...start)];
    while (q.length) for (const pk of back.get(q.shift()) || []) if (!ok.has(pk)) { ok.add(pk); q.push(pk); }
    return [...seen].filter((k) => !ok.has(k));
  };
  return { has, seen, env, traps, size: seen.size };
}

/** ¿Se puede interactuar con (x, y)? (pisándolo o desde una vecina alcanzable) */
const canUse = (r, x, y) => r.has(x, y) || [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => r.has(x + dx, y + dy));

const ENTRY_R10 = [RUTA10.east.x - 1, RUTA10.east.y0];

test('Ruta 10: el tramo bajo (etapa A) se recorre entero sin capacidades y el alto exige Trepar', async () => {
  const low = await reach('ruta_10', ENTRY_R10);
  for (let x = RUTA10.south.x0; x <= RUTA10.south.x1; x++) assert.ok(low.has(x, RUTA10.south.y), `sendero del Neblino (${x})`);
  const c007 = B11_CELLS.find((c) => c.code === 'C007');
  assert.ok(low.has(c007.x, c007.y), 'C007 en la orilla del Albo, sin capacidades');
  for (let y = 0; y <= 13; y++) for (let x = 0; x < RUTA10.width; x++) assert.ok(!low.has(x, y), `tramo alto (${x},${y}) alcanzable sin Trepar`);
  for (let y = RUTA10.west.y0; y <= RUTA10.west.y1; y++) assert.ok(!low.has(0, y), 'el campamento del Monte sin Trepar');
  assert.deepEqual(low.traps(), [], 'casillas trampa en el tramo bajo');
  const high = await reach('ruta_10', ENTRY_R10, { climb: true });
  assert.ok(high.has(...RUTA10.climb.to), 'lo alto de la pared de raíces');
  for (let y = RUTA10.west.y0; y <= RUTA10.west.y1; y++) assert.ok(high.has(0, y), 'salida al campamento con Trepar');
  const c049 = B11_CELLS.find((c) => c.code === 'C049');
  assert.ok(high.has(c049.x, c049.y), 'C049 en la repisa (Trepar)');
  assert.ok(high.has(...RUTA10.cornisa.to), 'la cornisa del dormidero (Trepar)');
  assert.deepEqual(high.traps(), [], 'casillas trampa con Trepar');
});

test('Ruta 10: la repisa y la cornisa solo se alcanzan por sus paredes de raíces', async () => {
  const noLedge = await reach('ruta_10', ENTRY_R10, { climb: true, erase: ['pared_repisa', 'pared_cornisa'] });
  assert.ok(noLedge.has(...RUTA10.climb.to));
  assert.ok(!noLedge.has(...RUTA10.ledge.to), 'la repisa de C049 sin su pared');
  assert.ok(!noLedge.has(...RUTA10.cornisa.to), 'la cornisa sin su pared');
  assert.ok(!noLedge.has(RUTA10.roost.plate.x, RUTA10.roost.plate.y), 'el dormidero sin la cornisa');
});

test('Ruta 10: objetos y entrenadores al alcance con las capacidades de su tramo', async () => {
  const low = await reach('ruta_10', ENTRY_R10);
  const high = await reach('ruta_10', ENTRY_R10, { climb: true });
  for (const ev of high.env.world.events) {
    if (!ev.def?.item && ev.def?.type !== 'trainer') continue;
    const r = ev.y >= 17 ? low : high;
    assert.ok(canUse(r, ev.x, ev.y), `${ev.id} en (${ev.x},${ev.y}) inalcanzable`);
  }
  // La cuadrilla, el Alfa y la Tablilla se alcanzan en la cornisa (T10).
  const flags = ['b11_t10_alfa'];
  const after = await reach('ruta_10', ENTRY_R10, { climb: true, flags });
  for (const c of RUTA10.crew) assert.ok(canUse(high, c.x, c.y), 'cuadrilla');
  assert.ok(canUse(high, RUTA10.roost.alfa.x, RUTA10.roost.alfa.y), 'Honchkrow Alfa');
  assert.ok(canUse(after, RUTA10.roost.plate.x, RUTA10.roost.plate.y), 'Tabla Oscura');
});

// ------------------------------------------------------------------ sigilo (T10)

/** Casillas que ve cada centinela en cada dirección (con la pasabilidad del mundo). */
async function sentinelSight() {
  const env = await setup('ruta_10', { climb: true });
  const sight = new Map();
  for (const s of SENTINELS) {
    const ev = env.world.events.find((e) => e.id === s.id);
    assert.ok(ev && ev.page, `centinela ${s.id} activo`);
    const byDir = {};
    for (const d of [2, 4, 6, 8]) {
      ev.direction = d;
      const n = sightReach(ev, SIGHT);
      byDir[d] = new Set(Array.from({ length: n }, (_, i) => key(s.x + DV[d][0] * (i + 1), s.y + DV[d][1] * (i + 1))));
    }
    sight.set(s.id, byDir);
  }
  return { env, sight };
}

const STEP = 16; // fotogramas por casilla a pie (Essentials, velocidad 4)

function watchedAt(sight, frame) {
  const out = new Set();
  for (const s of SENTINELS) for (const k of sight.get(s.id)[sentinelDir(s, frame)]) out.add(k);
  return out;
}
const safeDuring = (sight, k, t0, t1) => {
  for (let t = t0; t <= t1; t += 4) if (watchedAt(sight, t).has(k)) return false;
  return true;
};

test('T10: los centinelas cierran el paso si miran a todas partes y el sigilo tiene solución con su reloj', async () => {
  const { env, sight } = await sentinelSight();
  const start = [RUTA10.safe.x, RUTA10.safe.y];
  const goal = key(...RUTA10.cornisa.from);
  // 1) Si vigilaran todas las direcciones a la vez, no habría paso: el sigilo es una puerta real.
  const all = new Set();
  for (const byDir of sight.values()) for (const set of Object.values(byDir)) for (const k of set) all.add(k);
  const seen = new Set([key(...start)]);
  const q = [start];
  while (q.length) {
    const [x, y] = q.shift();
    for (const [nx, ny] of neighbours(env, x, y)) {
      const k = key(nx, ny);
      if (seen.has(k) || all.has(k)) continue;
      seen.add(k); q.push([nx, ny]);
    }
  }
  assert.ok(!seen.has(goal), 'hay un camino a la cornisa que ningún centinela vigila nunca');
  // 2) Con el reloj real (y esperando cuando haga falta), se llega desde cualquier fase del ciclo.
  const HORIZON = 4000;
  for (let phase = 0; phase < 900; phase += 75) {
    const visited = new Set();
    const queue = [[...start, phase]];
    let found = false;
    while (queue.length && !found) {
      const [x, y, t] = queue.shift();
      if (t - phase > HORIZON) continue;
      const moves = [[x, y], ...neighbours(env, x, y)];
      for (const [nx, ny] of moves) {
        const nk = key(nx, ny);
        const nt = t + STEP;
        if (!safeDuring(sight, key(x, y), t, nt) || !safeDuring(sight, nk, t, nt)) continue;
        const vk = `${nk},${nt % 16800}`;
        if (visited.has(vk)) continue;
        visited.add(vk);
        if (nk === goal) { found = true; break; }
        queue.push([nx, ny, nt]);
      }
    }
    assert.ok(found, `sin solución de sigilo empezando en la fase ${phase}`);
  }
});

// ------------------------------------------------------------------ Bosque Neblino

const ENTRY_NEB = [NEBLINO.north.x0 + 1, 1];

test('Neblino: la niebla del olvido corta el bosque hasta el P5 (G7)', async () => {
  const fog = await reach('ruta_9_neblino', ENTRY_NEB, { blockPrefix: ['niebla_'] });
  for (let x = NEBLINO.south.x0; x <= NEBLINO.south.x1; x++) assert.ok(!fog.has(x, NEBLINO.south.y), 'la salida a Mnemos antes del P5');
  assert.ok(!fog.has(NEBLINO.bridge.x0 + 1, NEBLINO.bridge.y0 + 2), 'el puente antes del P5');
  const clear = await reach('ruta_9_neblino', ENTRY_NEB, { flags: ['p5_restored'], blockPrefix: ['niebla_'] });
  for (let x = NEBLINO.south.x0; x <= NEBLINO.south.x1; x++) assert.ok(clear.has(x, NEBLINO.south.y), `salida a Mnemos (${x}) tras el P5`);
  assert.deepEqual(clear.traps(), [], 'casillas trampa');
});

test('Neblino: antes del P5 no hay hierba alta al norte de la niebla (se pisa desde la Ruta 10 baja con nivel ~5)', async () => {
  const fog = await reach('ruta_9_neblino', ENTRY_NEB, { blockPrefix: ['niebla_'] });
  const tallGrass = [];
  for (const k of fog.seen) {
    const [x, y] = k.split(',').map(Number);
    const tag = fog.env.map.terrainTagAt(x, y);
    if (tag?.landWildEncounters || tag?.id === 'TallGrass' || tag?.id === 'Grass') tallGrass.push(k);
  }
  assert.deepEqual(tallGrass, [], 'hierba alta (nivel 37–43) alcanzable antes del P5');
  // Las franjas de niebla cubren todas las casillas transitables de sus filas.
  const walk = await reach('ruta_9_neblino', ENTRY_NEB, { flags: ['p5_restored'], climb: true });
  for (const band of [NEBLINO.loopNorth, NEBLINO.loopSouth]) {
    for (let x = 0; x < NEBLINO.width; x++) {
      if (walk.has(x, band.y)) assert.ok(x >= band.x0 && x <= band.x1, `(${x},${band.y}) transitable fuera de la franja de niebla`);
    }
  }
});

test('Neblino: células con Trepar; objetos, entrenadores, hoguera y escondite de Nilo al alcance', async () => {
  const flags = ['p5_restored'];
  const walk = await reach('ruta_9_neblino', ENTRY_NEB, { flags });
  const climb = await reach('ruta_9_neblino', ENTRY_NEB, { flags, climb: true });
  for (const c of B11_CELLS.filter((cell) => cell.map === 'ruta_9_neblino')) {
    assert.ok(!walk.has(c.x, c.y), `${c.code} sin Trepar`);
    assert.ok(climb.has(c.x, c.y), `${c.code} con Trepar`);
  }
  for (const ev of walk.env.world.events) {
    if (!ev.def?.item && ev.def?.type !== 'trainer') continue;
    assert.ok(canUse(walk, ev.x, ev.y), `${ev.id} en (${ev.x},${ev.y}) inalcanzable`);
  }
  assert.ok(canUse(walk, NEBLINO.camp.fire.x, NEBLINO.camp.fire.y), 'hoguera (descanso)');
  assert.ok(canUse(walk, NEBLINO.nilo.x, NEBLINO.nilo.y), 'escondite de Nilo');
  assert.deepEqual(climb.traps(), [], 'casillas trampa con Trepar');
});

// ------------------------------------------------------------------ campamento del Monte

const ENTRY_CAMP = [CAMP.east.x - 1, CAMP.east.y0 + 1];

test('Campamento: la senda del Monte está cerrada mientras Genesis trabaja y se abre al marcharse', async () => {
  const busy = await reach('campamento_monte', ENTRY_CAMP);
  for (let x = CAMP.trail.x0; x <= CAMP.trail.x1; x++) assert.ok(!busy.has(x, CAMP.trail.y), `senda (${x}) abierta con el campamento activo`);
  for (const [x, y] of CAMP.crates) assert.ok(canUse(busy, x, y), 'cajas EXP-03');
  assert.ok(canUse(busy, CAMP.chief.x, CAMP.chief.y), 'jefa de campo');
  assert.ok(canUse(busy, CAMP.perimeter.guard.x, CAMP.perimeter.guard.y), 'técnico del perímetro');
  const gone = await reach('campamento_monte', ENTRY_CAMP, { flags: ['b11_exp03', 'b11_gael_alerce'] });
  for (let x = CAMP.trail.x0; x <= CAMP.trail.x1; x++) assert.ok(gone.has(x, CAMP.trail.y), `senda (${x}) tras la marcha`);
  assert.ok(gone.has(CAMP.duelSpot.x, CAMP.duelSpot.y), 'casilla del combate B4');
  assert.deepEqual(gone.traps(), [], 'casillas trampa');
});

// ------------------------------------------------------------------ Cerro del Alba, casa de Íker y pozo

test('Cerro del Alba: la cornisa (C054) y la cima exigen Trepar; se vuelve a bajar', async () => {
  const walk = await reach('cerro_alba', [CERRO.entry.x, CERRO.entry.y]);
  const cell = B11_CELLS.find((c) => c.code === 'C054');
  assert.ok(!walk.has(cell.x, cell.y), 'C054 sin Trepar');
  const climb = await reach('cerro_alba', [CERRO.entry.x, CERRO.entry.y], { climb: true });
  assert.ok(climb.has(cell.x, cell.y), 'C054 con Trepar');
  assert.ok(canUse(climb, CERRO.brazier.x, CERRO.brazier.y), 'el brasero de la cima');
  for (let x = CERRO.exit.x0; x <= CERRO.exit.x1; x++) assert.ok(walk.has(x, CERRO.exit.y), 'bajada a la Ruta 1');
  for (const ev of climb.env.world.events) if (ev.def?.item) assert.ok(canUse(climb, ev.x, ev.y), `${ev.id} inalcanzable`);
  assert.deepEqual(climb.traps(), [], 'casillas trampa');
});

test('Casa de Íker y pozo de los Custodios: personajes, dibujos y Tabla Mental al alcance', async () => {
  const house = await reach('mnemos_casa_iker', [IKER.door.x, IKER.door.y], { flags: ['p5_restored'] });
  for (const p of [IKER.iker, IKER.mother, IKER.elder, IKER.plan, ...IKER.drawings]) assert.ok(canUse(house, p.x, p.y), `(${p.x},${p.y}) en la casa de Íker`);
  const well = await reach('mnemos_pozo_custodios', [POZO.entry.x, POZO.entry.y]);
  assert.ok(canUse(well, POZO.plate.x, POZO.plate.y), 'Tabla Mental');
  assert.ok(canUse(well, POZO.exit.x, POZO.exit.y), 'salida del pozo');
});

test('Villa Alba y laboratorio (B01): los añadidos del B11 no cierran el paso', async () => {
  const flags = ['b01_dex_received', 'b01_left_town', 'p5_restored'];
  const lab = await reach('laboratorio_alerce', [9, 13], { flags });
  assert.ok(canUse(lab, 10, 8), 'Alerce se alcanza con Gael en la sala');
  const town = await reach('villa_alba', [22, 34], { flags });
  assert.ok(canUse(town, 38, 20), 'la vecina del laboratorio');
  assert.ok(town.has(37, 19), 'la puerta del laboratorio');
});
