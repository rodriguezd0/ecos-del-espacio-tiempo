// Bloque 8 — Pilar de la Masa: recorrido a pie (BFS con la pasabilidad real del mundo: tiles + eventos sólidos +
// saltos de saliente; montado, con la montura del 10 %) que demuestra que las puertas de historia y de capacidad no
// se pueden saltar, que no hay casillas trampa y que todo objeto, célula y entrenador obligatorio es alcanzable con
// las capacidades de su momento (docs/CAMPANA.md B08, §2.3; TABLILLAS T05).
//   · Estrato: de la Ruta 6 se llega a todas las puertas, a la mina, a la Losa y a las salidas oeste (Ruta 7) y este.
//   · Mina Galena: el pozo lateral solo se alcanza pasando por los técnicos; el montacargas sigue tapado hasta el P4.
//   · Dunas: el Cerro Plomo y C037/C038 exigen Terreno complicado (ceniza honda en los tres vados).
//   · Cerro Plomo: la puerta del Pilar solo se alcanza con la verja abierta (tras Garrido y Fermín).
//   · Cámara: el mapa coincide casilla a casilla con el trazado del puzle; el núcleo solo tras la Balanza; el ala este
//     y la galería inferior (C039) solo montado; sin trampas con la montura.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { World } from '../game/src/world/world.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import { ESTRATO, MINA, HONDA, DUNAS, DUNAS_CUEVA, CERRO, P4_VERTICAL } from '../game/src/content/maps/b08/layout.js';
import { CELL, CAMARA_W, CAMARA_H, SPOTS, SOLID_EVENTS, cellAt } from '../game/src/content/events/b08_balance_logic.js';
import { B08_CELLS } from '../game/src/content/events/b08_cells.js';
import { F, V } from '../game/src/content/events/b08_common.js';

const DV = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };
const ABILITIES = ['run', 'ram', 'terrain']; // Correr (montura), Embestida y Terreno complicado: las de B08
const DONE = [
  'p3_restored', F.arrival, F.argument, F.mineSeen, F.techs, F.garridoMet, F.garrido, F.ferminCerro, F.gateOpen,
  F.balance, F.fermin, F.restored, F.ferminLeft, F.coop,
];

/** Mundo de un mapa con un estado preparado. opts: flags, vars, abilities, erase (prefijos de id), mounted. */
async function worldOf(mapId, { flags = [], vars = {}, abilities = ABILITIES, erase = [], mounted = false } = {}) {
  const state = GameState.create({ name: 'Prueba' });
  for (const f of flags) state.setFlag(f);
  for (const [k, v] of Object.entries(vars)) state.setVar(k, v);
  for (const a of abilities) state.setZygardeAbility(a, true);
  const { entry } = await buildMapNode(mapId);
  const world = new World({ state });
  world.setCurrent({ ...entry, events: null });
  for (const ev of world.events) if (erase.some((p) => String(ev.id).startsWith(p))) ev.erased = true;
  if (mounted) {
    world.zygMount = { riding: true, forced: false, form: '10', char: null, savedCharsets: null, combined: null, idleTick: 0 };
    world.refreshEvents();
  }
  return { world, map: entry.map, state };
}

/** Vecinas a las que se pasa desde (x, y) en ese mundo (con saltos de saliente). */
function neighbours(w, x, y) {
  const p = w.world.player;
  const out = [];
  for (const d of [2, 4, 6, 8]) {
    let nx = x + DV[d][0];
    let ny = y + DV[d][1];
    if (!w.map.valid(nx, ny)) continue;
    p.x = x; p.y = y;
    if (!p.passable(x, y, d)) continue;
    if (w.map.terrainTagAt(nx, ny, 0).ledge) { nx += DV[d][0]; ny += DV[d][1]; }
    if (w.map.valid(nx, ny)) out.push([nx, ny]);
  }
  return out;
}

/** Casillas alcanzables desde `start` (con el grafo, para buscar trampas). */
function reachFrom(w, start) {
  const seen = new Set([`${start[0]},${start[1]}`]);
  const edges = new Map();
  const queue = [start];
  while (queue.length) {
    const [x, y] = queue.shift();
    const next = neighbours(w, x, y);
    edges.set(`${x},${y}`, next.map(([a, b]) => `${a},${b}`));
    for (const [nx, ny] of next) {
      const k = `${nx},${ny}`;
      if (!seen.has(k)) { seen.add(k); queue.push([nx, ny]); }
    }
  }
  return { has: (x, y) => seen.has(`${x},${y}`), keys: [...seen], edges, start: `${start[0]},${start[1]}` };
}

