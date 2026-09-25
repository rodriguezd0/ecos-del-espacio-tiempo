// Ayudas de pintado del Bloque 15 (módulo puro): rectángulos inclusivos, uniones, máscaras y detalles que solo
// se colocan sobre suelo despejado (misma idea que content/maps/b11/paint.js, copiada aquí para no depender de la
// carpeta de otro bloque).

/** Rectángulo inclusivo [x0..x1] × [y0..y1] como lista de casillas. */
export const rect = (x0, y0, x1, y1) => {
  const out = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]);
  return out;
};

export const union = (...parts) => parts.flat();

/** Casillas de `cells` ensanchadas `mx` casillas en horizontal y `my` en vertical (sin repetir). */
export function grow(cells, mx, my = mx) {
  const seen = new Map();
  for (const [x, y] of cells) {
    for (let dy = -my; dy <= my; dy++) for (let dx = -mx; dx <= mx; dx++) seen.set(`${x + dx},${y + dy}`, [x + dx, y + dy]);
  }
  return [...seen.values()];
}

/** Quita de `cells` las casillas de `holes`. */
export const minus = (cells, holes) => {
  const h = new Set(holes.map(([x, y]) => `${x},${y}`));
  return cells.filter(([x, y]) => !h.has(`${x},${y}`));
};

/** Pseudoaleatorio determinista por casilla. */
export function hash(x, y, seed = 1) {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Máscara (x, y) → bool a partir de listas de casillas, con margen opcional (Chebyshev). */
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
 * Coloca un stamp solo si ninguna de sus casillas tiene ya algo en las capas 1 y 2 (salvo las capas de `over`) ni
 * está vetada por `avoid(x, y)`. → true si se colocó.
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
        if (avoid && avoid(cx, cy)) return false;
        if ([1, 2].some((L) => !over.includes(L) && b.get(L, cx, cy))) return false;
      }
    }
  }
  b.stamp(name, x, y);
  return true;
}

/** Varios detalles con safeStamp: [[stamp, x, y], …] → los que no cupieron ('nombre@x,y'). */
export function decorate(b, list, opts = {}) {
  return list.filter(([n, x, y]) => !safeStamp(b, n, x, y, opts)).map(([n, x, y]) => `${n}@${x},${y}`);
}

/**
 * Casillas que ningún detalle puede ocupar: las de `cells` y, por cada evento visible o con guion, su casilla, las
 * cuatro vecinas y la línea de visión de los entrenadores. → (x, y) => bool
 */
export function reservedFrom(events, cells = []) {
  const out = [...cells];
  const DV = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };
  for (const e of events) {
    if (!Number.isInteger(e.x) || !Number.isInteger(e.y)) continue;
    for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) out.push([e.x + dx, e.y + dy]);
    if (e.type === 'trainer') {
      const [vx, vy] = DV[e.dir] || [0, 1];
      for (let i = 1; i <= (e.sight || 4); i++) out.push([e.x + vx * i, e.y + vy * i]);
    }
  }
  return openMask([out], 0);
}

/**
 * Esparce detalles sobre el suelo despejado: para cada casilla de `cells` (en orden aleatorio determinista) prueba las
 * piezas de `pieces` ([[stamp, peso]…]) con probabilidad `density`, sin tocar casillas vetadas (`avoid`) y dejando
 * `gap` casillas libres alrededor de lo ya colocado. → número de piezas colocadas.
 */
export function scatterDecor(b, cells, pieces, { avoid = null, density = 0.05, gap = 1, seed = 1 } = {}) {
  const order = [...cells].sort((p, q) => hash(p[0], p[1], seed) - hash(q[0], q[1], seed));
  const total = pieces.reduce((a, [, w]) => a + w, 0);
  const taken = [];
  let n = 0;
  for (const [x, y] of order) {
    if (hash(x, y, seed + 3) >= density) continue;
    let r = hash(y, x, seed + 5) * total;
    const [name] = pieces.find(([, w]) => (r -= w) < 0) || pieces[0];
    const def = b.findStamp(name);
    const grids = def && b.stampGrids(def, name);
    if (!grids) continue;
    const near = taken.some(([tx, ty, tw, th]) => x < tx + tw + gap && tx < x + grids.w + gap && y < ty + th + gap && ty < y + grids.h + gap);
    if (near) continue;
    const blocked = (cx, cy) => avoid && avoid(cx, cy);
    let clash = false;
    for (let j = 0; j < grids.h && !clash; j++) for (let i = 0; i < grids.w && !clash; i++) clash = blocked(x + i, y + j);
    if (clash) continue;
    if (safeStamp(b, name, x, y)) { taken.push([x, y, grids.w, grids.h]); n += 1; }
  }
  if (globalThis.__B15_DEBUG) console.log(`[scatterDecor] ${n} piezas de ${order.length} casillas`);
  return n;
}

