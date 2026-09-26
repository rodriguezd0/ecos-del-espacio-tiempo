// Exterior visible de los mapas (módulo puro, sin Three.js). La cámara sigue siempre al jugador centrado (como en
// Pokémon, render/camera.js), así que junto a cualquier borde se ve lo que hay fuera del mapa. Donde hay conexión se
// dibuja el mapa vecino; el resto de casillas que la cámara puede enseñar se rellena con el terreno del borde de un
// mapa cargado (world/borderFill.js: bloques de borde de los juegos oficiales), también junto a vecinos más estrechos
// o desplazados (p. ej. Ruta 3 → Ciudad Caudal). Solo es decorado: el paso sigue bloqueado (World.entryAt no lo ve).
// Los interiores y los mapas que caben en pantalla no se rellenan (negro, como en Pokémon).
import { borderMode, createEdgeFill, CAVE_TILESETS } from './borderFill.js';

/**
 * Casillas de margen alrededor del mapa actual: media pantalla (8 × 6 casillas desde el centro de la del jugador),
 * el paso de cruce de una conexión (el jugador aún se dibuja una casilla fuera) y el temblor de pantalla.
 */
export const SEAM_MARGIN_X = 10;
export const SEAM_MARGIN_Y = 8;
/** Periodo de repetición por defecto de borderIndex. */
export const SEAM_PERIOD = 2;

/** Lados con conexión de una definición de mapa. */
export function openSides(def) {
  const open = {};
  for (const c of def?.connections || []) open[c.dir] = true;
  return open;
}

/** Rectángulo [x0, x1) × [y0, y1) de una entrada en casillas del mapa actual. */
export function entryRect(e) {
  return { x0: e.offset.x, y0: e.offset.y, x1: e.offset.x + e.map.width, y1: e.offset.y + e.map.height };
}

/**
 * Casillas que la cámara puede mostrar estando el jugador (o un paneo de guion) en cualquier casilla del mapa actual:
 * la cámara va centrada, así que es el mapa más `margin` casillas por cada lado.
 */
export function cameraReach(width, height, { marginX = SEAM_MARGIN_X, marginY = SEAM_MARGIN_Y } = {}) {
  return { x0: -marginX, y0: -marginY, x1: width + marginX, y1: height + marginY };
}

/** Índice de origen de una casilla fuera de [0, n): repite las `period` primeras/últimas (dentro, la misma). */
export function borderIndex(v, n, period = SEAM_PERIOD) {
  const p = Math.max(1, Math.min(period, n));
  if (v < 0) return ((v % p) + p) % p;
  if (v >= n) return n - p + ((v - n) % p);
  return v;
}

const outside = (v, lo, hi) => (v < lo ? lo - v : v >= hi ? v - hi + 1 : 0);

/**
 * Posición de la casilla (x, y) respecto a un rectángulo: null si es suya; 'v' si está encima/debajo (prolonga una
 * columna), 'h' si está a un lado (prolonga una fila), 'c' en diagonal (esquina); d = distancia.
 */
export function sideOf(r, x, y) {
  const ox = outside(x, r.x0, r.x1);
  const oy = outside(y, r.y0, r.y1);
  if (!ox && !oy) return null;
  if (!ox) return { kind: 'v', d: oy };
  if (!oy) return { kind: 'h', d: ox };
  return { kind: 'c', d: ox * ox + oy * oy };
}

/**
 * Hueco entre un mapa A (la casilla está encima/debajo de él) y un mapa B (la casilla está a su lado): lo rellena
 * entero el que lo cubre con menos profundidad (filas que A prolonga en vertical frente a columnas que B prolonga en
 * horizontal; empate: A). Así el hueco es de un solo mapa y la frontera sigue el borde recto de un mapa (donde sus
 * árboles ya están enteros), no una diagonal que parte árboles, y no se estira un bosque decenas de casillas.
 */
export function verticalWins(a, b, x, y) {
  const depthV = y >= a.y1 ? b.y1 - Math.max(a.y1, b.y0) : Math.min(a.y0, b.y1) - b.y0;
  const depthH = x >= b.x1 ? a.x1 - Math.max(b.x1, a.x0) : Math.min(b.x0, a.x1) - a.x0;
  return depthV <= depthH;
}

