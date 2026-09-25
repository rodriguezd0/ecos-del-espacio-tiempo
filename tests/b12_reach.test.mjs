// Bloque 12 — alcanzabilidad a pie (docs/CAMPANA.md B12, §2.5 G8/G9): BFS con la pasabilidad real del mundo (tiles
// + eventos sólidos) y las mecánicas del espacio imposible (world/impossible/): el vacío (casilla sin suelo) no se
// pisa —se cae—, las aristas cambian de orientación (mapa gemelo, casilla girada), los puentes de La Mirada solo se
// cruzan en línea recta (girar encima hace caer), las cascadas invertidas son aristas de un solo sentido que abre su
// pulsador y caer devuelve al último poste. Comprueba que ninguna puerta de capacidad o de historia se salta, que no
// hay casillas trampa y que objetos, células y salidas se alcanzan con las capacidades de su momento.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { World } from '../game/src/world/world.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import { isVoidCell, rotatePoint } from '../game/src/world/impossible/logic.js';
import { MONTE, GRUTA, VESTIBULO, MIRADA, SUMIDERO, NUCLEO } from '../game/src/content/maps/b12/layout.js';
import { facetRoom, facetMapId, FACET_ROOM_IDS } from '../game/src/content/maps/b12/rooms.js';
import { B12_CELLS } from '../game/src/content/events/b12_cells.js';
import { roomEntry } from '../game/src/content/events/b12_cara.js';
import { CASILDA_SPOT } from '../game/src/content/events/b12_mundo.js';

const DV = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };
const key = (x, y) => `${x},${y}`;
const B01 = ['b01_woke', 'b01_met_mom', 'b01_lab_intro_seen', 'b01_starter_chosen', 'b01_signal_heard', 'b01_police_entered',
  'b01_core_found', 'b01_escorted', 'b01_gael_duel_done', 'b01_mom_gift', 'b01_dex_received', 'b01_left_town'];
const ENTRY_FLAGS = [...B01, 'p1_restored', 'p2_restored', 'p3_restored', 'p4_restored', 'p5_restored', 'b11_exp03', 'b11_gael_alerce', 'b11_gael_b4'];

/** Mundo del mapa con flags. opts: flags, climb (aristas de Trepar), swim (agua navegable), erase (prefijos). */
async function setup(mapId, { flags = [], climb = false, swim = false, erase = [] } = {}) {
  const state = GameState.create({ name: 'Prueba' });
  for (const f of flags) state.setFlag(f);
  const built = await buildMapNode(mapId);
  const world = new World({ state });
  world.setCurrent({ ...built.entry, events: null });
  for (const ev of world.events) if (erase.some((p) => String(ev.id).startsWith(p))) ev.erased = true;
  const climbEdges = new Map();
  if (climb) {
    for (const ev of world.events) {
      const to = ev.def?.to;
      if (ev.erased || !ev.page || !Array.isArray(to) || ev.def?.type !== 'climbWall') continue;
      const fx = ev.x + Math.sign(ev.x - to[0]);
      const fy = ev.y + Math.sign(ev.y - to[1]);
      if (!climbEdges.has(key(fx, fy))) climbEdges.set(key(fx, fy), []);
      climbEdges.get(key(fx, fy)).push(to);
    }
  }
  return { state, world, map: built.entry.map, def: built.def, climbEdges, swim };
}

const solidAt = (env, x, y) => env.world.events.some((ev) => !ev.erased && ev.page && !ev.through && (ev.characterName || ev.solid) && ev.x === x && ev.y === y);

