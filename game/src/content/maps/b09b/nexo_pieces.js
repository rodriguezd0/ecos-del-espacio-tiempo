// Piezas de ciudad portuaria del tileset 1 (Exterior1) que la biblioteca de stamps aún no tiene con nombre, para
// Ciudad Nexo y Caleta Sonda: suelo de ladrillo, adoquinado de plaza, piedra de muelle, muro del muelle con espuma,
// barandillas, norays, palmeras en jardinera y rosetón de plaza. Son tiles del atlas de Exterior1 (coordenadas de la
// imagen original: ID = 384 + fila·8 + columna), las mismas piezas que usa el puerto de Añil. Módulo puro: se pasan en
// `brushes` / `stamps` de la definición del mapa.
const T = (x, y) => 384 + y * 8 + x;

/** Rejilla de un stamp `tiles` en la capa `layer` a partir de un rectángulo del atlas. */
function block(sx, sy, w, h, layer = 2) {
  const grid = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) grid.push(T(sx + i, sy + j));
  const layers = [null, null, null];
  layers[layer] = grid;
  return { w, h, layers };
}

export const PORT_BRUSHES = Object.freeze({
  /** Suelo de ladrillo anaranjado de la ciudad (mosaico 3×2). */
  nexo_ladrillo: { pattern: [2, 399, 3, 2], layer: 0 },
  /** Adoquinado a cuadros de plaza con bordillo (usar en rectángulos). */
  nexo_plaza: { nine: [0, 401], layer: 1 },
  /** Piedra gris de muelle con bordillo (sobre `agua` o sobre suelo; usar en rectángulos). */
  nexo_muelle: { nine: [0, 396], layer: 1 },
  /** Pantalán de tablones de 3 de ancho (mosaico vertical; usar con x múltiplo de 3 a la izquierda). */
  nexo_pantalan: { pattern: [0, 523, 3, 4], layer: 1 },
  /** Barandilla metálica horizontal (bloquea). */
  nexo_baranda: { line: { ids: [T(4, 410), T(5, 410), T(6, 410)] }, layer: 2 },
  /** Barandilla metálica vertical (bloquea). */
  nexo_baranda_v: { line: { ids: [T(7, 408), T(7, 409), T(7, 410)], axis: 'v' }, layer: 2 },
});

export const PORT_STAMPS = Object.freeze({
  /** Noray de piedra (bloquea). */
  nexo_noray: { tiles: block(3, 410, 1, 1), solid: true, desc: 'Noray de piedra del muelle' },
  /** Palmera en jardinera de piedra (2×4; la base bloquea). */
  nexo_palmera: { tiles: block(0, 439, 2, 4), solid: true, desc: 'Palmera en jardinera' },
  /** Rosetón de piedra de la plaza (4×4, pisable). */
  nexo_roseton: { tiles: block(4, 395, 4, 4, 1), desc: 'Rosetón de piedra de la plaza' },
});

/** Tiles del muro del muelle: fila superior (piedra oscura) y cara con espuma sobre el agua (bloquean). */
export const QUAY_WALL = Object.freeze({
  top: [T(0, 409), T(1, 409), T(2, 409)],
  face: [T(0, 410), T(1, 410), T(2, 410)],
});

/**
 * Pinta un pincel complejo (p. ej. `playa`, de borde doble) con una máscara propia para calcular los bordes: el
 * MapBuilder no pasa `mask` a los pinceles delegados en content/stamps/brushes.js, que sí admite `inMask`.
 */
export function paintWithMask(b, brushName, cells, inMask) {
  const brush = b.findBrush(brushName);
  if (!brush || !b.painter || !cells.length) { b.paint(brushName, cells); return; }
  const writes = b.painter(brush, cells, { seed: b.seed, width: b.width, height: b.height, inMask });
  for (const w of writes) b.set(brush.layer ?? w.layer, w.x, w.y, w.id);
}

/**
 * Pinta el muro del muelle bajo un tramo horizontal de muelle: para cada x de [x0, x1], dos filas (y, y+1) en la capa
 * 1 sobre el agua (extremo izquierdo, centro y extremo derecho).
 */
export function paintQuayWall(b, x0, x1, y) {
  for (let x = x0; x <= x1; x++) {
    const i = x === x0 ? 0 : x === x1 ? 2 : 1;
    b.set(1, x, y, QUAY_WALL.top[i]);
    b.set(1, x, y + 1, QUAY_WALL.face[i]);
  }
}
