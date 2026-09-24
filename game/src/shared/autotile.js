// Tablas de autotiles de RPG Maker XP (portadas de Essentials 016_Map renderer/005_TileDrawingHelper.rb).
// Módulo puro: se usa en el navegador (render) y en Node (herramientas de mapas).
//
// IDs de tile RMXP:
//   0            vacío
//   48..383      autotiles: slot = floor(id/48) - 1 (0..6), patrón = id % 48
//   384+         tiles normales del tileset: índice = id - 384 (8 columnas en la imagen original)

export const TILE = 32;
export const FIRST_REGULAR_TILE = 384;

export const AUTOTILE_PATTERNS = [
  [[27, 28, 33, 34], [5, 28, 33, 34], [27, 6, 33, 34], [5, 6, 33, 34],
    [27, 28, 33, 12], [5, 28, 33, 12], [27, 6, 33, 12], [5, 6, 33, 12]],
  [[27, 28, 11, 34], [5, 28, 11, 34], [27, 6, 11, 34], [5, 6, 11, 34],
    [27, 28, 11, 12], [5, 28, 11, 12], [27, 6, 11, 12], [5, 6, 11, 12]],
  [[25, 26, 31, 32], [25, 6, 31, 32], [25, 26, 31, 12], [25, 6, 31, 12],
    [15, 16, 21, 22], [15, 16, 21, 12], [15, 16, 11, 22], [15, 16, 11, 12]],
  [[29, 30, 35, 36], [29, 30, 11, 36], [5, 30, 35, 36], [5, 30, 11, 36],
    [39, 40, 45, 46], [5, 40, 45, 46], [39, 6, 45, 46], [5, 6, 45, 46]],
  [[25, 30, 31, 36], [15, 16, 45, 46], [13, 14, 19, 20], [13, 14, 19, 12],
    [17, 18, 23, 24], [17, 18, 11, 24], [41, 42, 47, 48], [5, 42, 47, 48]],
  [[37, 38, 43, 44], [37, 6, 43, 44], [13, 18, 19, 24], [13, 14, 43, 44],
    [37, 42, 43, 48], [17, 18, 47, 48], [13, 18, 43, 48], [1, 2, 7, 8]],
];

// Máscara de vecinos (N=1, NE=2, E=4, SE=8, S=16, SW=32, W=64, NW=128) → patrón 0..47
export const NEIGHBORS_TO_AUTOTILE_INDEX = [
  46, 44, 46, 44, 43, 41, 43, 40, 46, 44, 46, 44, 43, 41, 43, 40,
  42, 32, 42, 32, 35, 19, 35, 18, 42, 32, 42, 32, 34, 17, 34, 16,
  46, 44, 46, 44, 43, 41, 43, 40, 46, 44, 46, 44, 43, 41, 43, 40,
  42, 32, 42, 32, 35, 19, 35, 18, 42, 32, 42, 32, 34, 17, 34, 16,
  45, 39, 45, 39, 33, 31, 33, 29, 45, 39, 45, 39, 33, 31, 33, 29,
  37, 27, 37, 27, 23, 15, 23, 13, 37, 27, 37, 27, 22, 11, 22, 9,
  45, 39, 45, 39, 33, 31, 33, 29, 45, 39, 45, 39, 33, 31, 33, 29,
  36, 26, 36, 26, 21, 7, 21, 5, 36, 26, 36, 26, 20, 3, 20, 1,
  46, 44, 46, 44, 43, 41, 43, 40, 46, 44, 46, 44, 43, 41, 43, 40,
  42, 32, 42, 32, 35, 19, 35, 18, 42, 32, 42, 32, 34, 17, 34, 16,
  46, 44, 46, 44, 43, 41, 43, 40, 46, 44, 46, 44, 43, 41, 43, 40,
  42, 32, 42, 32, 35, 19, 35, 18, 42, 32, 42, 32, 34, 17, 34, 16,
  45, 38, 45, 38, 33, 30, 33, 28, 45, 38, 45, 38, 33, 30, 33, 28,
  37, 25, 37, 25, 23, 14, 23, 12, 37, 25, 37, 25, 22, 10, 22, 8,
  45, 38, 45, 38, 33, 30, 33, 28, 45, 38, 45, 38, 33, 30, 33, 28,
  36, 24, 36, 24, 21, 6, 21, 4, 36, 24, 36, 24, 20, 2, 20, 0,
];

export const isAutotile = (id) => id >= 48 && id < FIRST_REGULAR_TILE;
export const autotileSlot = (id) => Math.floor(id / 48) - 1;

/**
 * Rectángulos fuente (16×16) de los 4 cuartos de un autotile, en orden TL, TR, BL, BR.
 * `frame` selecciona el fotograma de animación (autotiles animados son tiras de 96px por frame).
 * Para autotiles de 32px de alto (tiles simples animados) devuelve un único rect 32×32.
 */
export function autotileSourceRects(id, frame, autotileHeight) {
  if (autotileHeight === 32) return [{ x: frame * 32, y: 0, w: 32, h: 32 }];
  const pattern = id % 48;
  const tiles = AUTOTILE_PATTERNS[pattern >> 3][pattern & 7];
  const anim = frame * 96;
  return tiles.map((t) => {
    const p = t - 1;
    return { x: (p % 6) * 16 + anim, y: Math.floor(p / 6) * 16, w: 16, h: 16 };
  });
}

/** Número de fotogramas de un autotile según el ancho de su imagen. */
export function autotileFrameCount(width, height) {
  return height === 32 ? Math.max(1, Math.floor(width / 32)) : Math.max(1, Math.floor(width / 96));
}

/**
 * Calcula el ID de autotile correcto para la celda (x,y) de una capa según sus vecinos
 * del mismo slot (bordes del mapa cuentan como iguales, como en RMXP).
 * `getSlot(x, y)` devuelve el slot de autotile (0..6) o -1.
 */
export function resolveAutotileId(getSlot, x, y, width, height) {
  const slot = getSlot(x, y);
  if (slot < 0) return 0;
  const cx = (v) => Math.min(Math.max(v, 0), width - 1);
  const cy = (v) => Math.min(Math.max(v, 0), height - 1);
  const same = (dx, dy) => getSlot(cx(x + dx), cy(y + dy)) === slot;
  let mask = 0;
  if (same(0, -1)) mask |= 0x01;
  if (same(1, -1)) mask |= 0x02;
  if (same(1, 0)) mask |= 0x04;
  if (same(1, 1)) mask |= 0x08;
  if (same(0, 1)) mask |= 0x10;
  if (same(-1, 1)) mask |= 0x20;
  if (same(-1, 0)) mask |= 0x40;
  if (same(-1, -1)) mask |= 0x80;
  return 48 * (slot + 1) + NEIGHBORS_TO_AUTOTILE_INDEX[mask];
}

/** Posición de un tile normal en el atlas reempaquetado (ATLAS_COLUMNS por fila). */
export const ATLAS_COLUMNS = 64;
export function regularTileAtlasPos(id) {
  const t = id - FIRST_REGULAR_TILE;
  return { x: (t % ATLAS_COLUMNS) * TILE, y: Math.floor(t / ATLAS_COLUMNS) * TILE };
}
/** Posición del tile en la imagen original de 8 columnas (útil para herramientas). */
export function regularTileSourcePos(id) {
  const t = id - FIRST_REGULAR_TILE;
  return { x: (t % 8) * TILE, y: Math.floor(t / 8) * TILE };
}
