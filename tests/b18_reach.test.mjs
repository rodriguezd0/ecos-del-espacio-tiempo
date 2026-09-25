// Bloque 18 — Pilar de la Convergencia: alcanzabilidad a pie (docs/CAMPANA.md B18; §2.5 G14 Reconstrucción y la
// Cadena Roja). BFS con la pasabilidad real del mundo (tiles, vacío `voidBlocks`, eventos sólidos, warps por empujón y
// por dirección) como tests/b06_reach.test.mjs:
//   · Puente: cada hueco del tramo central corta el paso hasta alzar sus piedras (Reconstrucción); Casia y Garrido
//     cierran la plataforma de lado a lado; la boca de la Cámara está sellada hasta la irrupción y el vallado sur hasta
//     el final de la escena; los bordes siguen el tablero de B17; objetos, zócalos, entrenadores y Alerce, alcanzables
//     en su momento; ninguna casilla sin vuelta.
//   · Cámara del Cruce: BFS de estados (casilla, eje) sobre el mapa real con las reglas del motor (corrientes que
//     arrastran o hacen caer, pliegues, escombros congelados, tensar en los cristales, warps de las salas). Sin tensar
//     hacia Dialga no se sale del vestíbulo; sin Palkia no se pasa de la Sala de la Caída; cada puerta es obligatoria;
//     el atajo solo tras ver el núcleo; ningún estado alcanzable deja al jugador sin volver a la entrada.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { F } from '../game/src/content/events/b18_common.js';
import {
  ARRIVAL, BRIDGE, CAST, STRIPS, MOUTH, ITEMS, CAMP, SIGNS, PLATFORM, NORTH_EXIT, SOUTH_EXIT, PLANKS, platformCells,
} from '../game/src/content/maps/b18/puente_layout.js';
import { ROOM_PLACES, VESTIBULO, CAIDA, RIO, CRUCE, NUCLEO, SHORTCUT, ENTRY } from '../game/src/content/maps/b18/cruce_layout.js';
import { STELE } from '../game/src/content/events/b18_cruce.js';
import { AXIS_VAR, AXIS_TIME, AXIS_SPACE } from '../game/src/world/axis/logic.js';
import { fieldWorld, DV, key } from './b18_helpers.mjs';

const NEAR = [[0, 0], [0, 1], [0, -1], [1, 0], [-1, 0]];

// ───────────────────────────── BFS de casillas (Puente) ─────────────────────────────

/** ¿Hay un evento de contacto activo en (x, y)? (empujar contra el warp dispara el evento, no el warp) */
const touchAt = (w, x, y) => w.events.some((e) => !e.erased && e.page && ['touch', 'eventTouch'].includes(e.trigger) && e.x === x && e.y === y);

/** Casillas alcanzables desde `start` (block: casillas tratadas como muro, p. ej. las franjas de intercepción). */
function bfs(t, start, { block = [] } = {}) {
  const { map, p } = t;
  const blocked = new Set(block.map(([x, y]) => key(x, y)));
  const seen = new Set([key(...start)]);
  const edges = [];
  const queue = [start];
  while (queue.length) {
    const [x, y] = queue.shift();
    for (const d of [2, 4, 6, 8]) {
      const nx = x + DV[d][0];
      const ny = y + DV[d][1];
      if (!map.valid(nx, ny) || blocked.has(key(nx, ny))) continue;
      p.x = x; p.y = y;
      if (!p.passable(x, y, d)) continue;
      edges.push([key(x, y), key(nx, ny)]);
      if (seen.has(key(nx, ny))) continue;
      seen.add(key(nx, ny));
      queue.push([nx, ny]);
    }
  }
  return { has: (x, y) => seen.has(key(x, y)), seen, edges };
}

/** Casillas alcanzadas desde las que no se vuelve a `home`. */
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

const canUse = (r, x, y) => NEAR.some(([dx, dy]) => r.has(x + dx, y + dy));
/** ¿Se activa un warp de empujón en (x, y)? (se pisa o se empuja desde al lado, sin evento de contacto encima) */
const canWarp = (t, r, x, y) => !touchAt(t.w, x, y) && canUse(r, x, y);
const START = [ARRIVAL.x, ARRIVAL.y];
const BRIDGE_FLAGS = [F.arrival, F.gap1, F.gap2, F.gap3, F.bridge];
const puente = (flags) => fieldWorld('puente_convergencia', { flags });
const onPlatform = (r) => platformCells().some(([x, y]) => r.has(x, y));

