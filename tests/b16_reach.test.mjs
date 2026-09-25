// Bloque 16 — Pilar del Alma: alcanzabilidad a pie (docs/CAMPANA.md B16; §2.5: G12 Lagos del Alma con Nadar, G13 Forma
// Completa, G14 Reconstrucción). BFS con la pasabilidad real del mundo (tiles + eventos sólidos + saltos de saliente),
// con aristas extra por los warps del propio mapa (los que se activan empujando contra el hueco o pulsando una
// dirección) y el nado cuando la capacidad se da:
//   · Lagos: sin Nadar no se llega al islote del santuario (el puente de hielo está fundido junto al islote); nadando,
//     sí. Tras reconstruir los dos huecos del puente, se llega a pie. Con el tramo de la orilla hundido y sin
//     reconstruir, el arco del puente queda aislado. C095 y los objetos del agua, solo nadando; el resto, a pie.
//   · Santuario: cada puerta de historia (glifos, espejos, hexágono del Telar) cierra el paso hasta cumplirse; las rondas
//     de puertas y el Telar solo se alcanzan por guion; C097–C100 están en pasos obligados; el pasillo del viento llega
//     a la puerta de Azelf; ninguna casilla alcanzable deja al jugador sin vuelta.
//   · Recuerdo de Gael: cada estampa tiene sus casillas de guion alcanzables.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { World } from '../game/src/world/world.js';
import { canSurfFreely } from '../game/src/world/terrain.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import {
  ARRIVAL, SANCTUARY, BRIDGE, CELL_LAGOS, LAGOS_ITEMS, NPC, REFUGIO, EXITS, ISLAND,
} from '../game/src/content/maps/b16/lagos_layout.js';
import { PATIO, SABER, SENTIR, QUERER, TELAR, ENTRY, SANTUARIO_ITEMS, floorTop } from '../game/src/content/maps/b16/santuario_layout.js';
import { LAB, ESPLANADA, ALJIBE } from '../game/src/content/maps/b16/recuerdo_layout.js';
import { F } from '../game/src/content/events/b16_common.js';

const DV = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };
const key = (x, y) => `${x},${y}`;

async function world(mapId, { flags = [], vars = {} } = {}) {
  const state = GameState.create({ name: 'Prueba' });
  for (const f of flags) state.setFlag(f);
  for (const [k, v] of Object.entries(vars)) state.setVar(k, v);
  const { entry, def } = await buildMapNode(mapId);
  const w = new World({ state });
  w.setCurrent({ ...entry, events: null });
  return { w, map: entry.map, p: w.player, state, def };
}

/** ¿Hay un evento con página activa (disparador) en (x, y)? (barreras sobre un warp que se empuja) */
const eventAt = (w, x, y) => w.events.some((e) => !e.erased && e.page && e.trigger && e.x === x && e.y === y);

/** Aristas de los warps del propio mapa (empujar contra el hueco o pulsar una dirección sobre la casilla). */
function warpLinks(ctx) {
  const links = [];
  for (const wp of ctx.def.warps || []) {
    if (wp.to !== ctx.def.id) continue;
    const dest = [wp.tx, wp.ty];
    if (wp.dirTrigger) { links.push([[wp.x, wp.y], dest]); continue; }
    if (eventAt(ctx.w, wp.x, wp.y)) continue; // barrera activa: el empujón dispara el evento, no el warp
    for (const [dx, dy] of Object.values(DV)) links.push([[wp.x - dx, wp.y - dy], dest]);
  }
  return links;
}

/**
 * Casillas alcanzables desde `start`. opts: block (casillas tratadas como muro), links extra, swim (se puede nadar),
 * warps (seguir los warps internos del mapa).
 */
