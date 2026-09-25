// Las coladas de la Cueva del Tizón (docs/TABLILLAS.md T12: «en la Cueva Volcán hay que empujar bloques de obsidiana
// para desviar las coladas; donde se corta el flujo, la lava se enfría y se puede pisar. Así se reabren tres
// respiraderos. Reintento: las coladas se reinician al salir de la sala»). Reglas PURAS (node --test):
//   · Cada colada nace en una BOCA (su primera casilla, junto a la pared o a la bifurcación) y corre por sus casillas.
//   · Un bloque de obsidiana empujado dentro de la boca la tapona: la colada entera se enfría y se pisa (costra).
//   · Un bloque no entra en la lava corriente (se fundiría) ni en otra casilla ocupada o de roca; sí en la costra fría.
//   · En la sala de la bifurcación, la boca de un brazo está junto a la fuente: taponar un brazo desvía el magma al
//     otro (la fuente sigue viva).
//   · Una sala está RESUELTA cuando todas sus coladas están taponadas; si se sale sin resolverla, vuelve al principio.
//   · Las casillas de llegada junto a cada boca de túnel (`keep`) no admiten bloques: un bloque ahí encerraba al
//     jugador en la sala 1 (entre la colada y la pared, sin poder volver a la boca para reiniciarla).
// Coordenadas absolutas del mapa tizon_cueva (40×50, tileset 13). Las salas son rectángulos de suelo (x0, y0, w, h).

const rect = (x0, y0, w, h) => ({ x0, y0, w, h, x1: x0 + w - 1, y1: y0 + h - 1 });
const row = (y, xa, xb) => { const out = []; const s = xa <= xb ? 1 : -1; for (let x = xa; x !== xb + s; x += s) out.push([x, y]); return out; };
const col = (x, ya, yb) => { const out = []; const s = ya <= yb ? 1 : -1; for (let y = ya; y !== yb + s; y += s) out.push([x, y]); return out; };

/**
 * Salas. `flows`: { id: { cells } } (la primera casilla es la boca). `blocks`: posiciones iniciales. `vent`: respiradero.
 * `rocks`: casillas de roca dentro de la sala (bloquean). `keep`: casillas de llegada de los túneles (se pisan, pero no
 * admiten bloques; coinciden con las `arrive` de maps/b13/tizon_cueva_layout.js#EXITS, lo comprueba el test).
 */
export const ROOMS = Object.freeze({
  // Sala 1 (tutorial): una colada de oeste a este corta la sala; el bloque se lleva a la boca (pared oeste).
  1: Object.freeze({
    n: 1, name: 'Galería de la primera colada', floor: rect(3, 39, 16, 8),
    flows: { c: { cells: row(42, 3, 18) } },
    blocks: { b0: [8, 45] },
    vent: { x: 15, y: 40 },
    rocks: [[14, 45], [6, 40]],
    keep: [[18, 43], [11, 39]],
  }),
  // Sala 2: dos coladas. La B (vertical, boca en la pared sur) separa la entrada del bloque que tapona la A
  // (horizontal, boca en la pared este), que corta el paso al respiradero y a la salida norte.
  2: Object.freeze({
    n: 2, name: 'Galería de las dos coladas', floor: rect(8, 22, 24, 12),
    flows: { a: { cells: row(25, 31, 8) }, b: { cells: col(20, 33, 26) } },
    blocks: { b1: [12, 28], b2: [27, 30] },
    vent: { x: 10, y: 23 },
    rocks: [[15, 31], [25, 32], [29, 27]],
    keep: [[8, 30], [20, 22]],
  }),
  // Sala 3 (bifurcación): la fuente baja por el centro y se parte en dos brazos. Hay que taponar primero el oeste
  // para alcanzar el bloque del centro, que tapona el este (salida al cráter).
  3: Object.freeze({
    n: 3, name: 'Cámara de la bifurcación', floor: rect(10, 5, 20, 12),
    source: col(20, 5, 8),
    flows: {
      l: { cells: [...row(8, 19, 13), ...col(13, 9, 16)] },
      r: { cells: [...row(8, 21, 26), ...col(26, 9, 16)] },
    },
    blocks: { bx: [11, 10], by: [22, 13] },
    vent: { x: 18, y: 15 },
    rocks: [[16, 11], [24, 15]],
    keep: [[10, 14], [28, 5]],
  }),
});

export const ROOM_IDS = Object.freeze(Object.keys(ROOMS).map(Number));
export const DV = Object.freeze({ 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] });
const key = (x, y) => `${x},${y}`;

/** Estado inicial de una sala. */
export function roomStart(n) {
  const r = ROOMS[n];
  return { blocks: Object.fromEntries(Object.entries(r.blocks).map(([id, p]) => [id, [...p]])), dammed: [] };
}

/** Normaliza el estado guardado (var b13_colada_<n>). */
export function roomState(n, saved) {
  const base = roomStart(n);
  if (!saved || typeof saved !== 'object') return base;
  const blocks = { ...base.blocks };
  for (const id of Object.keys(blocks)) {
    const p = saved.blocks?.[id];
    if (p === null) blocks[id] = null; // hundido en una boca
    else if (Array.isArray(p) && p.length === 2) blocks[id] = [p[0], p[1]];
  }
  const dammed = (Array.isArray(saved.dammed) ? saved.dammed : []).filter((f) => ROOMS[n].flows[f]);
  return { blocks, dammed };
}

export const isSolved = (n, st) => Object.keys(ROOMS[n].flows).every((f) => st.dammed.includes(f));

