// Bloque 7 — Ruta 6 y la Cantería Solano: recorrido a pie (BFS con la pasabilidad real del mundo: tiles + eventos
// sólidos + saltos de saliente) que demuestra que las puertas de historia y de capacidad no se pueden saltar, que no
// hay casillas trampa sin salida y que todo objeto, célula y entrenador es alcanzable con las capacidades de su
// momento (docs/CAMPANA.md B07 y §2.3; TABLILLAS T04).
//   · Ruta 6: el derrumbe corta el camino de Estrato hasta b07_ruta_despejada; la boca de las galerías solo se
//     alcanza pasando por los técnicos (o tras retirarse con Garrido); C035 exige Terreno complicado (barro);
//     la Absolita y C056 exigen Trepar (se sube por su pared con vetas; sin ella no hay otro camino).
//   · Galerías: el mapa coincide casilla a casilla con las salas ASCII del solucionador; los atrapados no se
//     alcanzan sin romper su pila; los pozos siguen tapados hasta rescatar a los Timburr de la sala.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { World } from '../game/src/world/world.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import { RUTA6, CANTERIA, GALERIAS, HERRERIA } from '../game/src/content/maps/b07/layout.js';
import { room } from '../game/src/content/events/b07_strata_rooms.js';
import { fullMask } from '../game/src/content/events/b07_strata_logic.js';
import { B07_CELLS } from '../game/src/content/events/b07_cells.js';

const DV = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };
const FLAGS_DONE = [
  'p3_restored', 'b07_llegada', 'b07_tecnicos', 'b07_garrido', 'b07_alerce', 'b07_timburr_1', 'b07_timburr_2', 'b07_timburr_3',
  'b07_quino', 'b07_tablilla', 'b07_piedra', 'b07_rescate', 'b07_denuncia', 'b07_megaring', 'b07_ruta_despejada',
];

/**
 * Mundo de un mapa con un estado preparado. opts: flags, vars { k: v }, abilities [..], erase (prefijos de id).
 */
async function worldOf(mapId, { flags = [], vars = {}, abilities = [], erase = [] } = {}) {
  const state = GameState.create({ name: 'Prueba' });
  for (const f of flags) state.setFlag(f);
  for (const [k, v] of Object.entries(vars)) state.setVar(k, v);
  for (const a of abilities) state.setZygardeAbility(a, true);
  const { entry } = await buildMapNode(mapId);
  const world = new World({ state });
  world.setCurrent({ ...entry, events: null });
  for (const ev of world.events) if (erase.some((p) => String(ev.id).startsWith(p))) ev.erased = true;
  return { world, map: entry.map, state };
}

/**
 * Casillas alcanzables a pie desde `start`. `block`: casillas tratadas como muro (disparadores de escena);
 * `links`: saltos extra [[desde, hasta]] (p. ej. trepar una pared con la capacidad).
 */
function reachFrom(w, start, { block = [], links = [] } = {}) {
  const blocked = new Set(block.map(([x, y]) => `${x},${y}`));
  const p = w.world.player;
  const seen = new Set([`${start[0]},${start[1]}`]);
  const edges = new Map(); // casilla → vecinas a las que se pasa (para volver sobre el grafo: noTraps)
  const queue = [start];
  while (queue.length) {
    const [x, y] = queue.shift();
    const next = [];
    for (const d of [2, 4, 6, 8]) {
      let nx = x + DV[d][0];
      let ny = y + DV[d][1];
      if (!w.map.valid(nx, ny) || blocked.has(`${nx},${ny}`)) continue;
      p.x = x; p.y = y;
      if (!p.passable(x, y, d)) continue;
      if (w.map.terrainTagAt(nx, ny, 0).ledge) { nx += DV[d][0]; ny += DV[d][1]; }
      if (w.map.valid(nx, ny)) next.push([nx, ny]);
    }
    for (const [[fx, fy], to] of links) if (fx === x && fy === y) next.push(to);
    edges.set(`${x},${y}`, next.map(([a, b]) => `${a},${b}`));
    for (const [nx, ny] of next) {
      const k = `${nx},${ny}`;
      if (seen.has(k)) continue;
      seen.add(k);
      queue.push([nx, ny]);
    }
  }
  return { has: (x, y) => seen.has(`${x},${y}`), cells: [...seen].map((k) => k.split(',').map(Number)), size: seen.size, edges };
}

/** Casillas alcanzables desde las que NO se puede volver a `start` (búsqueda hacia atrás sobre el mismo grafo). */
function traps(r, start) {
  const back = new Map();
  for (const [from, list] of r.edges) for (const to of list) { if (!back.has(to)) back.set(to, []); back.get(to).push(from); }
  const ok = new Set([`${start[0]},${start[1]}`]);
  const queue = [...ok];
  while (queue.length) {
    const k = queue.shift();
    for (const prev of back.get(k) || []) if (!ok.has(prev)) { ok.add(prev); queue.push(prev); }
  }
  return r.cells.filter(([x, y]) => !ok.has(`${x},${y}`));
}

