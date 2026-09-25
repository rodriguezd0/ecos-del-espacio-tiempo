// Pintado de los mapas del Mundo Distorsión (tileset 14, Cueva Morada = imagen Cueva1) con los tiles propios de
// tools/distortion_tiles.mjs (content/stamps/distortion.js): islas flotantes de piedra (capa 0) con reborde, la cara
// de roca que cuelga bajo cada borde sur (capa 2, sobre el vacío: no sostiene), bloques de roca y de «cara vuelta»
// (capa 1), vetas de arista y detalles de suelo. Las casillas sin capa 0 ni 1 son el vacío (world/impossible).
// Módulo puro.
import { DISTORTION_TILES } from '../../stamps/distortion.js';
import { FIRST_REGULAR_TILE } from '../../../shared/autotile.js';
import { cellHash } from '../../../world/mapBuilder.js';

const id = (col, row) => FIRST_REGULAR_TILE + row * 8 + col;
const at = (name) => {
  const p = DISTORTION_TILES[name];
  if (!p) throw new Error(`Tiles del Mundo Distorsión sin "${name}": ejecuta node tools/distortion_tiles.mjs`);
  return p;
};

/** Pinceles del Mundo Distorsión (se pasan por objeto al MapBuilder). */
export function distortionBrushes() {
  const [ic, ir] = at('dist_isla');
  const [rc, rr] = at('dist_roca');
  const [vc, vr] = at('dist_vuelta');
  const [fc, fr] = at('dist_cara');
  const [lc, lr] = at('dist_losas');
  const [ec, er] = at('dist_veta');
  const [dc, dr] = at('dist_detalles');
  return Object.freeze({
    isla: { nine: [ic, ir], inner: [ic + 3, ir], layer: 0 },
    roca: { nine: [rc, rr], inner: [rc + 3, rr], layer: 1 },
    vuelta: { nine: [vc, vr], inner: [vc + 3, vr], layer: 1 },
    cara: { line: { src: [fc, fr, 3, 1], axis: 'h' }, layer: 2 },
    islaCentro: id(ic + 1, ir + 1),
    losas: [0, 1, 2].map((i) => id(lc + i, lr)),
    veta: id(ec, er),
    detalles: [0, 1, 2].map((i) => id(dc + i, dr)),
  });
}

const k = (x, y) => `${x},${y}`;
const toCells = (set) => [...set].map((s) => s.split(',').map(Number));

/**
 * Plataforma flotante. opts: { floor: Set 'x,y', wall: Set, vuelta: Set, veins: Set, reserved: Set, seed,
 * decals = 0.07 }. Suelo = floor ∪ wall ∪ vuelta (los bloques se alzan sobre la isla); caras bajo los bordes sur.
 */
export function paintPlatform(b, { floor = new Set(), wall = new Set(), vuelta = new Set(), veins = new Set(), reserved = new Set(), seed = 7, decals = 0.07 } = {}) {
  const B = distortionBrushes();
  const platform = new Set([...floor, ...wall, ...vuelta]);
  const inPlatform = (x, y) => platform.has(k(x, y));
  b.paint(B.isla, toCells(platform), { layer: 0, mask: inPlatform });
  // variantes del centro de la isla (brillos, glifos, grietas) para romper la repetición
  for (const [x, y] of toCells(floor)) {
    if (b.get(0, x, y) !== B.islaCentro || reserved.has(k(x, y))) continue;
    const h = cellHash(x, y, seed);
    if (h < 0.16) b.set(0, x, y, B.losas[Math.floor(cellHash(y, x, seed + 3) * B.losas.length)]);
  }
  if (wall.size) b.paint(B.roca, toCells(wall), { layer: 1, mask: (x, y) => wall.has(k(x, y)) });
  if (vuelta.size) b.paint(B.vuelta, toCells(vuelta), { layer: 1, mask: (x, y) => vuelta.has(k(x, y)) });
  // cara de roca bajo cada borde sur (sobre el vacío)
  const faces = new Set();
  for (const [x, y] of toCells(platform)) if (!platform.has(k(x, y + 1)) && b.inBounds(x, y + 1)) faces.add(k(x, y + 1));
  if (faces.size) b.paint(B.cara, toCells(faces), { layer: 2, mask: (x, y) => faces.has(k(x, y)) });
  for (const [x, y] of toCells(veins)) b.set(1, x, y, B.veta);
  if (decals > 0) {
    for (const [x, y] of toCells(floor)) {
      if (reserved.has(k(x, y)) || veins.has(k(x, y)) || b.get(1, x, y)) continue;
      if (cellHash(x, y, seed + 11) < decals) b.set(1, x, y, B.detalles[Math.floor(cellHash(x + 3, y, seed) * B.detalles.length)]);
    }
  }
  return { platform, faces };
}