test('Puente: cada hueco del tramo central corta el paso hasta alzar sus piedras; la plataforma, solo tras el tercero', async () => {
  const [g1, g2, g3] = BRIDGE.gaps;
  const pier = (i) => BRIDGE.piers[i];
  const s0 = bfs(await puente([F.arrival]), START);
  assert.ok(canUse(s0, g1.socket.x, g1.socket.y), 'el primer zócalo no se alcanza');
  assert.ok(!s0.has(BRIDGE.cx, g1.y0) && !s0.has(BRIDGE.cx, pier(0).y0), 'se cruza el primer hueco sin alzarlo');
  const s1 = bfs(await puente([F.arrival, F.gap1]), START);
  assert.ok(s1.has(BRIDGE.cx, pier(0).y0) && canUse(s1, g2.socket.x, g2.socket.y), 'el primer estribo o el segundo zócalo no se alcanzan');
  assert.ok(!s1.has(BRIDGE.cx, pier(1).y0), 'se cruza el segundo hueco sin alzarlo');
  const s2 = bfs(await puente([F.arrival, F.gap1, F.gap2]), START);
  assert.ok(s2.has(BRIDGE.cx, pier(1).y0) && canUse(s2, g3.socket.x, g3.socket.y), 'el segundo estribo o el tercer zócalo no se alcanzan');
  assert.ok(!onPlatform(s2), 'se llega a la plataforma sin el tercer tramo');
  const s3 = bfs(await puente(BRIDGE_FLAGS), START);
  assert.ok(onPlatform(s3), 'con el puente entero no se llega a la plataforma');
  for (const r of [s0, s1, s2, s3]) assert.deepEqual(dead(r, START), [], 'casillas del puente sin vuelta a la llegada');
  // Solo las piedras alzadas (x 19–21) se pisan en los huecos
  for (const g of BRIDGE.gaps) for (let y = g.y0; y <= g.y1; y++) assert.ok(!s3.has(BRIDGE.x0, y) && !s3.has(BRIDGE.x1, y), `el borde roto del hueco ${g.n} se pisa`);
});

test('Puente: objetos, campamento, buhonera y estela del rellano; el Caramelo Raro solo desde el segundo estribo', async () => {
  const t0 = await puente([F.arrival]);
  const s0 = bfs(t0, START);
  const all = bfs(await puente([...BRIDGE_FLAGS, F.casia, F.garrido, F.vertice, F.irruption, F.scene]), START);
  for (const it of ITEMS) {
    const late = it.id === 'objeto_estribo' || it.y > PLATFORM.y0;
    assert.equal(canUse(s0, it.x, it.y), !late, `${it.id} (${it.x},${it.y}) ${late ? 'se coge antes de tiempo' : 'no se alcanza al llegar'}`);
    assert.ok(canUse(all, it.x, it.y), `${it.id} inalcanzable`);
  }
  for (const c of [CAMP.rest, CAMP.fire, CAMP.scope, CAST.vendor, CAST.alerceCamp]) assert.ok(canUse(s0, c.x, c.y), `(${c.x},${c.y}) del rellano inalcanzable`);
  assert.ok(canUse(s0, SIGNS.stele.x, SIGNS.stele.y + 1), 'la estela no se lee');
  for (let x = NORTH_EXIT.x0; x <= NORTH_EXIT.x1; x++) assert.ok(s0.has(x, NORTH_EXIT.y), `el borde norte (${x}) no se pisa`);
});

