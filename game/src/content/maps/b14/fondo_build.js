// Fondo del Mar del Sur (docs/CAMPANA.md §1.4: «capa submarina de los tres sectores; Fosa Abisal al este · Buceo»;
// §2.3 C077–C081): 180×50 en tileset 15, con las mismas coordenadas que la superficie `mar_del_sur` (B13).
//   oeste (x 0–59): escollos, la raíz de roca del Islote Lumbre (al sur, x 21–41) y el paso al Arrecife del Eco
//     (borde oeste, filas 20–26)
//   centro (x 60–119): praderas de algas y claros de arena
//   este (x 120–179): bases de basalto de las islas y, desde x 171, el borde de la Fosa Abisal (no se pisa)
// Módulo PURO: las rocas y las algas salen de listas fijas y de una rejilla con semilla (siempre el mismo mapa).
import { FONDO } from './layout.js';
import { rect, placeFree, cellSet, key } from './paint.js';
import { cellHash } from '../../../world/mapBuilder.js';

const F = FONDO;
const GRIS = 402;
const isMacizo = (b, x, y) => { const id = b.get(1, x, y); return id >= 384 + (GRIS + 26) * 8 && id < 384 + (GRIS + 31) * 8; };

/** Macizos de roca (uniones de rectángulos inclusivos) por sector: formaciones irregulares, no bloques sueltos. */
export const FONDO_ROCKS = Object.freeze([
  // borde oeste (solo se abre en las filas 20–26 hacia el arrecife)
  [0, 5, 3, 19], [0, 27, 3, 47], [4, 5, 7, 8], [4, 42, 9, 47],
  // oeste: escollos de la barrera del arrecife (gran macizo escalonado) y rocas sueltas
  [24, 13, 33, 18], [21, 16, 27, 21], [29, 17, 38, 22], [33, 21, 39, 26], [26, 5, 31, 8],
  [9, 8, 14, 11], [11, 10, 16, 13], [12, 37, 20, 41], [16, 35, 21, 38], [42, 6, 49, 9], [45, 8, 50, 12],
  [48, 39, 57, 44], [52, 36, 56, 40],
  // oeste, al pie del borde sur: la raíz de roca del Islote Lumbre (x 20–43 en la superficie), con una cala en medio
  [21, 44, 30, 47], [24, 41, 30, 43], [34, 43, 41, 47], [36, 41, 40, 42],
  // centro: dorsales de roca entre las praderas
  [62, 5, 70, 8], [66, 7, 71, 10], [73, 25, 79, 28], [76, 27, 83, 30], [90, 11, 96, 14], [93, 13, 99, 17],
  [107, 31, 113, 35], [110, 34, 116, 38], [95, 41, 103, 45], [81, 41, 87, 44], [112, 6, 119, 9],
  // este: bases de basalto de las islas
  [123, 17, 131, 22], [126, 21, 135, 27], [129, 26, 136, 31], [139, 5, 147, 9], [143, 8, 149, 12],
  [141, 38, 151, 43], [146, 36, 152, 39], [154, 19, 161, 23], [157, 31, 165, 35], [133, 40, 139, 45], [165, 8, 168, 13],
]);

/** Bosques de algas: [cx, cy, radio, densidad] (se rellenan con matas y alguna roca, sin rejilla visible). */
const KELP = Object.freeze([
  [12, 30, 5, 0.8], [40, 36, 5, 0.7], [18, 7, 4, 0.6], [55, 25, 5, 0.75], [66, 17, 7, 0.9], [86, 24, 7, 0.9],
  [103, 33, 5, 0.85], [75, 39, 5, 0.85], [120, 21, 5, 0.8], [104, 20, 4, 0.6], [139, 32, 5, 0.7], [152, 27, 5, 0.65],
  [160, 42, 4, 0.6], [134, 12, 4, 0.55], [88, 7, 4, 0.5], [47, 16, 3, 0.5],
]);