/** Nodos alcanzables desde los que no se vuelve al inicio (búsqueda hacia atrás sobre el mismo grafo). */
function traps(r) {
  const back = new Map();
  for (const [from, list] of r.edges) for (const to of list) { if (!back.has(to)) back.set(to, []); back.get(to).push(from); }
  const ok = new Set([r.start]);
  const queue = [r.start];
  while (queue.length) for (const prev of back.get(queue.shift()) || []) if (!ok.has(prev)) { ok.add(prev); queue.push(prev); }
  return r.keys.filter((k) => !ok.has(k));
}

/** ¿Hay una casilla alcanzable desde la que interactuar con (x, y)? (encima o al lado) */
const touchable = (r, x, y) => r.has(x, y) || [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => r.has(x + dx, y + dy));

function assertEverythingReachable(w, r, label, { itemPrefix = 'objeto_', minItems = 1 } = {}) {
  const items = w.world.events.filter((e) => String(e.id).startsWith(itemPrefix));
  assert.ok(items.length >= minItems, `${label}: faltan objetos`);
  for (const ev of items) assert.ok(touchable(r, ev.x, ev.y), `${label}: objeto ${ev.id} en (${ev.x},${ev.y}) inalcanzable`);
  const trainers = w.world.events.filter((e) => String(e.def?.trainer || '').startsWith('b08_') && e.page && !e.erased);
  for (const ev of trainers) assert.ok(touchable(r, ev.x, ev.y), `${label}: entrenador ${ev.id} inalcanzable`);
}

// ───────────────────────────── Ciudad Estrato ─────────────────────────────

const ESTRATO_START = [28, 1];

test('Estrato: desde la Ruta 6 se llega a todas las puertas, la mina, la Losa y las salidas', async () => {
  for (const [label, flags] of [['al llegar', ['p3_restored']], ['al terminar', DONE]]) {
    const w = await worldOf('ciudad_estrato', { flags });
    const r = reachFrom(w, ESTRATO_START);
    for (const [id, b] of Object.entries(ESTRATO.buildings)) assert.ok(r.has(b.door.x, b.door.y + 1), `${label}: puerta ${id}`);
    assert.ok(r.has(ESTRATO.mine.door.x, ESTRATO.mine.door.y + 1), `${label}: boca de la mina`);
    assert.ok(r.has(ESTRATO.losa.front.x, ESTRATO.losa.front.y), `${label}: Losa del Pulso`);
    assert.ok(r.has(ESTRATO.trainArrival.x, ESTRATO.trainArrival.y), `${label}: llegada del tren`);
    assert.ok(r.has(ESTRATO.flyPoint.x, ESTRATO.flyPoint.y), `${label}: punto de Vuelo`);
    assert.ok([...Array(4).keys()].some((i) => r.has(ESTRATO.west.x, ESTRATO.west.y0 + i)), `${label}: salida a la Ruta 7`);
    assert.ok([...Array(4).keys()].some((i) => r.has(ESTRATO.east.x, ESTRATO.east.y0 + i)), `${label}: salida a las Dunas`);
    assertEverythingReachable(w, r, `Estrato ${label}`, { minItems: 3 });
    assert.deepEqual(traps(r), [], `${label}: casillas desde las que no se vuelve a la Ruta 6`);
  }
});

// ───────────────────────────── Mina Galena ─────────────────────────────

const MINE_START = [MINA.exit.arrive.x, MINA.exit.arrive.y];
const center = (room) => [Math.floor((room.x0 + room.x1) / 2), Math.floor((room.y0 + room.y1) / 2)];

