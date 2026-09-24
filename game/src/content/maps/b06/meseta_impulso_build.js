// Construcción de la Meseta del Impulso (tileset 1): altiplano abierto y ventoso con el Parque Eólico vallado al
// noroeste (nave del Colector, aerogeneradores, camión y contenedores del Consorcio), la peña del Anillo de los
// Vientos al noreste con su puerta tallada, praderas de hierba alta al sur, un estanque, una explanada de roca
// (Cyclizar) y los postes de la línea eléctrica muerta hacia Brontia. Coordenadas en ./layout.js (MESETA).
import { MESETA } from './layout.js';

const M = MESETA;
export const rect = (x0, y0, x1, y1) => {
  const out = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]);
  return out;
};
const minus = (cells, holes) => {
  const h = new Set(holes.map(([x, y]) => `${x},${y}`));
  return cells.filter(([x, y]) => !h.has(`${x},${y}`));
};

function borders(b) {
  // Oeste: pinar salvo el paso de la Ruta 5 (filas 22–25).
  b.paint('bosque_pinos', rect(0, 26, 1, 49));
  b.paint('bosque_pinos', rect(0, 0, 1, 21));
  // Sur: bosque mixto bajo; este: pinar al borde del altiplano (la peña llega hasta la esquina noreste).
  b.paint('bosque_mixto', rect(2, 46, 45, 49));
  b.paint('bosque_pinos', rect(46, 13, 49, 49));
  // Norte, entre el Parque y la peña: pinos.
  b.paint('bosque_pinos', rect(2, 0, 31, 1));
}

function parque(b) {
  const f = M.fence;
  // Suelo del recinto: grava de obra con caminos de tierra.
  b.paint('camino_arena', rect(f.x0 + 1, f.y0 + 1, f.x1 - 1, f.y1 - 1));
  // Valla con la puerta en el lado sur.
  const gate = rect(M.gate.x0, f.y1, M.gate.x1, f.y1);
  b.paint('valla_blanca', minus(rect(f.x0, f.y1, f.x1, f.y1), gate));
  b.paint('valla_blanca', rect(f.x0, f.y0, f.x1, f.y0));
  b.paint('valla_blanca_v', rect(f.x0, f.y0 + 1, f.x0, f.y1 - 1));
  b.paint('valla_blanca_v', rect(f.x1, f.y0 + 1, f.x1, f.y1 - 1));
  // Nave del Colector.
  b.stamp('central', M.colector.x, M.colector.y);
  // Material del Consorcio (sin pisar la fachada ni la sombra de la nave, ni la valla ni los aerogeneradores).
  b.stamp('camion', 23, 15);
  b.stamp('contenedores', 25, 11);
  b.stamp('cajas_madera', 4, 10);
  b.stamp('barriles', 9, 16);
  b.stamp('barrera_obras', 19, 17);
  b.stamp('barrera_obras', 19, 20);
  b.stamp('barrera_obras', 13, 20);
  b.stamp('farola_hierro', 11, 12);
  b.stamp('farola_hierro', 24, 11);
  // Aviso del Consorcio junto a la puerta, por fuera.
  b.stamp('tablon_anuncios_2', 21, 20);
}

function mesa(b) {
  const m = M.mesa;
  // La peña del Anillo: una terraza alta con la escalinata al sur; arriba asoman las piedras del anillo.
  b.blob(null, rect(m.x0, m.y0, m.x1, m.y1), 'terraza');
  const g = M.ringGate;
  b.stamp('escalera_terraza', g.x - 1, m.y1 - 2);
  b.stamp('pilar_dintel', g.x - 2, g.y - 3);
  for (const [n, x, y] of [
    ['pilar_columna', 35, 2], ['pilar_monolito', 42, 2], ['pilar_columna_quebrada', 44, 6], ['pilar_columna', 35, 6],
    ['pino', 44, 2], ['roca_gris', 38, 3], ['brotes', 34, 9], ['flores_blancas', 43, 9], ['pilar_zocalo_gastado', 40, 4],
  ]) b.stamp(n, x, y);
  b.stamp('pilar_columna_quebrada', g.x - 4, m.y1 + 1);
  b.stamp('pilar_columna', g.x + 4, m.y1 + 1);
  b.stamp('pilar_zocalo_gastado', g.x - 3, m.y1 + 3);
  b.stamp('pilar_zocalo_gastado', g.x + 3, m.y1 + 3);
}

