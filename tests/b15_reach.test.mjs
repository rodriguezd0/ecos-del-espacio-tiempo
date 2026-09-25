// Bloque 15 — Interludio 7: el norte, Villa Boreal y el quinto núcleo. Alcanzabilidad a pie (docs/CAMPANA.md B15;
// §2.5: Terreno complicado en la nieve honda, Embestida en la repisa de la Ruta 11, Nadar en el lago de la Gruta
// Escarcha y el Mar Boreal, Buceo en su fondo). BFS con la pasabilidad real del mundo (tests/b15_bfs.mjs):
//   · Ruta 11: la escena de la desvinculación no se esquiva; C089 solo con Terreno; C090 solo rompiendo la roca.
//   · Paso del Norte: la llegada no se esquiva; salidas, refugio, técnicos y objetos.
//   · Senda del Lazo: coronar una escalera falsa devuelve al principio; al mirador solo se llega por la pauta de los
//     Larvitar (quitar cualquier escalera buena lo deja inalcanzable); el tramo alto no lleva a ninguna parte.
//   · Ruta 13: sin Terreno no se cruza la franja de nieve honda; C091/C092 y la Abomasnowita solo con Terreno.
//   · Villa Boreal e interiores, Gruta Escarcha (con la pista de hielo del motor), Mar Boreal y su fondo.
// En ningún mapa hay casillas alcanzables sin vuelta a la llegada.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { world, erase, bfs, dead, canUse, canTalk, pickables, talkables, row, key } from './b15_bfs.mjs';
import { RUTA11 } from '../game/src/content/maps/b15/layout_ruta11.js';
import { PASO, REFUGIO } from '../game/src/content/maps/b15/layout_paso.js';
import { SENDA, correctStair, wrongTops, topRow, footRow } from '../game/src/content/maps/b15/layout_senda.js';
import { RUTA13 } from '../game/src/content/maps/b15/layout_ruta13.js';
import { BOREAL, BOREAL_INTERIORS, OBSERVATORIO, TERRAZA, TALLERES } from '../game/src/content/maps/b15/layout_boreal.js';
import { ESCARCHA, ESCARCHA2, MAR, FONDO } from '../game/src/content/maps/b15/layout_escarcha.js';
import { LAGO, lakeToMap } from '../game/src/content/maps/b15/layout_lago.js';
import { LAKE, initialState } from '../game/src/content/events/b15_lago_logic.js';
import { printTrails } from '../game/src/content/events/b15_senda.js';
import { F } from '../game/src/content/events/b15_common.js';

const ENTRY = [F.p7];
const ALL = ['run', 'ram', 'terrain', 'climb', 'swim', 'detect', 'dive'];
const NO_TERRAIN = ALL.filter((a) => a !== 'terrain');
const at = (p) => [p.x, p.y];

// ───────────────────────────── Ruta 11 ─────────────────────────────

test('Ruta 11: la escena de la desvinculación no se esquiva; de sur a norte sin capacidades nuevas', async () => {
  const R = RUTA11;
  const ctx = await world('ruta_11', { flags: ENTRY, abilities: NO_TERRAIN });
  erase(ctx, 'roca_repisa_r11');
  const r = bfs(ctx, at(R.start));
  for (let x = R.north.x0; x <= R.north.x1; x++) assert.ok(r.has(x, R.north.y), `borde norte (${x},0) inalcanzable`);
  for (let x = R.south.x0; x <= R.south.x1; x++) assert.ok(r.has(x, R.south.y), `borde sur (${x},${R.south.y}) inalcanzable`);
  const T = R.unbound.trigger;
  const skip = bfs(ctx, at(R.start), { block: row(T.y, T.x0, T.x1) });
  assert.ok(!skip.has(R.north.x0, 0), 'se sube al Paso sin pisar la franja de la escena de la desvinculación');
  for (const id of ['montanera_escarcha', 'snover_escarcha']) {
    const ev = ctx.w.events.find((e) => e.id === id);
    assert.ok(ev?.page && canUse(r, ev.x, ev.y), `${id} inalcanzable`);
  }
  assert.deepEqual(dead(r, at(R.start)), [], 'casillas sin vuelta');
});