test('Mina: al pozo lateral y a Garrido solo se llega pasando por los técnicos del Consorcio', async () => {
  const guarded = reachFrom(await worldOf('mina_galena', { flags: ['p3_restored', F.arrival, F.argument] }), MINE_START);
  assert.ok(guarded.has(...center(MINA.rooms.galeria)), 'la galería es alcanzable');
  assert.ok(guarded.has(MINA.cell.x, MINA.cell.y), 'C036 (veta de cristal) sin pasar por los técnicos');
  assert.ok(!guarded.has(...center(MINA.rooms.lateral)), 'se entra en el pozo lateral sin combatir');
  for (const [x, y] of MINA.garridoStrip) assert.ok(!guarded.has(x, y), 'se llega a Garrido sin combatir');
  assert.deepEqual(traps(guarded), []);
  const open = await worldOf('mina_galena', { flags: ['p3_restored', F.arrival, F.argument], erase: ['tecnico_pozo', 'tecnica_pozo'] });
  const r = reachFrom(open, MINE_START);
  for (const [x, y] of MINA.garridoStrip) assert.ok(r.has(x, y), 'tras los técnicos no se llega a Garrido');
  assert.deepEqual(traps(r), []);
});

test('Mina: el montacargas a la galería honda sigue tapado hasta el P4; objetos y entrenadores alcanzables', async () => {
  const before = await worldOf('mina_galena', { flags: DONE.filter((f) => f !== F.restored) });
  const lift = before.world.events.find((e) => e.id === 'montacargas');
  assert.ok(lift && !lift.page?.through && lift.trigger !== 'touch', 'el montacargas no está tapado antes del P4');
  const after = await worldOf('mina_galena', { flags: DONE });
  const open = after.world.events.find((e) => e.id === 'montacargas');
  assert.ok(open.page?.through && open.trigger === 'touch', 'el montacargas no se abre tras el P4');
  const r = reachFrom(after, MINE_START);
  assert.ok(r.has(MINA.lift.front.x, MINA.lift.front.y), 'no se llega delante del montacargas');
  assertEverythingReachable(after, r, 'Mina', { minItems: 5 });
  assert.deepEqual(traps(r), []);
});

test('Galería honda: la Steelixita y los objetos, alcanzables desde la escalera; sin trampas', async () => {
  const w = await worldOf('mina_galena_honda', { flags: DONE });
  const r = reachFrom(w, [HONDA.arrive.x, HONDA.arrive.y]);
  assertEverythingReachable(w, r, 'Galería honda', { minItems: 3 });
  assert.ok(w.world.events.some((e) => e.def?.item === 'STEELIXITE'), 'falta la Steelixita');
  assert.ok(r.has(HONDA.ladder.x, HONDA.ladder.y), 'la escalera de vuelta');
  assert.deepEqual(traps(r), []);
});

// ───────────────────────────── Dunas de Ceniza ─────────────────────────────

const DUNAS_START = [DUNAS.start.x, DUNAS.start.y];
const dunasCells = B08_CELLS.filter((c) => c.map === 'dunas_ceniza');

test('Dunas: sin Terreno complicado no se cruza la ceniza honda (ni Cerro, ni C037/C038); con él, sí', async () => {
  const flags = ['p3_restored', F.arrival, F.argument, F.garrido, F.ferminCerro];
  const without = reachFrom(await worldOf('dunas_ceniza', { flags, abilities: ['run', 'ram'] }), DUNAS_START);
  assert.ok(!without.has(DUNAS.cerro.front.x, DUNAS.cerro.front.y), 'se llega al Cerro sin Terreno complicado');
  for (const c of dunasCells) assert.ok(!without.has(c.x, c.y), `${c.code} sin Terreno complicado`);
  assert.ok(without.has(DUNAS.cave.front.x, DUNAS.cave.front.y), 'la Cueva de las Dunas no requiere Terreno');
  assert.ok(touchable(without, DUNAS.cave.door.x, DUNAS.cave.door.y), 'no se llega al boquete de la cueva');
  assert.deepEqual(traps(without), []);
  const w = await worldOf('dunas_ceniza', { flags });
  const r = reachFrom(w, DUNAS_START);
  assert.ok(r.has(DUNAS.cerro.door.x, DUNAS.cerro.door.y + 1), 'con Terreno complicado no se llega a la boca del Cerro');
  for (const c of dunasCells) assert.ok(r.has(c.x, c.y), `${c.code} inalcanzable`);
  assertEverythingReachable(w, r, 'Dunas', { minItems: 4 });
  assert.deepEqual(traps(r), []);
});