test('Puente: Casia y Garrido cierran la plataforma de lado a lado; Vértice, los técnicos y Alerce se alcanzan', async () => {
  const t = await puente(BRIDGE_FLAGS);
  const cut = bfs(t, START, { block: STRIPS.casia.map((c) => [c.x, c.y]) });
  assert.ok(!platformCells().some(([x, y]) => y > STRIPS.casia[0].y && cut.has(x, y)), 'se esquiva a Casia');
  const r = bfs(t, START);
  for (const c of [CAST.casia, CAST.tecnico, CAST.tecnica, CAST.alerceEdge]) assert.ok(canUse(r, c.x, c.y), `(${c.x},${c.y}) inalcanzable`);
  const t2 = await puente([...BRIDGE_FLAGS, F.casia]);
  const cut2 = bfs(t2, START, { block: STRIPS.garrido.map((c) => [c.x, c.y]) });
  assert.ok(!platformCells().some(([x, y]) => y > STRIPS.garrido[0].y && cut2.has(x, y)), 'se esquiva a Garrido');
  const r2 = bfs(await puente([...BRIDGE_FLAGS, F.casia, F.garrido]), START);
  assert.ok(canUse(r2, CAST.vertice.x, CAST.vertice.y), 'Vértice inalcanzable');
});

test('Puente: la boca de la Cámara, sellada hasta la irrupción; el vallado sur, hasta el P9 (como la barrera de B17); bordes con B17', async () => {
  const before = await puente([...BRIDGE_FLAGS, F.casia, F.garrido]);
  const rb = bfs(before, START);
  assert.ok(!canWarp(before, rb, MOUTH.warp.x, MOUTH.warp.y), 'se baja a la Cámara con la Cadena Sintética puesta');
  assert.ok(!rb.has(BRIDGE.cx, PLANKS.y0), 'se cruza el vallado sur antes de la escena');
  const open = await puente([...BRIDGE_FLAGS, F.casia, F.garrido, F.vertice, F.overload, F.irruption]);
  const ro = bfs(open, START);
  assert.ok(canWarp(open, ro, MOUTH.warp.x, MOUTH.warp.y), 'la boca no se abre tras la irrupción');
  const after = await puente([...BRIDGE_FLAGS, F.casia, F.garrido, F.vertice, F.irruption, F.verticeGone, F.notebook, F.arrest, F.scene]);
  const ra = bfs(after, START);
  assert.ok(canWarp(after, ra, MOUTH.warp.x, MOUTH.warp.y), 'la boca no queda abierta tras la escena');
  assert.ok(ra.has(MOUTH.front.x, MOUTH.front.y), 'el frente de la boca (vuelta de la Cámara) no se pisa');
  // Tras la escena el vallado sigue (precintado): el estribo del Mirador Sur (B17) está cerrado hasta el P9
  assert.ok(!ra.has(BRIDGE.cx, PLANKS.y0), 'el tramo sur se abre antes del P9 y muere contra la barrera de B17');
  assert.deepEqual(dead(ra, START), [], 'casillas sin vuelta tras la escena');
  const restored = bfs(await puente([...BRIDGE_FLAGS, F.casia, F.garrido, F.vertice, F.irruption, F.verticeGone, F.notebook, F.arrest, F.scene, F.restored]), START);
  for (let x = SOUTH_EXIT.x0; x <= SOUTH_EXIT.x1; x++) assert.ok(restored.has(x, SOUTH_EXIT.y), `el borde sur (${x}) no se pisa con el P9 restaurado`);
  assert.deepEqual(dead(restored, START), [], 'casillas sin vuelta con el P9 restaurado');
  for (const id of ['alerce_boca', 'olmedo_despues', 'agente_resonador']) {
    const ev = after.w.events.find((e) => e.id === id);
    assert.ok(canUse(ra, ev.x, ev.y), `${id} inalcanzable`);
  }
  // Los bordes siguen el tablero de B17 con las mismas x (conexiones con offset 0 en los dos sentidos)
  const senda = await fieldWorld('senda_mirador');
  const sur = await fieldWorld('mirador_sur');
  for (let x = 0; x < after.map.width; x++) {
    const northDeck = x >= NORTH_EXIT.x0 && x <= NORTH_EXIT.x1;
    assert.equal(after.map.playerPassable(x, 0, 8, {}), northDeck, `borde norte del Puente (${x})`);
    if (northDeck) assert.ok(senda.map.playerPassable(x, senda.map.height - 1, 2, {}), `la Senda no sigue el tablero en x ${x}`);
    const southDeck = x >= SOUTH_EXIT.x0 && x <= SOUTH_EXIT.x1;
    assert.equal(after.map.playerPassable(x, after.map.height - 1, 2, {}), southDeck, `borde sur del Puente (${x})`);
    if (southDeck) assert.ok(sur.map.playerPassable(x, 0, 8, {}), `el Mirador Sur no sigue el tablero en x ${x}`);
  }
  const link = (def, to) => (def.connections || []).find((c) => c.to === to);
  assert.deepEqual(link(after.def, 'senda_mirador'), { dir: 'north', to: 'senda_mirador', offset: 0 });
  assert.deepEqual(link(after.def, 'mirador_sur'), { dir: 'south', to: 'mirador_sur', offset: 0 });
  assert.equal(link(senda.def, 'puente_convergencia')?.dir, 'south');
  assert.equal(link(sur.def, 'puente_convergencia')?.dir, 'north');
});

