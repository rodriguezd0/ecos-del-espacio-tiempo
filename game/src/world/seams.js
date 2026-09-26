// Exterior visible de los mapas (módulo puro, sin Three.js). La cámara sigue siempre al jugador centrado (como en
// Pokémon, render/camera.js), así que junto a cualquier borde se ve lo que hay fuera del mapa. Donde hay conexión se
// dibuja el mapa vecino; el resto de casillas que la cámara puede enseñar se rellena con el terreno del borde del mapa
// cargado más cercano (world/borderFill.js: bloques de borde de los juegos oficiales), también junto a vecinos más
// estrechos o desplazados (p. ej. Ruta 3 → Ciudad Caudal). Solo es decorado: el paso sigue bloqueado (World.entryAt no
// lo ve). Los interiores y los mapas que caben en pantalla no se rellenan (negro, como en Pokémon).
import { borderMode, createEdgeFill } from './borderFill.js';

/** Casillas de margen alrededor del mapa: media pantalla (8 × 6) + paso de cruce/temblor. */
export const SEAM_MARGIN_X = 9;
export const SEAM_MARGIN_Y = 7;
/** Periodo de repetición por defecto de borderIndex (compatibilidad). */
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

// Relleno 'edge' por mapa (se calcula una vez por GameMap; un tile del borde cambiado se relee al reconstruir la malla).
const FILLS = new WeakMap();
function edgeFillOf(map) {
  let f = FILLS.get(map);
  if (!f) { f = createEdgeFill(map); FILLS.set(map, f); }
  return f;
}

/** Casilla de relleno de la entrada `e` en (lx, ly) locales, o null si no se dibuja nada. */
function fillCell(e, mode, lx, ly) {
  const ids = mode === 'pattern' ? e.borderPattern?.get(`${lx},${ly}`) : null;
  if (ids) return { x: lx, y: ly, ids };
  if (mode === 'none') return null;
  const { ground, upper } = edgeFillOf(e.map).source(lx, ly);
  if (!ground && !upper) return null;
  return { x: lx, y: ly, ground, upper };
}

/**
 * Plan de relleno: Map id de entrada → [{ x, y, ground, upper } | { x, y, ids }] en casillas LOCALES de esa entrada
 * (ground/upper = casilla [sx, sy] que se copia en la capa 0 / capas 1–2; ids = tiles del patrón propio). `entries[0]`
 * es el mapa actual (World.allEntries). La casilla vacía toma el mapa más cercano; en empate decide el id (no depende
 * de cuál es el actual: al cruzar una conexión no cambia nada).
 */
export function planSeams(entries, opts = {}) {
  const plan = new Map();
  const current = entries[0];
  if (!current) return plan;
  const rects = entries.map((e) => ({ e, r: entryRect(e), mode: borderMode(e.def) }));
  if (rects.every((x) => x.mode === 'none')) return plan;
  const reach = cameraReach(current.map.width, current.map.height, opts);
  for (let y = reach.y0; y < reach.y1; y++) {
    for (let x = reach.x0; x < reach.x1; x++) {
      let best = null;
      let bestD = Infinity;
      for (const it of rects) {
        const ox = outside(x, it.r.x0, it.r.x1);
        const oy = outside(y, it.r.y0, it.r.y1);
        const d = ox * ox + oy * oy;
        if (d === 0) { best = null; bestD = 0; break; }
        if (d < bestD || (d === bestD && it.e.id < best.e.id)) { best = it; bestD = d; }
      }
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