test('Cueva de las Dunas: la Garchompita, el montañero y los objetos, alcanzables; sin trampas', async () => {
  const w = await worldOf('dunas_cueva', { flags: DONE });
  const r = reachFrom(w, [DUNAS_CUEVA.arrive.x, DUNAS_CUEVA.arrive.y]);
  assertEverythingReachable(w, r, 'Cueva de las Dunas', { minItems: 3 });
  assert.ok(w.world.events.some((e) => e.def?.item === 'GARCHOMPITE'), 'falta la Garchompita');
  assert.ok(r.has(DUNAS_CUEVA.exit.x, DUNAS_CUEVA.exit.y), 'la escalera de salida');
  assert.deepEqual(traps(r), []);
});

// ───────────────────────────── Cerro Plomo ─────────────────────────────

test('Cerro Plomo: la puerta del Pilar solo se alcanza con la verja abierta', async () => {
  const start = [CERRO.exit.arrive.x, CERRO.exit.arrive.y];
  const door = [CERRO.door.x, CERRO.door.y + 1];
  const closed = reachFrom(await worldOf('cerro_plomo', { flags: ['p3_restored', F.garrido, F.ferminCerro] }), start);
  assert.ok(!closed.has(...door), 'se llega a la puerta del Pilar con la verja cerrada');
  for (const [x, y] of CERRO.gateFront) assert.ok(closed.has(x, y), 'no se llega delante de la verja');
  assert.deepEqual(traps(closed), []);
  const w = await worldOf('cerro_plomo', { flags: ['p3_restored', F.garrido, F.ferminCerro, F.gateOpen] });
  const open = reachFrom(w, start);
  assert.ok(open.has(...door), 'con la verja abierta no se llega a la puerta');
  assertEverythingReachable(w, open, 'Cerro Plomo', { minItems: 3 });
  assert.deepEqual(traps(open), []);
});

// ───────────────────────────── Cámara de los Contrapesos ─────────────────────────────

const WALKABLE = new Set([CELL.FLOOR, CELL.LOW, CELL.ONLY_PLAYER, CELL.FRAGILE, CELL.SAND, CELL.PLATE, CELL.STAIRS, CELL.GATE, CELL.LEVER, 'A', 'B', 'C']);

test('Cámara: el mapa coincide casilla a casilla con el trazado del puzle (también el foso con la plataforma)', async () => {
  // Casillas que el trazado da por sólidas porque hay un evento encima (palanca de retorno, pedestal, objeto).
  const byEvent = [SPOTS.resetLever, SPOTS.pedestal, ...SOLID_EVENTS].map((p) => `${p.x},${p.y}`);
  for (const plate of [false, true]) {
    const vars = plate ? { [V.puzzle]: { pieces: {}, holes: [], plate: true, solved: false } } : {};
    const w = await worldOf('camara_contrapesos', { vars });
    for (const key of byEvent) {
      const [x, y] = key.split(',').map(Number);
      const solidEvent = w.world.events.some((e) => e.x === x && e.y === y && e.page && !e.page.through);
      assert.ok(solidEvent || !w.map.passableStrict(x, y), `(${x},${y}): se puede pisar`);
    }
    for (let y = 0; y < CAMARA_H; y++) {
      for (let x = 0; x < CAMARA_W; x++) {
        if (x === SPOTS.exitWarp.x && y === SPOTS.exitWarp.y) continue;
        if (byEvent.includes(`${x},${y}`)) continue;
        const c = cellAt(x, y);
        const expected = WALKABLE.has(c) || (c === CELL.PIT && plate);
        assert.equal(w.map.passableStrict(x, y), expected, `(${x},${y}) '${c}' placa=${plate}: ${expected ? 'debería pisarse' : 'debería bloquear'}`);
      }
    }
  }
});

