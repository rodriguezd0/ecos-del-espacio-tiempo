// Construcción de Columna Lanza (tileset 8, InteriorLiga + kit común de Pilar). Coordenadas en layout.js.
// Suelo de enlosado antiguo sobre el vacío (el panorama se ve alrededor), anillo de dieciocho zócalos alrededor del
// altar, columnas enteras y rotas, monolitos, aristas y glifos Unown grabados en las losas.
import { W, H, floorCells, isFloor, COLUMNA, SOCKETS } from './layout.js';

/** Glifos sueltos grabados en el suelo (calcos de la capa 2): lectura de ruina, sin tapar el paso. */
const GLYPHS = Object.freeze([
  [8, 26], [11, 34], [18, 26], [20, 34], [15, 27], [9, 30], [19, 30], [13, 20], [15, 23], [14, 18],
]);

function stampAll(b, name, list) {
  for (const p of list) b.stamp(name, p.x, p.y);
}

export function buildColumna(b) {
  // Suelo: enlosado con bordillo sobre la capa 1 (capa 0 vacía: por fuera asoma el panorama).
  b.paint('pilar_enlosado', floorCells(), { layer: 1 });

  const C = COLUMNA;
  // Antecámara: nodo de la Red de Convergencia, manantial, estela de la Crónica y monolitos.
  b.stamp('pilar_camara_nucleo', C.node.x, C.node.y);
  b.stamp('pilar_manantial', C.spring.x, C.spring.y);
  b.stamp('pilar_placa_unown', C.chronicle.x, C.chronicle.y);
  stampAll(b, 'pilar_monolito', C.monoliths);
  b.stamp('pilar_dintel', C.gate.x, C.gate.y);

  // Calzada, escalinata y columnas rotas.
  b.stamp('pilar_escalinata_ancha', C.stairs.x, C.stairs.y);
  stampAll(b, 'pilar_columna_quebrada', C.brokenColumns.filter((p) => isFloor(p.x, p.y + 1)));

  // Cumbre: altar, anillo de zócalos, columnas, monolitos y aristas.
  b.stamp('pilar_camara_nucleo', C.altar.x, C.altar.y);
  for (const s of SOCKETS) b.stamp('pilar_zocalo', s.x, s.y);
  stampAll(b, 'pilar_columna', C.columns);
  stampAll(b, 'pilar_columna_quebrada', C.brokenSummit);
  stampAll(b, 'pilar_monolito', C.summitMonoliths);
  stampAll(b, 'pilar_arista', C.crystals);

  // Glifos grabados (solo sobre suelo libre de la capa 2).
  for (const [x, y] of GLYPHS) {
    if (!isFloor(x, y) || b.get(2, x, y)) continue;
    b.stamp((x + y) % 2 ? 'pilar_glifo' : 'pilar_glifo_2', x, y);
  }
}

/** Tamaño del mapa (para comprobaciones de la construcción). */
export const COLUMNA_SIZE = Object.freeze({ W, H });
