// Construcción de la Calzada del Rey (tileset 1, Exterior1). Coordenadas: calzada_layout.js. Módulo PURO.
//   · Orillas de hierba (la Peña al norte, el Mirador al sur) y el brazo de la Sima entre ellas: vacío de borde a
//     borde con los bordes de roca de rim.js (labio, cara de 3 filas que cuelga, muros finos) alrededor de las pilas,
//     las agujas lejanas y las orillas. Por el vacío asoma el panorama del abismo.
//   · La Calzada es el estrado de ladrillo con bordillo (3 de ancho) en tierra; los tramos sobre el vacío los alza la
//     Reconstrucción (calzada_patch.js) y, hasta entonces, solo hay piedras forzadas (eventos de b19_spans.js).
import {
  W, H, PENA, STACK_A, STACK_B, ISLETS, ROAD, ROAD_JOINTS, MIRADOR, TRAIL, CAMP, FORESTS, isLand, isChasm, rect,
} from './calzada_layout.js';
import { cellsOf, SPAN_DEFS } from '../../events/b19_spans_logic.js';
import { VOID_BLOCK, DARK, estradoTile, roadTileAt } from './tiles.js';
import { paintVoid, paintVoidEdges } from './rim.js';
import { cellHash } from '../../stamps/brushes.js';

const k = (x, y) => `${x},${y}`;

// ───────────────────────────── Peña del Rey ─────────────────────────────

function paintPena(b) {
  const p = PENA;
  b.paint('acantilado', rect(p.band.x0, p.band.y0, p.band.x1, p.band.y1));
  b.paint('acantilado', rect(p.cima.x0, p.cima.y0, p.cima.x1, p.cima.y1));
  b.stamp('escalera_terraza', p.cimaStairs.x, p.cimaStairs.y);
  // bocas del taller y de la Bajada: negro en la cara del risco bajo un dintel de piedra
  for (const g of [p.workshop, p.bajada]) {
    for (let y = g.dintel.y + 1; y <= g.dintel.y + 3; y++) {
      for (let x = g.dintel.x + 1; x <= g.dintel.x + 3; x++) b.set(1, x, y, DARK[y === g.dintel.y + 1 ? 0 : 1]);
    }
    b.stamp('pilar_dintel', g.dintel.x, g.dintel.y);
  }
  // cima: matas y rocas alrededor del nido (sin césped ni guijarros, que llevan hierba debajo: es roca)
  for (const [s, x, y] of [
    ['roca_peque', 39, 2], ['roca_peque', 46, 3], ['brotes', 40, 5], ['pilar_columna_quebrada', 45, 1],
    ['brotes', 44, 1], ['roca_peque', 41, 4], ['brotes', 46, 4], ['brotes', 42, 2],
  ]) b.stamp(s, x, y);
  // la explanada: ruinas del tiempo del Rey
  for (const [s, x, y] of [
    ['pilar_placa_unown', p.stele.x, p.stele.y], ['pilar_placa_unown', p.steleBajada.x, p.steleBajada.y],
    ['pilar_columna', 14, 5], ['pilar_columna', 29, 5], ['pilar_monolito', 31, 5],
    ['pilar_columna_quebrada', 10, 6], ['pilar_columna_quebrada', 37, 11], ['pilar_columna_quebrada', 17, 12],
    ['pilar_glifo', 12, 8], ['pilar_glifo_2', 28, 12], ['pilar_glifo', 24, 8], ['pilar_glifo_2', 8, 12],
    ['roca_grande', 1, 11], ['roca_gris', 26, 12], ['roca_peque', 9, 7], ['roca_peque', 38, 12], ['pino', 45, 10],
    ['brotes', 16, 7], ['flores_blancas', 18, 6], ['brotes', 31, 12], ['flores_blancas', 3, 12], ['guijarros', 22, 13],
    ['guijarros', 7, 5], ['brotes', 42, 12],
  ]) b.stamp(s, x, y);
}

// ───────────────────────────── Sima, pilas y bordes ─────────────────────────────

function paintChasm(b) {
  const voidCells = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (isChasm(x, y)) voidCells.push([x, y]);
  paintVoid(b, voidCells);
  // Fuera del mapa por los lados el brazo continúa: ni muros ni caras en las columnas del borde.
  const landOut = (x, y) => (x < 0 || x >= W ? y <= 13 || y >= 40 : isLand(x, y));
  paintVoidEdges(b, isChasm, landOut, { W, H });
  // cima de las pilas y de las agujas: hierba clara y matas
  for (const s of [STACK_A, STACK_B]) b.paint('cesped_claro', rect(s.x0 + 1, s.y0 + 1, s.x1 - 1, s.y1 - 1));
  for (const r of ISLETS) b.paint('cesped_claro', rect(r.x0, r.y0, r.x1, r.y1));
  for (const [s, x, y] of [['pino', 42, 15], ['brotes', 3, 30], ['roca_peque', 24, 34], ['roca_peque', 45, 32], ['brotes', 4, 17]]) b.stamp(s, x, y);
}

