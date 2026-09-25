// Tiles del Bloque 19 en Exterior1 (tileset 1) y Cueva1 (tileset 2). IDs RMXP = 384 + fila·8 + columna de la imagen
// original. Módulo PURO: lo usan la construcción de los mapas, los parches de la Reconstrucción y las pruebas.
import { extraDefs } from '../../stamps/extraTiles.js';

export const tid = (col, row) => 384 + row * 8 + col;

// ─── Exterior1 ──────────────────────────────────────────────────────────────────────────────────
/** Tile vacío que bloquea (prioridad 0): el abismo, sin dibujo, deja ver el panorama (brushes.js FOREST_BLOCKER_TILE). */
export const VOID_BLOCK = 503;
/** Tile transparente, pasable y de prioridad 0 de Exterior1: «suelo invisible» bajo una losa forzada que flota. */
export const PASS_TILE = 391;
/** Negro del boquete de Exterior1 (bocas del taller y de la Bajada). */
export const DARK = [tid(1, 198), tid(1, 199)];

/**
 * Estrado de losas con bordillo (Exterior1, filas 670–675, columnas 0–5): la Calzada del Rey. En un tramo de 3 de
 * ancho: borde izquierdo (col 1), ladrillo (cols 2–3) y borde derecho (col 4); en horizontal: filas 671/672/674.
 * Todo el estrado se pisa (pasabilidad 0).
 */
const E = (c, r) => tid(c, 670 + r);
export const CALZADA = Object.freeze({
  v: (x, y, part) => (part === 0 ? E(1, 1 + (y % 3)) : part === 2 ? E(4, 1 + (y % 3)) : E(2 + (x % 2), 1 + (y % 3))),
  h: (x, y, part) => (part === 0 ? E(2 + (x % 2), 1) : part === 2 ? E(2 + (x % 2), 4) : E(2 + (x % 2), 2 + (x % 2))),
  body: (x, y) => E(2 + (x % 2), 1 + (y % 3)),
  front: (x) => E(2 + (x % 2), 5),
});

/**
 * Tile de calzada en (x, y) según sus vecinas (`isRoad(x, y)` → ¿sigue la calzada?): bordillo donde no sigue
 * (izquierda, derecha, arriba, abajo y esquinas) y ladrillo dentro. Para recodos y cruces de cualquier forma sin
 * costuras (un rectángulo de ladrillo liso en un cruce cortaba el bordillo de los tramos que no siguen).
 */
export function roadTileAt(x, y, isRoad) {
  const col = !isRoad(x - 1, y) ? 1 : !isRoad(x + 1, y) ? 4 : 2 + (x % 2);
  const row = !isRoad(x, y - 1) ? 1 : !isRoad(x, y + 1) ? 4 : 2 + (y % 2);
  return E(col, row);
}

/**
 * Plaza de estrado de cualquier tamaño (6×6 de Añil: anillo exterior —fila 670 borde norte, 675 cara sur, col 0/5
 * caras laterales—, anillo interior de bordillo —fila 671/674, col 1/4— y ladrillo —filas 672–673, cols 2–3—).
 * Devuelve el tile de (x, y) dentro del rectángulo inclusivo r (ancho y alto ≥ 4).
 */
export function estradoTile(r, x, y) {
  const col = x === r.x0 ? 0 : x === r.x1 ? 5 : x === r.x0 + 1 ? 1 : x === r.x1 - 1 ? 4 : 2 + (x % 2);
  const row = y === r.y0 ? 0 : y === r.y1 ? 5 : y === r.y0 + 1 ? 1 : y === r.y1 - 1 ? 4 : 2 + (y % 2);
  return E(col, row);
}

/** Escalera de piedra con barandilla (escalera_terraza, 3×3 sobre una cara): filas 56–58, columnas 5–7. Solo se pisa
 *  la columna central. */
export const STAIRS = Object.freeze([
  [tid(5, 56), tid(6, 56), tid(7, 56)],
  [tid(5, 57), tid(6, 57), tid(7, 57)],
  [tid(5, 58), tid(6, 58), tid(7, 58)],
]);

const KIT1 = extraDefs('Exterior1').stamps;
const tileOf = (lib, name) => lib[name]?.tiles?.layers?.[2]?.[0] || 0;
/** Zócalos hexagonales (kit exterior de Pilar, overlay): piedra, gastado (borde de un vacío), vivo (verde). */
export const ZOCALO = Object.freeze({
  plain: tileOf(KIT1, 'pilar_zocalo'),
  worn: tileOf(KIT1, 'pilar_zocalo_gastado'),
  live: tileOf(KIT1, 'pilar_zocalo_vivo'),
});

// ─── Cueva1 (tileset 2) ─────────────────────────────────────────────────────────────────────────
const KIT2 = extraDefs('Cueva1').stamps;
export const ZOCALO_CUEVA = Object.freeze({
  plain: tileOf(KIT2, 'pilar_zocalo'),
  worn: tileOf(KIT2, 'pilar_zocalo_gastado'),
  live: tileOf(KIT2, 'pilar_zocalo_vivo'),
});
/** Negro de roca maciza de Cueva1 (bloquea). */
export const CAVE_BLACK = 403;