// ───────────────────────────── BFS de estados (Cámara del Cruce) ─────────────────────────────

const MODES = [null, AXIS_TIME, AXIS_SPACE];
const mk = (m) => m ?? '-';
const skey = (x, y, m) => `${x},${y},${mk(m)}`;

/** Eventos de ejes vivos por casilla y tipo en el estado actual del mapa. */
function axisAt(w, x, y, kind) {
  return w.events.find((e) => !e.erased && e.page && e.x === x && e.y === y && e.def?.axisKind === kind) || null;
}

/** Arrastre de una corriente en el mapa real (como world/axis/actions.js#rideCurrent). → { x, y } */
function ride(t, x, y) {
  const { w, map, p } = t;
  let px = x;
  let py = y;
  for (let i = 0; i < 200; i++) {
    const cur = axisAt(w, px, py, 'current');
    if (!cur || !cur.trigger) break;
    const d = cur.def.dir;
    const nx = px + DV[d][0];
    const ny = py + DV[d][1];
    if (map.isVoid(nx, ny)) return { x: cur.def.safe.x, y: cur.def.safe.y };
    p.x = px; p.y = py;
    if (!p.passable(px, py, d)) break;
    px = nx; py = ny;
  }
  return { x: px, y: py };
}

/**
 * Grafo de estados de la Cámara con los flags dados: para cada eje, el mapa y los eventos en ese estado (patches de los
 * escombros incluidos), pasos del jugador (corrientes, pliegues, warps internos de empujón y de dirección) y tensiones
 * en los cristales. La salida al Puente vuelve a la llegada con el mismo eje (la tensión se guarda).
 */