/** Detalles de las pilas: ruinas, rocas y flores (sin tapar la calzada ni los accesos). */
function paintStackDetails(b) {
  for (const [s, x, y] of [
    ['pilar_columna_quebrada', 11, 21], ['roca_peque', 17, 29], ['flores_blancas', 10, 28], ['brotes', 16, 22], ['pilar_glifo', 15, 28],
    ['roca_gris', 9, 24], ['flores_rosas', 17, 24],
    ['pilar_monolito', 31, 22], ['roca_peque', 38, 23], ['flores_rosas', 33, 30], ['brotes', 36, 28], ['pilar_columna', 37, 25],
    ['pilar_glifo_2', 31, 28], ['roca_gris', 34, 31], ['flores_blancas', 38, 29],
  ]) b.stamp(s, x, y);
}

// ───────────────────────────── Calzada y tierra ─────────────────────────────

/**
 * Calzada antigua sobre tierra (estrado de 3 de ancho): el bordillo se elige por vecinas, así los recodos y cruces
 * no cortan el borde. Cuentan como «sigue la calzada» los tramos y sus salidas sobre la Sima (aunque aún no estén
 * alzados): al alzarlos, la calzada de la orilla empalma sin bordillo de por medio.
 */
function paintRoads(b) {
  const road = new Map();
  for (const list of Object.values(ROAD)) for (const r of list) for (const [x, y] of rect(...r)) road.set(k(x, y), [x, y]);
  for (const r of ROAD_JOINTS) for (const [x, y] of rect(...r)) road.set(k(x, y), [x, y]);
  const continues = new Set(road.keys());
  for (const s of SPAN_DEFS) for (const [x, y] of [...cellsOf(s.n).footprint, ...s.far]) continues.add(k(x, y));
  const isRoad = (x, y) => continues.has(k(x, y));
  for (const [x, y] of road.values()) {
    b.set(1, x, y, roadTileAt(x, y, isRoad));
    b.set(2, x, y, 0);
  }
}

function paintMirador(b) {
  const r = MIRADOR.plaza;
  for (const [x, y] of rect(r.x0, r.y0, r.x1, r.y1)) { b.set(1, x, y, estradoTile(r, x, y)); b.set(2, x, y, 0); }
  b.stamp('pilar_placa_unown', MIRADOR.stele.x, MIRADOR.stele.y);
}

function paintSouth(b) {
  // Sendero y caminos del campamento (una sola máscara: el borde se calcula sobre la unión)
  const dirt = new Map();
  for (const r of TRAIL) for (const [x, y] of rect(r.x0, r.y0, r.x1, r.y1)) dirt.set(k(x, y), [x, y]);
  b.paint('camino_tierra', [...dirt.values()]);
  for (const [x0, y0, x1, y1, brush] of FORESTS) b.paint(brush, rect(x0, y0, x1, y1));
  b.paint('cesped_claro', rect(20, 42, 30, 44));
  b.paint('cesped_claro', rect(32, 52, 42, 56));
}

function paintCamp(b) {
  for (const [x, y] of CAMP.tents) b.stamp('tienda_campana', x, y);
  for (const [x, y] of CAMP.barrels) b.stamp('barriles', x, y);
  for (const [x, y] of CAMP.logs) b.stamp('troncos', x, y);
  b.stamp('puesto_mercado', CAMP.stall.x, CAMP.stall.y);
}

function paintSouthDetails(b) {
  for (const [s, x, y] of [
    ['roca_grande', 9, 50], ['roca_gris', 14, 47], ['roca_peque', 6, 44], ['pino', 40, 41], ['tocon', 38, 48], ['brotes', 29, 50],
    ['flores_blancas', 20, 56], ['guijarros', 32, 49], ['arbustos', 16, 50], ['roca_gris', 42, 44], ['brotes', 7, 49],
    ['flores_rosas', 12, 49], ['guijarros', 20, 49], ['lupinos', 25, 41], ['flores_blancas', 3, 42], ['brotes', 1, 44],
    ['roca_peque', 30, 42], ['flores_rosas', 43, 49], ['brotes', 34, 55], ['macizo_flores', 5, 41],
  ]) b.stamp(s, x, y);
  b.stamp('cartel_madera', 6, 46);
}

/** Variación del césped (guijarros) lejos de la calzada y de todo lo pintado. */
function scatter(b) {
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (isChasm(x, y) || b.get(1, x, y) || b.get(2, x, y)) continue;
      if (cellHash(x, y, 19) < 0.03) b.stamp('guijarros', x, y);
    }
  }
}

/** Construcción completa (el campamento está siempre; lo que cambia con la historia son los eventos). */
export function buildCalzada(b) {
  b.fill(null, 'cesped');
  paintSouth(b);
  paintPena(b);
  paintChasm(b);
  paintStackDetails(b);
  paintRoads(b);
  paintMirador(b);
  paintCamp(b);
  paintSouthDetails(b);
  scatter(b);
  // la aguja de cada tramo (el evento lleva el dibujo; la casilla sigue siendo vacío)
  for (const s of SPAN_DEFS) { const p = cellsOf(s.n).pinnacle; b.set(2, p.x, p.y, VOID_BLOCK); }
}
