// Bloque 19 — la Calzada del Rey: alcanzabilidad a pie (docs/CAMPANA.md B19; §2.5 G14 «Puente, Sima y Calzada:
// Reconstrucción»; TABLILLAS.md T15). BFS con la pasabilidad real del mundo (tiles + parches de página + eventos
// sólidos + saltos de saliente) y aristas extra por los warps del propio mapa:
//   · Calzada: antes del P9 no hay piedras (el brazo de la Sima no se cruza); con el P9, Tadeo guarda el primer tramo
//     hasta hablar con Casandra; las piedras forzadas nunca tocan la otra orilla (solo se cruza con la Calzada de verdad
//     que alza la Reconstrucción, tramo a tramo); Casandra corta el paso a la Peña hasta ganarle; el taller, la Bajada,
//     la cima y el Alfa, después. Objetos y entrenadores alcanzables en su momento; sin casillas sin vuelta.
//   · Taller: la hornacina y todas las piezas se alcanzan desde la entrada.
//   · Sima: la Calzada del Rey se corta ante el Umbral hasta alzar el último tramo (solo con la Tabla Draco); el sendero
//     del oeste exige Reconstrucción entre las dos bajadas; la Metagrossita, su propio hueco. Sin trampas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { World } from '../game/src/world/world.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import {
  ARRIVAL, STACK_A, STACK_B, PENA, DUEL, NPC, ITEMS, TRAINERS, CAMP, MIRADOR, RIM_S,
} from '../game/src/content/maps/b19/calzada_layout.js';
import { ENTRY as TALLER_ENTRY, NICHE, PIECES } from '../game/src/content/maps/b19/taller_layout.js';
import {
  ARRIVALS, WEST, EAST, UMBRAL, GAP_W, GAP_ALCOVE, GAP_FINAL, ITEMS as SIMA_ITEMS, TRAINERS as SIMA_TRAINERS, BAJADA,
} from '../game/src/content/maps/b19/sima_layout.js';
import { SPAN_DEFS, cellsOf, spanFlag } from '../game/src/content/events/b19_spans_logic.js';
import { F } from '../game/src/content/events/b19_common.js';

const DV = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };
const key = (x, y) => `${x},${y}`;
const P9 = ['p8_restored', 'p9_restored', 'zyg_complete'];
const SPANS = [F.span1, F.span2, F.span3];

async function world(mapId, { flags = [], vars = {}, selfA = [] } = {}) {
  const state = GameState.create({ name: 'Prueba' });
  for (const f of flags) state.setFlag(f);
  for (const [k, v] of Object.entries(vars)) state.setVar(k, v);
  for (const id of selfA) state.setSelfSwitch(mapId, id, 'A', true);
  const { entry, def } = await buildMapNode(mapId);
  const w = new World({ state });
  w.setCurrent({ ...entry, events: null });
  return { w, map: entry.map, p: w.player, state, def };
}

/** Aristas de los warps del propio mapa (empujar contra el hueco o pulsar una dirección sobre la casilla). */
function warpLinks(ctx) {
  const links = [];
  for (const wp of ctx.def.warps || []) {
    if (wp.to !== ctx.def.id) continue;
    const dest = [wp.tx, wp.ty];
    if (wp.dirTrigger) { links.push([[wp.x, wp.y], dest]); continue; }
    for (const [dx, dy] of Object.values(DV)) links.push([[wp.x - dx, wp.y - dy], dest]);
  }
  return links;
}