/**
 * Cierra los bordes del mapa que no tienen salida: en las casillas de borde (x 0 / ancho − 1, y 0 / alto − 1) sin
 * nada en la capa 2 pone el muro invisible del bosque (tile vacío que bloquea), para que no se camine pegado al borde
 * de la pantalla por los huecos que dejan los árboles. `keep(x, y)` = casillas de paso (conexiones) que se respetan.
 * `sides` = bordes a cerrar ('north', 'south', 'west', 'east').
 */
export function sealEdges(b, { width, height, keep = () => false, sides = ['north', 'south', 'west', 'east'] }) {
  const cells = [];
  if (sides.includes('west')) for (let y = 0; y < height; y++) cells.push([0, y]);
  if (sides.includes('east')) for (let y = 0; y < height; y++) cells.push([width - 1, y]);
  if (sides.includes('north')) for (let x = 0; x < width; x++) cells.push([x, 0]);
  if (sides.includes('south')) for (let x = 0; x < width; x++) cells.push([x, height - 1]);
  for (const [x, y] of cells) {
    if (keep(x, y) || b.get(2, x, y)) continue;
    b.paint('muro_invisible', [[x, y]]);
  }
}

/**
 * Bosque de pinos nevados que rellena todo lo que no está abierto. Por pareja de columnas busca tramos verticales
 * cerrados y los pinta con el brush `forest` recortado a una altura 4k + 2 (árboles completos); un tramo que toca el
 * borde superior se llena entero. Los tramos de 4–5 filas llevan un pino pequeño y los menores, matas nevadas.
 * opts: { width, height, open(x, y), brush = 'bosque_nevado', small = 'pino_nevado_peque', seed, x0, x1, y0, y1 }
 */
export function snowForest(b, opts) {
  const { width, height, open, brush = 'bosque_nevado', small = 'pino_nevado_peque', seed = 1 } = opts;
  const x0 = opts.x0 ?? 0; const y0 = opts.y0 ?? 0;
  const x1 = opts.x1 ?? width - 1; const y1 = opts.y1 ?? height - 1;
  const closed = (x, y) => x >= 0 && x < width && y >= 0 && y < height && !open(x, y);
  for (let px = x0; px + 1 <= x1; px += 2) {
    let y = y0;
    while (y <= y1) {
      if (!(closed(px, y) && closed(px + 1, y))) { y += 1; continue; }
      const a = y;
      while (y + 1 <= y1 && closed(px, y + 1) && closed(px + 1, y + 1)) y += 1;
      const bottom = y;
      y += 1;
      const len = bottom - a + 1;
      // Un tramo que toca el borde superior se llena entero (los árboles siguen más allá del borde), salvo que sea tan
      // corto (< 4 filas) que solo se verían troncos sin copa: entonces, como cualquier tramo corto.
      if ((a === 0 && len >= 4) || len >= 6) {
        const top = a === 0 ? 0 : bottom - (4 * Math.floor((len - 2) / 4) + 2) + 1;
        b.paint(brush, rect(px, top, px + 1, bottom));
        if (top - a >= 2) safeStamp(b, 'monton_nieve', px, top - 2);
      } else if (len >= 4) {
        safeStamp(b, small, px, bottom - 3);
      } else if (len >= 2) {
        // Tramos cortos (entre caras de terraza, claros y bordes): matas, rocas o tocones, no nieve vacía.
        const r = hash(px, a, seed);
        const side = hash(px, a, seed + 1) < 0.5 ? 0 : 1;
        if (r < 0.3) safeStamp(b, 'arbusto_nevado', px - side, bottom);
        else if (r < 0.55) safeStamp(b, 'roca_gris', px, bottom);
        else if (r < 0.8) safeStamp(b, 'tocon_nevado', px + side, bottom);
      }
    }
  }
}