function bfs(ctx, start, { block = [], links = [], swim = false, warps = true } = {}) {
  const { map, p } = ctx;
  const blocked = new Set(block.map(([x, y]) => key(x, y)));
  const extra = new Map();
  for (const [a, b] of [...links, ...(warps ? warpLinks(ctx) : [])]) extra.set(key(...a), [...(extra.get(key(...a)) || []), b]);
  const water = (x, y) => canSurfFreely(map.terrainTagAt(x, y)) && !map.playerPassable(x, y, 0, {});
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
      p.surfing = water(x, y);
      let ok = p.passable(x, y, d);
      if (!ok && swim && !p.surfing && water(nx, ny)) { p.surfing = true; ok = p.passable(x, y, d); }
      if (!ok && p.surfing) { p.surfing = false; ok = map.playerPassable(nx, ny, 10 - d, {}) && p.passable(x, y, d); }
      if (!ok) continue;
      if (!p.surfing && map.terrainTagAt(nx, ny, 0).ledge) { nx += DV[d][0]; ny += DV[d][1]; }
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
const START = [ARRIVAL.x, ARRIVAL.y];
const onIsland = (r) => r.has(SANCTUARY.out.x, SANCTUARY.out.y);

// ───────────────────────────── Lagos del Alma ─────────────────────────────

test('Lagos: sin Nadar no se llega al islote del santuario (G12); nadando, sí', async () => {
  const L = await world('lagos_alma', { flags: [F.arrival] });
  const foot = bfs(L, START);
  assert.ok(!onIsland(foot), 'a pie se llega a la boca del santuario');
  for (const w of SANCTUARY.warps) assert.ok(!canUse(foot, w.x, w.y), `a pie se empuja el warp del santuario (${w.x},${w.y})`);
  assert.ok(foot.has(BRIDGE.x0, BRIDGE.middle.y0), 'el arco del puente (del lado de la orilla) no se pisa a pie');
  assert.ok(!foot.has(BRIDGE.cx, BRIDGE.gapA.y0), 'el hueco A (fundido) se pisa');
  const swim = bfs(L, START, { swim: true });
  assert.ok(onIsland(swim), 'nadando no se llega al islote');
  assert.ok(swim.has(SANCTUARY.warps[0].x, SANCTUARY.warps[0].y + 1), 'nadando no se llega a la boca del santuario');
});

test('Lagos: con los dos huecos reconstruidos se cruza a pie; con el tramo hundido, el arco queda aislado', async () => {
  const rebuilt = await world('lagos_alma', { flags: [F.arrival, F.restored, F.milestoneScene, F.milestone, F.bridgeBroken, F.bridgeA, F.bridgeB] });
  assert.ok(onIsland(bfs(rebuilt, START)), 'con el puente reconstruido no se llega a pie al islote');
  const broken = await world('lagos_alma', { flags: [F.arrival, F.restored, F.milestoneScene, F.milestone, F.milestonePartial, F.bridgeBroken] });
  const r = bfs(broken, START);
  assert.ok(!r.has(BRIDGE.x0, BRIDGE.middle.y0), 'con el tramo hundido se llega a pie al arco del puente');
  assert.ok(!onIsland(r), 'con el tramo hundido se llega a pie al islote');
  assert.ok(onIsland(bfs(broken, START, { swim: true })), 'con el tramo hundido no se puede ni nadar al islote');
  // Solo el hueco A reconstruido (escena completa a medias): del islote al arco sí, del arco a la orilla no.
  const half = await world('lagos_alma', { flags: [F.arrival, F.restored, F.milestoneScene, F.bridgeBroken, F.bridgeA] });
  const fromIsland = bfs(half, [SANCTUARY.out.x, SANCTUARY.out.y]);
  assert.ok(canUse(fromIsland, BRIDGE.sockets.B[0].x, BRIDGE.sockets.B[0].y), 'el zócalo B no se alcanza desde el islote');
  assert.ok(!fromIsland.has(BRIDGE.cx, BRIDGE.y1 + 1), 'se llega a la orilla sin reconstruir el hueco B');
});

test('Lagos: C095 y los objetos del agua solo nadando; objetos, vecinos, refugio y puertas a pie; sin trampas', async () => {
  const L = await world('lagos_alma', { flags: [F.arrival] });
  const foot = bfs(L, START);
  const swim = bfs(L, START, { swim: true });
  assert.ok(!canUse(foot, CELL_LAGOS.x, CELL_LAGOS.y), 'C095 (etapa H, Nadar) se alcanza a pie');
  assert.ok(swim.has(CELL_LAGOS.x, CELL_LAGOS.y), 'C095 no se alcanza nadando');
  const bySwim = new Set(['objeto_lagos_3', 'objeto_lagos_4', 'objeto_lagos_5']);
  for (const it of LAGOS_ITEMS) {
    if (bySwim.has(it.id)) {
      assert.ok(!canUse(foot, it.x, it.y), `${it.id} se coge a pie`);
      assert.ok(canUse(swim, it.x, it.y), `${it.id} no se coge nadando`);
    } else {
      assert.ok(canUse(foot, it.x, it.y), `${it.id} en (${it.x},${it.y}) inalcanzable a pie`);
    }
  }
  for (const id of ['marta', 'anciano_boreal', 'nino_boreal', 'observadora', 'genesis_tecnica', 'genesis_tecnico', 'cartel_lagos']) {
    const ev = L.w.events.find((e) => e.id === id);
    assert.ok(ev && canUse(foot, ev.x, ev.y), `${id} inalcanzable`);
  }
  assert.ok(canUse(foot, REFUGIO.door.x, REFUGIO.door.y), 'la puerta del refugio no se alcanza');
  for (let x = EXITS.south.x0; x <= EXITS.south.x1; x++) assert.ok(foot.has(x, EXITS.south.y), `borde sur (${x}) inalcanzable`);
  assert.deepEqual(dead(foot, START), [], 'casillas a pie sin vuelta a la llegada');
  assert.deepEqual(dead(swim, START), [], 'casillas nadando sin vuelta a la llegada');
});

test('Lagos: los zócalos de Reconstrucción están donde se alcanzan en su momento', async () => {
  const L = await world('lagos_alma', { flags: [F.arrival] });
  const swim = bfs(L, START, { swim: true });
  for (const s of BRIDGE.sockets.A) assert.ok(canUse(swim, s.x, s.y), `zócalo A (${s.x},${s.y})`);
  const sockA = L.w.events.find((e) => e.id === 'zocalo_a_0');
  assert.ok(sockA?.page?.solid, 'el zócalo A está antes del P8 (lectura de la barrera)');
  assert.ok(!L.w.events.find((e) => e.id === 'zocalo_b_0')?.page, 'el zócalo B aparece antes de hundirse el tramo');
  assert.ok(ISLAND.x0 < SANCTUARY.out.x && SANCTUARY.out.x < ISLAND.x1, 'la salida del santuario está en el islote');
  assert.ok(NPC.arrivalStrip.every(([x, y]) => bfs(L, START).has(x, y)), 'la franja de llegada no se pisa');
});

// ───────────────────────────── Santuario del Alma ─────────────────────────────

const HOME = [ENTRY.arrive.x, ENTRY.arrive.y];
const inRoom = (r, room) => {
  for (let y = floorTop(room); y < room.y + room.h; y++) for (let x = room.x; x < room.x + room.w; x++) if (r.has(x, y)) return true;
  return false;
};
const sant = (flags = []) => world('santuario_alma', { flags: [F.sanctuaryIntro, ...flags] });

test('Santuario: del patio se llega a las tres alas; la sala de puertas del Saber solo tras los glifos', async () => {
  const s = await sant();
  const r = bfs(s, HOME);
  assert.ok(inRoom(r, SABER.glyphRoom.room), 'la sala de los glifos no se alcanza');
  assert.ok(inRoom(r, SENTIR.mirrors[0].room), 'el primer espejo no se alcanza');
  assert.ok(inRoom(r, QUERER.wind.room), 'el pasillo del viento no se alcanza');
  assert.ok(!inRoom(r, SABER.doors3.room), 'se llega a las tres puertas sin colocar los glifos');
  assert.ok(inRoom(bfs(await sant([F.glyphs]), HOME), SABER.doors3.room), 'con los glifos, la sala de tres puertas sigue cerrada');
  // Las rondas de cuatro puertas, la cámara de Uxie y el Telar solo se alcanzan por guion (puertas y hexágono)
  const all = bfs(await sant([F.glyphs, F.mirror1, F.mirror2, F.mirror3, F.telarOpen]), HOME);
  assert.ok(!inRoom(all, SABER.doors4.room), 'la sala de cuatro puertas se alcanza sin acertar una puerta');
  assert.ok(!inRoom(all, SABER.uxie.room), 'la cámara de Uxie se alcanza sin acertar las puertas');
  assert.ok(!inRoom(all, TELAR.room), 'el Telar se alcanza sin el hexágono del patio');
});

test('Santuario: cada espejo cierra la puerta hasta atrapar a Mesprit; C098 está en el paso al último espejo', async () => {
  const [m1, m2, m3] = SENTIR.mirrors;
  const none = bfs(await sant(), HOME);
  assert.ok(!inRoom(none, m2.room), 'se llega al segundo espejo sin el primero');
  const one = bfs(await sant([F.mirror1]), HOME);
  assert.ok(inRoom(one, m2.room) && !inRoom(one, m3.room), 'el segundo espejo no abre en su momento');
  const two = bfs(await sant([F.mirror1, F.mirror2]), HOME);
  assert.ok(inRoom(two, m3.room) && !inRoom(two, SENTIR.lastMirror.room), 'el tercer espejo no abre en su momento');
  const three = await sant([F.mirror1, F.mirror2, F.mirror3]);
  const r = bfs(three, HOME);
  assert.ok(inRoom(r, SENTIR.lastMirror.room), 'el último espejo no se alcanza');
  assert.ok(!inRoom(bfs(three, HOME, { block: [[SENTIR.cell.x, SENTIR.cell.y]] }), SENTIR.lastMirror.room), 'se llega al último espejo sin pasar por C098');
  assert.ok(canUse(r, SENTIR.lastMirror.mirror.x, SENTIR.lastMirror.mirror.y), 'el gran espejo no se alcanza');
  assert.ok(!inRoom(r, SENTIR.mesprit.room), 'la cámara de Mesprit se alcanza sin el recuerdo (solo se entra desde el espejo)');
  // Los reflejos y Mesprit están en el lado del espejo: el jugador nunca pisa ese lado
  for (const m of SENTIR.mirrors) for (let y = floorTop(m.room); y < m.room.y + m.room.h; y++) assert.ok(!r.has(m.mirrorX + 1, y), `se pisa el lado del reflejo en (${m.mirrorX + 1},${y})`);
});

test('Santuario: C097 y C099 están en pasos obligados; el viento no corta el camino a Azelf', async () => {
  const s = await sant([F.glyphs]);
  assert.ok(!inRoom(bfs(s, HOME, { block: [[SABER.cell.x, SABER.cell.y]] }), SABER.doors3.room), 'se llega a las puertas sin pasar por C097');
  const r = bfs(s, HOME);
  assert.ok(r.has(QUERER.wind.cell.x, QUERER.wind.cell.y), 'la repisa de arriba (C099) no se alcanza');
  assert.ok(inRoom(r, QUERER.azelf.room), 'la cámara de Azelf no se alcanza por el pasillo');
  assert.ok(!inRoom(bfs(s, HOME, { block: [[QUERER.wind.cell.x, QUERER.wind.cell.y]] }), QUERER.azelf.room), 'se llega a Azelf sin pasar por C099');
  const az = s.w.events.find((e) => e.id === 'azelf');
  assert.ok(canUse(r, az.x, az.y), 'Azelf no se alcanza');
});

test('Santuario: el Telar solo se alcanza desde (51,37), donde está C100; todo tiene vuelta al patio', async () => {
  const s = await sant([F.glyphs, F.mirror1, F.mirror2, F.mirror3, F.telarOpen]);
  const fromTelar = bfs(s, [TELAR.entry.arrive.x, TELAR.entry.arrive.y]);
  const L = TELAR.loom;
  const around = [[L.x, L.y + 1], [L.x - 1, L.y], [L.x + 1, L.y], [L.x, L.y - 1]].filter(([x, y]) => fromTelar.has(x, y));
  assert.deepEqual(around, [[TELAR.cell.x, TELAR.cell.y]], `el Telar se alcanza desde ${JSON.stringify(around)}`);
  assert.ok(fromTelar.has(HOME[0], HOME[1]), 'desde el Telar no se vuelve al patio');
  const all = bfs(s, HOME);
  assert.deepEqual(dead(all, HOME), [], 'casillas del santuario sin vuelta al patio');
  for (const it of SANTUARIO_ITEMS) {
    const reach = [all, fromTelar, bfs(s, [SABER.uxie.entry.arrive.x, SABER.uxie.entry.arrive.y]), bfs(s, [SENTIR.mesprit.arrive.x, SENTIR.mesprit.arrive.y])];
    assert.ok(reach.some((r) => canUse(r, it.x, it.y)), `${it.id} en (${it.x},${it.y}) inalcanzable`);
  }
  // Uxie, las puertas de las rondas y Mesprit se alcanzan desde sus llegadas por guion
  const uxie = bfs(s, [SABER.uxie.entry.arrive.x, SABER.uxie.entry.arrive.y]);
  assert.ok(canUse(uxie, SABER.uxie.uxie.x, SABER.uxie.uxie.y), 'Uxie inalcanzable');
  for (const k of ['doors3', 'doors4']) {
    const rr = bfs(s, [SABER[k].entry.arrive.x, SABER[k].entry.arrive.y]);
    for (const d of SABER[k].doors) assert.ok(canUse(rr, d.x, d.y), `puerta ${k} (${d.x},${d.y}) inalcanzable`);
    assert.ok(rr.has(PATIO.gates.saber.front.x, PATIO.gates.saber.front.y), `${k}: sin vuelta al patio`);
  }
  const mes = bfs(s, [SENTIR.mesprit.arrive.x, SENTIR.mesprit.arrive.y]);
  assert.ok(canUse(mes, SENTIR.mesprit.mesprit.x, SENTIR.mesprit.mesprit.y) && mes.has(HOME[0], HOME[1]), 'Mesprit inalcanzable o sin vuelta');
});

// ───────────────────────────── Recuerdo de Gael ─────────────────────────────

test('Recuerdo: en cada estampa se alcanzan las casillas de su guion', async () => {
  const m = await world('santuario_alma_recuerdo');
  const lab = bfs(m, [LAB.arrive.x, LAB.arrive.y]);
  assert.ok(canUse(lab, LAB.alerce.x, LAB.alerce.y), 'Alerce inalcanzable');
  assert.ok(lab.has(LAB.wait.x, LAB.wait.y), 'la ventana (esperar) inalcanzable');
  const esp = bfs(m, [ESPLANADA.arrive.x, ESPLANADA.arrive.y]);
  assert.ok(esp.has(ESPLANADA.front.x, ESPLANADA.front.y) && esp.has(ESPLANADA.bench.x, ESPLANADA.bench.y), 'explanada: Casilda o la piedra inalcanzables');
  const alj = bfs(m, [ALJIBE.arrive.x, ALJIBE.arrive.y]);
  assert.ok(alj.has(ALJIBE.front.x, ALJIBE.front.y), 'el aljibe inalcanzable');
  assert.ok(!lab.has(ESPLANADA.arrive.x, ESPLANADA.arrive.y) && !esp.has(ALJIBE.arrive.x, ALJIBE.arrive.y), 'las estampas están unidas a pie');
});