test('Ruta 11: C089 solo con Terreno complicado; C090 y el objeto de la repisa solo rompiendo la roca (Embestida)', async () => {
  const R = RUTA11;
  const noTerrain = await world('ruta_11', { flags: ENTRY, abilities: NO_TERRAIN });
  const a = bfs(noTerrain, at(R.start));
  assert.ok(!canUse(a, R.cells.c089.x, R.cells.c089.y), 'C089 se alcanza sin Terreno');
  assert.ok(!canUse(a, R.cells.c090.x, R.cells.c090.y), 'C090 se alcanza con la roca en su sitio');
  assert.ok(!canUse(a, R.ledge.item.x, R.ledge.item.y), 'el objeto de la repisa se alcanza con la roca en su sitio');
  assert.ok(canUse(a, R.ledge.rock.x, R.ledge.rock.y), 'la roca agrietada no se alcanza');
  const full = erase(await world('ruta_11', { flags: ENTRY, abilities: ALL }), 'roca_repisa_r11');
  const b = bfs(full, at(R.start));
  assert.ok(b.has(R.cells.c089.x, R.cells.c089.y), 'C089 inalcanzable con Terreno');
  assert.ok(b.has(R.cells.c090.x, R.cells.c090.y), 'C090 inalcanzable con la roca rota');
  for (const ev of pickables(full.w)) assert.ok(canUse(b, ev.x, ev.y), `${ev.id} en (${ev.x},${ev.y}) inalcanzable`);
  for (const ev of talkables(full.w)) assert.ok(canUse(b, ev.x, ev.y), `${ev.id} en (${ev.x},${ev.y}) inalcanzable`);
  assert.deepEqual(dead(b, at(R.start)), [], 'casillas sin vuelta con todo abierto');
});

test('Villa Brontia (B05) → Ruta 11: el hielo-eco cierra el norte hasta el P7; después, se sale por x 20–23', async () => {
  const north = [20, 21, 22, 23];
  const closedCtx = await world('villa_brontia', { flags: ['p1_restored', 'p2_restored', 'p3_restored'] });
  const closed = bfs(closedCtx, at(closedCtx.def.start));
  assert.ok(north.every((x) => !closed.has(x, 0)), 'se sale al norte de Brontia sin el P7');
  const openCtx = await world('villa_brontia', { flags: ['p1_restored', 'p2_restored', 'p3_restored', F.p7] });
  const open = bfs(openCtx, at(openCtx.def.start));
  assert.ok(north.every((x) => open.has(x, 0)), 'con el P7 no se llega al borde norte de Brontia');
  const link = openCtx.def.connections.find((c) => c.to === 'ruta_11');
  assert.ok(link && link.dir === 'north' && link.offset === -RUTA11.south.offset, 'conexión Brontia → Ruta 11 no simétrica');
});

// ───────────────────────────── Paso del Norte y refugio ─────────────────────────────

test('Paso del Norte: la llegada no se esquiva; salidas, refugio, técnicos de Genesis, mirador y objetos', async () => {
  const P = PASO;
  const ctx = await world('paso_del_norte', { flags: ENTRY, abilities: ALL });
  const r = bfs(ctx, at(P.start));
  for (let x = P.north.x0; x <= P.north.x1; x++) assert.ok(r.has(x, 0), `borde norte (${x},0)`);
  for (let y = P.west.y0; y <= P.west.y1; y++) assert.ok(r.has(0, y), `borde oeste (0,${y})`);
  assert.ok(canUse(r, P.refugio.door.x, P.refugio.door.y), 'puerta del refugio');
  for (const ev of [...pickables(ctx.w), ...talkables(ctx.w)]) assert.ok(canUse(r, ev.x, ev.y), `${ev.id} en (${ev.x},${ev.y}) inalcanzable`);
  const A = P.arrival;
  const skip = bfs(ctx, [P.south.x0 + 1, P.south.y], { block: row(A.y, A.x0, A.x1) });
  assert.ok(!skip.has(P.north.x0, 0) && !skip.has(0, P.west.y0), 'se cruza el Paso sin pisar la franja de llegada');
  assert.deepEqual(dead(r, at(P.start)), [], 'casillas sin vuelta');
  const ref = await world('paso_refugio', { flags: ENTRY });
  const rr = bfs(ref, at(REFUGIO.entry));
  for (const ev of talkables(ref.w)) assert.ok(canUse(rr, ev.x, ev.y), `refugio: ${ev.id} inalcanzable`);
  assert.deepEqual(dead(rr, at(REFUGIO.entry)), [], 'refugio: casillas sin vuelta');
});

