// Bloque 9b — Ruta 8 (Marisma y Palafitos), Ciudad Nexo, Ruta 15 y Caleta Sonda: alcanzabilidad a pie y a nado
// (docs/CAMPANA.md §2.5: puertas G5 barro · G9 agua profunda; §2.3: etapas de las células). BFS con la pasabilidad real
// del mundo (tiles + eventos sólidos + saltos de saliente) y, con Nadar, entradas y salidas del agua como en el juego:
//   · Ruta 8: sin Terreno complicado no se cruza el barro (ni desde Lúmina ni desde Mnemos); con él se llega a los
//     Palafitos, a las bombas, las estacas, las pozas y C044; C072 (aguas hondas) solo con Nadar.
//   · Nexo, Ruta 15 y Caleta: objetos, puertas y personajes alcanzables a pie; C075 y C064 solo con Nadar; el remolino
//     del bosque de algas solo nadando; C086 alcanzable dentro del mapa submarino.
//   · Ningún mapa tiene casillas trampa: desde toda casilla alcanzable se puede volver a la entrada.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { World } from '../game/src/world/world.js';
import { canSurfFreely } from '../game/src/world/terrain.js';
import { canOfferSwim } from '../game/src/world/waterAccess.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import * as R8 from '../game/src/content/maps/b09b/ruta_8_layout.js';
import * as NX from '../game/src/content/maps/b09b/nexo_layout.js';
import * as R15 from '../game/src/content/maps/b09b/ruta_15_layout.js';
import * as CL from '../game/src/content/maps/b09b/caleta_layout.js';
import * as AL from '../game/src/content/maps/b09b/caleta_algas_layout.js';

const DV = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };
const K = (x, y, s) => `${x},${y},${s ? 1 : 0}`;

/**
 * Explora un mapa desde `starts` ([x, y]). opts: abilities (capacidades de Zygarde), flags, erase (prefijos de id de
 * evento que se dan por retirados). Devuelve { has(x, y), hasWalk, hasSurf, traps, world, size }.
 */
