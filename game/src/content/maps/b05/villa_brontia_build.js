// Construcción de Villa Brontia (MapBuilder + stamps de Exterior1): pueblo de meseta con calles de arena en cruz,
// plaza con fuente junto al campanario, Centro y tienda al noroeste, casa de Abril y el cerro de los molinos al
// noreste, posada, granero y corrales de Wooloo al suroeste, subestación y estación al sureste, y el borde de la
// meseta al sur con la escalera que baja al cañón. El campanario y los molinos son eventos con sprite propio
// (tools/b05_assets.mjs). Módulo puro.
import { W, H, STREETS, PLAZA, MESETA_EDGE, BUILDINGS, PENS, LAMPS, TOWN_SIGN } from './villa_brontia_layout.js';

export function cells(x, y, w, h) {
  const out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.push([x + i, y + j]);
  return out;
}
const rc = (r) => cells(r.x, r.y, r.w, r.h);
const key = (x, y) => `${x},${y}`;

function paintBorders(b) {
  // Norte: pinar de la meseta, abierto SOLO en la calle norte (la del hielo-eco). El pinar sigue por encima del cerro
  // de los molinos (x 28–41): antes ese prado llegaba al borde y se salía a la Ruta 11 (nivel 53–55) sin pasar por el
  // hielo (auditoría de fugas, DECISIONES «DECIDIDO (autor, 25-09-2026)»).
  b.paint('bosque_pinos', [...cells(0, 0, 20, 4), ...cells(24, 0, 4, 2), ...cells(28, 0, 14, 2)]);
  b.paint('bosque_mixto', [...cells(0, 4, 2, 2)]);
  // Oeste y este: arboleda abierta en las calles
  b.paint('bosque_mixto', [...cells(0, 22, 2, 14)]);
  b.paint('bosque_pinos', cells(42, 0, 2, 4));
  // Sur: cara de la meseta (terraza que cubre todo el pueblo) con la escalera de bajada al cañón
  b.blob(null, cells(-3, -3, W + 6, MESETA_EDGE.faceY + 6), 'terraza');
}

function paintStreets(b) {
  const skip = new Set();
  const s = MESETA_EDGE.stairs;
  for (const [x, y] of cells(s.x, s.y, 5, 3)) skip.add(key(x, y));
  const paths = [
    ...rc(STREETS.west), ...rc(STREETS.east), ...rc(STREETS.north), ...rc(STREETS.south), ...rc(PLAZA),
    ...cells(3, 14, 3, 4), // Centro
    ...cells(11, 14, 3, 4), // tienda
    ...cells(29, 9, 3, 9), // casa de Abril
    ...cells(3, 22, 3, 8), // posada
    ...cells(11, 22, 3, 7), // granero
    ...cells(36, 22, 3, 10), // subestación
    ...cells(25, 34, 5, 2), // estación
  ];
  b.paint('camino_arena', paths.filter(([x, y]) => !skip.has(key(x, y))));
  b.stamp(s.stamp, s.x, s.y);
}

function paintPlaza(b) {
  b.stamp('fuente_grande', 16, 17);
  b.stamp('banco', 24, 23);
  b.stamp('banco', 16, 24 - 1);
  b.stamp('tablon_anuncios', 27, 17);
  b.stamp('papelera', 27, 22);
  for (const [x, y] of LAMPS) b.stamp('farola_hierro', x, y);
  b.stamp('macizo_flores', 17, 15);
  b.stamp('flores_rosas', 19, 15);
}

function paintNorthWest(b) {
  b.stamp('jardinera_flores', 6, 15);
  b.stamp('maquinas_expendedoras', 8, 12);
  b.stamp('arbol', 17, 9);
  b.stamp('pino', 8, 4); // entre el Centro y la tienda, sin pisar el tejado del Centro
  b.stamp('flores_blancas', 16, 14);
  b.stamp('buzon_rojo', 15, 12);
  b.rect(null, 2, 16, 1, 2, 'flores_amarillas');
}

function paintNorthEast(b) {
  // Cerro de los molinos: prado con hierba alta (encuentros) y flores de meseta. Los molinos (sprites 3×5 de
  // MILLS, x−1…x+1 y y−4…y) no pisan la hierba ni los adornos.
  b.rect(null, 32, 11, 3, 5, 'hierba_alta');
  b.rect(null, 38, 13, 4, 4, 'hierba_alta');
  b.rect(null, 36, 1, 5, 2, 'hierba_alta');
  b.stamp('lupinos', 39, 4);
  b.stamp('flores_blancas', 35, 8);
  b.stamp('roca_gris', 40, 3);
  b.stamp('roca_peque', 38, 11);
  b.stamp('brotes', 42, 8);
  b.stamp('guijarros', 41, 12);
  // Jardín de Abril
  b.stamp('macizo_flores', 32, 9);
  b.stamp('flores_rosas', 27, 10);
  b.stamp('buzon_azul', 32, 7);
}

function paintSouthWest(b) {
  // Corrales de Wooloo: valla blanca con la puerta hacia el granero
  const p = PENS;
  const top = cells(p.x, p.y, p.w, 1).filter(([x]) => x !== p.gate.x);
  b.paint('valla_blanca', top);
  b.paint('valla_blanca', cells(p.x, p.y + p.h - 1, p.w, 1));
  b.paint('valla_blanca_v', cells(p.x, p.y + 1, 1, p.h - 2));
  b.paint('valla_blanca_v', cells(p.x + p.w - 1, p.y + 1, 1, p.h - 2));
  b.stamp('troncos', 16, 32);
  b.stamp('barriles', 9, 34);
  b.rect(null, 11, 33, 4, 2, 'flores_amarillas');
  b.stamp('tocon', 6, 33);
  b.stamp('arbol', 2, 32);
  b.stamp('flores_blancas', 7, 23);
  b.stamp('macizo_flores', 15, 27);
  b.stamp('cartel_madera', TOWN_SIGN.x, TOWN_SIGN.y); // el evento del cartel (b05_brontia.js) necesita su gráfico
}

function paintSouthEast(b) {
  b.stamp('poste_electrico', 29, 22); // entre la farola y la subestación, sin pisar ninguna
  b.stamp('barriles', 40, 35); // (el poste de 6 filas no cabía aquí: su sombra caía sobre la cara de la meseta)
  b.stamp('barrera_obras', 40, 23);
  b.stamp('macizo_flores', 26, 26);
  b.stamp('cajas_madera', 33, 34);
  b.stamp('banco', 26, 36);
  b.stamp('flores_blancas', 31, 36);
  b.stamp('brotes', 18, 36);
  b.stamp('roca_peque', 16, 36);
}

export function buildBrontia(b) {
  b.fill(null, 'cesped');
  paintBorders(b);
  paintStreets(b);
  for (const bd of Object.values(BUILDINGS)) b.stamp(bd.stamp, bd.x, bd.y);
  paintPlaza(b);
  paintNorthWest(b);
  paintNorthEast(b);
  paintSouthWest(b);
  paintSouthEast(b);
}

export { W, H };
