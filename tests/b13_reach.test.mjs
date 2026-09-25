// Bloque 13 — Mar del Sur, Estación Talasa, Islote Lumbre y Volcán Tizón: alcanzabilidad a pie y a nado (docs/CAMPANA.md
// §2.5 G9 agua profunda; B13: compuerta del invernadero, puerta sellada del laboratorio, peña de la luna, coladas).
// BFS con la pasabilidad real del mundo (tiles + eventos sólidos + saltos de saliente) y, con Nadar, entradas y salidas
// del agua como en el juego (world/waterAccess.js). Las casillas de warp se pisan pero no se sigue más allá (sacan del
// mapa). Comprueba que ninguna puerta de capacidad o de historia se salta, que no hay casillas trampa (desde toda casilla
// alcanzable se vuelve a una entrada) y que objetos, células y entrenadores se alcanzan en su momento.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { World } from '../game/src/world/world.js';
import { canSurfFreely } from '../game/src/world/terrain.js';
import { canOfferSwim } from '../game/src/world/waterAccess.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import * as MAR from '../game/src/content/maps/b13/mar_layout.js';
import * as TAL from '../game/src/content/maps/b13/talasa_layout.js';
import * as LUM from '../game/src/content/maps/b13/lumbre_layout.js';
import * as TIZ from '../game/src/content/maps/b13/tizon_layout.js';
import * as CUE from '../game/src/content/maps/b13/tizon_cueva_layout.js';
import * as CL from '../game/src/content/maps/b09b/caleta_layout.js';
import { PILOTES } from '../game/src/content/maps/b13/talasa_pilotes.js';
import { CRATER } from '../game/src/content/events/b13_tizon_crater.js';
import { GREENHOUSE, OFFICE } from '../game/src/content/events/b13_talasa_interiores.js';
import { LAB } from '../game/src/content/events/b13_talasa_lab.js';
import { ROOMS, ROOM_IDS, roomStart, walkable as lavaWalkable, headOf } from '../game/src/content/events/b13_lava_logic.js';
import { F, V } from '../game/src/content/events/b13_common.js';

const DV = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };
const K = (x, y, s) => `${x},${y},${s ? 1 : 0}`;
const XY = (x, y) => `${x},${y}`;

/**
 * Explora un mapa desde `starts` ([x, y, nadando?]). opts: abilities, flags, vars ({ nombre: valor }), erase (prefijos de
 * id de evento retirados). → { has, hasWalk, hasSurf, traps, world, map, size }
 */
async function explore(mapId, starts, { abilities = [], flags = [], vars = {}, erase = [] } = {}) {
  const state = GameState.create({ name: 'Prueba' });
  for (const a of abilities) state.setZygardeAbility(a, true);
  for (const f of flags) state.setFlag(f);
  for (const [k, v] of Object.entries(vars)) state.setVar(k, v);
  const { entry, def } = await buildMapNode(mapId);
  const world = new World({ state });
  world.setCurrent({ ...entry, events: null });
  for (const ev of world.events) if (erase.some((p) => String(ev.id).startsWith(p))) ev.erased = true;
  const warps = new Set((def.warps || []).map((w) => XY(w.x, w.y)));
  const startSet = new Set(starts.map(([x, y]) => XY(x, y)));
  const p = world.player;
  const map = entry.map;
  const swim = abilities.includes('swim');
  const blockedByEvent = (x, y) => world.events.some((ev) => !ev.erased && !ev.through && ev.at(x, y) && (ev.characterName || ev.solid));
  const seen = new Set();
  const rev = new Map();
  const queue = [];
  for (const [x, y, s = false] of starts) { seen.add(K(x, y, s)); queue.push([x, y, s]); }
  while (queue.length) {
    const [x, y, s] = queue.shift();
    if (warps.has(XY(x, y)) && !startSet.has(XY(x, y))) continue; // el warp saca del mapa
    for (const d of [2, 4, 6, 8]) {
      let nx = x + DV[d][0];
      let ny = y + DV[d][1];
      if (!map.valid(nx, ny)) continue;
      p.x = x; p.y = y; p.surfing = s;
      let ns = s;
      if (p.passable(x, y, d)) {
        const t = map.terrainTagAt(nx, ny);
        if (s && !canSurfFreely(t)) ns = false;
        if (!s && t.ledge) { nx += DV[d][0]; ny += DV[d][1]; }
      } else if (!s && swim && !blockedByEvent(nx, ny)
        && canOfferSwim({ map, player: { x, y, direction: d, surfing: false }, bridge: 0 })) {
        ns = true;
      } else continue;
      if (!map.valid(nx, ny)) continue;
      const k = K(nx, ny, ns);
      if (!rev.has(k)) rev.set(k, new Set());
      rev.get(k).add(K(x, y, s));
      if (seen.has(k)) continue;
      seen.add(k);
      queue.push([nx, ny, ns]);
    }
  }
  const back = new Set(starts.map(([x, y, s = false]) => K(x, y, s)));
  const bq = [...back];
  while (bq.length) {
    const k = bq.shift();
    for (const from of rev.get(k) || []) if (!back.has(from)) { back.add(from); bq.push(from); }
  }
  const isWarpKey = (k) => warps.has(k.split(',').slice(0, 2).join(','));
  const traps = [...seen].filter((k) => !back.has(k) && !isWarpKey(k));
  const has = (x, y) => seen.has(K(x, y, false)) || seen.has(K(x, y, true));
  return { has, hasWalk: (x, y) => seen.has(K(x, y, false)), hasSurf: (x, y) => seen.has(K(x, y, true)), traps, world, map, def, size: seen.size };
}