// ───────────────────────────── Senda del Lazo ─────────────────────────────

const WRONG = new Set(wrongTops().map((w) => key(w.x, w.y)));
/** El lazo: coronar (subiendo) una escalera falsa devuelve al principio; pisar el tramo alto, al borde del mirador. */
function lazo(x, y, d, nx, ny) {
  if (d !== 8) return null;
  if (WRONG.has(key(nx, ny))) return at(SENDA.loopStart);
  if (ny === SENDA.high.y && nx >= SENDA.high.x0 && nx <= SENDA.high.x1) return at(SENDA.high.back);
  return null;
}

test('Senda del Lazo: al mirador solo se llega siguiendo la pauta; cada escalera falsa devuelve al principio', async () => {
  const ctx = await world('ruta_12_senda_lazo', { flags: ENTRY, abilities: ALL });
  const start = at(SENDA.start);
  const r = bfs(ctx, start, { redirect: lazo });
  const M = SENDA.mirador;
  assert.ok(canUse(r, M.stone.x, M.stone.y), 'la Tyranitarita del mirador inalcanzable siguiendo la pauta');
  for (let k = 0; k < SENDA.pattern.length; k++) {
    const c = correctStair(k);
    assert.ok(r.has(...c.foot) && r.has(...c.top), `escalera buena de la cara ${k + 1} (${c.side})`);
    // Sin la escalera buena de esta cara, el mirador queda fuera de alcance: las demás devuelven al principio.
    const cut = bfs(ctx, start, { redirect: lazo, block: [c.top] });
    assert.ok(!canUse(cut, M.stone.x, M.stone.y), `sin la escalera buena de la cara ${k + 1} se llega al mirador`);
  }
  // Las escaleras falsas se pueden subir (el lazo se vive) y su coronación existe como evento de toque.
  for (const w of wrongTops()) {
    if (w.face > 0 && !r.has(correctStair(w.face - 1).top[0], correctStair(w.face - 1).top[1])) continue;
    assert.ok(r.has(w.x, w.y + 1), `la escalera falsa ${w.face + 1}${w.side} no se puede subir`);
    const ev = ctx.w.events.find((e) => e.id === `lazo_${w.face}_${w.side}`);
    assert.ok(ev && ev.x === w.x && ev.y === w.y && ev.trigger === 'touch', `falta el lazo de ${w.face + 1}${w.side}`);
  }
  // Sin el lazo, las escaleras falsas subirían de verdad: es el evento lo que cierra el paso.
  const noLoop = bfs(ctx, start, { block: SENDA.pattern.map((_, k) => correctStair(k).top) });
  assert.ok(canUse(noLoop, M.stone.x, M.stone.y), 'las escaleras falsas no son escaleras de verdad (el lazo no hace falta)');
  // El tramo alto no lleva a ninguna parte.
  for (const k of r.seen) assert.ok(Number(k.split(',')[1]) > SENDA.high.y || !k, `se pisa por encima del tramo alto (${k})`);
  assert.deepEqual(dead(r, start), [], 'casillas sin vuelta a la llegada');
});

