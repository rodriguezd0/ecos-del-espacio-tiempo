// Relleno de costuras entre mapas conectados (módulo puro, sin Three.js). La cámara no se limita por los lados
// con conexión, así que junto a un vecino más estrecho o desplazado (offset) quedaban a la vista casillas que no
// pertenecen a ningún mapa: franjas negras (p. ej. Ruta 3 → Ciudad Caudal). Como los bloques de borde de los
// juegos de GBA/DS, cada casilla vacía que la cámara puede enseñar se rellena repitiendo el borde del mapa cargado
// más cercano (periodo de 2 casillas: filas de árboles, acantilados y agua siguen enteras). Solo es decorado: el
// paso sigue bloqueado (World.entryAt no las ve) y los mapas sin conexiones no se rellenan (interiores con negro).
import { SCREEN_W, SCREEN_H } from '../core/screen.js';

const TILE = 32;
/** Casillas de margen más allá de un lado abierto: media pantalla (7,5 × 5,5) + paso de cruce + temblor. */
export const SEAM_MARGIN_X = 9;
export const SEAM_MARGIN_Y = 7;
/** Periodo de repetición del borde (casillas). */
export const SEAM_PERIOD = 2;

/** Lados con conexión de una definición de mapa (la cámara no se limita por ellos). */
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
 * Casillas que la cámara puede mostrar estando el jugador en el mapa actual (mismas reglas que render/camera.js):
 * un eje más corto que la pantalla queda centrado; si no, se limita por los lados cerrados y se abre `margin`
 * casillas por los lados con conexión.
 */
export function cameraReach(def, width, height, { marginX = SEAM_MARGIN_X, marginY = SEAM_MARGIN_Y } = {}) {
  const open = openSides(def);
  const axis = (size, screen, lo, hi, margin) => {
    if (size * TILE <= screen) {
      const start = (size * TILE - screen) / 2;
      return [Math.floor(start / TILE) - 1, Math.ceil((start + screen) / TILE) + 1];
    }
    return [lo ? -margin : 0, hi ? size + margin : size];
  };
  const [x0, x1] = axis(width, SCREEN_W, open.west, open.east, marginX);
  const [y0, y1] = axis(height, SCREEN_H, open.north, open.south, marginY);
  return { x0, y0, x1, y1 };
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
 * Plan de relleno: Map id de entrada → [{ x, y, sx, sy }] en casillas LOCALES de esa entrada (x, y fuera del mapa;
 * sx, sy = casilla del borde que se copia). `entries[0]` es el mapa actual (World.allEntries). La casilla vacía
 * toma el mapa más cercano; en empate decide el id (no depende de cuál es el actual: al cruzar no cambia nada).
 */
export function planSeams(entries, opts = {}) {
  const plan = new Map();
  const current = entries[0];
  if (!current || !(current.def?.connections || []).length) return plan;
  const period = opts.period ?? SEAM_PERIOD;
  const rects = entries.map((e) => ({ e, r: entryRect(e) }));
  const reach = cameraReach(current.def, current.map.width, current.map.height, opts);
  for (let y = reach.y0; y < reach.y1; y++) {
    for (let x = reach.x0; x < reach.x1; x++) {
      let best = null;
      let bestD = Infinity;
      for (const { e, r } of rects) {
        const ox = outside(x, r.x0, r.x1);
        const oy = outside(y, r.y0, r.y1);
        const d = ox * ox + oy * oy;
        if (d === 0) { best = null; bestD = 0; break; }
        if (d < bestD || (d === bestD && e.id < best.id)) { best = e; bestD = d; }
      }
      if (!best) continue;
      const lx = x - best.offset.x;
      const ly = y - best.offset.y;
      const cell = { x: lx, y: ly, sx: borderIndex(lx, best.map.width, period), sy: borderIndex(ly, best.map.height, period) };
      if (!plan.has(best.id)) plan.set(best.id, []);
      plan.get(best.id).push(cell);
    }
  }
  return plan;
}

/** Clave que cambia cuando hay que rehacer el plan (mapa actual, vecinos o desplazamientos). */
export function seamKey(entries) {
  return entries.map((e) => `${e.id}@${e.offset.x},${e.offset.y}`).join('|');
}