function paths(b) {
  b.paint('camino_tierra', [
    ...rect(0, 22, 40, 25), // de la Ruta 5 al cruce
    ...rect(M.gate.x0, 20, M.gate.x1, 21), // a la puerta del Parque
    ...rect(M.gate.x0, 14, M.gate.x1, 19), // dentro del recinto, a la nave
    ...rect(M.ringGate.x - 1, M.mesa.y1 + 1, M.ringGate.x + 1, 21), // a la peña del Anillo
    ...rect(27, 26, 28, 36), // bajada a las praderas del sur
    ...rect(27, 36, 40, 37), // hacia el estanque
  ]);
}

function meadows(b) {
  // Hierba alta (encuentros): junto a la valla del Parque (Drifloon), praderas del sur y el oeste.
  for (const [x0, y0, x1, y1] of [
    [23, 20, 30, 21], [3, 28, 12, 35], [16, 29, 25, 35], [31, 39, 40, 44], [6, 39, 15, 43], [41, 27, 44, 31],
  ]) b.rect(null, x0, y0, x1 - x0 + 1, y1 - y0 + 1, 'hierba_alta');
  b.rect(null, 3, 36, 8, 2, 'hierba_alta_oscura');
  // Flores amarillas y lila que el viento peina.
  b.rect(null, 13, 27, 3, 2, 'flores_amarillas');
  b.rect(null, 36, 43, 3, 2, 'flores_amarillas');
  // Estanque con rocas.
  b.rect(null, 41, 38, 5, 4, 'estanque');
  b.stamp('roca_agua', 43, 39);
}

function explanada(b) {
  // Explanada pedregosa del este (Cyclizar corretea por aquí): guijarros, rocas y matas bajas.
  for (const [n, x, y] of [
    ['roca_grande', 34, 28], ['roca_gris', 36, 31], ['roca_peque', 39, 29], ['roca_grande', 30, 34], ['roca_peque', 33, 33],
    ['guijarros', 35, 29], ['guijarros', 38, 32], ['guijarros', 32, 30], ['brotes', 37, 27], ['arbustos', 39, 33],
  ]) b.stamp(n, x, y);
}

function details(b) {
  // Nada sobre el camino ni sobre el pinar del borde (las piezas de flor y matojo llevan su propia hierba).
  for (const [n, x, y] of [
    ['poste_electrico', 13, 26],
    ['pino', 3, 40], ['pino', 17, 43], ['arbol', 26, 42], ['pino', 44, 43], ['arbol', 29, 28], ['pino', 11, 25],
    ['roca_grande', 18, 27], ['roca_gris', 23, 44], ['roca_peque', 9, 37], ['roca_gris', 41, 19],
    ['tocon', 5, 44], ['troncos', 32, 19], ['arbustos', 15, 36], ['arbustos', 29, 44], ['arbustos', 2, 38],
    ['troncos', 34, 16], ['roca_grande', 43, 16], ['arbustos', 36, 19], ['lupinos', 41, 23],
  ]) b.stamp(n, x, y);
  for (const [n, x, y] of [
    ['flores_blancas', 6, 27], ['flores_rosas', 21, 28], ['macizo_flores', 26, 38], ['flores_blancas', 34, 35],
    ['brotes', 12, 38], ['guijarros', 24, 27], ['flores_rosas', 37, 34], ['flores_blancas', 45, 36], ['brotes', 33, 41],
    ['guijarros', 7, 45], ['flores_blancas', 19, 37], ['brotes', 42, 26], ['guijarros', 35, 20], ['flores_rosas', 2, 27],
    ['macizo_flores', 30, 38], ['lupinos', 22, 40], ['brotes', 16, 27], ['flores_blancas', 44, 34], ['tocon', 36, 17],
  ]) b.stamp(n, x, y);
  b.stamp('cartel_ruta', 4, 26);
}

export function buildMeseta(b) {
  b.fill(null, 'cesped');
  borders(b);
  paths(b);
  meadows(b);
  explanada(b);
  parque(b);
  mesa(b);
  details(b);
}