/** Praderas de algas (zonas someras donde se recarga sin gastar: `underwater.shallow`). */
export const MEADOWS = Object.freeze([
  [60, 14, 12, 8], [80, 20, 12, 8], [98, 30, 10, 6], [70, 36, 10, 6], [14, 26, 8, 6], [116, 18, 8, 7],
]);

/** Casillas de una mancha elíptica de borde irregular (sin esquinas rectas) centrada en (cx, cy). */
export function blob(cx, cy, rx, ry, seed) {
  const out = [];
  for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) {
    for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
      const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
      if (d < 1 + (cellHash(x, y, seed) - 0.5) * 0.6) out.push([x, y]);
    }
  }
  return out;
}

/**
 * Macizos con contorno irregular: a cada rectángulo se le añaden salientes de 2×2 en sus lados y se le muerden
 * esquinas de 2×2 (con semilla), para que no se lean como bloques. Mínimo 2 casillas: el pincel nine lo dibuja bien.
 */
export function roughRocks(rects) {
  const cells = new Set(rects.flatMap((r) => rect(...r)).map(([x, y]) => key(x, y)));
  rects.forEach(([x0, y0, x1, y1], k) => {
    const bump = (x, y) => { for (const [a, b2] of rect(x, y, x + 1, y + 1)) cells.add(key(a, b2)); };
    // Solo en los lados largos y pocas: muchas salientes convierten los escollos en cruces.
    if (x1 - x0 >= 6) {
      for (let x = x0 + 1; x < x1 - 1; x += 4) {
        if (cellHash(x, k, 921) > 0.65) bump(x, y0 - 2);
        if (cellHash(x, k, 922) > 0.65) bump(x, y1 + 1);
      }
    }
    if (y1 - y0 >= 6) {
      for (let y = y0 + 1; y < y1 - 1; y += 4) {
        if (cellHash(y, k, 923) > 0.65) bump(x0 - 2, y);
        if (cellHash(y, k, 924) > 0.65) bump(x1 + 1, y);
      }
    }
    if (x1 - x0 >= 7 && y1 - y0 >= 5) {
      // Mordiscos en las esquinas que no tapa otro rectángulo del mismo macizo (si no, quedarían agujeros).
      const covered = (a, b2) => rects.some((r, j) => j !== k && a >= r[0] && a <= r[2] && b2 >= r[1] && b2 <= r[3]);
      const corners = [[x0, y0], [x1 - 1, y0], [x0, y1 - 1], [x1 - 1, y1 - 1]];
      corners.forEach(([cx, cy], i) => {
        if (cellHash(k, i, 925) <= 0.55) return;
        for (const [a, b2] of rect(cx, cy, cx + 1, cy + 1)) if (!covered(a, b2)) cells.delete(key(a, b2));
      });
    }
  });
  return [...cells].map((s) => s.split(',').map(Number));
}

export function reservedFondo() {
  const out = [];
  for (let x = 0; x <= 12; x++) for (let y = F.west.y0; y <= F.west.y1; y++) out.push([x, y]); // entrada del arrecife
  for (const p of [...F.surface, ...F.vents]) out.push([p.x, p.y], [p.x + 1, p.y], [p.x - 1, p.y], [p.x, p.y + 1], [p.x, p.y - 1]);
  for (const c of Object.values(F.cells)) out.push([c.x, c.y], [c.x + 1, c.y], [c.x - 1, c.y], [c.x, c.y + 1], [c.x, c.y - 1]);
  // pasillo principal (oeste → este) siempre transitable
  for (let x = 0; x < F.abyssX; x++) out.push([x, 23 + Math.round(Math.sin(x / 9) * 3)]);
  return cellSet(out);
}