test('Cámara: a pie no se llega al ala este ni abajo; montado, sí; la subida solo tras la Balanza', async () => {
  const start = [SPOTS.entry.x, SPOTS.entry.y];
  const c039 = B08_CELLS.find((c) => c.code === 'C039');
  const c040 = B08_CELLS.find((c) => c.code === 'C040');
  const foot = reachFrom(await worldOf('camara_contrapesos'), start);
  assert.ok(foot.has(SPOTS.leverFrom.x, SPOTS.leverFrom.y), 'la palanca de la Balanza a pie');
  assert.ok(foot.has(c040.x, c040.y), 'C040 junto a la Balanza');
  assert.ok(touchable(foot, SPOTS.resetLever.x, SPOTS.resetLever.y), 'la palanca de retorno de la entrada');
  assert.ok(!foot.has(33, 23), 'se llega al ala este a pie (arena)');
  assert.ok(!foot.has(c039.x, c039.y), 'C039 a pie');
  assert.ok(!foot.has(SPOTS.pedestalFront.x, SPOTS.pedestalFront.y), 'el núcleo sin resolver la Balanza');
  const mountedW = await worldOf('camara_contrapesos', { mounted: true });
  const mounted = reachFrom(mountedW, start);
  assert.ok(mounted.has(33, 23), 'montado no se cruza la arena');
  assert.ok(mounted.has(c039.x, c039.y), 'C039 montado (por la escalinata)');
  assert.ok(!mounted.has(SPOTS.pedestalFront.x, SPOTS.pedestalFront.y), 'el núcleo montado sin resolver la Balanza');
  assertEverythingReachable(mountedW, mounted, 'Cámara', { minItems: 1 });
  const solved = { [V.puzzle]: { pieces: {}, holes: [], plate: true, solved: true } };
  const done = reachFrom(await worldOf('camara_contrapesos', { flags: [F.balance, F.fermin], vars: solved }), start);
  assert.ok(done.has(SPOTS.pedestalFront.x, SPOTS.pedestalFront.y), 'tras la Balanza y Fermín no se llega al núcleo');
});

test('P4: base transitable y el Guardián cubre todos los pasos al núcleo del tercer piso', async () => {
  const start = [P4_VERTICAL.entry.x, P4_VERTICAL.entry.y];
  const base = await worldOf('camara_contrapesos_base');
  const r = reachFrom(base, start);
  assert.ok(r.has(P4_VERTICAL.up.x, P4_VERTICAL.up.y));
  assert.ok(r.has(P4_VERTICAL.down.x, P4_VERTICAL.down.y));
  assertEverythingReachable(base, r, 'Base', { minItems: 0 });
  assert.deepEqual(traps(r), []);
  const guarded = await worldOf('camara_contrapesos_nucleo', { flags: [F.balance] });
  // Las franjas activas disparan el combate; al bloquearlas no existe ningún camino alternativo.
  for (const [x, y] of P4_VERTICAL.challenge) guarded.world.events.push({ x, y, erased: false, through: false, solid: true, at: (cx, cy) => x === cx && y === cy });
  const closed = reachFrom(guarded, start);
  assert.ok(!touchable(closed, P4_VERTICAL.pedestal.x, P4_VERTICAL.pedestal.y));
  assert.ok(closed.has(P4_VERTICAL.down.x, P4_VERTICAL.down.y));
  const open = reachFrom(await worldOf('camara_contrapesos_nucleo', { flags: [F.balance, F.fermin] }), start);
  assert.ok(touchable(open, P4_VERTICAL.pedestal.x, P4_VERTICAL.pedestal.y));
});

test('Cámara: sin trampas combinando a pie y montado (se monta y desmonta fuera de la arena)', async () => {
  const foot = await worldOf('camara_contrapesos');
  const mounted = await worldOf('camara_contrapesos', { mounted: true });
  const k = (x, y, m) => `${x},${y},${m}`;
  const start = k(SPOTS.entry.x, SPOTS.entry.y, 0);
  const seen = new Set([start]);
  const edges = new Map();
  const queue = [[SPOTS.entry.x, SPOTS.entry.y, 0]];
  while (queue.length) {
    const [x, y, m] = queue.shift();
    const next = neighbours(m ? mounted : foot, x, y).map(([nx, ny]) => [nx, ny, m]);
    if (cellAt(x, y) !== CELL.SAND) next.push([x, y, 1 - m]);
    edges.set(k(x, y, m), next.map((n) => k(...n)));
    for (const n of next) if (!seen.has(k(...n))) { seen.add(k(...n)); queue.push(n); }
  }
  const r = { keys: [...seen], edges, start };
  assert.deepEqual(traps(r), [], 'posiciones desde las que no se vuelve a la salida');
});