test('Senda del Lazo: huellas legibles en el camino, guía al pie de la última escalera buena, objetos y entrenadores', async () => {
  const ctx = await world('ruta_12_senda_lazo', { flags: ENTRY, abilities: ALL });
  const r = bfs(ctx, at(SENDA.start), { redirect: lazo });
  const prints = printTrails();
  assert.ok(prints.filter((p) => p.kind === 'larvitar').length >= 12, 'pocas huellas de Larvitar');
  for (const p of prints) assert.ok(r.has(p.x, p.y), `huella ${p.kind} en (${p.x},${p.y}) inalcanzable o sobre una casilla bloqueada`);
  // Las huellas de Larvitar de cada rellano acaban al pie de su escalera buena (caras 1–3).
  for (let k = 0; k < 3; k++) {
    const c = correctStair(k);
    const near = prints.filter((p) => p.kind === 'larvitar' && p.x === c.x && p.y >= footRow(k) && p.y <= footRow(k) + 2);
    assert.ok(near.length > 0, `las huellas de la cara ${k + 1} no llegan a su escalera buena`);
  }
  const boots = prints.filter((p) => p.kind === 'botas');
  assert.ok(boots.length > 0 && boots.every((p) => p.y > topRow(2)), 'las botas de los perdidos deben estar en el tercer rellano');
  const guide = ctx.w.events.find((e) => e.id === 'larvitar_guia');
  const c4 = correctStair(3);
  assert.ok(guide?.page && guide.x === c4.foot[0] + 1 && guide.y === c4.foot[1], 'el Larvitar guía no está al pie de la última escalera buena');
  for (const ev of [...pickables(ctx.w), ...talkables(ctx.w)]) assert.ok(canUse(r, ev.x, ev.y), `${ev.id} en (${ev.x},${ev.y}) inalcanzable`);
  for (let y = SENDA.east.y0; y <= SENDA.east.y1; y++) assert.ok(r.has(SENDA.east.x, y), `borde este (${SENDA.east.x},${y})`);
});

// ───────────────────────────── Ruta 13 ─────────────────────────────

test('Ruta 13: sin Terreno la nieve honda corta el paso a Villa Boreal; con Terreno, células, Abomasnowita y entrenadores', async () => {
  const R = RUTA13;
  const no = bfs(await world('ruta_13', { flags: ENTRY, abilities: NO_TERRAIN }), at(R.start));
  assert.ok(!no.has(R.north.x0, 0), 'se llega a Villa Boreal sin Terreno complicado');
  const ctx = await world('ruta_13', { flags: ENTRY, abilities: ALL });
  const r = bfs(ctx, at(R.start));
  for (let x = R.north.x0; x <= R.north.x1; x++) assert.ok(r.has(x, 0), `borde norte (${x},0)`);
  for (const c of Object.values(R.cells)) {
    assert.ok(r.has(c.x, c.y), `célula en (${c.x},${c.y}) inalcanzable con Terreno`);
    assert.ok(!canUse(no, c.x, c.y), `célula en (${c.x},${c.y}) alcanzable sin Terreno`);
  }
  assert.ok(!canUse(no, R.items.abomasite.x, R.items.abomasite.y), 'la Abomasnowita sin Terreno');
  for (const ev of [...pickables(ctx.w), ...talkables(ctx.w)]) assert.ok(canUse(r, ev.x, ev.y), `${ev.id} en (${ev.x},${ev.y}) inalcanzable`);
  assert.deepEqual(dead(r, at(R.start)), [], 'casillas sin vuelta');
});

test('Llegando en ferri (desde el norte), las llegadas del Paso y de la Ruta 13 tampoco se esquivan; los bordes sin salida están cerrados', async () => {
  const paso = await world('paso_del_norte', { flags: ENTRY, abilities: ALL });
  const ids = new Set(paso.w.events.filter((e) => e.page && String(e.id).startsWith('llegada_paso_norte_')).map((e) => `${e.x},${e.y}`));
  assert.ok(ids.size > 0, 'sin franja de llegada norte en el Paso');
  const skipPaso = bfs(paso, [PASO.north.x0 + 1, 0], { block: [...ids].map((k) => k.split(',').map(Number)) });
  assert.ok(!skipPaso.has(PASO.south.x0 + 1, PASO.south.y) && !skipPaso.has(0, PASO.west.y0), 'se cruza el Paso desde el norte sin la llegada');
  const r13 = await world('ruta_13', { flags: ENTRY, abilities: ALL });
  const A = RUTA13.arrivalNorth;
  const skip13 = bfs(r13, [RUTA13.north.x0 + 1, 0], { block: row(A.y, A.x0, A.x1) });
  assert.ok(!skip13.has(RUTA13.south.x0 + 1, RUTA13.south.y), 'se baja la Ruta 13 desde el norte sin la llegada');
  // Bordes sin conexión: no se camina pegado al borde de la pantalla (solo por las salidas).
  for (const [id, start, sides] of [['ruta_11', RUTA11.start, ['west', 'east']], ['ruta_13', RUTA13.start, ['west', 'east']], ['paso_del_norte', PASO.start, ['east']]]) {
    const ctx = await world(id, { flags: ENTRY, abilities: ALL });
    const r = bfs(ctx, at(start));
    const W = ctx.map.width; const H = ctx.map.height;
    for (const side of sides) {
      const x = side === 'west' ? 0 : W - 1;
      const open = Array.from({ length: H }, (_, y) => y).filter((y) => r.has(x, y));
      assert.deepEqual(open, [], `${id}: borde ${side} pisable en y ${open.join(', ')}`);
    }
  }
});