// Relleno 'edge' por mapa (se calcula una vez por GameMap; un tile del borde cambiado se relee al reconstruir la malla).
const FILLS = new WeakMap();
function edgeFillOf(e) {
  let f = FILLS.get(e.map);
  if (!f) { f = createEdgeFill(e.map, { cave: CAVE_TILESETS.has(e.def?.tileset) }); FILLS.set(e.map, f); }
  return f;
}

/** Casilla de relleno de la entrada `e` en (lx, ly) locales, o null si no se dibuja nada. */
function fillCell(e, mode, lx, ly) {
  if (mode === 'none') return null;
  if (mode === 'pattern') {
    const ids = e.borderPattern?.get(`${lx},${ly}`);
    return ids ? { x: lx, y: ly, ids } : null;
  }
  const { ground, upper } = edgeFillOf(e).source(lx, ly);
  if (!ground && !upper) return null;
  return { x: lx, y: ly, ground, upper };
}

/**
 * Entrada que rellena la casilla (x, y) (null si la casilla es de algún mapa). Se prefiere un mapa del que la casilla
 * prolonga una columna o fila (el más cercano de cada tipo; entre ambos, verticalWins) a uno en diagonal (el más
 * cercano). Empates: el id. Solo depende de los rectángulos relativos, no de cuál es el mapa actual: al cruzar una
 * conexión el relleno visible no cambia. Un vecino sin relleno ('none', p. ej. con panorama) no reclama casillas: las
 * rellenan los demás, que no quede un agujero negro junto a él.
 */
function ownerOf(items, x, y) {
  const best = { v: null, h: null, c: null };
  for (const it of items) {
    const s = sideOf(it.r, x, y);
    if (!s) return null;
    if (it.mode === 'none') continue;
    const cur = best[s.kind];
    if (!cur || s.d < cur.d || (s.d === cur.d && it.e.id < cur.it.e.id)) best[s.kind] = { it, d: s.d };
  }
  const { v, h, c } = best;
  if (v && h) return verticalWins(v.it.r, h.it.r, x, y) ? v.it : h.it;
  return (v || h || c)?.it || null;
}

/**
 * Plan de relleno: Map id de entrada → [{ x, y, ground, upper } | { x, y, ids }] en casillas LOCALES de esa entrada
 * (ground/upper = casilla [sx, sy] que se copia en la capa 0 / capas 1–2; ids = tiles del patrón propio). `entries[0]`
 * es el mapa actual (World.allEntries). Si el mapa actual no se rellena ('none': interior, panorama…), fuera de él y
 * de sus vecinos se ve negro o su panorama.
 */
export function planSeams(entries, opts = {}) {
  const plan = new Map();
  const current = entries[0];
  if (!current || borderMode(current.def) === 'none') return plan;
  const items = entries.map((e) => ({ e, r: entryRect(e), mode: borderMode(e.def) }));
  const reach = cameraReach(current.map.width, current.map.height, opts);
  for (let y = reach.y0; y < reach.y1; y++) {
    for (let x = reach.x0; x < reach.x1; x++) {
      const best = ownerOf(items, x, y);
      if (!best) continue;
      const cell = fillCell(best.e, best.mode, x - best.e.offset.x, y - best.e.offset.y);
      if (!cell) continue;
      if (!plan.has(best.e.id)) plan.set(best.e.id, []);
      plan.get(best.e.id).push(cell);
    }
  }
  return plan;
}

/** Tile de la capa `layer` de una casilla del plan (render/tilemapView.js#setSeamFill, herramientas de vista previa). */
export function seamTileId(map, c, layer) {
  if (c.ids) return c.ids[layer] || 0;
  const src = c.ground !== undefined ? (layer === 0 ? c.ground : c.upper) : [c.sx, c.sy];
  return src ? map.data(src[0], src[1], layer) : 0;
}

/** Clave que cambia cuando hay que rehacer el plan (mapa actual, vecinos o desplazamientos). */
export function seamKey(entries) {
  return entries.map((e) => `${e.id}@${e.offset.x},${e.offset.y}`).join('|');
}