const NEAR = [[0, 1], [0, -1], [1, 0], [-1, 0]];
const canReach = (r, x, y) => r.has(x, y) || NEAR.some(([dx, dy]) => r.has(x + dx, y + dy));
const canReachWalking = (r, x, y) => r.hasWalk(x, y) || NEAR.some(([dx, dy]) => r.hasWalk(x + dx, y + dy));
const evById = (r, id) => r.world.events.find((e) => e.id === id);

/** Casillas de agua de un borde (entradas nadando desde el mapa vecino). */
function edgeWater(map, side) {
  const out = [];
  const along = side === 'north' || side === 'south' ? map.width : map.height;
  for (let i = 0; i < along; i++) {
    const [x, y] = side === 'north' ? [i, 0] : side === 'south' ? [i, map.height - 1] : side === 'west' ? [0, i] : [map.width - 1, i];
    if (canSurfFreely(map.terrainTagAt(x, y))) out.push([x, y, true]);
  }
  return out;
}

/** Ningún punto del borde `side` se pisa a pie (solo se llega nadando). */
function assertEdgeNotWalkable(map, side, label) {
  const along = side === 'north' || side === 'south' ? map.width : map.height;
  for (let i = 0; i < along; i++) {
    const [x, y] = side === 'north' ? [i, 0] : side === 'south' ? [i, map.height - 1] : side === 'west' ? [0, i] : [map.width - 1, i];
    assert.ok(!map.playerPassable(x, y, 0, {}), `${label}: borde ${side} (${x},${y}) pisable a pie`);
  }
}

// ───────────────────────────── Mar del Sur ─────────────────────────────

test('Mar del Sur: solo se entra nadando; con Nadar se recorre entero (células, objetos, nadadores, remolinos), sin trampas', async () => {
  const { entry } = await buildMapNode('mar_del_sur');
  const map = entry.map;
  for (const side of ['north', 'south', 'east']) assertEdgeNotWalkable(map, side, 'Mar del Sur');
  const starts = edgeWater(map, 'north').filter(([x]) => x >= 20 && x < 24);
  assert.ok(starts.length > 0, 'no hay agua en el borde norte frente a Caleta');
  const r = await explore('mar_del_sur', starts, { abilities: ['swim'] });
  for (const c of Object.values(MAR.CELLS)) assert.ok(canReach(r, c.x, c.y), `célula ${c.key} inalcanzable nadando`);
  for (const it of MAR.ITEMS) assert.ok(canReach(r, it.x, it.y), `objeto ${it.id} inalcanzable`);
  for (const t of MAR.TRAINERS) assert.ok(canReach(r, t.x, t.y), `entrenador ${t.id} inalcanzable`);
  for (const [x, y] of MAR.WHIRLPOOLS) assert.ok(r.hasSurf(x, y), `remolino (${x},${y}) no se alcanza nadando`);
  for (const l of MAR.LINKS.south) {
    const xs = Array.from({ length: l.width }, (_, i) => l.offset + i);
    assert.ok(xs.some((x) => r.hasSurf(x, map.height - 1)), `no se llega nadando al borde sur hacia ${l.to}`);
  }
  for (const l of MAR.LINKS.north) {
    const xs = Array.from({ length: l.width }, (_, i) => l.offset + i);
    assert.ok(xs.some((x) => r.hasSurf(x, 0)), `no se llega nadando al borde norte hacia ${l.to}`);
  }
  assert.ok(Array.from({ length: map.height }, (_, y) => y).some((y) => r.hasSurf(map.width - 1, y)), 'no se llega al borde este (Volcán Tizón)');
  assert.deepEqual(r.traps, [], 'casillas trampa en el mar');
  const dry = await explore('mar_del_sur', [[MAR.START.x, MAR.START.y]]);
  assert.ok(dry.size < 60, 'sin Nadar el banco de arena de la llegada no debería llevar a ninguna parte');
});