async function explore(mapId, starts, { abilities = [], flags = [], erase = [] } = {}) {
  const state = GameState.create({ name: 'Prueba' });
  for (const a of abilities) state.setZygardeAbility(a, true);
  for (const f of flags) state.setFlag(f);
  const { entry } = await buildMapNode(mapId);
  const world = new World({ state });
  world.setCurrent({ ...entry, events: null });
  for (const ev of world.events) if (erase.some((p) => String(ev.id).startsWith(p))) ev.erased = true;
  const p = world.player;
  const map = entry.map;
  const swim = abilities.includes('swim');
  const blockedByEvent = (x, y) => world.events.some((ev) => !ev.erased && !ev.through && ev.at(x, y) && (ev.characterName || ev.solid));
  const seen = new Set();
  const rev = new Map(); // destino → orígenes (para buscar trampas)
  const queue = [];
  for (const [x, y] of starts) { seen.add(K(x, y, false)); queue.push([x, y, false]); }
  while (queue.length) {
    const [x, y, s] = queue.shift();
    for (const d of [2, 4, 6, 8]) {
      let nx = x + DV[d][0];
      let ny = y + DV[d][1];
      if (!map.valid(nx, ny)) continue;
      p.x = x; p.y = y; p.surfing = s;
      let ns = s;
      if (p.passable(x, y, d)) {
        const t = map.terrainTagAt(nx, ny);
        if (s && !canSurfFreely(t)) ns = false; // sale del agua de un salto
        if (!s && t.ledge) { nx += DV[d][0]; ny += DV[d][1]; }
      } else if (!s && swim && !blockedByEvent(nx, ny)
        && canOfferSwim({ map, player: { x, y, direction: d, surfing: false }, bridge: 0 })) {
        ns = true; // empieza a nadar (misma regla que el botón A del juego: world/waterAccess.js)
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
  // Trampas: casillas alcanzables desde las que no se vuelve a ninguna entrada (BFS inverso).
  const back = new Set(starts.map(([x, y]) => K(x, y, false)));
  const bq = [...back];
  // Desde las entradas, hacia atrás: «quién puede llegar a mí» = orígenes guardados en rev.
  while (bq.length) {
    const k = bq.shift();
    for (const from of rev.get(k) || []) if (!back.has(from)) { back.add(from); bq.push(from); }
  }
  const traps = [...seen].filter((k) => !back.has(k));
  const has = (x, y) => seen.has(K(x, y, false)) || seen.has(K(x, y, true));
  return { has, hasWalk: (x, y) => seen.has(K(x, y, false)), hasSurf: (x, y) => seen.has(K(x, y, true)), traps, world, size: seen.size };
}

/** ¿Se puede interactuar con (x, y)? (pisándolo o desde una vecina alcanzable). */
const canReach = (r, x, y) => r.has(x, y) || [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => r.has(x + dx, y + dy));
const canReachWalking = (r, x, y) => r.hasWalk(x, y) || [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => r.hasWalk(x + dx, y + dy));
/** Se puede hablar con alguien: al lado, o por encima de un mostrador (como world.eventsInFront). */
const canTalk = (r, x, y) => canReachWalking(r, x, y)
  || [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => r.world.map.counter(x + dx, y + dy) && r.hasWalk(x + 2 * dx, y + 2 * dy));

const R8_LUMINA = [R8.START.x, R8.START.y];
const R8_MNEMOS = [31, 1];

// ───────────────────────────── Ruta 8 ─────────────────────────────

test('Ruta 8: sin Terreno complicado el barro cierra el paso desde Lúmina y desde Mnemos', async () => {
  const fromLumina = await explore('ruta_8_marisma', [R8_LUMINA]);
  assert.ok(!fromLumina.has(28, 34), 'sin Terreno se llega a los Palafitos desde Lúmina');
  assert.ok(!fromLumina.has(R8_MNEMOS[0], R8_MNEMOS[1]), 'sin Terreno se llega a la senda de Mnemos');
  assert.ok(fromLumina.size < 40, `sin Terreno solo debería verse el pasillo de entrada (${fromLumina.size} casillas)`);
  const fromMnemos = await explore('ruta_8_marisma', [R8_MNEMOS]);
  assert.ok(!fromMnemos.has(31, 9), 'sin Terreno se cruza el barro de la senda norte');
  assert.ok(!fromMnemos.has(28, 34), 'sin Terreno se baja a los Palafitos desde Mnemos');
});

test('Ruta 8: con Terreno se recorre la marisma entera (Palafitos, bombas, estacas, pozas, C044), sin trampas', async () => {
  const r = await explore('ruta_8_marisma', [R8_LUMINA, R8_MNEMOS], { abilities: ['terrain'] });
  assert.ok(r.has(28, 34) && r.has(R8_MNEMOS[0], R8_MNEMOS[1]), 'con Terreno se cruza de Lúmina a Mnemos');
  for (const h of Object.values(R8.HOUSES)) assert.ok(r.hasWalk(h.door.x, h.door.y + 1), `puerta de ${h.to || 'la casa vacía'} inalcanzable`);
  for (const pmp of R8.PUMPS) {
    assert.ok(canReachWalking(r, pmp.x, pmp.y), `bomba ${pmp.n} inalcanzable`);
    assert.ok(canReachWalking(r, pmp.tech.x, pmp.tech.y), `técnico de la bomba ${pmp.n} inalcanzable`);
    assert.ok(r.hasWalk(pmp.tech.front.x, pmp.tech.front.y), `casilla de reintento de la bomba ${pmp.n} inalcanzable`);
  }
  for (const k of R8.STAKES) assert.ok(canReachWalking(r, k.x, k.y), `estaca ${k.n} inalcanzable`);
  for (const q of R8.POOLS) assert.ok(canReachWalking(r, q.x, q.y), `poza ${q.id} inalcanzable`);
  assert.ok(r.hasWalk(R8.CELLS.c044.x, R8.CELLS.c044.y), 'C044 (barro junto a la bomba) inalcanzable con Terreno');
  const items = r.world.events.filter((e) => /^objeto_/.test(String(e.id)));
  assert.equal(items.length, R8.ITEMS.length);
  for (const ev of items) assert.ok(canReachWalking(r, ev.x, ev.y), `objeto ${ev.id} en (${ev.x},${ev.y}) inalcanzable`);
  assert.ok(canReachWalking(r, R8.SPOTS.alerceStation.x, R8.SPOTS.alerceStation.y), 'el puesto de Alerce es inalcanzable');
  assert.deepEqual(r.traps, [], 'casillas trampa en la Ruta 8');
});

test('Ruta 8: las aguas hondas (C072) solo con Nadar', async () => {
  const { x, y } = R8.CELLS.c072;
  const walk = await explore('ruta_8_marisma', [R8_LUMINA], { abilities: ['terrain'] });
  assert.ok(!walk.has(x, y), 'C072 se alcanza sin Nadar');
  const swim = await explore('ruta_8_marisma', [R8_LUMINA], { abilities: ['terrain', 'swim'] });
  assert.ok(swim.hasSurf(x, y), 'C072 inalcanzable con Nadar');
  assert.deepEqual(swim.traps, [], 'casillas trampa en la Ruta 8 nadando');
});

// ───────────────────────────── Ciudad Nexo ─────────────────────────────

const NX_STARTS = [[31, 1], [1, 21]];

test('Ciudad Nexo: puertas, pescador, ferri, prismáticos y objetos a pie; C075 solo con Nadar; sin trampas', async () => {
  const r = await explore('ciudad_nexo', NX_STARTS);
  for (const bd of Object.values(NX.BUILDINGS)) assert.ok(canReachWalking(r, bd.door.x, bd.door.y), `puerta de ${bd.to || bd.stamp} inalcanzable`);
  assert.ok(canReachWalking(r, NX.PORT.fisher.x, NX.PORT.fisher.y), 'el pescador de la Caña Buena es inalcanzable');
  assert.ok(canReachWalking(r, NX.PORT.ferrySailor.x, NX.PORT.ferrySailor.y), 'el marinero del ferri es inalcanzable');
  assert.ok(canReachWalking(r, NX.PORT.binoculars.x, NX.PORT.binoculars.y), 'los prismáticos son inalcanzables');
  for (const s of NX.PLAZA.stalls) assert.ok(r.hasWalk(s.x + 1, s.y + 4), `puesto ${s.role}: no se puede hablar desde abajo`);
  for (const it of NX.ITEMS) assert.ok(canReachWalking(r, it.x, it.y), `objeto ${it.id} inalcanzable`);
  assert.ok(!r.has(NX.CELLS.c075.x, NX.CELLS.c075.y), 'C075 se alcanza sin Nadar');
  assert.deepEqual(r.traps, [], 'casillas trampa en Nexo');
  const swim = await explore('ciudad_nexo', NX_STARTS, { abilities: ['swim'] });
  assert.ok(swim.hasSurf(NX.CELLS.c075.x, NX.CELLS.c075.y), 'C075 inalcanzable con Nadar');
  assert.deepEqual(swim.traps, [], 'casillas trampa en Nexo nadando');
});

// ───────────────────────────── Ruta 15 ─────────────────────────────

test('Ruta 15: de Nexo a Caleta a pie, calas, mirador, entrenadores y objetos alcanzables; sin trampas', async () => {
  const east = [R15.EXITS.east.x, R15.EXITS.east.y0 + 1];
  const r = await explore('ruta_15', [east]);
  assert.ok(r.hasWalk(R15.EXITS.west.x, R15.EXITS.west.y0 + 1), 'no se llega de Nexo a Caleta por el sendero');
  assert.ok(canReachWalking(r, R15.LOOKOUT.binoculars.x, R15.LOOKOUT.binoculars.y), 'mirador inalcanzable');
  for (const t of R15.TRAINERS) assert.ok(canReachWalking(r, t.x, t.y), `entrenador ${t.id} inalcanzable`);
  for (const it of R15.ITEMS) assert.ok(canReachWalking(r, it.x, it.y), `objeto ${it.id} inalcanzable`);
  for (const rock of R15.BINACLE_ROCKS) assert.ok(canReachWalking(r, rock.x, rock.y), `roca ${rock.id} inalcanzable`);
  for (const f of R15.SPOTS.fishers) assert.ok(canReachWalking(r, f.x, f.y), 'pescador de las mareas inalcanzable');
  assert.deepEqual(r.traps, [], 'casillas trampa en la Ruta 15');
});

// ───────────────────────────── Caleta Sonda y bosque de algas ─────────────────────────────

test('Caleta Sonda: puertas, muelles y Barbaraclita a pie; C064 y el remolino de las algas solo con Nadar; sin trampas', async () => {
  const start = [CL.START.x, CL.START.y];
  const r = await explore('caleta_sonda', [start]);
  for (const bd of Object.values(CL.BUILDINGS)) assert.ok(canReachWalking(r, bd.door.x, bd.door.y), `puerta de ${bd.to || 'la casa'} inalcanzable`);
  assert.ok(canReachWalking(r, CL.FERRY.sailor.x, CL.FERRY.sailor.y), 'marinero del ferri inalcanzable');
  assert.ok(canReachWalking(r, CL.DIVERS.resonance.x, CL.DIVERS.resonance.y), 'extremo del muelle de buzos (Buceo, B13) inalcanzable');
  for (const it of CL.ITEMS) assert.ok(canReachWalking(r, it.x, it.y), `objeto ${it.id} inalcanzable`);
  assert.ok(!r.has(CL.CELLS.c064.x, CL.CELLS.c064.y), 'C064 se alcanza sin Nadar');
  assert.ok(!r.has(CL.DIVERS.kelpDive.x, CL.DIVERS.kelpDive.y), 'el remolino de las algas se alcanza sin Nadar');
  assert.deepEqual(r.traps, [], 'casillas trampa en Caleta');
  const swim = await explore('caleta_sonda', [start], { abilities: ['swim'] });
  assert.ok(swim.hasSurf(CL.CELLS.c064.x, CL.CELLS.c064.y), 'C064 inalcanzable con Nadar');
  assert.ok(swim.hasSurf(CL.DIVERS.kelpDive.x, CL.DIVERS.kelpDive.y), 'remolino de las algas inalcanzable nadando');
  assert.deepEqual(swim.traps, [], 'casillas trampa en Caleta nadando');
});

test('Bosque de algas: desde la llegada se alcanzan C086, el respiradero y la perla', async () => {
  const r = await explore('caleta_algas', [[AL.ALGAS_ENTRY.x, AL.ALGAS_ENTRY.y]], { abilities: ['swim', 'dive'] });
  assert.ok(r.hasWalk(AL.CELL.x, AL.CELL.y), 'C086 inalcanzable');
  assert.ok(r.hasWalk(AL.VENT.x, AL.VENT.y), 'respiradero inalcanzable');
  for (const it of AL.ITEMS) assert.ok(canReachWalking(r, it.x, it.y), `objeto ${it.id} inalcanzable`);
  assert.deepEqual(r.traps, [], 'casillas trampa en el bosque de algas');
});

test('puertas de ida y vuelta: cada interior sale delante de su puerta y la llegada alcanza la salida', async () => {
  for (const outside of ['ruta_8_marisma', 'ciudad_nexo', 'caleta_sonda']) {
    const { def } = await buildMapNode(outside);
    const doors = (def.warps || []).filter((w) => w.to);
    assert.ok(doors.length > 0, `${outside}: sin puertas`);
    for (const w of doors) {
      const r = await explore(w.to, [[w.tx, w.ty]]);
      const { def: inner } = await buildMapNode(w.to);
      const exits = (inner.warps || []).filter((e) => e.to === outside);
      assert.ok(exits.length > 0, `${w.to}: sin salida a ${outside}`);
      assert.ok(exits.some((e) => r.hasWalk(e.x, e.y)), `${w.to}: desde la llegada (${w.tx},${w.ty}) no se alcanza la salida`);
      for (const e of exits) assert.deepEqual([e.tx, e.ty], [w.x, w.y + 1], `${w.to}: la salida no deja delante de la puerta (${w.x},${w.y})`);
    }
  }
});

test('interiores del bloque: la salida es alcanzable desde la llegada', async () => {
  const cases = [
    ['palafitos_remedios', R8.INTERIOR_ENTRIES.palafitos_remedios], ['palafitos_casa', R8.INTERIOR_ENTRIES.palafitos_casa],
    ['nexo_correos', NX.INTERIOR_ENTRIES.nexo_correos], ['nexo_casa_pescador', NX.INTERIOR_ENTRIES.nexo_casa_pescador],
    ['nexo_astillero', NX.INTERIOR_ENTRIES.nexo_astillero], ['nexo_faro', NX.INTERIOR_ENTRIES.nexo_faro],
    ['caleta_faro', CL.INTERIOR_ENTRIES.caleta_faro], ['caleta_casa_buzos', CL.INTERIOR_ENTRIES.caleta_casa_buzos],
  ];
  for (const [id, e] of cases) {
    const r = await explore(id, [[e.x, e.y]]);
    const people = r.world.events.filter((ev) => ev.characterName && !/flecha/.test(String(ev.id)));
    for (const ev of people) assert.ok(canTalk(r, ev.x, ev.y), `${id}: ${ev.id} inalcanzable`);
    const items = r.world.events.filter((ev) => ev.def?.item);
    for (const ev of items) assert.ok(canReachWalking(r, ev.x, ev.y), `${id}: objeto ${ev.id} inalcanzable`);
    assert.deepEqual(r.traps, [], `${id}: casillas trampa`);
  }
});
