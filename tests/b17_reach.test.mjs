// Bloque 17 — Interludio 8: alcanzabilidad a pie (docs/CAMPANA.md B17; §2.5 G14 Reconstrucción y G15 Vuelo). BFS con la
// pasabilidad real del mundo (tiles + eventos sólidos + parches de página), con aristas extra por las paredes de Trepar:
//   · Senda del Mirador: antes del P8 solo se llega al Mirador Norte; el tramo derrumbado (Reconstrucción) es el único
//     paso a la Cabeza del Puente; la Policía Regional cierra el tablero hasta la Vigilia; después se llega al borde sur
//     (Puente de B18). Las plataformas de las torres solo se alcanzan alzando piedras.
//   · Torres del Anillo: la ruta directa muere en un zócalo que no aguanta; hay una ruta por las peñas.
//   · Mirador Sur: el estribo del Puente no se pisa desde el Mirador hasta el P9 (barrera); del P8 al P9 la valla del
//     Consorcio cierra el borde, pero el espolón de la Torre del Temblor sigue abierto; la bajada a la Sima tiene un
//     tramo desprendido (Reconstrucción), así que la Sima no se alcanza antes de la Forma Completa.
//   · Mesa de los Vientos: el Altaria del Alto exige Trepar y el de la Aguja, Reconstrucción; la cabaña de Aurora, el
//     rebaño completo.
//   · Villa Alba: las seis losas se alcanzan; con el Círculo en pie no queda ninguna casilla encerrada.
//   · Todo objeto se coge y ninguna casilla alcanzable deja al jugador sin vuelta.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { World } from '../game/src/world/world.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import * as SENDA from '../game/src/content/maps/b17/senda_layout.js';
import * as MIR from '../game/src/content/maps/b17/mirador_layout.js';
import * as MESA from '../game/src/content/maps/b17/mesa_layout.js';
import { CIRCLE_POINTS } from '../game/src/content/events/b17_circulo_logic.js';
import { TOWER_ROOMS, parseRoom, solveRoom, solutionSockets, looseSockets, LIMIT } from '../game/src/content/events/b17_torres_logic.js';
import { VIGIL } from '../game/src/content/events/b17_vigilia.js';
import { F, V } from '../game/src/content/events/b17_common.js';
import { mapRegistered } from '../game/src/content/maps/b17/links.js';

const DV = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };
const key = (x, y) => `${x},${y}`;
const EARLY = ['b01_dex_received', 'b01_left_town', 'p1_restored', 'p2_restored'];
const LATE = [...EARLY, 'p3_restored', 'p4_restored', 'p5_restored', 'p6_restored', 'p7_restored', 'p8_restored', 'zyg_complete'];

async function world(mapId, { flags = [], vars = {}, hour = 13 } = {}) {
  const state = GameState.create({ name: 'Prueba' });
  for (const f of flags) state.setFlag(f);
  for (const [k, v] of Object.entries(vars)) state.setVar(k, v);
  state.data.clock.minutes = hour * 60;
  const { entry, def } = await buildMapNode(mapId);
  const w = new World({ state });
  w.setCurrent({ ...entry, events: null });
  return { w, map: entry.map, p: w.player, state, def };
}

