// IDs de tiles del Pilar de la Corriente (tileset 15 = imagen Cueva1, variante «gris»: suelo gris y paredes azul
// oscuro) y parches de los estanques lleno/vacío. Módulo PURO: lo usan el mapa (construcción del estado inicial),
// los eventos de cada estanque (`patch` de sus páginas) y los tests.
import { PONDS, pondParts, cellSet, cellKey, CORE_BRIDGE } from './pilar_corriente_layout.js';

const T = (col, row) => 384 + row * 8 + col;
const GRIS = 402; // fila base de la variante gris en Cueva1 (content/stamps/Cueva1.js, VARIANTS._gris)

/** Borde de estanque con agua (brush `estanque_gris`): 3×3 [NO, N, NE / O, C, E / SO, S, SE]. */
export const FRAME = Object.freeze([
  [T(0, GRIS + 3), T(1, GRIS + 3), T(7, GRIS + 3)],
  [T(0, GRIS + 4), T(1, GRIS + 4), T(7, GRIS + 4)],
  [T(0, GRIS + 7), T(1, GRIS + 7), T(7, GRIS + 7)],
]);
/** Agua quieta del fondo (centro del estanque). */
export const WATER = FRAME[1][1];
/** Mancha de suelo húmedo (brush `mancha_gris`, nine en la fila GRIS+90). */
const MANCHA = [0, GRIS + 90];
/** Escalera norte-sur de 3 de ancho: remate (fila superior) y peldaños. Pasables. */
export const STAIR_NS = Object.freeze({ cap: [T(0, GRIS + 16), T(1, GRIS + 16), T(2, GRIS + 16)], body: [T(0, GRIS + 17), T(1, GRIS + 17), T(2, GRIS + 17)] });
/** Escalera este-oeste 2×3 (se cruza por la fila central). */
export const STAIR_EW = Object.freeze([
  [T(3, GRIS + 16), T(4, GRIS + 16)],
  [T(3, GRIS + 17), T(4, GRIS + 17)],
  [T(3, GRIS + 18), T(4, GRIS + 18)],
]);
/** Losa flotante: zócalo hexagonal del kit de Pilar (overlay de Cueva1, content/stamps/extraTiles.js). */
export const SLAB = T(5, 624 + 3);
/** La misma losa posada en el fondo cuando el estanque se vacía (zócalo gastado). */
export const SLAB_SUNK = T(6, 624 + 3);
/** Manchas de limo del fondo vacío (calcos pisables de la variante gris). */
export const DEBRIS = Object.freeze([T(3, GRIS), T(4, GRIS)]);

/** Pieza 3×3 según los vecinos dentro de `inside` (mismo criterio que MapBuilder#nineId, sin esquinas cóncavas). */
export function nine3(ids, x, y, inside) {
  const n = inside(x, y - 1); const s = inside(x, y + 1);
  const w = inside(x - 1, y); const e = inside(x + 1, y);
  const row = !n ? 0 : (!s ? 2 : 1);
  const col = !w ? 0 : (!e ? 2 : 1);
  return ids[row][col];
}
const nineFromSrc = ([sx, sy], x, y, inside) => {
  const n = inside(x, y - 1); const s = inside(x, y + 1);
  const w = inside(x - 1, y); const e = inside(x + 1, y);
  return T(sx + (!w ? 0 : (!e ? 2 : 1)), sy + (!n ? 0 : (!s ? 2 : 1)));
};

/** Tiles fijos de las escaleras de un estanque: [[x, y, capa, id]…] (capa 1). */
export function stairTiles(pond) {
  const out = [];
  for (const s of pond.stairs) {
    if (s.dir === 'n' || s.dir === 's') {
      const rows = s.dir === 'n' ? [STAIR_NS.cap, STAIR_NS.body] : [STAIR_NS.body, STAIR_NS.body];
      rows.forEach((row, j) => row.forEach((id, i) => out.push([s.x + i, s.y + j, 1, id])));
    } else {
      STAIR_EW.forEach((row, j) => row.forEach((id, i) => out.push([s.x + i, s.y + j, 1, id])));
    }
  }
  return out;
}

/** Borde de roca (fijo, capa 1). */
export function rimTiles(pond) {
  const { all, rim } = pondParts(pond);
  const inside = ((set) => (x, y) => set.has(cellKey(x, y)))(cellSet(all));
  return rim.map(([x, y]) => [x, y, 1, nine3(FRAME, x, y, inside)]);
}

/**
 * Parche del fondo de un estanque: lleno (agua + losas en la capa 2) o vacío (mancha húmeda + charcos).
 * Escribe TODAS las casillas del fondo en las capas 1 y 2 (así un parche deshace el otro).
 */
export function pondPatch(pond, full) {
  const { floor } = pondParts(pond);
  const floorSet = cellSet(floor);
  const inside = (x, y) => floorSet.has(cellKey(x, y));
  const slabs = cellSet(pond.slabs);
  const debris = new Map(pond.debris.map(([x, y], i) => [cellKey(x, y), DEBRIS[i % DEBRIS.length]]));
  const out = [];
  for (const [x, y] of floor) {
    const k = cellKey(x, y);
    if (full) {
      out.push([x, y, 1, WATER], [x, y, 2, slabs.has(k) ? SLAB : 0]);
    } else {
      out.push([x, y, 1, nineFromSrc(MANCHA, x, y, inside)], [x, y, 2, slabs.has(k) ? SLAB_SUNK : (debris.get(k) || 0)]);
    }
  }
  return out;
}

/** Losas del puente del núcleo (capa 2 sobre el agua del foso) o su ausencia. */
export function bridgePatch(up) {
  return CORE_BRIDGE.map(([x, y]) => [x, y, 2, up ? SLAB : 0]);
}

/** Parches precalculados de los seis estanques: { E1: { full, empty }, … }. */
export const POND_PATCHES = Object.freeze(Object.fromEntries(PONDS.map((p) => [p.id, Object.freeze({
  full: Object.freeze(pondPatch(p, true)), empty: Object.freeze(pondPatch(p, false)),
})])));