// ───────────────────────────── Estación Talasa ─────────────────────────────

const TAL_ARRIVE = () => [[TAL.JETTY.x + 1, TAL.JETTY.y - 1, true]];

test('Talasa: se desembarca por el pantalán; la compuerta cierra la cubierta este y la puerta del laboratorio va sellada', async () => {
  const { entry, def } = await buildMapNode('estacion_talasa');
  assertEdgeNotWalkable(entry.map, 'north', 'Talasa');
  const opts = { abilities: ['swim', 'dive'], flags: [F.talArrival] };
  const shut = await explore('estacion_talasa', TAL_ARRIVE(), opts);
  const gh = TAL.BUILDINGS.greenhouse.door;
  const tw = TAL.BUILDINGS.tower.door;
  const lab = TAL.BUILDINGS.lab.door;
  assert.ok(canReachWalking(shut, gh.x, gh.y), 'la puerta del invernadero no se alcanza');
  assert.ok(!canReach(shut, tw.x, tw.y), 'la torre de dirección se alcanza sin abrir la compuerta (ni a nado)');
  assert.ok(!canReach(shut, lab.x, lab.y), 'el laboratorio se alcanza sin abrir la compuerta (ni a nado)');
  for (const c of Object.values(TAL.CELLS)) assert.ok(!shut.has(c.x, c.y), `${c.key} se alcanza sin abrir la compuerta`);
  assert.ok(shut.hasSurf(TAL.DIVE.x, TAL.DIVE.y), 'el remolino de la dársena no se alcanza nadando');
  assert.deepEqual(shut.traps, [], 'casillas trampa con la compuerta cerrada');

  const open = await explore('estacion_talasa', TAL_ARRIVE(), { ...opts, flags: [F.talArrival, F.talGreenhouse] });
  assert.ok(canReachWalking(open, tw.x, tw.y), 'la torre no se alcanza con la compuerta abierta');
  assert.ok(canReachWalking(open, lab.x, lab.y), 'la puerta del laboratorio no se alcanza con la compuerta abierta');
  for (const c of Object.values(TAL.CELLS)) assert.ok(canReachWalking(open, c.x, c.y), `célula ${c.key} inalcanzable`);
  for (const it of TAL.ITEMS) assert.ok(canReachWalking(open, it.x, it.y), `objeto ${it.id} inalcanzable`);
  for (const t of TAL.TRAINERS) assert.ok(canReachWalking(open, t.x, t.y), `técnico ${t.id} inalcanzable`);
  assert.deepEqual(open.traps, [], 'casillas trampa con la compuerta abierta');

  // Sin Nadar (no debería pasar: se llega nadando) el pantalán no lleva a la dársena.
  const dry = await explore('estacion_talasa', [[TAL.START.x, TAL.START.y]], { flags: [F.talArrival, F.talGreenhouse] });
  assert.ok(!dry.hasSurf(TAL.DIVE.x, TAL.DIVE.y), 'se llega a la dársena sin Nadar');
  // La puerta del laboratorio es un evento sellado (tarjeta), no un warp que se pueda pisar.
  assert.ok(!(def.warps || []).some((w) => w.to === 'talasa_laboratorio'), 'el laboratorio tiene un warp que salta la tarjeta');
  const door = evById(open, 'puerta_laboratorio');
  assert.ok(door && door.x === lab.x && door.y === lab.y, 'falta la puerta sellada del laboratorio');
});