/** Casillas alcanzables desde `start` (block: casillas tratadas como muro, p. ej. los disparadores de una escena). */
function bfs(ctx, start, { block = [] } = {}) {
  const { map, p } = ctx;
  const blocked = new Set(block.map(([x, y]) => key(x, y)));
  const extra = new Map();
  for (const [a, b] of warpLinks(ctx)) extra.set(key(...a), [...(extra.get(key(...a)) || []), b]);
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

const canUse = (r, x, y) => r.has(x, y) || [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => r.has(x + dx, y + dy));
const inRect = (r, rc) => { for (let y = rc.y0; y <= rc.y1; y++) for (let x = rc.x0; x <= rc.x1; x++) if (r.has(x, y)) return true; return false; };
const START = [ARRIVAL.x, ARRIVAL.y];
const PENA_LAND = { x0: 0, y0: 5, x1: 37, y1: 13 };

// ───────────────────────────── Calzada del Rey ─────────────────────────────

test('Calzada: antes del P9 el brazo de la Sima no se cruza (no hay piedras); el campamento y el Mirador, sí', async () => {
  const c = await world('calzada_rey');
  const r = bfs(c, START);
  assert.ok(!inRect(r, STACK_A) && !inRect(r, STACK_B) && !inRect(r, PENA_LAND), 'se cruza la Sima antes del P9');
  assert.ok(r.has(13, 40) && r.has(CAMP.fire.x, CAMP.fire.y + 1), 'el Mirador o la hoguera no se alcanzan');
  for (const d of SPAN_DEFS) for (const s of cellsOf(d.n).stones) assert.ok(!r.has(s.x, s.y), `antes del P9 se pisa la piedra (${s.x},${s.y})`);
  assert.deepEqual(dead(r, START), [], 'casillas sin vuelta antes del P9');
});

test('Calzada: con el P9, Tadeo guarda el primer tramo hasta hablar con Casandra; las piedras nunca tocan la otra orilla', async () => {
  const guarded = bfs(await world('calzada_rey', { flags: P9 }), START);
  for (const s of cellsOf(1).stones) assert.ok(!guarded.has(s.x, s.y), `sin la presentación de Casandra se pisa la piedra (${s.x},${s.y})`);
  assert.deepEqual(cellsOf(1).entries.map((s) => [s.x, s.y]), [[NPC.tadeoPaso.x, NPC.tadeoPaso.y - 1]], 'la única entrada del primer tramo no es la que guarda Tadeo');
  assert.ok(!inRect(guarded, STACK_A), 'se llega a la pila A sin alzar la Calzada');
  const open = bfs(await world('calzada_rey', { flags: [...P9, F.intro] }), START);
  const goal = cellsOf(1).goals[0];
  assert.ok(open.has(goal.x, goal.y), 'la meta del primer tramo (junto a la aguja) no se alcanza');
  assert.ok(!inRect(open, STACK_A) && !inRect(open, PENA_LAND), 'las piedras forzadas llevan a la otra orilla (se salta la Reconstrucción)');
  assert.deepEqual(dead(open, START), [], 'casillas sin vuelta con las piedras en pie');
});

test('Calzada: cada tramo solo se cruza una vez alzado; la meta de cada uno se alcanza desde el anterior', async () => {
  const base = [...P9, F.intro];
  for (let n = 1; n <= 3; n++) {
    const done = SPANS.slice(0, n - 1);
    const before = bfs(await world('calzada_rey', { flags: [...base, ...done] }), START);
    const goal = cellsOf(n).goals[0];
    assert.ok(before.has(goal.x, goal.y), `tramo ${n}: la meta no se alcanza con los anteriores alzados`);
    const beyond = SPAN_DEFS[n - 1].beyond;
    assert.ok(!before.has(beyond.x, beyond.y), `tramo ${n}: se llega al otro lado (${beyond.x},${beyond.y}) sin alzarlo`);
    const after = bfs(await world('calzada_rey', { flags: [...base, ...done, SPANS[n - 1]] }), START);
    assert.ok(after.has(beyond.x, beyond.y), `tramo ${n}: alzado, no se llega al otro lado`);
    assert.deepEqual(dead(after, START), [], `tramo ${n}: casillas sin vuelta`);
  }
});

test('Calzada: Casandra corta el paso a la Peña hasta ganarle; después, taller, Bajada, cima y Alfa', async () => {
  const flags = [...P9, F.intro, ...SPANS, F.casandraArrived];
  const duel = await world('calzada_rey', { flags });
  const blocked = bfs(duel, START, { block: DUEL.strip });
  assert.ok(!inRect(blocked, PENA_LAND), 'se llega a la Peña sin pasar por Casandra');
  assert.ok(blocked.has(DUEL.retry.x, DUEL.retry.y), 'la casilla de reintento no se alcanza');
  const won = bfs(await world('calzada_rey', { flags: [...flags, F.casandraBeaten] }), START);
  const W = PENA.workshop.front;
  const B = PENA.bajada.front;
  assert.ok(won.has(W.x, W.y) && won.has(B.x, B.y), 'el taller o la Bajada no se alcanzan tras el combate');
  assert.ok(canUse(won, PENA.alfa.x, PENA.alfa.y), 'el Salamence Alfa no se alcanza');
  assert.ok(canUse(won, PENA.stele.x, PENA.stele.y + 1), 'la estela del taller no se alcanza');
  assert.deepEqual(dead(won, START), [], 'casillas sin vuelta con la Calzada entera');
});

test('Calzada: objetos, entrenadores y gente se alcanzan en su momento', async () => {
  const all = [...P9, F.intro, ...SPANS, F.casandraArrived, F.casandraBeaten];
  const r = bfs(await world('calzada_rey', { flags: all }), START);
  for (const it of ITEMS) assert.ok(canUse(r, it.x, it.y), `${it.id} en (${it.x},${it.y}) inalcanzable`);
  for (const t of TRAINERS) assert.ok(canUse(r, t.x, t.y), `${t.id} inalcanzable`);
  for (const p of [NPC.leocadia, NPC.tarsicio, NPC.cocinera, NPC.nino, NPC.mercader, CAMP.fire, CAMP.resonator]) {
    assert.ok(canUse(r, p.x, p.y), `(${p.x},${p.y}) inalcanzable`);
  }
  assert.ok(r.has(MIRADOR.stele.x, MIRADOR.stele.y + 2), 'la estela del Mirador no se lee');
  // Antes de la Calzada, los objetos de la orilla sur ya se alcanzan (no dependen de la Reconstrucción)
  const south = bfs(await world('calzada_rey'), START);
  for (const it of ITEMS.filter((i) => i.y >= RIM_S)) assert.ok(canUse(south, it.x, it.y), `${it.id} exige cruzar la Sima`);
});

// ───────────────────────────── Taller del Rey ─────────────────────────────

test('Taller: la hornacina de la Tabla Draco y todas las piezas se alcanzan; siempre hay vuelta', async () => {
  const t = await world('calzada_taller', { flags: [F.casandraBeaten] });
  const home = [TALLER_ENTRY.x, TALLER_ENTRY.y];
  const r = bfs(t, home);
  assert.ok(r.has(NICHE.stand.x, NICHE.stand.y), 'no se llega delante de la hornacina');
  for (const p of PIECES) assert.ok(canUse(r, p.x, p.y + (p.wall ? 1 : 0)) || canUse(r, p.x, p.y), `${p.id} inalcanzable`);
  assert.deepEqual(dead(r, home), [], 'casillas sin vuelta en el taller');
});

// ───────────────────────────── Sima del Eje ─────────────────────────────

const onUmbral = (r) => inRect(r, UMBRAL.plaza);

test('Sima: desde la Bajada, la Calzada se corta ante el Umbral hasta alzar el último tramo (solo con la Tabla Draco)', async () => {
  const home = [ARRIVALS.bajada.x, ARRIVALS.bajada.y];
  const s = await world('sima_eje', { flags: [...P9] });
  const r = bfs(s, home);
  assert.ok(r.has(EAST.landing3.x0 + 1, EAST.landing3.y0 + 1), 'no se baja por la Calzada hasta el tercer rellano');
  assert.ok(!onUmbral(r), 'se llega al Umbral sin el último tramo');
  assert.ok(!inRect(r, WEST.trail1) && !inRect(r, WEST.trail2), 'la Calzada lleva al sendero del oeste');
  const socket = s.w.events.find((e) => e.id === 'sima_zocalo_final');
  assert.ok(!socket?.page, 'sin la Tabla Draco aparece el zócalo del último tramo');
  const t = await world('sima_eje', { flags: [...P9, F.tablet] });
  assert.ok(t.w.events.find((e) => e.id === 'sima_zocalo_final')?.page?.solid, 'con la Tabla Draco no aparece el zócalo');
  assert.ok(canUse(bfs(t, home), GAP_FINAL.socket.x, GAP_FINAL.socket.y), 'el zócalo del último tramo no se alcanza');
  const done = await world('sima_eje', { flags: [...P9, F.tablet, F.finalGap] });
  const rd = bfs(done, home);
  assert.ok(onUmbral(rd) && rd.has(UMBRAL.arrive.x, UMBRAL.arrive.y), 'alzado el último tramo, el Umbral no se alcanza');
  assert.deepEqual(dead(rd, home), [], 'casillas sin vuelta desde la Bajada');
  const back = bfs(done, [UMBRAL.arrive.x, UMBRAL.arrive.y]);
  assert.ok(back.has(BAJADA.arrive.x, BAJADA.arrive.y), 'del Umbral no se vuelve a la Bajada');
});

test('Sima: el sendero del oeste exige Reconstrucción entre las dos bajadas; la Metagrossita, su hueco', async () => {
  const north = [ARRIVALS.north.x, ARRIVALS.north.y];
  const south = [ARRIVALS.south.x, ARRIVALS.south.y];
  const s = await world('sima_eje', { flags: [...P9] });
  const r = bfs(s, north);
  assert.ok(canUse(r, GAP_W.sockets[0].x, GAP_W.sockets[0].y), 'el zócalo norte del sendero no se alcanza');
  assert.ok(!r.has(...south), 'se baja al Mirador Sur sin Reconstrucción');
  assert.ok(!onUmbral(r) && !inRect(r, EAST.landing1), 'el sendero del oeste lleva al Umbral o a la Calzada');
  const open = await world('sima_eje', { flags: [...P9, F.simaGap] });
  const ro = bfs(open, north);
  assert.ok(ro.has(...south), 'con el hueco alzado no se llega a la bajada del Mirador Sur');
  const metag = SIMA_ITEMS.find((i) => i.item === 'METAGROSSITE');
  assert.ok(!canUse(ro, metag.x, metag.y), 'la Metagrossita se coge sin alzar su hueco');
  assert.ok(canUse(ro, GAP_ALCOVE.socket.x, GAP_ALCOVE.socket.y), 'el zócalo del rellano no se alcanza');
  const all = await world('sima_eje', { flags: [...P9, F.simaGap], selfA: ['sima_zocalo_rellano'] });
  const ra = bfs(all, north);
  assert.ok(canUse(ra, metag.x, metag.y), 'la Metagrossita no se alcanza con el hueco alzado');
  const isWest = (it) => Object.values(WEST).some((rc) => it.x >= rc.x0 && it.x <= rc.x1 && it.y >= rc.y0 && it.y <= rc.y1);
  for (const it of SIMA_ITEMS.filter(isWest)) assert.ok(canUse(ra, it.x, it.y), `${it.id} inalcanzable por el oeste`);
  for (const t of SIMA_TRAINERS) assert.ok(canUse(ra, t.x, t.y), `${t.id} inalcanzable`);
  assert.deepEqual(dead(ra, north), [], 'casillas sin vuelta en el oeste');
  const east = bfs(await world('sima_eje', { flags: [...P9, F.tablet, F.finalGap] }), [ARRIVALS.bajada.x, ARRIVALS.bajada.y]);
  for (const it of SIMA_ITEMS.filter((i) => !isWest(i))) assert.ok(canUse(east, it.x, it.y), `${it.id} inalcanzable por la Calzada`);
});