export function inFloor(n, x, y) {
  const f = ROOMS[n].floor;
  return x >= f.x0 && x <= f.x1 && y >= f.y0 && y <= f.y1;
}

/** Colada a la que pertenece (x, y), o null. */
export function flowAt(n, x, y) {
  for (const [id, fl] of Object.entries(ROOMS[n].flows)) if (fl.cells.some(([cx, cy]) => cx === x && cy === y)) return id;
  return null;
}

/** ¿Es lava corriente? (colada sin taponar o la fuente de la bifurcación). */
export function isLiveLava(n, st, x, y) {
  const r = ROOMS[n];
  if ((r.source || []).some(([sx, sy]) => sx === x && sy === y)) return true;
  const f = flowAt(n, x, y);
  return Boolean(f) && !st.dammed.includes(f);
}

/** Boca de la colada (primera casilla). */
export const headOf = (n, flow) => ROOMS[n].flows[flow].cells[0];

const blockAt = (st, x, y) => Object.entries(st.blocks).find(([, p]) => p && p[0] === x && p[1] === y)?.[0] ?? null;
const isRock = (n, x, y) => ROOMS[n].rocks.some(([rx, ry]) => rx === x && ry === y);
/** El respiradero es un evento sólido: ni se pisa ni admite un bloque encima. */
const isVent = (n, x, y) => ROOMS[n].vent.x === x && ROOMS[n].vent.y === y;
/** Casilla de llegada de un túnel: se pisa, pero no admite bloques (nunca tapa la salida). */
export const isKeep = (n, x, y) => (ROOMS[n].keep || []).some(([kx, ky]) => kx === x && ky === y);

/** ¿Se puede pisar (x, y) en la sala? (suelo, costra fría; no lava viva, roca, respiradero, bloque ni boca taponada). */
export function walkable(n, st, x, y) {
  if (!inFloor(n, x, y) || isRock(n, x, y) || isVent(n, x, y) || isLiveLava(n, st, x, y) || blockAt(st, x, y)) return false;
  const f = flowAt(n, x, y);
  if (f && st.dammed.includes(f)) {
    const [hx, hy] = headOf(n, f);
    if (hx === x && hy === y) return false; // el bloque hundido en la boca
  }
  return true;
}

/**
 * El jugador en (px, py) empuja hacia `dir`. → { ok, state, moved, dammed, reason }
 *   reason: 'nothing' (no hay bloque delante) · 'blocked' (no cabe) · 'lava' (lava corriente que no es una boca)
 */
export function push(n, st, px, py, dir) {
  const [dx, dy] = DV[dir];
  const bx = px + dx; const by = py + dy;
  const id = blockAt(st, bx, by);
  if (!id) return { ok: false, state: st, reason: 'nothing' };
  const tx = bx + dx; const ty = by + dy;
  const flow = flowAt(n, tx, ty);
  if (flow && !st.dammed.includes(flow)) {
    const [hx, hy] = headOf(n, flow);
    if (hx !== tx || hy !== ty) return { ok: false, state: st, reason: 'lava' };
    const next = { blocks: { ...st.blocks, [id]: null }, dammed: [...st.dammed, flow] };
    return { ok: true, state: next, moved: id, dammed: flow, to: [tx, ty] };
  }
  if (!walkable(n, st, tx, ty) || isKeep(n, tx, ty)) return { ok: false, state: st, reason: 'blocked' };
  return { ok: true, state: { blocks: { ...st.blocks, [id]: [tx, ty] }, dammed: [...st.dammed] }, moved: id, dammed: null, to: [tx, ty] };
}

/**
 * Solucionador (BFS sobre posición del jugador + estado): ¿se resuelve la sala desde (sx, sy)? Para tests.
 * → { solved: bool, pushes: n }
 */
export function solveRoom(n, sx, sy, { limit = 200000 } = {}) {
  const start = roomStart(n);
  const enc = (px, py, st) => `${px},${py}|${Object.entries(st.blocks).map(([k, p]) => `${k}:${p ? p.join('.') : 'x'}`).join(';')}|${[...st.dammed].sort().join('')}`;
  const seen = new Set([enc(sx, sy, start)]);
  const queue = [[sx, sy, start, 0]];
  for (let head = 0; head < queue.length && head < limit; head++) {
    const [px, py, st, pushes] = queue[head];
    if (isSolved(n, st)) return { solved: true, pushes };
    for (const d of [2, 4, 6, 8]) {
      const [dx, dy] = DV[d];
      const nx = px + dx; const ny = py + dy;
      let next = null;
      let np = pushes;
      if (walkable(n, st, nx, ny)) next = [nx, ny, st];
      else {
        const r = push(n, st, px, py, d);
        if (r.ok) { next = [r.dammed ? px : nx, r.dammed ? py : ny, r.state]; np += 1; }
      }
      if (!next) continue;
      const k = enc(next[0], next[1], next[2]);
      if (seen.has(k)) continue;
      seen.add(k);
      queue.push([next[0], next[1], next[2], np]);
    }
  }
  return { solved: false, pushes: -1 };
}

/** Casillas de suelo transitables de la sala con un estado (para el test de alcanzabilidad). */
export function walkableCells(n, st) {
  const f = ROOMS[n].floor;
  const out = [];
  for (let y = f.y0; y <= f.y1; y++) for (let x = f.x0; x <= f.x1; x++) if (walkable(n, st, x, y)) out.push([x, y]);
  return out;
}

export { key as cellKey };