test('Talasa: interiores (invernadero, despacho, laboratorio) y pilotes al alcance, sin trampas', async () => {
  const gh = await explore('talasa_invernadero', [[GREENHOUSE.door.x, GREENHOUSE.door.y]]);
  assert.ok(canReachWalking(gh, GREENHOUSE.console.x, GREENHOUSE.console.y), 'consola del invernadero');
  assert.ok(canReachWalking(gh, GREENHOUSE.researcher.x, GREENHOUSE.researcher.y), 'investigadora');
  assert.ok(canReachWalking(gh, GREENHOUSE.item.x, GREENHOUSE.item.y), 'objeto del invernadero');
  assert.deepEqual(gh.traps, []);
  const of = await explore('talasa_despacho', [[OFFICE.door.x, OFFICE.door.y]], { flags: [F.talArrival, F.talGreenhouse] });
  assert.ok(of.hasWalk(OFFICE.photoFrom.x, OFFICE.photoFrom.y), 'no se llega delante de la foto del Proyecto Laguna');
  assert.ok(of.hasWalk(OFFICE.deskFront.x, OFFICE.deskFront.y), 'no se llega delante de la mesa con la tarjeta');
  const desk = evById(of, 'mesa_direccion_2');
  assert.ok(desk && desk.x === OFFICE.deskFront.x && desk.y === OFFICE.deskFront.y - 1, 'la tarjeta no está delante de la casilla de la mesa');
  assert.ok(canReachWalking(of, OFFICE.alerce.x, OFFICE.alerce.y), 'Alerce en los archivadores');
  assert.deepEqual(of.traps, []);
  const lab = await explore('talasa_laboratorio', [[LAB.door.x, LAB.door.y]], { flags: [F.talCard, F.talLabIn] });
  for (const q of [LAB.stand, LAB.alerceStand, LAB.retry, LAB.consoleFrom]) assert.ok(lab.hasWalk(q.x, q.y), `laboratorio (${q.x},${q.y})`);
  assert.ok(canReachWalking(lab, LAB.casia.x, LAB.casia.y) && canReachWalking(lab, LAB.garrido.x, LAB.garrido.y), 'Casia y Garrido');
  assert.deepEqual(lab.traps, []);
  const pil = await explore('talasa_pilotes', [[TAL.DIVE.x, TAL.DIVE.y]]);
  assert.ok(canReachWalking(pil, PILOTES.cell.x, PILOTES.cell.y), 'C087 entre los pilotes');
  for (const v of [PILOTES.vent, PILOTES.vent2]) assert.ok(canReachWalking(pil, v.x, v.y), `respiradero (${v.x},${v.y})`);
  for (const it of PILOTES.items) assert.ok(canReachWalking(pil, it.x, it.y), `objeto ${it.id}`);
  const [ax, ay, aw] = PILOTES.surfaceAreas[1];
  assert.ok(pil.hasWalk(ax + Math.floor(aw / 2), ay + 1), 'no se llega bajo el mar abierto del norte (para emerger)');
  assert.deepEqual(pil.traps, []);
});

// ───────────────────────────── Islote Lumbre y gruta ─────────────────────────────

test('Islote Lumbre: se llega nadando; la peña de la luna cierra la gruta hasta completar el baile', async () => {
  const { entry } = await buildMapNode('islote_lumbre');
  assertEdgeNotWalkable(entry.map, 'north', 'Islote Lumbre');
  const starts = edgeWater(entry.map, 'north').filter(([x]) => x >= 9 && x <= 12);
  assert.ok(starts.length > 0);
  const closed = await explore('islote_lumbre', starts, { abilities: ['swim'] });
  for (const [x, y] of LUM.STONES) assert.ok(closed.hasWalk(x, y), `piedra del corro (${x},${y}) no se pisa`);
  assert.ok(!closed.has(LUM.MOON_ROCK.x, LUM.MOON_ROCK.y), 'la peña de la luna deja pasar sin el baile');
  assert.ok(canReachWalking(closed, LUM.MOON_ROCK.x, LUM.MOON_ROCK.y), 'no se llega a la peña de la luna');
  assert.ok(canReachWalking(closed, LUM.BENCH.x + 1, LUM.BENCH.y), 'el banco para descansar');
  assert.ok(canReachWalking(closed, LUM.TRAINER.x, LUM.TRAINER.y), 'la dama del islote');
  for (const it of LUM.ITEMS) assert.ok(canReachWalking(closed, it.x, it.y), `objeto ${it.id}`);
  assert.deepEqual(closed.traps, [], 'casillas trampa');
  const open = await explore('islote_lumbre', starts, { abilities: ['swim'], flags: [F.lumDance] });
  assert.ok(open.hasWalk(LUM.MOON_ROCK.x, LUM.MOON_ROCK.y), 'la gruta no se abre tras el baile');
  const grotto = await explore('lumbre_gruta', [[LUM.GROTTO_ENTRY.x, LUM.GROTTO_ENTRY.y]]);
  const G = LUM.GROTTO;
  assert.ok(canReachWalking(grotto, G.cell.x, G.cell.y), 'C063 en la gruta de la luna');
  assert.ok(canReachWalking(grotto, G.lucia.x, G.lucia.y), 'Lucía');
  assert.ok(canReachWalking(grotto, G.pedestal.x, G.pedestal.y), 'el pedestal de la Tabla Duende');
  assert.ok(canReachWalking(grotto, G.exit.x, G.exit.y + 1), 'la salida de la gruta');
  assert.deepEqual(grotto.traps, []);
});