/** Vecinos a pie (sin pisar el vacío), por Trepar y, con Nadar, por el agua. */
function neighbours(env, x, y) {
  const { world, map, climbEdges, swim } = env;
  const p = world.player;
  const out = [];
  for (const d of [2, 4, 6, 8]) {
    let nx = x + DV[d][0];
    let ny = y + DV[d][1];
    if (!map.valid(nx, ny) || isVoidCell(map, nx, ny) && env.def.impossible) continue;
    const water = map.terrainTagAt(nx, ny).canSurf;
    if (water && swim) {
      if (!solidAt(env, nx, ny)) out.push([nx, ny]);
      continue;
    }
    p.x = x; p.y = y;
    p.surfing = Boolean(swim && map.terrainTagAt(x, y).canSurf);
    if (p.surfing) {
      // saliendo del agua a tierra
      if (!map.playerPassable(nx, ny, 10 - d, {}) || solidAt(env, nx, ny)) continue;
      out.push([nx, ny]);
      continue;
    }
    if (!p.passable(x, y, d)) continue;
    if (map.terrainTagAt(nx, ny, 0).ledge) { nx += DV[d][0]; ny += DV[d][1]; }
    if (map.valid(nx, ny)) out.push([nx, ny]);
  }
  p.surfing = false;
  for (const to of climbEdges.get(key(x, y)) || []) out.push(to);
  return out;
}

function bfs(env, starts, next = (x, y) => neighbours(env, x, y)) {
  const seen = new Set(starts.map(([x, y]) => key(x, y)));
  const q = [...starts];
  while (q.length) {
    const [x, y] = q.shift();
    for (const [nx, ny] of next(x, y)) {
      const k = key(nx, ny);
      if (seen.has(k)) continue;
      seen.add(k);
      q.push([nx, ny]);
    }
  }
  return seen;
}

async function reach(mapId, start, opts = {}) {
  const env = await setup(mapId, opts);
  const seen = bfs(env, [start]);
  const has = (x, y) => seen.has(key(x, y));
  const traps = () => {
    const back = new Map();
    for (const k of seen) {
      const [x, y] = k.split(',').map(Number);
      for (const [nx, ny] of neighbours(env, x, y)) {
        if (!back.has(key(nx, ny))) back.set(key(nx, ny), []);
        back.get(key(nx, ny)).push(k);
      }
    }
    const ok = new Set([key(...start)]);
    const q = [key(...start)];
    while (q.length) for (const pk of back.get(q.shift()) || []) if (!ok.has(pk)) { ok.add(pk); q.push(pk); }
    return [...seen].filter((k) => !ok.has(k));
  };
  return { has, seen, env, traps };
}

/** ¿Se puede interactuar con (x, y)? (pisándolo o desde una vecina alcanzable) */
const canUse = (r, x, y) => r.has(x, y) || [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => r.has(x + dx, y + dy));

// ───────────────────────────── Monte del Portal ─────────────────────────────

const ARRIVAL = [MONTE.arrival.x, MONTE.arrival.y];

test('Monte: la escalinata lleva al aljibe; C050 y C051 a pie; la repisa exige Trepar y la poza (C076) Nadar', async () => {
  const flags = ENTRY_FLAGS;
  const walk = await reach('montana_portal', ARRIVAL, { flags });
  assert.ok(walk.has(MONTE.aljibeFront.x, MONTE.aljibeFront.y), 'delante del aljibe');
  const c050 = B12_CELLS.find((c) => c.code === 'C050');
  const c051 = B12_CELLS.find((c) => c.code === 'C051');
  const c076 = B12_CELLS.find((c) => c.code === 'C076');
  assert.ok(walk.has(c050.x, c050.y), 'C050 en la explanada quemada');
  assert.ok(walk.has(c051.x, c051.y), 'C051 a mitad de la escalinata (obligatoria)');
  assert.ok(!walk.has(...MONTE.climb.top), 'la repisa de la cascada sin Trepar');
  assert.ok(!walk.has(c076.x, c076.y), 'C076 sin Nadar');
  for (let x = 16; x <= 18; x++) assert.ok(walk.has(x, 49), 'la senda de vuelta al campamento');
  assert.deepEqual(walk.traps(), [], 'casillas trampa a pie');
  const climb = await reach('montana_portal', ARRIVAL, { flags, climb: true });
  assert.ok(climb.has(...MONTE.climb.top), 'la repisa con Trepar');
  assert.ok(canUse(climb, MONTE.grutaDoor.x, MONTE.grutaDoor.y), 'la boca de la gruta');
  for (const ev of climb.env.world.events) {
    if (ev.def?.type !== 'item' || !ev.page) continue;
    assert.ok(canUse(climb, ev.x, ev.y), `${ev.id} en (${ev.x},${ev.y}) inalcanzable con Trepar`);
  }
  assert.deepEqual(climb.traps(), [], 'casillas trampa con Trepar');
  const swim = await reach('montana_portal', ARRIVAL, { flags: [...flags, 'p6_restored'], climb: true, swim: true });
  assert.ok(swim.has(c076.x, c076.y), 'C076 nadando en la poza');
});

