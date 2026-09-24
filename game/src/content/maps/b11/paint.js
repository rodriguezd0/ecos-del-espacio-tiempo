// Ayudas de pintado del Bloque 11 (módulo puro): rectángulos inclusivos y bosques de borde irregular con árboles
// completos. El brush `forest` apila árboles de 2×6 cada 4 filas alineados por parejas de columnas desde abajo; si
// cada pareja tiene una altura 4k+2 el árbol de arriba sale entero. `raggedForest` elige para cada pareja un pie y
// una cabeza distintos (deterministas) y así los lindes del bosque dejan de ser una línea recta.

/** Rectángulo inclusivo [x0..x1] × [y0..y1] como lista de casillas. */
export const rect = (x0, y0, x1, y1) => {
  const out = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]);
  return out;
};

export const union = (...parts) => parts.flat();

/** Quita de `cells` las casillas de `holes`. */
export const minus = (cells, holes) => {
  const h = new Set(holes.map(([x, y]) => `${x},${y}`));
  return cells.filter(([x, y]) => !h.has(`${x},${y}`));
};

/** Pseudoaleatorio determinista por casilla. */
function hash(x, y, seed) {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * Casillas de un bosque de linde irregular sobre [x0..x1] × [y0..y1] (x1 − x0 + 1 par). Cada pareja de columnas
 * baja hasta y1 − (0..jitter) y sube hasta donde cabe un número entero de árboles (altura 4k + 2): los árboles
 * quedan completos. opts: { jitter = 2, seed = 1, clipTop = false (el borde superior es el del mapa u otro bosque:
 * se llena hasta y0 aunque el árbol de arriba quede cortado), clipBottom = false (el pie no varía), skip(x, y) }.
 */
export function raggedForestCells(x0, y0, x1, y1, opts = {}) {
  const { jitter = 2, seed = 1, clipTop = false, clipBottom = false, skip = null } = opts;
  const out = [];
  for (let px = x0; px <= x1; px += 2) {
    const j = clipBottom ? 0 : Math.floor(hash(px, y1, seed) * (jitter + 1));
    const bottom = y1 - j;
    let top;
    if (clipTop) {
      top = y0;
    } else {
      const span = bottom - y0 + 1;
      if (span < 6) continue;
      const k = Math.floor((span - 2) / 4);
      top = bottom - (4 * k + 2) + 1;
    }
    for (let y = top; y <= bottom; y++) {
      for (const x of [px, px + 1]) {
        if (x > x1) continue;
        if (skip && skip(x, y)) continue;
        out.push([x, y]);
      }
    }
  }
  return out;
}

/**
 * Trozos de un tramo vertical largo [a..bottom] (de abajo arriba) con alturas 4k + 2 variadas, para que una misma
 * pareja de columnas no sea una franja de un solo árbol de punta a punta del mapa. El trozo de arriba se queda con
 * el resto (hasta el borde superior del mapa si el tramo lo toca). → [[top, bottom], …]
 */
function runChunks(px, a, bottom, { maxRun, seed }) {
  const len = bottom - a + 1;
  if (!maxRun || len <= maxRun) return [[a, bottom]];
  const out = [];
  let end = bottom;
  let i = 0;
  const SIZES = [10, 14, 18];
  while (end - a + 1 > maxRun) {
    const h = SIZES[Math.floor(hash(px, end + i, seed + 5) * SIZES.length)];
    if (end - h + 1 - a < 6 && a !== 0) break; // el resto no daría otro árbol completo: se queda en este trozo
    out.push([end - h + 1, end]);
    end -= h;
    i += 1;
  }
  out.push([a, end]);
  return out;
}

/**
 * Rellena de bosque todo lo que no está abierto. Por cada pareja de columnas se buscan tramos verticales donde las
 * dos columnas están cerradas; cada tramo se pinta como un trazo propio recortado a una altura 4k + 2 (árboles
 * completos). Un tramo que toca el borde superior del mapa se llena entero (el árbol de arriba sigue fuera). Los
 * tramos de 4–5 filas llevan un árbol suelto (stamp 2×4) y los menores quedan de hierba. Con `maxRun`, los tramos
 * más largos se parten en trozos de alturas variadas, cada uno con su pincel (el linde deja de ser una franja).
 * opts: { width, height, open(x, y) → bool, brushes: ['bosque_morado', …] (elegido por pareja), small: [stamps 2×4],
 *   fringe: [stamps 2×2], maxRun, seed, x0, y0, x1, y1 }
 */
export function forestFill(b, opts) {
  const { width, height, open, brushes = ['bosque_morado'], small = [], fringe = [], seed = 1, maxRun = 0 } = opts;
  const x0 = opts.x0 ?? 0; const y0 = opts.y0 ?? 0;
  const x1 = opts.x1 ?? width - 1; const y1 = opts.y1 ?? height - 1;
  const closed = (x, y) => x >= 0 && x < width && !open(x, y);
  for (let px = x0; px + 1 <= x1; px += 2) {
    let y = y0;
    while (y <= y1) {
      if (!(closed(px, y) && closed(px + 1, y))) { y += 1; continue; }
      const a = y;
      while (y + 1 <= y1 && closed(px, y + 1) && closed(px + 1, y + 1)) y += 1;
      const bottom = y;
      y += 1;
      for (const [ca, cb] of runChunks(px, a, bottom, { maxRun, seed })) {
        const len = cb - ca + 1;
        const brush = brushes[Math.floor(hash(px, ca, seed) * brushes.length)];
        if (ca === 0 || len >= 6) {
          const top = ca === 0 ? 0 : cb - (4 * Math.floor((len - 2) / 4) + 2) + 1;
          b.paint(brush, rect(px, top, px + 1, cb));
          // Sobra de 2–3 filas sobre el árbol de arriba: matas (2×2) para que el linde no quede pelado.
          if (fringe.length && top - ca >= 2) safeStamp(b, fringe[Math.floor(hash(px, ca, seed + 2) * fringe.length)], px, top - 2);
        } else if (len >= 4 && small.length) {
          safeStamp(b, small[Math.floor(hash(px, cb, seed + 1) * small.length)], px, cb - 3);
        }
      }
    }
  }
}

/**
 * Segunda pasada tras forestFill: los huecos cerrados que quedaron sin árbol (tramos de 2–3 filas entre claros) se
 * rellenan con piezas de 2×2 (matas, rocas, cristales; elegidas por casilla, alguna se deja vacía) para que el bosque
 * no deje franjas de césped sueltas ni hileras de clones. opts: { width, height, open(x, y), stamps: ['arbustos'],
 * seed, skip = 0.15 }
 */
export function fillGaps(b, opts) {
  const { width, height, open, stamps = ['arbustos'], seed = 1, skip = 0.15 } = opts;
  const bare = (x, y) => x >= 0 && x < width && y >= 0 && y < height && !open(x, y) && !b.get(1, x, y) && !b.get(2, x, y);
  for (let px = 0; px + 1 < width; px += 2) {
    let y = 0;
    while (y < height) {
      if (!(bare(px, y) && bare(px + 1, y))) { y += 1; continue; }
      const a = y;
      while (y + 1 < height && bare(px, y + 1) && bare(px + 1, y + 1)) y += 1;
      const bottom = y;
      y += 1;
      for (let top = bottom - 1; top >= a; top -= 2) {
        if (hash(px, top, seed + 13) < skip) continue;
        safeStamp(b, stamps[Math.floor(hash(px, top, seed + 9) * stamps.length)], px, top);
      }
    }
  }
}

/**
 * Coloca un stamp solo sobre suelo despejado: ninguna casilla que ocupe puede tener ya algo en las capas 1 y 2 (un
 * árbol o su tronco, el borde de un camino, la orilla, la hierba alta, otra pieza…) salvo las capas de `over`, ni
 * estar vetada por `avoid(x, y)`. Así los detalles nunca rompen otras piezas. → true si se colocó.
 */
export function safeStamp(b, name, x, y, { avoid = null, over = [] } = {}) {
  const def = b.findStamp(name);
  const grids = def && b.stampGrids(def, name);
  if (!grids) return false;
  for (let l = 0; l < grids.layers.length; l++) {
    const g = grids.layers[l];
    if (!g) continue;
    for (let j = 0; j < grids.h; j++) {
      for (let i = 0; i < grids.w; i++) {
        if (!g[i + j * grids.w]) continue;
        const cx = x + i; const cy = y + j;
        if (cx < 0 || cy < 0 || cx >= b.width || cy >= b.height) continue;
        const why = (avoid && avoid(cx, cy)) ? 'reservada'
          : [1, 2].find((L) => !over.includes(L) && b.get(L, cx, cy));
        if (why) {
          if (globalThis.__B11_DECOR_DEBUG) console.log(`  ${name}@${x},${y}: (${cx},${cy}) ${why === 'reservada' ? why : `capa ${why} = ${b.get(why, cx, cy)}`}`);
          return false;
        }
      }
    }
  }
  b.stamp(name, x, y);
  return true;
}

/**
 * Varios detalles con safeStamp: [[stamp, x, y], …] → nombres de los que no cupieron. Con
 * `globalThis.__B11_DECOR_DEBUG = true` (herramientas de Node) los lista por consola para recolocarlos.
 */
export function decorate(b, list, opts = {}) {
  const skipped = list.filter(([n, x, y]) => !safeStamp(b, n, x, y, opts)).map(([n, x, y]) => `${n}@${x},${y}`);
  if (skipped.length && globalThis.__B11_DECOR_DEBUG) console.log(`[decorate] no caben: ${skipped.join(' ')}`);
  return skipped;
}

/** Máscara de casillas abiertas a partir de listas de casillas, con margen opcional (Chebyshev). */
export function openMask(cellLists, margin = 0) {
  const set = new Set();
  for (const list of cellLists) {
    for (const [x, y] of list) {
      for (let dy = -margin; dy <= margin; dy++) for (let dx = -margin; dx <= margin; dx++) set.add(`${x + dx},${y + dy}`);
    }
  }
  return (x, y) => set.has(`${x},${y}`);
}

/**
 * Pinta un bosque de linde irregular (ver raggedForestCells). Cada pareja de columnas va en su propio trazo: el
 * brush alinea las parejas desde la x mínima del trazo y así ninguna pareja omitida desplaza a las demás. `brush`
 * puede ser una lista: cada pareja elige el suyo (determinista), para que el bosque no sea una hilera de clones.
 */
export function raggedForest(b, brush, x0, y0, x1, y1, opts = {}) {
  const cells = raggedForestCells(x0, y0, x1, y1, opts);
  const byPair = new Map();
  for (const c of cells) {
    const px = x0 + Math.floor((c[0] - x0) / 2) * 2;
    if (!byPair.has(px)) byPair.set(px, []);
    byPair.get(px).push(c);
  }
  const list = Array.isArray(brush) ? brush : [brush];
  for (const [px, pair] of byPair) b.paint(list[Math.floor(hash(px, y1, (opts.seed ?? 1) + 7) * list.length)], pair);
  return cells;
}