async function cruceGraph(flags, vars = {}) {
  const t = await fieldWorld('camara_cruce', { flags, vars });
  const { w, map, p, def } = t;
  const warps = def.warps || [];
  const pushWarp = (x, y) => warps.find((wp) => !wp.dirTrigger && wp.x === x && wp.y === y) || null;
  const moves = new Map(); // skey → [{ x, y, m }]
  const add = (x, y, m, to) => { const k = skey(x, y, m); moves.set(k, [...(moves.get(k) || []), to]); };
  const debris = new Set();
  const crystals = [];
  const slides = {}; // eje → Map(casilla → destino) al tensar encima de una corriente
  for (const m of MODES) {
    t.state.setVar(AXIS_VAR, m);
    w.refreshEvents();
    slides[mk(m)] = new Map();
    for (const e of w.events) {
      if (e.def?.axisKind === 'debris') debris.add(key(e.x, e.y));
      if (e.def?.axisKind === 'crystal' && m === null) crystals.push({ x: e.x, y: e.y, safe: e.def.safe });
      if (e.def?.axisKind === 'current' && e.trigger) slides[mk(m)].set(key(e.x, e.y), ride(t, e.x, e.y));
    }
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        if (map.isVoid(x, y)) continue;
        for (const d of [2, 4, 6, 8]) {
          const dirWarp = warps.find((wp) => wp.dirTrigger === d && wp.x === x && wp.y === y);
          if (dirWarp) { add(x, y, m, dirWarp.to === 'camara_cruce' ? { x: dirWarp.tx, y: dirWarp.ty, m } : { exit: true, m }); continue; }
          const nx = x + DV[d][0];
          const ny = y + DV[d][1];
          const wp = pushWarp(nx, ny);
          if (wp && !touchAt(w, nx, ny)) { add(x, y, m, wp.to === 'camara_cruce' ? { x: wp.tx, y: wp.ty, m } : { exit: true, m }); continue; }
          p.x = x; p.y = y;
          if (!p.passable(x, y, d)) continue;
          const cur = axisAt(w, nx, ny, 'current');
          const fold = axisAt(w, nx, ny, 'fold');
          if (cur?.trigger) add(x, y, m, { ...ride(t, nx, ny), m });
          else if (fold?.trigger) add(x, y, m, { x: fold.def.to.x, y: fold.def.to.y, m });
          else add(x, y, m, { x: nx, y: ny, m });
        }
      }
    }
  }
  const home = { x: ENTRY.x, y: ENTRY.y };
  /** Sucesores de (x, y, m); `forbid`: ejes hacia los que no se puede tensar. */
  const next = (x, y, m, forbid = []) => {
    const out = (moves.get(skey(x, y, m)) || []).map((s) => (s.exit ? { ...home, m: s.m } : s));
    for (const c of crystals) {
      if (Math.abs(c.x - x) + Math.abs(c.y - y) !== 1) continue;
      for (const to of [AXIS_TIME, AXIS_SPACE]) {
        if (to === m || forbid.includes(to)) continue;
        if (debris.has(key(x, y)) && to !== AXIS_TIME) out.push({ x: c.safe.x, y: c.safe.y, m: to });
        else if (slides[mk(to)].has(key(x, y))) out.push({ ...slides[mk(to)].get(key(x, y)), m: to });
        else out.push({ x, y, m: to });
      }
    }
    return out;
  };
  /** BFS de estados desde la llegada (sin tensar). opts: forbid, cut (warps internos anulados: [{ x, y }]) */
  const reach = ({ forbid = [], cut = [] } = {}) => {
    const cutSet = new Set(cut.map((c) => key(c.x, c.y)));
    const seen = new Map([[skey(home.x, home.y, null), { ...home, m: null }]]);
    const edges = [];
    const queue = [{ ...home, m: null }];
    while (queue.length) {
      const s = queue.shift();
      for (const n of next(s.x, s.y, s.m, forbid)) {
        if (cut.length && warps.some((wp) => cutSet.has(key(wp.x, wp.y)) && wp.tx === n.x && wp.ty === n.y && Math.abs(wp.x - s.x) + Math.abs(wp.y - s.y) <= 1)) continue;
        const k = skey(n.x, n.y, n.m);
        edges.push([skey(s.x, s.y, s.m), k]);
        if (seen.has(k)) continue;
        seen.set(k, n);
        queue.push(n);
      }
    }
    const cells = new Set([...seen.values()].map((s) => key(s.x, s.y)));
    return { seen, edges, cells, has: (x, y) => cells.has(key(x, y)) };
  };
  return { t, reach, home };
}

const inRect = (r, x, y) => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h;
const reachesRoom = (r, rect) => [...r.cells].some((k) => { const [x, y] = k.split(',').map(Number); return inRect(rect, x, y); });

/** Estados alcanzados desde los que no se vuelve a la llegada (con cualquier eje). */
function deadStates(r, home) {
  const back = new Map();
  for (const [a, b] of r.edges) back.set(b, [...(back.get(b) || []), a]);
  const homes = MODES.map((m) => skey(home.x, home.y, m)).filter((k) => r.seen.has(k));
  const ok = new Set(homes);
  const queue = [...homes];
  while (queue.length) {
    const k = queue.shift();
    for (const a of back.get(k) || []) if (!ok.has(a)) { ok.add(a); queue.push(a); }
  }
  return [...r.seen.keys()].filter((k) => !ok.has(k));
}