/** ¿Hay una casilla alcanzable desde la que interactuar con (x, y)? (encima o al lado) */
const touchable = (r, x, y) => r.has(x, y) || [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => r.has(x + dx, y + dy));

const R6_START = [RUTA6.start.x, RUTA6.start.y];
const techStrip = () => {
  const out = [];
  for (let x = CANTERIA.techStrip.x0; x <= CANTERIA.techStrip.x1; x++) out.push([x, CANTERIA.techStrip.y]);
  return out;
};

// ───────────────────────────── Ruta 6 ─────────────────────────────

test('Ruta 6: el derrumbe corta el camino de Estrato hasta que los canteros lo despejan', async () => {
  const before = reachFrom(await worldOf('ruta_6', { flags: ['p3_restored', 'b07_llegada', 'b07_tecnicos', 'b07_garrido', 'b07_alerce'] }), R6_START);
  assert.ok(before.has(RUTA6.rubbleNorth.x, RUTA6.rubbleNorth.y), 'el patio de la Cantería es alcanzable');
  assert.ok(!before.has(RUTA6.rubbleSouth.x, RUTA6.rubbleSouth.y), 'se cruza el derrumbe sin despejar');
  for (let x = RUTA6.south.x0; x <= RUTA6.south.x1; x++) assert.ok(!before.has(x, RUTA6.south.y), `se llega a la salida de Estrato (${x}) sin despejar`);
  const after = reachFrom(await worldOf('ruta_6', { flags: FLAGS_DONE, abilities: ['run', 'ram', 'terrain'] }), R6_START);
  assert.ok(after.has(RUTA6.rubbleSouth.x, RUTA6.rubbleSouth.y), 'tras despejar se cruza el derrumbe');
  assert.ok(after.has(15, RUTA6.south.y), 'tras despejar se llega a la salida de Estrato');
});

test('Ruta 6: a la boca de las galerías solo se llega pasando por los técnicos del Consorcio', async () => {
  const d = CANTERIA.mine.door;
  const guarded = reachFrom(await worldOf('ruta_6', { flags: ['p3_restored', 'b07_llegada'] }), R6_START, { block: techStrip() });
  assert.ok(!guarded.has(d.x, d.y + 1), 'se llega delante de la boca sin pasar por el perímetro');
  assert.ok(touchable(guarded, CANTERIA.techs[0].x, CANTERIA.techs[0].y), 'los técnicos no se pueden alcanzar');
  const open = reachFrom(await worldOf('ruta_6', { flags: ['p3_restored', 'b07_llegada', 'b07_tecnicos', 'b07_garrido', 'b07_alerce'] }), R6_START);
  assert.ok(open.has(d.x, d.y + 1), 'tras retirarse el Consorcio la boca es accesible');
});

test('Ruta 6: C035 exige Terreno complicado; la Absolita y C056, Trepar (sin atajos)', async () => {
  const c035 = B07_CELLS.find((c) => c.code === 'C035');
  const c056 = B07_CELLS.find((c) => c.code === 'C056');
  const flags = FLAGS_DONE;
  const noTerrain = reachFrom(await worldOf('ruta_6', { flags, abilities: ['run', 'ram'] }), R6_START);
  assert.ok(!noTerrain.has(c035.x, c035.y), 'C035 sin Terreno complicado');
  assert.ok(noTerrain.has(CANTERIA.mud.x0 - 1, CANTERIA.mud.y0), 'el borde del barro no es alcanzable desde el bancal bajo');
  const terrain = reachFrom(await worldOf('ruta_6', { flags, abilities: ['run', 'ram', 'terrain'] }), R6_START);
  assert.ok(terrain.has(c035.x, c035.y), 'C035 con Terreno complicado');
  const k = RUTA6.cornice;
  const w = RUTA6.wallLedge;
  for (const [what, foot, top, target] of [['Absolita', k.foot, k.top, k.item], ['C056', w.foot, w.top, c056]]) {
    assert.ok(terrain.has(foot.x, foot.y), `${what}: el pie de la pared es alcanzable`);
    assert.ok(!touchable(terrain, target.x, target.y), `${what}: alcanzable sin Trepar`);
    const climbing = reachFrom(await worldOf('ruta_6', { flags, abilities: ['run', 'ram', 'terrain', 'climb'] }), R6_START, {
      links: [[[foot.x, foot.y], [top.x, top.y]]],
    });
    assert.ok(touchable(climbing, target.x, target.y), `${what}: no se alcanza tras trepar`);
  }
});