test('Monte: los añadidos del B12 no existen en el prólogo (partida provisional sin flags)', async () => {
  const env = await setup('montana_portal');
  const b12 = env.world.events.filter((ev) => String(ev.id).startsWith('b12_') || String(ev.id).startsWith('cell_') || String(ev.id).startsWith('objeto_'));
  assert.ok(b12.length > 20);
  for (const ev of b12) assert.ok(!ev.page, `${ev.id} visible en el prólogo`);
});

test('Gruta del Monte: objetos y salida al alcance, sin trampas', async () => {
  const r = await reach('monte_gruta', [GRUTA.entry.x, GRUTA.entry.y]);
  for (const it of GRUTA.items) assert.ok(canUse(r, it.x, it.y), `${it.id} inalcanzable`);
  assert.ok(canUse(r, GRUTA.door.x, GRUTA.door.y), 'salida');
  assert.deepEqual(r.traps(), []);
});

// ───────────────────────────── La explanada interior ─────────────────────────────

test('Explanada interior: el aljibe, el Ancla, el portal a La Cara Vuelta y los objetos al alcance; sin trampas', async () => {
  const r = await reach('pilar_invertido', [VESTIBULO.arrival.x, VESTIBULO.arrival.y], { flags: ENTRY_FLAGS });
  for (const [x, y, what] of [[VESTIBULO.aljibe.x, VESTIBULO.aljibe.y, 'aljibe'], [VESTIBULO.anchor.x, VESTIBULO.anchor.y, 'Ancla'],
    [VESTIBULO.portalCara.x, VESTIBULO.portalCara.y, 'portal'], [VESTIBULO.returnArrival.x, VESTIBULO.returnArrival.y, 'llegada del núcleo']]) {
    assert.ok(canUse(r, x, y), `${what} en (${x},${y})`);
  }
  for (const it of VESTIBULO.items) assert.ok(canUse(r, it.x, it.y), it.id);
  assert.deepEqual(r.traps(), []);
});

// ───────────────────────────── La Cara Vuelta ─────────────────────────────

/**
 * BFS de estados (mapa, x, y) sobre los dos gemelos construidos: a pie por el suelo de cada orientación y, al pisar
 * una arista, al gemelo en la casilla girada (las Anclas son postes: no se pisan).
 */
async function facetReach(roomId) {
  const envs = [await setup(facetMapId(roomId, 0), { flags: ENTRY_FLAGS }), await setup(facetMapId(roomId, 1), { flags: ENTRY_FLAGS })];
  const aristas = envs.map((env) => new Set(env.world.events.filter((ev) => ev.def?.type === 'arista').map((ev) => key(ev.x, ev.y))));
  const k = (o, x, y) => `${o}:${x},${y}`;
  const next = (o, x, y) => {
    const out = [];
    for (const [nx, ny] of neighbours(envs[o], x, y)) {
      if (aristas[o].has(key(nx, ny))) {
        const m = envs[o].map;
        const [tx, ty] = rotatePoint(nx, ny, m.width, m.height, o ? -1 : 1);
        out.push([1 - o, tx, ty]);
      } else out.push([o, nx, ny]);
    }
    return out;
  };
  const e = roomEntry(roomId);
  const seen = new Set([k(0, e.x, e.y)]);
  const q = [[0, e.x, e.y]];
  while (q.length) {
    const [o, x, y] = q.shift();
    for (const [no, nx, ny] of next(o, x, y)) {
      if (seen.has(k(no, nx, ny))) continue;
      seen.add(k(no, nx, ny));
      q.push([no, nx, ny]);
    }
  }
  return { envs, seen, next, k, start: [0, e.x, e.y] };
}