/** Casillas alcanzables desde `start`. opts: block (casillas tratadas como muro), links extra [[a, b]…]. */
function bfs(ctx, start, { block = [], links = [] } = {}) {
  const { map, p } = ctx;
  const blocked = new Set(block.map(([x, y]) => key(x, y)));
  const extra = new Map();
  for (const [a, b] of links) extra.set(key(...a), [...(extra.get(key(...a)) || []), b]);
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
      if (!p.passable(x, y, d)) continue;
      if (map.terrainTagAt(nx, ny, 0).ledge) { nx += DV[d][0]; ny += DV[d][1]; }
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

/** Casillas alcanzadas desde las que NO se puede volver a `home`. */
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

const canUse = (r, x, y) => r.has(x, y) || [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => r.has(x + dx, y + dy));
const itemsOf = (w) => w.events.filter((e) => e.def?.type === 'item' || /^objeto_/.test(String(e.id)));
/** Casillas de disparadores de contacto activos cuyo guion devuelve al jugador (cordón, puertas vigiladas). */
const touchBlocks = (w, prefix) => w.events.filter((e) => String(e.id).startsWith(prefix) && e.page && e.trigger === 'touch').map((e) => [e.x, e.y]);

// ───────────────────────────── Senda del Mirador ─────────────────────────────

const S_START = [SENDA.ARRIVAL.x, SENDA.ARRIVAL.y];
const onEsplanade = (r) => r.has(SENDA.ESPLANADE.x0 + 5, SENDA.ESPLANADE.y0 + 1);

test('Senda: antes del P8 se llega al Mirador Norte, pero no a la Cabeza del Puente ni a las torres', async () => {
  const S = await world('senda_mirador', { flags: EARLY });
  const r = bfs(S, S_START);
  assert.ok(r.has(SENDA.MIRADOR.x0 + 2, SENDA.MIRADOR.y0 + 2), 'el Mirador Norte no se alcanza');
  assert.ok(!onEsplanade(r), 'se llega a la Cabeza del Puente sin Reconstrucción');
  for (const t of Object.values(SENDA.TOWERS)) {
    const p = t.room.stand;
    assert.ok(!r.has(t.ox + p.x, t.oy + p.y), `se llega a la plataforma de la torre ${t.id}`);
    assert.ok(r.has(t.ox + parseRoom(t.room).entry.x, t.oy + parseRoom(t.room).entry.y), `la entrada del espolón ${t.id} no se alcanza`);
  }
  assert.ok(r.has(SENDA.PLANKS.x1 + 2, SENDA.PLANKS.y0), 'el puente de tablas no lleva al borde del este');
  assert.deepEqual(dead(r, S_START), [], 'casillas sin vuelta a Caudal');
  for (let x = SENDA.NORTH.x0; x <= SENDA.NORTH.x1; x++) assert.ok(r.has(x, 0), `borde norte (${x}) inalcanzable`);
});

test('Senda: el tramo derrumbado es el único paso a la Cabeza del Puente; el cordón cierra el tablero hasta la Vigilia', async () => {
  const occupiedFlags = [...LATE];
  const S = await world('senda_mirador', { flags: occupiedFlags });
  assert.ok(!onEsplanade(bfs(S, S_START)), 'sin reconstruir se llega a la explanada');
  const rebuilt = await world('senda_mirador', { flags: [...occupiedFlags, F.sendaGap] });
  const r = bfs(rebuilt, S_START, { block: touchBlocks(rebuilt.w, 'paso_agente_puente') });
  assert.ok(onEsplanade(r), 'con el tramo reconstruido no se llega a la explanada');
  assert.ok(!r.has(SENDA.BRIDGE.x0 + 2, SENDA.BRIDGE.y0 + 2), 'se pasa el cordón de la Policía antes de la Vigilia');
  const after = await world('senda_mirador', { flags: [...occupiedFlags, F.sendaGap, F.vigil] });
  const ra = bfs(after, S_START);
  for (let x = SENDA.BRIDGE.south.x0; x <= SENDA.BRIDGE.south.x1; x++) assert.ok(ra.has(x, SENDA.BRIDGE.south.y), `tras la Vigilia no se llega al borde sur (${x})`);
  assert.deepEqual(dead(ra, S_START), [], 'casillas sin vuelta tras la Vigilia');
  // la bajada a la Sima: aviso neutro mientras no exista su mapa; con B19, warp al final de la cornisa (b19/links.js)
  checkDescent(after, ra, SENDA.DESCENT.x0, SENDA.DESCENT.y1);
});

/** La bajada de la Sima: cerrada sin `sima_eje`; con el mapa de B19, su final se pisa y tiene el warp. */
function checkDescent(ctx, r, x, y) {
  const warps = (ctx.def.warps || []).filter((w) => w.to === 'sima_eje');
  if (!mapRegistered('sima_eje')) {
    assert.ok(!r.has(x, y), 'se baja a la Sima sin su mapa');
    assert.equal(warps.length, 0);
    return;
  }
  assert.ok(r.has(x, y), 'con la Sima registrada no se llega al final de la bajada');
  assert.ok(warps.some((w) => w.x === x && w.y === y), `sin warp a la Sima en (${x},${y})`);
}

// ───────────────────────────── Torres del Anillo ─────────────────────────────

test('Torres: la ruta directa muere en un zócalo que no aguanta; por las peñas se llega a la plataforma', () => {
  for (const def of Object.values(TOWER_ROOMS)) {
    const room = parseRoom(def);
    const sol = solveRoom(room);
    assert.ok(sol, `${def.name}: sin solución con la torre encendida`);
    assert.ok(looseSockets(room).length > 0, `${def.name}: ningún zócalo corta una ruta`);
    for (const i of solutionSockets(room)) assert.ok(room.sockets[i].d <= LIMIT, `${def.name}: la solución usa un zócalo suelto`);
    const free = solveRoom(room, { unlimited: true });
    const freeRaises = free.filter((a) => a.raise !== undefined).map((a) => a.raise);
    assert.ok(freeRaises.some((i) => room.sockets[i].d > LIMIT) || free.length < sol.length, `${def.name}: la ruta más corta sin límite no es la tentadora`);
  }
});

test('Torres: la plataforma solo se pisa alzando la ruta; con ella, se llega a la consola y se vuelve al borde', async () => {
  for (const t of [...Object.values(SENDA.TOWERS)]) {
    const room = parseRoom(t.room);
    const e = [t.ox + room.entry.x, t.oy + room.entry.y];
    const stand = [t.ox + t.room.stand.x, t.oy + t.room.stand.y];
    const none = await world('senda_mirador', { flags: [...LATE] });
    assert.ok(!bfs(none, e).has(...stand), `${t.id}: plataforma sin piedras`);
    const sol = solutionSockets(room).join(',');
    const done = await world('senda_mirador', { flags: [...LATE, `b17_torre_${t.id}_tecnicos`], vars: { [V.towerStones(t.id)]: sol } });
    const r = bfs(done, e);
    assert.ok(r.has(...stand), `${t.id}: con la ruta alzada no se llega a la consola`);
    assert.deepEqual(dead(r, e), [], `${t.id}: casillas sin vuelta al borde`);
  }
  const room = parseRoom(MIR.TOWER.room);
  const e = [MIR.TOWER.ox + room.entry.x, MIR.TOWER.oy + room.entry.y];
  const stand = [MIR.TOWER.ox + MIR.TOWER.room.stand.x, MIR.TOWER.oy + MIR.TOWER.room.stand.y];
  const none = await world('mirador_sur', { flags: [...LATE] });
  assert.ok(!bfs(none, e).has(...stand), 'temblor: plataforma sin piedras');
  const done = await world('mirador_sur', { flags: [...LATE, 'b17_torre_temblor_tecnicos'], vars: { [V.towerStones('temblor')]: solutionSockets(room).join(',') } });
  assert.ok(bfs(done, e).has(...stand), 'temblor: con la ruta alzada no se llega a la consola');
});

// ───────────────────────────── Mirador Sur ─────────────────────────────

const M_START = [MIR.ARRIVAL.x, MIR.ARRIVAL.y];

test('Mirador Sur: el estribo se cierra hasta el P9; la valla del Consorcio, del P8 al P9; la bajada pide Reconstrucción', async () => {
  const early = await world('mirador_sur', { flags: EARLY });
  const r = bfs(early, M_START);
  assert.ok(r.has(MIR.PLAZA.x0 + 3, MIR.RIM_Y + 1), 'antes del P8 el borde del mirador no se alcanza');
  assert.ok(!r.has(MIR.DECK.x0 + 1, MIR.DECK.y1 - 1), 'se pisa el estribo del Puente desde el Mirador');
  // La bajada se pisa desde B09, pero su tramo desprendido pide Reconstrucción: la Sima (B19) no se alcanza antes.
  assert.ok(r.has(MIR.DESCENT.x0, MIR.DESCENT.y1), 'el arranque de la bajada no se alcanza');
  assert.ok(!r.has(MIR.DESCENT.x0, MIR.DESCENT.y0), 'se baja a la Sima sin Reconstrucción');
  const [below] = MIR.DESCENT_GAP.sockets;
  assert.ok(canUse(r, below.x, below.y), 'el zócalo de la bajada no se alcanza');
  assert.deepEqual(dead(r, M_START), [], 'casillas sin vuelta a Lúmina (antes del P8)');
  const occ = await world('mirador_sur', { flags: [...LATE] });
  // Del P8 al P9, la escena de la ocupación no se puede esquivar: desde Lúmina no se llega a la plaza, a la torre ni a la
  // bajada sin pisar una de sus franjas (la de la puerta o la de la avenida).
  const skip = bfs(occ, M_START, { block: touchBlocks(occ.w, 'escena_mirador') });
  assert.ok(!skip.has(MIR.SPOTS.legend.x, MIR.SPOTS.legend.y + 1), 'se llega a la plaza sin ver la ocupación');
  assert.ok(!skip.has(MIR.TOWER.ox + parseRoom(MIR.TOWER.room).entry.x, MIR.RIM_Y), 'se llega a la torre sin ver la ocupación');
  assert.ok(!skip.has(MIR.DESCENT.x0, MIR.RIM_Y + 2), 'se llega a la bajada sin ver la ocupación');
  const gateStrip = touchBlocks(occ.w, 'escena_mirador').filter(([, y]) => y === MIR.COMPOUND.trigger.y);
  const ro = bfs(occ, M_START, { block: gateStrip });
  assert.ok(!ro.has(MIR.PLAZA.x0 + 3, MIR.RIM_Y + 1), 'con el Consorcio se llega al borde del recinto');
  assert.ok(ro.has(MIR.TOWER.ox + parseRoom(MIR.TOWER.room).entry.x, MIR.RIM_Y), 'el espolón de la torre queda cerrado');
  assert.ok(ro.has(MIR.DESCENT.x0, MIR.RIM_Y), 'la bajada del oeste queda cerrada');
  assert.ok(!ro.has(MIR.DESCENT.x0, MIR.DESCENT.y0), 'se cruza el tramo desprendido sin reconstruirlo');
  const rebuilt = await world('mirador_sur', { flags: [...LATE, F.descentGap] });
  const rr = bfs(rebuilt, M_START, { block: touchBlocks(rebuilt.w, 'escena_mirador').filter(([, y]) => y === MIR.COMPOUND.trigger.y) });
  checkDescent(rebuilt, rr, MIR.DESCENT.x0, MIR.DESCENT.y0);
  assert.deepEqual(dead(rr, M_START), [], 'casillas sin vuelta a Lúmina (bajada reconstruida)');
  assert.deepEqual(dead(ro, M_START), [], 'casillas sin vuelta a Lúmina (ocupado)');
  // Desde la Sima (llegada de B19 en (x, 1)): sin reconstruir se vuelve al warp; el zócalo de arriba se alcanza.
  const fromSima = bfs(occ, [MIR.DESCENT.x0, MIR.DESCENT.y0 + 1]);
  const [, , above] = MIR.DESCENT_GAP.sockets;
  assert.ok(canUse(fromSima, above.x, above.y), 'desde la Sima no se alcanza el zócalo de arriba');
  assert.deepEqual(dead(fromSima, [MIR.DESCENT.x0, MIR.DESCENT.y0 + 1]), [], 'la llegada desde la Sima queda encerrada');
  const after = await world('mirador_sur', { flags: [...LATE, 'p9_restored'] });
  const rp9 = bfs(after, M_START);
  assert.ok(rp9.has(MIR.PLAZA.x0 + 3, MIR.RIM_Y + 1), 'tras el P9 la valla sigue');
  // Tras el P9 el Puente cruza la Sima entera: el estribo sur ya no tiene barrera (tramo sur del Puente de B18).
  for (let x = MIR.DECK.north.x0; x <= MIR.DECK.north.x1; x++) assert.ok(rp9.has(x, MIR.DECK.y0), `tras el P9 no se llega al Puente por el estribo (${x})`);
  assert.deepEqual(dead(rp9, M_START), [], 'casillas sin vuelta a Lúmina (tras el P9)');
  for (let x = MIR.SOUTH.x0; x <= MIR.SOUTH.x1; x++) assert.ok(r.has(x, MIR.SOUTH.y), `borde sur (${x}) inalcanzable`);
});

// ───────────────────────────── Mesa de los Vientos ─────────────────────────────

const ME_START = [MESA.FLY_POINT.x, MESA.FLY_POINT.y];
const climbLinks = [[[MESA.CLIMB.up.x, MESA.CLIMB.up.y + 1], MESA.CLIMB.top], [[MESA.CLIMB.down.x, MESA.CLIMB.down.y - 1], MESA.CLIMB.bottom]];

test('Mesa: el Altaria del prado se alcanza a pie; el del Alto, trepando; el de la Aguja, reconstruyendo', async () => {
  const M = await world('mesa_vientos', { flags: [...LATE, F.mesaArrival] });
  const [h1, h2, h3] = MESA.HERD_SPOTS;
  const foot = bfs(M, ME_START);
  assert.ok(canUse(foot, h1.x, h1.y), 'el Altaria del prado no se alcanza');
  assert.ok(!canUse(foot, h3.x, h3.y), 'se llega al Alto sin Trepar');
  assert.ok(!canUse(foot, h2.x, h2.y), 'se llega a la Aguja sin Reconstrucción');
  assert.ok(canUse(foot, MESA.CLIMB.up.x, MESA.CLIMB.up.y), 'la pared de Trepar no se alcanza');
  for (const s of MESA.AGUJA_GAP.sockets) assert.ok(canUse(foot, s.x, s.y), `el zócalo (${s.x},${s.y}) no se alcanza`);
  const climb = bfs(M, ME_START, { links: climbLinks });
  assert.ok(canUse(climb, h3.x, h3.y), 'trepando no se llega al Altaria del Alto');
  const bridged = await world('mesa_vientos', { flags: [...LATE, F.mesaArrival, 'b17_aguja'] });
  const rb = bfs(bridged, ME_START, { links: climbLinks });
  assert.ok(canUse(rb, h2.x, h2.y), 'reconstruido el hueco no se llega a la Aguja');
  for (const ev of itemsOf(bridged.w)) assert.ok(canUse(rb, ev.x, ev.y), `${ev.id} en (${ev.x},${ev.y}) inalcanzable`);
  assert.deepEqual(dead(rb, ME_START), [], 'casillas de la Mesa sin vuelta a la explanada');
});

test('Mesa: la cabaña de Aurora solo se abre con el rebaño completo; los cuidadores se alcanzan', async () => {
  const door = MESA.BUILDINGS.aurora.door;
  const M = await world('mesa_vientos', { flags: [...LATE, F.mesaArrival] });
  const guard = M.w.events.find((e) => e.id === 'puerta_aurora');
  assert.ok(guard?.page && guard.trigger === 'touch', 'la puerta de Aurora no está vigilada antes del rebaño');
  const T = await world('mesa_vientos', { flags: [...LATE, F.mesaArrival, F.altaria1, F.altaria2, F.altaria3, F.trust] });
  assert.ok(!T.w.events.find((e) => e.id === 'puerta_aurora')?.page, 'con el rebaño completo la puerta sigue vigilada');
  const r = bfs(T, ME_START);
  assert.ok(r.has(door.x, door.y + 1), 'no se llega a la puerta de Aurora');
  for (const id of ['brisa', 'cefiro', 'nube']) {
    const ev = T.w.events.find((e) => e.id === id);
    assert.ok(ev && canUse(r, ev.x, ev.y), `${id} inalcanzable`);
  }
});

test('Senda y Mirador Sur: todos los objetos se cogen con las piedras que aguantan alzadas', async () => {
  const holdAll = (room) => room.sockets.filter((s) => s.d <= LIMIT).map((s) => s.i).join(',');
  const vars = {};
  for (const t of Object.values(SENDA.TOWERS)) vars[V.towerStones(t.id)] = holdAll(parseRoom(t.room));
  const S = await world('senda_mirador', { flags: [...LATE, F.sendaGap, F.vigil], vars });
  const rs = bfs(S, S_START);
  for (const ev of itemsOf(S.w)) assert.ok(canUse(rs, ev.x, ev.y), `senda: ${ev.id} en (${ev.x},${ev.y}) inalcanzable`);
  const M = await world('mirador_sur', { flags: [...EARLY], vars: { [V.towerStones('temblor')]: holdAll(parseRoom(MIR.TOWER.room)) } });
  const rm = bfs(M, M_START);
  for (const ev of itemsOf(M.w)) assert.ok(canUse(rm, ev.x, ev.y), `mirador: ${ev.id} en (${ev.x},${ev.y}) inalcanzable`);
});

// ───────────────────────────── Villa Alba y Caudal ─────────────────────────────

test('Villa Alba: las seis losas se alcanzan; con el Círculo en pie ninguna casilla queda encerrada', async () => {
  const home = [10, 26];
  const before = await world('villa_alba', { flags: [...LATE, F.momClefairy, F.danceSeen], hour: 22 });
  const r = bfs(before, home);
  for (const p of CIRCLE_POINTS) assert.ok(canUse(r, p.x, p.y), `la losa (${p.x},${p.y}) no se alcanza`);
  const after = await world('villa_alba', { flags: [...LATE, F.momClefairy, F.danceSeen, F.circle], hour: 22 });
  const ra = bfs(after, home);
  assert.deepEqual(dead(ra, home), [], 'casillas encerradas por el Círculo');
  for (const p of CIRCLE_POINTS) assert.ok(!ra.has(p.x, p.y), `la piedra alzada (${p.x},${p.y}) se pisa`);
  assert.ok(ra.has(22, 14), 'la llegada del Vuelo al Círculo no se pisa');
  assert.ok(ra.has(22, 1) && ra.has(22, 35), 'el Círculo corta los caminos norte o sur');
});

test('Caudal: la Vigilia se alcanza desde la entrada norte y no corta el paso por la esclusa', async () => {
  const C = await world('ciudad_caudal', { flags: [...LATE, F.reunion, F.mirador, F.alerceCall] });
  const r = bfs(C, [31, 1]);
  assert.ok(r.has(VIGIL.player.x, VIGIL.player.y), 'la casilla de la Vigilia no se alcanza');
  for (const id of ['vigilia_alerce', 'vigilia_leandro', 'vigilia_olmedo']) {
    const ev = C.w.events.find((e) => e.id === id);
    assert.ok(ev?.page && canUse(r, ev.x, ev.y), `${id} ausente o inalcanzable`);
  }
  assert.ok(r.has(44, 8), 'la puerta de la Casa de las Esclusas queda aislada');
});