test('Ruta 6: todos los objetos, células de la etapa D y entrenadores son alcanzables', async () => {
  const w = await worldOf('ruta_6', { flags: FLAGS_DONE, abilities: ['run', 'ram', 'terrain'] });
  const r = reachFrom(w, R6_START);
  const items = w.world.events.filter((e) => /^objeto_ruta6_/.test(String(e.id)));
  assert.ok(items.length >= 8, 'faltan objetos');
  for (const ev of items) assert.ok(touchable(r, ev.x, ev.y), `objeto ${ev.id} en (${ev.x},${ev.y}) inalcanzable`);
  const trainers = w.world.events.filter((e) => e.def?.trainer && String(e.def.trainer).startsWith('b07_'));
  assert.ok(trainers.length >= 6, 'faltan entrenadores');
  for (const ev of trainers) assert.ok(touchable(r, ev.x, ev.y), `entrenador ${ev.id} inalcanzable`);
  const c035 = B07_CELLS.find((c) => c.code === 'C035');
  assert.ok(r.has(c035.x, c035.y), 'C035 inalcanzable');
  // Herrería (puerta) y galerías (boca) accesibles.
  assert.ok(r.has(CANTERIA.forgeFront.x, CANTERIA.forgeFront.y), 'puerta de la herrería');
});

test('Ruta 6: ningún entrenador se queda tapando un paso después de acercarse al jugador', async () => {
  const w = await worldOf('ruta_6', { flags: FLAGS_DONE, abilities: ['run', 'ram', 'terrain'] });
  const exit = [15, RUTA6.south.y];
  const trainers = w.world.events.filter((e) => e.def?.trainer && String(e.def.trainer).startsWith('b07_'));
  for (const ev of trainers) {
    const [dx, dy] = DV[ev.direction];
    const home = [ev.x, ev.y];
    for (let k = 2; k <= (ev.def.sight ?? 4); k++) {
      // El jugador, a k casillas en su línea de visión; el entrenador camina hasta quedarse a su lado.
      const player = [home[0] + dx * k, home[1] + dy * k];
      if (!w.map.valid(...player)) continue;
      ev.moveTo(home[0] + dx * (k - 1), home[1] + dy * (k - 1));
      const r = reachFrom(w, R6_START);
      if (!r.has(...player)) continue;
      assert.ok(r.has(...exit), `${ev.id} en (${ev.x},${ev.y}) corta el camino a Estrato`);
    }
    ev.moveTo(...home);
  }
});

test('Ruta 6: no hay casillas trampa (desde todo lo alcanzable se vuelve a Brontia)', async () => {
  for (const [label, flags, abilities] of [
    ['al llegar', ['p3_restored'], ['run', 'ram', 'terrain']],
    ['al terminar el bloque', FLAGS_DONE, ['run', 'ram', 'terrain']],
  ]) {
    const w = await worldOf('ruta_6', { flags, abilities });
    const forward = reachFrom(w, R6_START);
    assert.deepEqual(traps(forward, R6_START), [], `${label}: casillas desde las que no se vuelve a la entrada`);
  }
});

// ───────────────────────────── Galerías ─────────────────────────────

const WALLISH = new Set(['#', 'P', 'U', 'V']);
const mapCell = (n, x, y) => [x + GALERIAS.rooms[n].ox, y + GALERIAS.rooms[n].oy];

/** ¿Se puede entrar en la casilla desde alguna vecina? (con saltos de saliente: se entra por el norte) */
function enterable(w, x, y) {
  const p = w.world.player;
  for (const d of [2, 4, 6, 8]) {
    const sx = x - DV[d][0];
    const sy = y - DV[d][1];
    if (!w.map.valid(sx, sy)) continue;
    p.x = sx; p.y = sy;
    if (p.passable(sx, sy, d)) return true;
  }
  return false;
}

test('Galerías: el mapa coincide casilla a casilla con las salas del solucionador', async () => {
  const w = await worldOf('canteria_solano', { flags: ['b07_alerce'] });
  // Los objetos visibles ocupan su casilla hasta cogerlos (rincones sin salida, ver b07_galerias.js).
  const items = new Set(w.world.events.filter((e) => /^objeto_galeria_/.test(String(e.id))).map((e) => `${e.x},${e.y}`));
  for (const n of [1, 2, 3]) {
    const r = room(n);
    r.rows.forEach((row, y) => [...row].forEach((ch, x) => {
      if (x === 0 || x === r.w - 1) return; // columnas del borde: pared de cueva
      if (items.has(mapCell(n, x, y).join(','))) return;
      const [mx, my] = mapCell(n, x, y);
      const solidNow = WALLISH.has(ch) || 'abcdTQE'.includes(ch);
      if (ch === 'v') {
        assert.ok(w.map.terrainTagAt(mx, my, 0).ledge, `sala ${n} (${x},${y}): falta el saliente`);
        return;
      }
      assert.equal(!enterable(w, mx, my), solidNow, `sala ${n} (${x},${y}) '${ch}': ${solidNow ? 'debería bloquear' : 'debería poderse pisar'}`);
    }));
  }
});