// ───────────────────────────── Villa Boreal ─────────────────────────────

test('Villa Boreal: la llegada desde el sur no se esquiva; puertas, cueva, lago, muelle, loma y salidas', async () => {
  const B = BOREAL;
  const ctx = await world('villa_boreal', { flags: ENTRY, abilities: ALL });
  const start = at(B.start);
  const r = bfs(ctx, start);
  for (const [name, bd] of Object.entries(B.buildings)) assert.ok(canUse(r, bd.door.x, bd.door.y), `puerta ${name}`);
  assert.ok(canUse(r, B.cave.door.x, B.cave.door.y) && r.has(B.cave.arrival.x, B.cave.arrival.y), 'boca de la Gruta Escarcha');
  for (let y = B.lakeExit.y0; y <= B.lakeExit.y1; y++) assert.ok(r.has(B.lakeExit.x, y), `salida al Lago Viejo (${B.lakeExit.x},${y})`);
  for (let x = B.north.x0; x <= B.north.x1; x++) assert.ok(r.has(x, 0), `sendero de los Lagos (${x},0)`);
  assert.ok(r.has(B.ferry.arrival.x, B.ferry.arrival.y), 'llegada del ferri');
  assert.ok(r.has(B.flyPoint.x, B.flyPoint.y), 'punto de Vuelo');
  for (const [x, y] of B.tower.footprint) assert.ok(!r.has(x, y), `se pisa la base de la Torre (${x},${y})`);
  for (const ev of [...pickables(ctx.w), ...talkables(ctx.w)]) assert.ok(canUse(r, ev.x, ev.y), `${ev.id} en (${ev.x},${ev.y}) inalcanzable`);
  const L = B.npcs.llegada;
  const skip = bfs(ctx, [B.south.x0 + 1, B.south.y], { block: row(L.y, L.x0, L.x1) });
  assert.ok(!canUse(skip, B.buildings.centro.door.x, B.buildings.centro.door.y), 'se entra al pueblo sin pisar la franja de llegada');
  assert.deepEqual(dead(r, start), [], 'casillas sin vuelta');
  const ferry = bfs(ctx, at(B.ferry.arrival));
  assert.ok(ferry.has(...start), 'del muelle no se llega al pueblo');
  const cave = bfs(ctx, at(B.cave.arrival));
  assert.ok(cave.has(...start), 'de la gruta no se vuelve al pueblo');
});