// ───────────────────────────── Volcán Tizón ─────────────────────────────

test('Volcán Tizón: se desembarca en la playa; caserío, forja, ladera y bocamina al alcance, sin trampas', async () => {
  const { entry } = await buildMapNode('volcan_tizon');
  assertEdgeNotWalkable(entry.map, 'west', 'Volcán Tizón');
  const starts = edgeWater(entry.map, 'west').filter(([, y]) => y >= 34 && y <= 38);
  assert.ok(starts.length > 0);
  const r = await explore('volcan_tizon', starts, { abilities: ['swim'] });
  assert.ok(canReachWalking(r, TIZ.FORGE.brasa.x, TIZ.FORGE.brasa.y), 'la Maestra Brasa');
  assert.ok(canReachWalking(r, TIZ.FORGE.cell.x, TIZ.FORGE.cell.y), 'C067 «Forja fría»');
  assert.ok(r.hasWalk(TIZ.MINE_FRONT.x, TIZ.MINE_FRONT.y), 'delante de la bocamina');
  assert.ok(canReachWalking(r, TIZ.MINE.door.x, TIZ.MINE.door.y), 'la bocamina (entrada a la Cueva del Tizón)');
  const b = TIZ.BUILDINGS.brasa.door;
  assert.ok(canReachWalking(r, b.x, b.y), 'la puerta de la casa de Brasa');
  for (const t of TIZ.TRAINERS) assert.ok(canReachWalking(r, t.x, t.y), `entrenador ${t.id}`);
  for (const it of TIZ.ITEMS) assert.ok(canReachWalking(r, it.x, it.y), `objeto ${it.id}`);
  for (const q of Object.values(TIZ.NPCS)) assert.ok(canReachWalking(r, q.x, q.y), `vecino (${q.x},${q.y})`);
  for (const [x, y] of [...TIZ.MESA_EDGE, [9, 4]]) assert.ok(!r.has(x, y), `se trepa al flanco noroeste desde el agua (${x},${y})`);
  assert.deepEqual(r.traps, [], 'casillas trampa en la ladera');
  const house = await explore('tizon_casa', [[TIZ.HOUSE_ENTRY.x, TIZ.HOUSE_ENTRY.y]]);
  assert.ok(house.size > 20, 'la casa de Brasa no se recorre');
  assert.deepEqual(house.traps, []);
});

/** Estado resuelto de una sala: todas las coladas taponadas y los bloques hundidos. */
const solvedState = (n) => ({ blocks: Object.fromEntries(Object.keys(ROOMS[n].blocks).map((id) => [id, null])), dammed: Object.keys(ROOMS[n].flows) });
const ARRIVE = { 1: CUE.EXITS.hallWest.arrive, 2: CUE.EXITS.r1North.arrive, 3: CUE.EXITS.r2North.arrive };
const LEAVE = { 1: CUE.EXITS.r1North.door, 2: CUE.EXITS.r2North.door, 3: CUE.EXITS.r3North.door };

test('Cueva del Tizón: el suelo del mapa coincide con la lógica de las coladas (rocas y suelo casilla a casilla)', async () => {
  const { entry } = await buildMapNode('tizon_cueva');
  const map = entry.map;
  for (const n of ROOM_IDS) {
    const st = { blocks: {}, dammed: Object.keys(ROOMS[n].flows) };
    const heads = Object.keys(ROOMS[n].flows).map((fl) => XY(...headOf(n, fl)));
    const skip = new Set([...heads, XY(ROOMS[n].vent.x, ROOMS[n].vent.y), ...(ROOMS[n].source || []).map(([x, y]) => XY(x, y))]);
    const f = ROOMS[n].floor;
    for (let y = f.y0 + 1; y < f.y1; y++) {
      for (let x = f.x0 + 1; x < f.x1; x++) {
        if (skip.has(XY(x, y))) continue;
        const logic = lavaWalkable(n, st, x, y);
        const tile = map.playerPassable(x, y, 0, {});
        assert.equal(tile, logic, `sala ${n} (${x},${y}): mapa ${tile ? 'pisable' : 'bloqueado'}, lógica ${logic ? 'pisable' : 'bloqueado'}`);
      }
    }
  }
});