test('Galerías: sin romper su pila no se alcanza a ningún atrapado; con todo roto, sí, y no hay trampas', async () => {
  for (const n of [1, 2, 3]) {
    const r = room(n);
    const start = mapCell(n, ...r.marks.S[0]);
    const closed = reachFrom(await worldOf('canteria_solano', { flags: ['b07_alerce'] }), start);
    for (const [x, y] of [...r.marks.T, ...r.marks.Q]) {
      assert.ok(!touchable(closed, ...mapCell(n, x, y)), `sala ${n}: el atrapado de (${x},${y}) se alcanza sin romper nada`);
    }
    const vars = { [`b07_sala_${n}`]: fullMask(r) };
    const w = await worldOf('canteria_solano', { flags: ['b07_alerce'], vars });
    const open = reachFrom(w, start);
    for (const [x, y] of [...r.marks.T, ...r.marks.Q]) assert.ok(touchable(open, ...mapCell(n, x, y)), `sala ${n}: el atrapado de (${x},${y}) no se alcanza`);
    assert.deepEqual(traps(open, start), [], `sala ${n}: casillas desde las que no se vuelve a la entrada`);
  }
});

test('Galerías: los pozos siguen tapados hasta rescatar a los Timburr de la sala; objetos alcanzables', async () => {
  const shut = await worldOf('canteria_solano', { flags: ['b07_alerce'] });
  for (const n of [1, 2]) {
    const ev = shut.world.events.find((e) => e.id === `pozo_s${n}`);
    assert.ok(ev && ev.solid && ev.trigger === 'action', `el pozo de la sala ${n} no está tapado`);
  }
  const vars = { b07_sala_1: fullMask(room(1)), b07_sala_2: fullMask(room(2)), b07_sala_3: fullMask(room(3)) };
  const w = await worldOf('canteria_solano', { flags: ['b07_alerce', 'b07_timburr_1', 'b07_timburr_2', 'b07_timburr_3', 'b07_quino'], vars });
  for (const n of [1, 2]) {
    const ev = w.world.events.find((e) => e.id === `pozo_s${n}`);
    assert.ok(ev && ev.through && ev.trigger === 'touch', `el pozo de la sala ${n} no se abre`);
  }
  const items = w.world.events.filter((e) => /^objeto_galeria_/.test(String(e.id)));
  assert.equal(items.length, 4);
  for (const ev of items) {
    const n = [1, 2, 3].find((k) => ev.x >= GALERIAS.rooms[k].ox && ev.x < GALERIAS.rooms[k].ox + room(k).w);
    const r = reachFrom(w, mapCell(n, ...room(n).marks.S[0]));
    assert.ok(touchable(r, ev.x, ev.y), `objeto ${ev.id} inalcanzable`);
  }
});

test('Galerías: Quino, ya fuera, no cierra el pasillo de la última sala', async () => {
  // Solo la pila de Quino rota (ocre, gris y roja de su columna): el jugador acaba de sacarlo desde el hueco de la
  // roja y tiene que poder volver a la entrada y a la pila grande sin romper nada más.
  const r = room(3);
  const pile = r.rocks.filter((k) => k.x === r.marks.Q[0][0] + 1).reduce((m, k) => m | (1 << k.i), 0);
  const w = await worldOf('canteria_solano', { flags: ['b07_alerce', 'b07_quino'], vars: { b07_sala_3: pile } });
  const free = reachFrom(w, mapCell(3, r.marks.Q[0][0] + 1, r.marks.Q[0][1]));
  assert.ok(free.has(...mapCell(3, ...r.marks.S[0])), 'desde el hueco de Quino no se vuelve a la entrada de la sala');
  const quino = w.world.events.find((e) => e.id === 'quino_libre');
  assert.ok(quino && touchable(free, quino.x, quino.y), 'no se puede hablar con Quino ya libre');
});

test('Herrería: de la puerta al yunque y al catre', async () => {
  const w = await worldOf('canteria_herreria', { flags: ['b07_rescate'] });
  const r = reachFrom(w, [HERRERIA.entry.x, HERRERIA.entry.y]);
  assert.ok(r.has(HERRERIA.playerRing.x, HERRERIA.playerRing.y), 'no se llega delante del yunque');
  assert.ok(touchable(r, HERRERIA.cot.x, HERRERIA.cot.y), 'no se llega al catre');
});
