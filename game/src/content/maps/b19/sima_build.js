// Construcción de la Sima del Eje (tileset 1, Exterior1). Coordenadas: sima_layout.js. Módulo PURO.
//   · Todo es vacío (panorama `sima`) salvo las cornisas y rellanos, que llevan los bordes de roca de rim.js: labio
//     arriba, cara de 3 filas que cuelga debajo y muros finos a los lados.
//   · Oeste: cornisas de tierra con matas y rocas. Este: la roca de la Bajada con su dintel y la Calzada del Rey (estrado
//     de ladrillo con bordillo) que baja por escaleras de piedra. Centro: la roca de la Puerta de las Quince con su
//     dintel y el Umbral, una explanada de estrado.
import {
  W, H, WEST, EAST, BAJADA, CALZADA, STAIRS, UMBRAL, ISLETS, GAP_W, GAP_ALCOVE, GAP_FINAL, REPISA_STELE,
  isLand, isChasm, inStairs, rect,
} from './sima_layout.js';
import { DARK, ZOCALO, estradoTile, roadTileAt } from './tiles.js';
import { paintVoid, paintVoidEdges } from './rim.js';
import { cellHash } from '../../stamps/brushes.js';

const k = (x, y) => `${x},${y}`;

/** Tierra del mapa y de fuera de él para los bordes (por arriba sigue la cornisa de la Senda; por abajo, la del
 *  Mirador Sur). Las rocas de acantilado dibujan sus propios bordes: no cuentan. */
function solidOut(x, y) {
  if (y < 0) return x >= 11 && x <= 12;
  if (y >= H) return x >= 3 && x <= 4;
  if (x < 0 || x >= W) return false;
  return isLand(x, y);
}
/** Para los bordes: las escaleras cuelgan sobre la cara del rellano (se dibuja la cara debajo). */
const voidForEdges = (x, y) => isChasm(x, y) || inStairs(x, y);

function paintChasm(b) {
  const cells = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (isChasm(x, y)) cells.push([x, y]);
  paintVoid(b, cells);
  paintVoidEdges(b, voidForEdges, solidOut, { W, H });
}

function paintWest(b) {
  // Cornisas y sendero: tierra con bordes de hierba (una sola máscara para que los bordes enlacen)
  b.paint('cesped_claro', rect(6, 8, 10, 10));
  b.paint('cesped_claro', rect(WEST.alcove.x0, WEST.alcove.y0, WEST.alcove.x1, WEST.alcove.y1));
  const trail = new Map();
  for (const r of [WEST.ledgeN, R_(11, 8, 12, 12), R_(5, 11, 12, 12), WEST.trail1, WEST.trail2, WEST.ledgeS]) {
    for (const [x, y] of rect(r.x0, r.y0, r.x1, r.y1)) trail.set(k(x, y), [x, y]);
  }
  // el sendero ancho deja hierba rala en algunos bordes
  const dirt = [...trail.values()].filter(([x, y]) => !(inRectR(WEST.trail2, x, y) && (x === 1 || x === 6) && cellHash(x, y, 7) < 0.6));
  b.paint('camino_tierra', dirt);
  // (sin guijarros: su tile lleva hierba debajo y sobre la tierra del sendero se ve un cuadro verde)
  for (const [s, x, y] of [
    ['roca_grande', 7, 8], ['roca_peque', 16, 8], ['brotes', 6, 12], ['brotes', 9, 12], ['flores_blancas', 15, 10],
    ['pilar_columna_quebrada', 5, 9], ['roca_gris', 2, 15], ['brotes', 6, 20], ['roca_peque', 2, 22], ['brotes', 5, 23],
    ['roca_gris', 5, 29], ['brotes', 1, 33], ['roca_peque', 6, 38], ['brotes', 2, 43], ['roca_grande', 5, 44],
    ['brotes', 1, 47], ['pilar_glifo', 3, 34], ['pilar_columna_quebrada', 10, 30], ['roca_peque', 8, 32],
  ]) b.stamp(s, x, y);
  b.stamp('pilar_placa_unown', REPISA_STELE.x, REPISA_STELE.y);
}

const R_ = (x0, y0, x1, y1) => ({ x0, y0, x1, y1 });
const inRectR = (r, x, y) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;

/**
 * La Calzada del Rey (estrado de 3 de ancho): sobre el vacío y lo que el Rey dejó en pie en los rellanos. El bordillo
 * se elige por vecinas (recodos sin costuras); las escaleras y el último tramo cuentan como «sigue la calzada».
 */
