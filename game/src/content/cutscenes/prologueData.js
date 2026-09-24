// Datos PUROS del prólogo (sin DOM ni motor): lista de planos, geometría del plano de la región y destinos de
// la dispersión. Se prueban en tests/prologue.test.mjs.
import { REGION_MAP } from '../../ui/logic/regionMapData.js';

export const SHOTS = Object.freeze(['p01', 'p02', 'p03', 'montaje', 'p04', 'final']);

// Plano de la región: arte a ×2 (256×192) con celdas de 8 px desplazadas (OX, OY).
export const REGION_ART = Object.freeze({ w: 256, h: 192, cell: 8, ox: 8, oy: 16, scale: 2 });

// Celdas de la rejilla PROVISIONAL (X02) — lugares genéricos, sin nombre: solo sirven para las trayectorias.
export const REGION_POINTS = Object.freeze({
  origin: [21, 4], // montaña del portal (nordeste)
  village: [9, 12], // pequeño pueblo entre bosques
  cores: [[9, 11], [13, 7], [23, 9], [16, 15], [7, 6]], // el primero cae al norte del pueblo
});

/** ¿Tierra en la celda (cx, cy) de la rejilla? */
export function landCell(grid, cx, cy) {
  const row = grid[cy];
  return row ? row[cx] === '#' || row[cx] === '=' : false;
}

/** Casillas de tierra de la rejilla (destinos de las células). */
export function landCells(map = REGION_MAP) {
  const out = [];
  map.grid.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '#') out.push([x, y]); }));
  return out;
}

/** Centro de una celda de la rejilla en px de pantalla. */
export function cellToScreen([cx, cy]) {
  const a = REGION_ART;
  return { x: (a.ox + cx * a.cell + a.cell / 2) * a.scale, y: (a.oy + cy * a.cell + a.cell / 2) * a.scale };
}