test('Villa Boreal: interiores (Centro, tienda, posada, casa, Observatorio, Talleres) sin trampas y con todo a mano', async () => {
  const stages = {
    boreal_talleres: [ENTRY, [ENTRY, F.nieves], [ENTRY, F.nieves, F.tower, F.froslassite]],
    boreal_observatorio: [ENTRY, [ENTRY, F.gaelB5]],
  };
  for (const [id, pos] of Object.entries(BOREAL_INTERIORS)) {
    for (const flags of stages[id] || [ENTRY]) {
      const ctx = await world(id, { flags: flags.flat(), abilities: ALL });
      const r = bfs(ctx, at(pos));
      for (const ev of talkables(ctx.w)) {
        if (/^estante\d/.test(ev.id)) continue; // mobiliario de la plantilla compartida de tienda (content/services)
        assert.ok(canTalk(r, ctx.map, ev.x, ev.y), `${id}: ${ev.id} en (${ev.x},${ev.y}) inalcanzable`);
      }
      for (const w of ctx.def.warps || []) assert.ok(canUse(r, w.x, w.y), `${id}: warp a ${w.to} en (${w.x},${w.y})`);
      assert.deepEqual(dead(r, at(pos)), [], `${id}: casillas sin vuelta`);
    }
  }
  const obs = bfs(await world('boreal_observatorio', { flags: ENTRY }), at(OBSERVATORIO.entry));
  assert.ok(obs.has(OBSERVATORIO.stairs.x - 1, OBSERVATORIO.stairs.y), 'no se llega al pie de la escalera de la azotea');
  const t = await world('boreal_talleres', { flags: ENTRY });
  const rt = bfs(t, at(TALLERES.entry));
  assert.ok(canUse(rt, TALLERES.rosendo.x, TALLERES.rosendo.y) && canUse(rt, TALLERES.nieves.x, TALLERES.nieves.y), 'Rosendo y Nieves');
});

test('Terraza del Observatorio: Gael, el núcleo, la casilla del duelo y C093; vuelta a la escalera', async () => {
  const T = TERRAZA;
  const ctx = await world('boreal_observatorio_terraza', { flags: ENTRY, abilities: ALL });
  const r = bfs(ctx, at(T.entry));
  assert.ok(r.has(T.duel.x, T.duel.y), 'casilla del duelo');
  assert.ok(canUse(r, T.gael.x, T.gael.y), 'Gael');
  assert.ok(canUse(r, T.cell.x, T.cell.y), 'C093');
  assert.ok(canUse(r, T.telescope.x, T.telescope.y), 'telescopio');
  assert.ok(canUse(r, T.stairs.x, T.stairs.y), 'escalera de bajada');
  assert.deepEqual(dead(r, at(T.entry)), [], 'casillas sin vuelta');
});

test('Lago Viejo: el mapa coincide con el plano del puzle (hielo, orilla, ribera) y la orilla se alcanza desde la llegada', async () => {
  const ctx = await world('boreal_lago', { flags: [...ENTRY, F.nieves], abilities: ALL });
  const { map } = ctx;
  for (let ly = 0; ly < LAKE.h; ly++) {
    for (let lx = 0; lx < LAKE.w; lx++) {
      const c = LAKE.at(lx, ly);
      const [x, y] = lakeToMap(lx, ly);
      const walk = map.playerPassable(x, y, 0, {});
      if (c === 'X') assert.ok(!walk, `ribera del lago pisable en (${x},${y}) (plano ${lx},${ly})`);
      if (c === '.' || c === 'B' || c === 'S') assert.ok(walk, `casilla de lago no pisable en (${x},${y}) (plano ${lx},${ly} «${c}»)`);
    }
  }
  const [sx, sy] = lakeToMap(initialState(LAKE).x, initialState(LAKE).y);
  const r = bfs(ctx, at(LAGO.entry), { block: LAKE.ice.map(([lx, ly]) => lakeToMap(lx, ly)) });
  assert.ok(r.has(sx, sy), 'la orilla de salida del lago no se alcanza');
  assert.ok(r.has(LAGO.respawn.x, LAGO.respawn.y), 'casilla de vuelta tras caerse');
  assert.ok(canUse(r, LAGO.nieves.x, LAGO.nieves.y), 'Nieves en el embarcadero');
  for (let y = LAGO.exit.y0; y <= LAGO.exit.y1; y++) assert.ok(r.has(LAGO.exit.x, y), `salida al pueblo (0,${y})`);
  assert.deepEqual(dead(r, at(LAGO.entry)), [], 'casillas sin vuelta en la orilla');
});

// ───────────────────────────── Gruta Escarcha ─────────────────────────────