test('Cueva del Tizón: sin taponar las coladas no se llega al respiradero ni a la salida de cada sala; resueltas, sí', async () => {
  for (const n of ROOM_IDS) {
    const v = ROOMS[n].vent;
    const a = ARRIVE[n];
    const init = await explore('tizon_cueva', [[a.x, a.y]], { vars: { [V.lava(n)]: roomStart(n) } });
    assert.ok(!canReach(init, v.x, v.y), `sala ${n}: el respiradero se alcanza sin taponar las coladas`);
    assert.ok(!canReach(init, LEAVE[n].x, LEAVE[n].y), `sala ${n}: la salida se alcanza sin taponar las coladas`);
    const done = await explore('tizon_cueva', [[a.x, a.y]], { vars: { [V.lava(n)]: solvedState(n) } });
    assert.ok(canReachWalking(done, v.x, v.y), `sala ${n}: respiradero inalcanzable con la sala resuelta`);
    assert.ok(canReachWalking(done, LEAVE[n].x, LEAVE[n].y), `sala ${n}: salida inalcanzable con la sala resuelta`);
    assert.deepEqual(done.traps, [], `sala ${n}: casillas trampa`);
  }
  const all = Object.fromEntries(ROOM_IDS.map((n) => [V.lava(n), solvedState(n)]));
  const hall = await explore('tizon_cueva', [[CUE.START.x, CUE.START.y]], { vars: all });
  assert.ok(canReachWalking(hall, CUE.TECH.x, CUE.TECH.y), 'la técnica del vestíbulo');
  assert.ok(canReachWalking(hall, CUE.EXITS.hallWest.door.x, CUE.EXITS.hallWest.door.y), 'el túnel a la primera galería');
  assert.deepEqual(hall.traps, [], 'casillas trampa en el vestíbulo');
  for (const it of CUE.ITEMS) {
    const room = CUE.roomAt(it.x, it.y);
    const from = room === 'hall' ? CUE.START : ARRIVE[room];
    const r = await explore('tizon_cueva', [[from.x, from.y]], { vars: all });
    assert.ok(canReachWalking(r, it.x, it.y), `objeto ${it.id} (${it.x},${it.y}) inalcanzable`);
  }
});

test('Cráter del Tizón: la jefa, la sonda, la vieja fragua y la salida al alcance, sin trampas', async () => {
  const r = await explore('tizon_crater', [[CRATER.arrive.x, CRATER.arrive.y]]);
  assert.ok(canReachWalking(r, CRATER.chief.x, CRATER.chief.y), 'la jefa de perforación');
  assert.ok(r.hasWalk(CRATER.retry.x, CRATER.retry.y), 'la casilla de reintento');
  assert.ok(canReachWalking(r, CRATER.hearth.x, CRATER.hearth.y + 1), 'la vieja fragua');
  assert.ok(canReachWalking(r, CRATER.plate.x, CRATER.plate.y), 'la Tabla Llama');
  assert.ok(canReachWalking(r, CRATER.exit.x, CRATER.exit.y), 'la salida a la cueva');
  assert.deepEqual(r.traps, []);
  const after = await explore('tizon_crater', [[CRATER.arrive.x, CRATER.arrive.y]], { flags: [F.tizChief, F.tizVents] });
  assert.ok(after.hasWalk(CRATER.chief.x, CRATER.chief.y), 'la jefa se ha ido: su casilla se pisa');
  assert.deepEqual(after.traps, []);
});

// ───────────────────────────── Caleta Sonda (resonancia del Buceo) ─────────────────────────────

test('Caleta Sonda: el extremo del muelle de buzos (resonancia del Buceo) se alcanza a pie', async () => {
  const r = await explore('caleta_sonda', [[CL.START.x, CL.START.y]], { flags: [F.core4] });
  assert.ok(canReachWalking(r, CL.DIVERS.resonance.x, CL.DIVERS.resonance.y), 'el extremo del muelle de buzos');
  assert.ok(evById(r, 'resonancia_buceo'), 'falta el evento de la resonancia del Buceo');
});