test('La Cara Vuelta: cada sala se resuelve girando y NO sin girar; sin estados trampa', async () => {
  for (const roomId of FACET_ROOM_IDS) {
    const r = await facetReach(roomId);
    const exits = r.envs.map((env) => env.world.events.find((ev) => ev.id === 'b12_cara_salida'));
    const reachedExit = [0, 1].some((o) => r.seen.has(r.k(o, exits[o].x, exits[o].y)));
    assert.ok(reachedExit, `${roomId}: la salida no se alcanza`);
    // Sin aristas (sin girar) la salida queda fuera: la veta es la puerta de la sala.
    const flat = bfs(r.envs[0], [[r.start[1], r.start[2]]], (x, y) => neighbours(r.envs[0], x, y)
      .filter(([nx, ny]) => !r.envs[0].world.events.some((ev) => ev.def?.type === 'arista' && ev.x === nx && ev.y === ny)));
    assert.ok(!flat.has(key(exits[0].x, exits[0].y)), `${roomId}: se llega a la salida sin girar`);
    // Sin trampas: desde cualquier estado alcanzable se vuelve a la llegada.
    const back = new Map();
    for (const s of r.seen) {
      const [o, xy] = s.split(':');
      const [x, y] = xy.split(',').map(Number);
      for (const [no, nx, ny] of r.next(Number(o), x, y)) {
        const nk = r.k(no, nx, ny);
        if (!back.has(nk)) back.set(nk, []);
        back.get(nk).push(s);
      }
    }
    const ok = new Set([r.k(...r.start)]);
    const q = [r.k(...r.start)];
    while (q.length) for (const pk of back.get(q.shift()) || []) if (!ok.has(pk)) { ok.add(pk); q.push(pk); }
    const traps = [...r.seen].filter((s) => !ok.has(s));
    assert.deepEqual(traps, [], `${roomId}: estados sin vuelta`);
    // Objetos y célula de la sala (en su orientación) al alcance.
    for (const o of [0, 1]) {
      for (const ev of r.envs[o].world.events) {
        if (ev.def?.type !== 'item' && ev.def?.type !== 'zygardeCell') continue;
        const near = [[0, 0], [0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => r.seen.has(r.k(o, ev.x + dx, ev.y + dy)));
        assert.ok(near, `${roomId}: ${ev.id} inalcanzable`);
      }
    }
  }
});

test('La Cara Vuelta: C052 está en el gemelo girado de la segunda sala (registro de células)', async () => {
  const c = B12_CELLS.find((cell) => cell.code === 'C052');
  assert.equal(c.map, 'pilar_invertido_cara_2_giro');
  const room = facetRoom('cara_2');
  assert.equal(room.cellOrient, 1);
});

// ───────────────────────────── La Mirada ─────────────────────────────

test('La Mirada: la salida exige los puentes y se alcanza girando solo sobre islotes; sin trampas', async () => {
  const env = await setup('pilar_invertido_mirada', { flags: ENTRY_FLAGS });
  const bridges = new Set(env.world.events.filter((ev) => ev.def?.type === 'puenteMirada').map((ev) => key(ev.x, ev.y)));
  const floorAt = (x, y) => !isVoidCell(env.map, x, y);
  const blocked = (x, y) => solidAt(env, x, y) || (floorAt(x, y) && !env.map.passableStrict(x, y));
  // Estados (x, y, dir): girar solo en suelo firme; avanzar a suelo o a puente (siempre visible a 1 casilla).
  const k = (x, y, d) => `${x},${y},${d}`;
  const next = (x, y, d) => {
    const out = [];
    if (floorAt(x, y)) for (const nd of [2, 4, 6, 8]) if (nd !== d) out.push([x, y, nd]);
    const nx = x + DV[d][0];
    const ny = y + DV[d][1];
    if (env.map.valid(nx, ny) && (floorAt(nx, ny) || bridges.has(key(nx, ny))) && !blocked(nx, ny)) out.push([nx, ny, d]);
    return out;
  };
  const start = [MIRADA.start.x, MIRADA.start.y, 8];
  const seen = new Set([k(...start)]);
  const q = [start];
  while (q.length) {
    const s = q.shift();
    for (const n of next(...s)) if (!seen.has(k(...n))) { seen.add(k(...n)); q.push(n); }
  }
  const at = (x, y) => [2, 4, 6, 8].some((d) => seen.has(k(x, y, d)));
  const near = (x, y) => [[0, 0], [0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => at(x + dx, y + dy));
  assert.ok(near(MIRADA.exit.x, MIRADA.exit.y), 'la salida de La Mirada');
  for (const it of MIRADA.items) assert.ok(near(it.x, it.y), `${it.id} inalcanzable`);
  for (const a of MIRADA.anchors) assert.ok(near(a.x, a.y), `${a.id} inalcanzable`);
  // Sin puentes (solo islas) no se sale de la isla de llegada.
  const islands = bfs(env, [[MIRADA.start.x, MIRADA.start.y]]);
  assert.ok(!islands.has(key(MIRADA.exit.x, MIRADA.exit.y)), 'se llega a la salida sin puentes');
  // Cada estado alcanzable puede volver a la llegada (los puentes se desandan girando en el islote del extremo).
  const back = new Map();
  for (const s of seen) for (const n of next(...s.split(',').map(Number))) {
    const nk = k(...n);
    if (!back.has(nk)) back.set(nk, []);
    back.get(nk).push(s);
  }
  const ok = new Set([...[2, 4, 6, 8].map((d) => k(start[0], start[1], d))].filter((s) => seen.has(s)));
  const bq = [...ok];
  while (bq.length) for (const pk of back.get(bq.shift()) || []) if (!ok.has(pk)) { ok.add(pk); bq.push(pk); }
  assert.deepEqual([...seen].filter((s) => !ok.has(s)), [], 'estados trampa');
});

// ───────────────────────────── El Sumidero ─────────────────────────────

/**
 * Alcance en El Sumidero con unos pulsadores pulsados: a pie + cascadas abiertas (pisar la base sube a la cima: un
 * solo sentido). Caer devuelve a un poste YA alcanzado (la llegada o una Ancla tocada), así que no añade casillas nuevas;
 * `next` (con caídas) sirve para comprobar que desde cualquier sitio se puede volver.
 */
async function sumideroReach(pressed) {
  const env = await setup('pilar_invertido_sumidero', { flags: [...ENTRY_FLAGS, ...pressed] });
  const lifts = new Map();
  for (const f of SUMIDERO.falls) if (pressed.includes(f.flag)) lifts.set(key(f.base.x, f.base.y), [f.top.x, f.top.y]);
  const walk = (x, y) => {
    const out = [];
    for (const [nx, ny] of neighbours(env, x, y)) out.push(lifts.get(key(nx, ny)) || [nx, ny]);
    return out;
  };
  const seen = bfs(env, [[SUMIDERO.start.x, SUMIDERO.start.y]], walk);
  const posts = [[SUMIDERO.start.x, SUMIDERO.start.y], ...SUMIDERO.anchors.map((a) => [a.x + 1, a.y]).filter(([x, y]) => seen.has(key(x, y)))];
  const edgeOfVoid = (x, y) => [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => isVoidCell(env.map, x + dx, y + dy));
  const next = (x, y) => [...walk(x, y), ...(edgeOfVoid(x, y) ? posts : [])];
  return { has: (x, y) => seen.has(key(x, y)), seen, env, next, walk };
}

test('El Sumidero: cada cascada exige su pulsador; el tercero obliga a caer para bajar; C053, Gengarita y salida', async () => {
  const [p1, p2, p3] = SUMIDERO.falls.map((f) => f.flag);
  const btn = (i) => SUMIDERO.buttons[i];
  const none = await sumideroReach([]);
  assert.ok(canUse(none, btn(0).x, btn(0).y), 'el primer pulsador desde la llegada');
  assert.ok(!none.has(SUMIDERO.falls[0].top.x, SUMIDERO.falls[0].top.y), 'la isla media sin abrir la primera cascada');
  const one = await sumideroReach([p1]);
  assert.ok(canUse(one, btn(1).x, btn(1).y), 'el segundo pulsador tras la primera cascada');
  assert.ok(!one.has(SUMIDERO.falls[1].top.x, SUMIDERO.falls[1].top.y), 'la isla alta sin la segunda cascada');
  const two = await sumideroReach([p1, p2]);
  assert.ok(canUse(two, btn(2).x, btn(2).y), 'el tercer pulsador en la isla alta');
  assert.ok(canUse(two, SUMIDERO.cell.x, SUMIDERO.cell.y), 'C053');
  assert.ok(canUse(two, SUMIDERO.gengarita.x, SUMIDERO.gengarita.y), 'la Gengarita en el rincón');
  assert.ok(!two.has(SUMIDERO.exit.x, SUMIDERO.exit.y), 'la salida sin la tercera cascada');
  const all = await sumideroReach([p1, p2, p3]);
  assert.ok(all.has(SUMIDERO.exit.x, SUMIDERO.exit.y), 'la salida con las tres');
  for (const it of SUMIDERO.items) assert.ok(canUse(all, it.x, it.y), it.id);
  // Desde la isla alta no se baja a pie ni por cascada: solo cayendo.
  const noFall = bfs(all.env, [[SUMIDERO.falls[1].top.x, SUMIDERO.falls[1].top.y]], all.walk);
  assert.ok(!noFall.has(key(SUMIDERO.falls[2].base.x, SUMIDERO.falls[2].base.y)), 'bajada a pie desde la isla alta');
  const withFall = bfs(all.env, [[SUMIDERO.falls[1].top.x, SUMIDERO.falls[1].top.y]], all.next);
  assert.ok(withFall.has(key(SUMIDERO.exit.x, SUMIDERO.exit.y)), 'dejándose caer se llega a la salida');
  // Sin trampas: todo lo alcanzable tiene un borde con vacío (caer siempre devuelve a un poste) o vuelve a pie.
  for (const k of all.seen) {
    const [x, y] = k.split(',').map(Number);
    const back = bfs(all.env, [[x, y]], all.next);
    assert.ok(back.has(key(SUMIDERO.start.x, SUMIDERO.start.y)), `(${x},${y}) sin vuelta a la llegada`);
  }
});

// ───────────────────────────── Núcleo ─────────────────────────────

test('Núcleo: las tres Anclas y el sello al alcance; el portal de regreso aparece al restaurar', async () => {
  const r = await reach('pilar_invertido_nucleo', [NUCLEO.arrival.x, NUCLEO.arrival.y], { flags: ENTRY_FLAGS });
  for (const a of NUCLEO.anchors) assert.ok(canUse(r, a.x, a.y), `${a.id}`);
  assert.ok(canUse(r, NUCLEO.seal.x, NUCLEO.seal.y + 1) || canUse(r, NUCLEO.seal.x, NUCLEO.seal.y), 'el sello');
  const env = await setup('pilar_invertido_nucleo', { flags: ENTRY_FLAGS });
  assert.ok(!env.world.events.find((ev) => ev.id === 'b12_portal_regreso').page, 'portal de regreso antes de restaurar');
  const after = await setup('pilar_invertido_nucleo', { flags: [...ENTRY_FLAGS, 'p6_restored'] });
  assert.ok(after.world.events.find((ev) => ev.id === 'b12_portal_regreso').page, 'portal de regreso tras restaurar');
  assert.ok(r.has(NUCLEO.portalBack.x, NUCLEO.portalBack.y), 'la casilla del portal de regreso');
  assert.deepEqual(r.traps(), []);
});

// ───────────────────────────── Villa Zaguán y Villa Alba ─────────────────────────────

test('Villa Zaguán: Casilda (Lucarita) solo tras el P6 y al alcance; Villa Alba sigue transitable', async () => {
  const flags = [...ENTRY_FLAGS, 'b02_salida'];
  const before = await setup('villa_zaguan', { flags });
  assert.ok(!before.world.events.find((ev) => ev.id === 'b12_casilda').page, 'Casilda en la calle antes del P6');
  const r = await reach('villa_zaguan', [19, 1], { flags: [...flags, 'p6_restored'] });
  assert.ok(r.env.world.events.find((ev) => ev.id === 'b12_casilda').page, 'Casilda en la calle tras el P6');
  assert.ok(canUse(r, CASILDA_SPOT.x, CASILDA_SPOT.y), 'Casilda al alcance');
  const town = await reach('villa_alba', [22, 34], { flags: [...ENTRY_FLAGS, 'b11_regreso'] });
  assert.ok(town.has(37, 19), 'la puerta del laboratorio');
});