test('Gruta Escarcha, sala 1: a nado la boca de la sala honda, C094, Glalita y el objeto; a pie, solo la orilla y la salida', async () => {
  const E = ESCARCHA;
  const ctx = await world('gruta_escarcha', { flags: ENTRY, abilities: ALL });
  const foot = bfs(ctx, at(E.entry));
  const swim = bfs(ctx, at(E.entry), { swim: true });
  assert.ok(!foot.has(E.innerFront.x, E.innerFront.y), 'la boca de la sala honda se alcanza a pie');
  assert.ok(swim.has(E.innerFront.x, E.innerFront.y), 'la boca de la sala honda no se alcanza a nado');
  for (let x = E.exit.x0; x <= E.exit.x1; x++) assert.ok(foot.has(x, E.exit.y), `felpudo de salida (${x},${E.exit.y})`);
  for (const p of [E.cell, E.glalita, E.item]) {
    assert.ok(!canUse(foot, p.x, p.y), `(${p.x},${p.y}) alcanzable a pie`);
    assert.ok(canUse(swim, p.x, p.y), `(${p.x},${p.y}) inalcanzable a nado`);
  }
  for (const ev of pickables(ctx.w)) assert.ok(canUse(swim, ev.x, ev.y), `${ev.id} en (${ev.x},${ev.y}) inalcanzable`);
  assert.deepEqual(dead(foot, at(E.entry)), [], 'casillas a pie sin vuelta');
  assert.deepEqual(dead(swim, at(E.entry)), [], 'casillas a nado sin vuelta');
});

test('Gruta Escarcha, sala honda: la pista de hielo lleva a la Baxcaliburita, a Fidel y a los objetos, y siempre hay vuelta', async () => {
  const E = ESCARCHA2;
  const ctx = await world('gruta_escarcha_2', { flags: ENTRY, abilities: ALL });
  const r = bfs(ctx, at(E.entry));
  assert.ok(r.size > 60, `sala honda casi vacía (${r.size} casillas)`);
  assert.ok(canUse(r, E.back.x, E.back.y), 'la boca de vuelta a la sala 1');
  assert.ok(canUse(r, E.baxcaliburita.x, E.baxcaliburita.y), 'la Baxcaliburita');
  for (const it of E.items) assert.ok(canUse(r, it.x, it.y), `${it.item} en (${it.x},${it.y})`);
  for (const ev of pickables(ctx.w)) assert.ok(canUse(r, ev.x, ev.y), `${ev.id} en (${ev.x},${ev.y}) inalcanzable`);
  assert.deepEqual(dead(r, at(E.entry)), [], 'casillas de la pista sin vuelta a la entrada');
});

// ───────────────────────────── Mar Boreal ─────────────────────────────

test('Mar Boreal: desde la costa del pueblo a nado se llega a C096, Teo, el remolino, los objetos y la verja de Cierzo', async () => {
  const ctx = await world('mar_boreal', { flags: ENTRY, abilities: ALL });
  const { map } = ctx;
  const east = map.width - 1;
  const coast = Array.from({ length: map.height }, (_, y) => [east, y]).find(([x, y]) => !map.playerPassable(x, y, 0, {}));
  assert.ok(coast, 'sin agua en el borde este');
  const r = bfs(ctx, coast, { swim: true });
  assert.ok(r.has(MAR.cell.x, MAR.cell.y), 'C096 inalcanzable');
  assert.ok(r.has(MAR.dive.x, MAR.dive.y), 'remolino de Buceo');
  assert.ok(canUse(r, MAR.cierzo.gate.x, MAR.cierzo.gate.y), 'verja de la Instalación Cierzo');
  for (const ev of pickables(ctx.w)) assert.ok(canUse(r, ev.x, ev.y), `${ev.id} en (${ev.x},${ev.y}) inalcanzable`);
  assert.deepEqual(dead(r, coast), [], 'casillas sin vuelta a la costa');
  const fondo = await world('mar_boreal_fondo', { flags: ENTRY, abilities: ALL });
  const rf = bfs(fondo, at(FONDO.entry));
  assert.ok(canUse(rf, FONDO.vent.x, FONDO.vent.y), 'respiradero');
  for (const ev of pickables(fondo.w)) assert.ok(canUse(rf, ev.x, ev.y), `fondo: ${ev.id} inalcanzable`);
  assert.deepEqual(dead(rf, at(FONDO.entry)), [], 'fondo: casillas sin vuelta');
});