function paintRoads(b) {
  const road = new Map();
  const add = (r) => { for (const [x, y] of rect(r.x0, r.y0, r.x1, r.y1)) road.set(k(x, y), [x, y]); };
  for (const r of CALZADA) add(r);
  for (const r of [R_(34, 7, 36, 10), R_(34, 22, 36, 24), R_(31, 24, 36, 26), R_(31, 26, 33, 27), R_(31, 40, 33, 42), R_(27, 41, 33, 43)]) add(r);
  const continues = new Set(road.keys());
  for (const s of STAIRS) for (const [x, y] of rect(s.x, s.y, s.x + 2, s.y + 2)) continues.add(k(x, y));
  for (const [x, y] of GAP_FINAL.cells) continues.add(k(x, y));
  const isRoad = (x, y) => continues.has(k(x, y));
  for (const [x, y] of road.values()) { b.set(1, x, y, roadTileAt(x, y, isRoad)); b.set(2, x, y, 0); }
}

function paintEast(b) {
  b.paint('acantilado', rect(EAST.rock.x0, EAST.rock.y0, EAST.rock.x1, EAST.rock.y1));
  const d = BAJADA.dintel;
  for (let y = d.y + 1; y <= d.y + 3; y++) for (let x = d.x + 1; x <= d.x + 3; x++) b.set(1, x, y, DARK[y === d.y + 1 ? 0 : 1]);
  b.stamp('pilar_dintel', d.x, d.y);
  for (const r of [EAST.landing1, EAST.landing2, EAST.landing3]) b.paint('cesped_claro', rect(r.x0 + 1, r.y0 + 1, r.x1 - 1, r.y1 - 1));
  paintRoads(b);
  for (const s of STAIRS) b.stamp('escalera_terraza', s.x, s.y);
  // (la columna del tercer rellano, en su lado este: en (28, 44) su base caía sobre la cara del rellano y se perdía)
  for (const [s, x, y] of [
    ['pilar_columna', 31, 7], ['pilar_columna_quebrada', 38, 8], ['roca_peque', 30, 9], ['brotes', 37, 7],
    ['pilar_columna_quebrada', 29, 23], ['pilar_monolito', 37, 22], ['roca_gris', 29, 26], ['flores_blancas', 38, 26],
    ['pilar_columna', 35, 42], ['roca_peque', 35, 40], ['guijarros', 29, 40], ['brotes', 35, 45], ['brotes', 28, 44],
  ]) b.stamp(s, x, y);
}

function paintUmbral(b) {
  const r = UMBRAL.plaza;
  for (const [x, y] of rect(r.x0, r.y0, r.x1, r.y1)) { b.set(1, x, y, estradoTile(r, x, y)); b.set(2, x, y, 0); }
  b.paint('acantilado', rect(UMBRAL.rock.x0, UMBRAL.rock.y0, UMBRAL.rock.x1, UMBRAL.rock.y1));
  const d = UMBRAL.dintel;
  for (let y = d.y + 1; y <= d.y + 3; y++) for (let x = d.x + 1; x <= d.x + 3; x++) b.set(1, x, y, DARK[y === d.y + 1 ? 0 : 1]);
  // La fachada vertical del P10 se pinta al terminar; conservar solo el hueco de roca debajo.
  for (const [s, x, y] of [
    ['pilar_columna', 13, 38], ['pilar_columna', 23, 38], ['pilar_columna_quebrada', 11, 44], ['pilar_glifo', 15, 41],
    ['pilar_glifo_2', 21, 41], ['pilar_glifo', 18, 44], ['pilar_losa_eco', 17, 40],
  ]) b.stamp(s, x, y);
  b.stamp('pilar_placa_unown', UMBRAL.stele.x, UMBRAL.stele.y);
}

function paintIslets(b) {
  for (const r of ISLETS) b.paint('cesped_claro', rect(r.x0, r.y0, r.x1, r.y1));
  for (const [s, x, y] of [
    ['pilar_columna_quebrada', 19, 14], ['roca_peque', 22, 20], ['brotes', 9, 20], ['pilar_columna', 21, 49], ['roca_peque', 36, 50],
  ]) b.stamp(s, x, y);
}

/** Zócalos gastados junto a los huecos (el evento de Reconstrucción va encima). */
function paintSockets(b) {
  for (const s of GAP_W.sockets) b.set(2, s.x, s.y, ZOCALO.worn);
  b.set(2, GAP_ALCOVE.socket.x, GAP_ALCOVE.socket.y, ZOCALO.worn);
  b.set(2, GAP_FINAL.socket.x, GAP_FINAL.socket.y, ZOCALO.worn);
}

export function buildSima(b) {
  b.fill(null, 'cesped');
  paintWest(b);
  paintEast(b);
  paintUmbral(b);
  paintIslets(b);
  paintChasm(b);
  paintSockets(b);
}