/** Conjunto 'x,y' de una lista de casillas [[x, y]…]. */
export const cellSet = (cells) => new Set(cells.map(([x, y]) => k(x, y)));

/** Conjunto 'x,y' de varios rectángulos { x0, y0, x1, y1 } (bordes incluidos). */
export function rectSet(...rects) {
  const out = new Set();
  for (const r of rects) for (let y = r.y0; y <= r.y1; y++) for (let x = r.x0; x <= r.x1; x++) out.add(k(x, y));
  return out;
}

/**
 * Isla de contorno irregular a partir de un rectángulo: esquinas recortadas en escalera (0–2 casillas) y algún
 * mordisco en los bordes, deterministas por semilla. Nunca quita casillas de `keep` ni sus vecinas (accesos, eventos,
 * uniones con pasos y puentes). Las islas de menos de 5×5 se dejan rectas.
 */
export function raggedIsland(r, { keep = new Set(), seed = 1, bites = 0.12 } = {}) {
  const set = rectSet(r);
  const w = r.x1 - r.x0 + 1;
  const h = r.y1 - r.y0 + 1;
  if (w < 5 || h < 5) return set;
  const protectedCell = (x, y) => [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => keep.has(k(x + dx, y + dy)));
  const cut = (x, y) => { if (!protectedCell(x, y)) set.delete(k(x, y)); };
  [[r.x0, r.y0, 1, 1], [r.x1, r.y0, -1, 1], [r.x0, r.y1, 1, -1], [r.x1, r.y1, -1, -1]].forEach(([cx, cy, sx, sy], i) => {
    const size = Math.floor(cellHash(cx, cy, seed + i) * 3);
    for (let j = 0; j < size; j++) for (let q = 0; q < size - j; q++) cut(cx + q * sx, cy + j * sy);
  });
  for (let x = r.x0 + 2; x <= r.x1 - 2; x++) {
    if (cellHash(x, r.y0, seed + 5) < bites) cut(x, r.y0);
    if (cellHash(x, r.y1, seed + 6) < bites) cut(x, r.y1);
  }
  for (let y = r.y0 + 2; y <= r.y1 - 2; y++) {
    if (cellHash(r.x0, y, seed + 7) < bites) cut(r.x0, y);
    if (cellHash(r.x1, y, seed + 8) < bites) cut(r.x1, y);
  }
  return set;
}

/** Unión de conjuntos 'x,y'. */
export const union = (...sets) => new Set(sets.flatMap((s) => [...s]));

/** Peñas de 2×2 (esquina superior izquierda) → conjunto de casillas. */
export function rockSet(spots, size = 2) {
  const out = new Set();
  for (const [x, y] of spots) for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) out.add(k(x + i, y + j));
  return out;
}

/**
 * Peñascos flotantes decorativos (solo capa 2: siguen siendo vacío, no sostienen). spots: [[x, y, w = 2]…], lejos
 * de cualquier casilla transitable. Cada uno: una fila de piedra de isla y su cara debajo.
 */
export function floatingDebris(b, spots) {
  const B = distortionBrushes();
  for (const [x, y, w = 2] of spots) {
    const top = [];
    for (let i = 0; i < w; i++) top.push([x + i, y]);
    const set = cellSet(top);
    b.paint({ ...B.isla, layer: 2 }, top, { layer: 2, mask: (cx, cy) => set.has(k(cx, cy)) });
    const under = top.map(([cx, cy]) => [cx, cy + 1]);
    const uset = cellSet(under);
    b.paint(B.cara, under, { layer: 2, mask: (cx, cy) => uset.has(k(cx, cy)) });
  }
}

/** Entorno común de los mapas del Mundo Distorsión (tileset, tono, fondo, niebla, música por la zona). */
export const DISTORTION_ENV = Object.freeze({
  tileset: 14,
  outdoor: false,
  cave: true,
  noFollower: true,
  mount: false,
  escapeRope: true,
  panorama: Object.freeze({ shader: 'distorsion', parallax: 0.35 }),
  fog: Object.freeze({ name: 'portal', opacity: 18, blend: 'add', sx: 5, sy: -3, zoom: 3 }),
});

/** Tinte violeta del P6 (kit de Pilar), algo rebajado: el fondo y la niebla ya aportan violeta. */
export const DISTORTION_TONE = Object.freeze([10, -16, 20, 70]);
