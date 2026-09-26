// Construcción del Puente de la Convergencia (tileset 1 Exterior1 + kit exterior de Pilar). Módulo puro: solo pinta
// tiles (los eventos están en content/events/b18_puente.js y b18_genesis.js). La Sima es vacío: se deja sin tiles y la
// definición del mapa pone `voidBlocks` y el panorama de la Sima (el de B17).
//   · Tablero y Rellano de los Custodios: losas de mármol (nine de Exterior1, filas 216–220) con columnas de pretil,
//     estribos rotos y los huecos del tramo central (zócalos gastados a los lados: lectura de la Reconstrucción).
//   · Plataforma del Cruce: octógono de losas grises (nine de las filas 216–220, columnas 3–5), monolitos del Pilar,
//     glifos, losas de eco y aristas, la boca de la Cámara (escalera de bajada) y el material de Genesis.
//   · Tramo sur: losas viejas y tablones de Genesis (muelle) hacia el Mirador Sur.
import {
  BRIDGE, deckCells, landingCells, platformCells, plankCells, MOUTH, MONOLITHS, CAMP, SIGNS, PLATFORM, PLANKS,
} from './puente_layout.js';

export const PUENTE_BRUSHES = Object.freeze({
  marmol: { nine: [0, 216], inner: [0, 219], layer: 1, desc: 'Losas de mármol del puente (nine)' },
  losas_plataforma: { nine: [3, 216], inner: [3, 219], layer: 1, desc: 'Losas grises de la plataforma del Cruce (nine)' },
});

export const PUENTE_STAMPS = Object.freeze({
  /** Escalera de bajada con marco (Exterior1 filas 226–229): la boca de la Cámara del Cruce, abierta al sur. */
  boca_camara: { src: [0, 226, 3, 4], layer: 2, desc: 'Boca de la Cámara del Cruce: escalera que baja a la oscuridad' },
  /** Maquinaria del Consorcio (Exterior1 filas 221–224). */
  sonda_genesis: { src: [0, 221, 2, 2], layer: 2, desc: 'Sonda de medición de Genesis (2×2)' },
  perforadora_genesis: { src: [4, 222, 3, 3], layer: 2, desc: 'Perforadora oruga de Genesis (3×3)' },
});

function paintBridge(b) {
  b.paint('marmol', [...deckCells(), ...landingCells()]);
  for (const [x, y] of BRIDGE.rails) b.stamp('pilar_columna', x, y - 2);
  for (const [x, y] of BRIDGE.broken) b.stamp('pilar_columna_quebrada', x, y - 1);
  // Zócalos: el del punto (donde se pide a Zygarde) y los gastados a los lados de cada hueco
  for (const g of BRIDGE.gaps) {
    b.stamp('pilar_zocalo', g.socket.x, g.socket.y);
    for (const x of [19, 21]) {
      b.stamp('pilar_zocalo_gastado', x, g.y0 - 1);
      b.stamp('pilar_zocalo_gastado', x, g.y1 + 1);
    }
  }
  for (const [x, y] of [[19, 1], [21, 16], [19, 22], [21, 27], [20, 54]]) b.stamp(x % 2 ? 'pilar_glifo' : 'pilar_glifo_2', x, y);
}

function paintLanding(b) {
  // Campamento de Alerce en el Rellano de los Custodios
  b.stamp('tienda_campana', CAMP.tent.x, CAMP.tent.y);
  b.stamp('troncos', CAMP.logs.x, CAMP.logs.y);
  b.stamp('pilar_placa_unown', SIGNS.stele.x, SIGNS.stele.y);
  // Esquinas del rellano: columnas y losas de eco de los Custodios (al oeste, la tienda de Alerce ocupa la esquina)
  for (const [x, y] of [[27, 7], [27, 12]]) b.stamp('pilar_columna', x, y - 2);
  b.stamp('pilar_losa_eco', 23, 10);
  for (const [x, y] of [[12, 10], [28, 9], [24, 12]]) b.stamp(x % 2 ? 'pilar_glifo' : 'pilar_glifo_2', x, y);
}

/** Cruz de mármol sobre la plataforma: los dos caminos del mundo que se cruzan en la boca de la Cámara. */
function crossCells() {
  const inPlatform = new Set(platformCells().map(([x, y]) => `${x},${y}`));
  const out = [];
  for (const [x, y] of platformCells()) {
    const vertical = x >= BRIDGE.x0 && x <= BRIDGE.x1;
    const horizontal = y >= MOUTH.y0 && y <= MOUTH.y0 + 4;
    if ((vertical || horizontal) && inPlatform.has(`${x},${y}`)) out.push([x, y]);
  }
  return out;
}

function paintPlatform(b) {
  b.paint('losas_plataforma', platformCells());
  b.paint('marmol', crossCells());
  for (const [x, y] of [[12, 33], [28, 33], [11, 49], [29, 48], [24, 32]]) b.stamp('roca_peque', x, y);
  // Anillo del Pilar: monolitos, columnas, glifos, losas de eco y aristas violetas (la energía de la Sima)
  for (const [x, y] of MONOLITHS) b.stamp('pilar_monolito', x, y - 2);
  const y0 = PLATFORM.y0;
  for (const [x, y] of [[15, y0 + 3], [25, y0 + 3], [10, y0 + 10], [30, y0 + 10], [26, y0 + 18]]) b.stamp('pilar_columna', x, y - 2);
  for (const [x, y] of [[17, y0 + 2], [23, y0 + 2], [11, y0 + 7], [29, y0 + 7], [11, y0 + 13], [29, y0 + 13], [17, y0 + 19], [23, y0 + 19]]) {
    b.stamp(x % 2 ? 'pilar_glifo' : 'pilar_glifo_2', x, y);
  }
  b.stamp('pilar_losa_eco', 19, y0 + 15);
  b.stamp('pilar_losa_eco', 22, y0 + 16);
  for (const [x, y] of [[18, y0 + 7], [22, y0 + 8], [14, y0 + 15], [27, y0 + 4]]) b.stamp('pilar_arista', x, y - 1);
  // La boca de la Cámara del Cruce (se entra desde el sur)
  b.stamp('boca_camara', MOUTH.x0, MOUTH.y0);
  // Material de Genesis alrededor del Resonador
  b.stamp('sonda_genesis', 23, y0 + 12);
  b.stamp('perforadora_genesis', 14, y0 + 17);
  b.stamp('barrera_obras', 16, PLATFORM.y1);
  b.stamp('barrera_obras', 23, PLATFORM.y1);
}

/**
 * Pasarela de tablones de Genesis (x 19–21): la pasarela vertical con barandillas de Exterior1 (columnas 0–2, filas
 * 523–529 del tileset original; pasables). El brush `muelle` mezcla esa pieza con el tablero horizontal y dejaba una
 * casilla vacía en el borde sur.
 */
const GANGWAY_ROW0 = 524;
const gangwayTile = (col, row) => 384 + row * 8 + col;

function paintSouth(b) {
  for (const [x, y] of plankCells()) b.set(1, x, y, gangwayTile(x - PLANKS.x0, GANGWAY_ROW0 + ((y - PLANKS.y0) % 4)));
}

export function buildPuente(b) {
  paintBridge(b);
  paintLanding(b);
  paintPlatform(b);
  paintSouth(b);
}