test('Cámara: de la llegada al núcleo por las tres salas en orden; sin Dialga no se sale del vestíbulo; sin Palkia, de la Caída', async () => {
  const g = await cruceGraph([F.scene, F.chamberIn]);
  const all = g.reach();
  assert.ok(all.seen.size >= 800, `grafo de estados demasiado pequeño (${all.seen.size}): el BFS no recorre las salas`);
  assert.ok(all.has(NUCLEO.coreFront.x, NUCLEO.coreFront.y), 'el núcleo no se alcanza');
  assert.ok(!reachesRoom(g.reach({ forbid: [AXIS_TIME] }), CAIDA.room), 'se sale del vestíbulo sin tensar hacia Dialga');
  const noSpace = g.reach({ forbid: [AXIS_SPACE] });
  assert.ok(reachesRoom(noSpace, CAIDA.room) && !reachesRoom(noSpace, RIO.room), 'la Sala de la Caída se supera sin Palkia (o no se llega)');
  // Cada puerta es obligatoria: sin ella no se llega a la sala siguiente ni al núcleo
  const chain = [[VESTIBULO, CAIDA.room], [CAIDA, RIO.room], [RIO, CRUCE.room], [CRUCE, NUCLEO.room]];
  for (const [from, rect] of chain) {
    const cut = g.reach({ cut: [from.gate.warp] });
    assert.ok(!reachesRoom(cut, rect), `se llega a la sala siguiente sin la puerta de ${from.name}`);
    assert.ok(!cut.has(NUCLEO.coreFront.x, NUCLEO.coreFront.y), `se llega al núcleo sin la puerta de ${from.name}`);
  }
  assert.deepEqual(deadStates(all, g.home), [], 'estados de la Cámara sin vuelta a la llegada');
  // Nada fuera de las salas (el abismo no se pisa)
  const rects = [...ROOM_PLACES.map((pl) => pl.room), NUCLEO.room];
  for (const k of all.cells) { const [x, y] = k.split(',').map(Number); assert.ok(rects.some((rc) => inRect(rc, x, y)), `(${x},${y}) fuera de las salas`); }
});

test('Cámara: cristales, objetos, estela, Dialga, Palkia, el núcleo y la placa se alcanzan', async () => {
  const g = await cruceGraph([F.scene, F.chamberIn]);
  const r = g.reach();
  for (const place of ROOM_PLACES) {
    for (const c of place.grid.crystals) assert.ok(canUse(r, place.ox + c.x, place.oy + c.y), `${place.name}: cristal (${c.x},${c.y}) inalcanzable`);
    for (const o of place.grid.items) assert.ok(canUse(r, place.ox + o.x, place.oy + o.y), `${place.name}: objeto (${o.x},${o.y}) inalcanzable`);
  }
  assert.ok(canUse(r, STELE.x, STELE.y + 1), 'la estela del vestíbulo no se lee');
  for (const c of [NUCLEO.dialga, NUCLEO.palkia, NUCLEO.core, NUCLEO.orb, NUCLEO.bound]) assert.ok(canUse(r, c.x, c.y), `(${c.x},${c.y}) del núcleo inalcanzable`);
  assert.ok(canUse(r, NUCLEO.inscription.x, NUCLEO.inscription.y + 1), 'la placa del núcleo no se lee');
  // Con el eje atado, el orbe (sólido) sigue alcanzable y el núcleo tiene vuelta
  const bound = await cruceGraph([F.scene, F.chamberIn, F.nucleus, F.bound], { p9_choice: 'DIALGA' });
  assert.ok(bound.t.w.events.find((e) => e.id === 'orbe_no_elegido')?.page, 'el orbe no está tras atar el eje');
  const rb = bound.reach();
  assert.ok(canUse(rb, NUCLEO.orb.x, NUCLEO.orb.y));
  assert.deepEqual(deadStates(rb, bound.home), []);
});

test('Cámara: el atajo del vestíbulo lleva al núcleo solo tras verlo; la escalinata del núcleo baja junto al atajo', async () => {
  const before = await cruceGraph([F.scene, F.chamberIn]);
  assert.ok(!before.reach({ forbid: [AXIS_SPACE] }).has(NUCLEO.coreFront.x, NUCLEO.coreFront.y), 'el atajo está abierto antes de ver el núcleo');
  const after = await cruceGraph([F.scene, F.chamberIn, F.nucleus]);
  const r = after.reach({ forbid: [AXIS_SPACE] });
  assert.ok(r.has(NUCLEO.coreFront.x, NUCLEO.coreFront.y), 'con el núcleo visto, el atajo no lleva al núcleo');
  assert.ok(r.has(SHORTCUT.front.x, SHORTCUT.front.y));
  assert.deepEqual(deadStates(after.reach(), after.home), [], 'estados sin vuelta con el atajo abierto');
});