export function buildFondo(b) {
  b.fill(null, 'vacio');
  b.rect(null, 0, 5, F.w, 43, 'sala_gris');
  const res = reservedFondo();
  const inside = ([x, y]) => x >= 0 && x < F.abyssX - 2 && y >= 5 && y <= 47 && !res.has(key(x, y));
  const rockCells = [
    ...roughRocks(FONDO_ROCKS).filter(inside),
    // Fosa Abisal: desde x 171 el fondo cae a la oscuridad (vacío con un borde de roca).
    ...rect(F.abyssX - 2, 5, F.abyssX - 1, 47).filter(([, y]) => y < 25 || y > 29),
  ];
  const rocks = new Set(rockCells.map(([x, y]) => key(x, y)));
  b.paint('macizo_gris', rockCells);
  b.rect(null, F.abyssX, 5, F.w - F.abyssX, 43, 'vacio');
  // Arena clara (praderas y claros) sobre el limo: manchas de borde irregular, nunca rectángulos.
  const sand = (cells) => b.paint('mancha_gris', cells.filter((c) => inside(c) || res.has(key(...c))).filter(([x, y]) => !rocks.has(key(x, y))));
  MEADOWS.forEach(([x, y, w, h], i) => sand(blob(x + (w - 1) / 2, y + (h - 1) / 2, w / 2 + 0.5, h / 2 + 0.5, 930 + i)));
  for (let i = 0; i < 26; i++) {
    const cx = 6 + cellHash(i, 7, 941) * (F.abyssX - 14);
    const cy = 8 + cellHash(i, 8, 942) * 36;
    sand(blob(cx, cy, 1.5 + cellHash(i, 9, 943) * 2.5, 1.2 + cellHash(i, 10, 944) * 1.8, 950 + i));
  }
  // Restos de Antea desperdigados por el oeste (la ciudad llegaba hasta aquí).
  for (const [x, y] of [[15, 21], [21, 30], [9, 33], [52, 12]]) b.stamp('pilar_columna_quebrada', x, y);
  b.stamp('pilar_monolito', 5, 12);
  b.stamp('pilar_zocalo_gastado', 18, 18);
  b.stamp('pilar_losa_eco', 33, 13);
  // Bosques de algas en manchas (sin rejilla): matas alrededor de cada centro, con desplazamientos con semilla.
  const free = (x, y) => x >= 1 && x < F.abyssX - 2 && y >= 5 && y <= 47 && !rocks.has(key(x, y)) && !isMacizo(b, x, y) && !b.get(2, x, y);
  const kelp = [];
  KELP.forEach(([cx, cy, r, d], k) => {
    for (let t = 0; t < r * r * 2.2; t++) {
      const a = cellHash(k, t, 811) * Math.PI * 2;
      const dist = Math.sqrt(cellHash(t, k, 812)) * r;
      const x = Math.round(cx + Math.cos(a) * dist);
      const y = Math.round(cy + Math.sin(a) * dist * 0.8);
      if (cellHash(x, y, 813) > d) continue;
      kelp.push(cellHash(x, y, 814) > 0.88 ? ['roca_musgo_gris', x, y, 2, 2] : ['matojo_cueva_gris', x, y, 2, 2]);
    }
  });
  // Los bosques de algas, apretados (matas juntas); el resto, con aire alrededor.
  const used = placeFree(b, kelp, free, res, { gap: false });
  const list = [];
  // Piedras sueltas, cristales luminosos y restos: dispersos con semilla fuera de los bosques.
  for (let i = 0; i < 150; i++) {
    const x = 4 + Math.floor(cellHash(i, 1, 901) * (F.abyssX - 10));
    const y = 6 + Math.floor(cellHash(i, 2, 902) * 40);
    const h = cellHash(i, 3, 903);
    const piece = h < 0.3 ? ['musgo_rocas', 2, 1] : h < 0.5 ? ['roca_peque_gris', 1, 2] : h < 0.62 ? ['gota_cristal', 1, 2]
      : h < 0.72 ? ['roca_grande_gris', 2, 3] : h < 0.8 ? ['cristales', 6, 2] : h < 0.9 ? ['matojo_cueva_gris', 2, 2] : ['roca_musgo_gris', 2, 2];
    list.push([piece[0], x, y, piece[1], piece[2]]);
  }
  placeFree(b, list, free, used);
}

/** Zonas someras (no gastan la burbuja): praderas y el pie de cada haz de luz. */
export function fondoShallow() {
  return [...MEADOWS, ...F.surface.map((p) => [p.x - 1, p.y - 1, 3, 3])];
}
