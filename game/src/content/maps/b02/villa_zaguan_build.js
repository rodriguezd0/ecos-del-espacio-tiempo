// Construcción de Villa Zaguán (MapBuilder + stamps de Exterior1). Separado de la definición del mapa para
// mantener los archivos pequeños. Módulo puro. Coordenadas: villa_zaguan_layout.js.
//
// Aldea de huertos a la salida del bosque: calle mayor norte-sur (de la Ruta 1 a la Ruta 2), camino del Dintel
// al oeste (explanada de las ruinas), plazuela ante el Centro Pokémon, Arboleda de los Nombres junto a la
// escuela, campanario sobre su terraza, calleja del sur con las casas, huertos vallados con granero, estanque y
// prados de hierba alta en las afueras.
import {
  W, H, BUILDINGS, ARBOLEDA, CAMPANARIO, POND, GRASS, HUERTOS, LANE, TOWN_EXITS, TOWN_DOORS,
} from './villa_zaguan_layout.js';

const T = (x, y) => 384 + y * 8 + x;

/** Rectángulo como lista de celdas. */
export function cells(x, y, w, h) {
  const out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.push([x + i, y + j]);
  return out;
}

/** Pinceles propios del pueblo (piezas de Exterior1 que la biblioteca no trae con nombre). */
export const ZAGUAN_BRUSHES = Object.freeze({
  // Valla rústica de madera (fila 583: poste, tramo, poste) y su versión vertical (columna 2, filas 584–586).
  valla_madera: { line: { ids: [T(4, 583), T(5, 583), T(6, 583)] }, layer: 2, desc: 'Valla rústica de madera (horizontal)' },
  valla_madera_v: { line: { ids: [T(2, 584), T(2, 585), T(2, 586)], axis: 'v' }, layer: 2, desc: 'Valla rústica de madera (vertical)' },
  // Tierra de cultivo con borde de hierba (filas 12–14, columnas 3–5).
  huerta: { nine: [3, 12], layer: 1, desc: 'Bancal de tierra labrada' },
});

function paintForest(b) {
  const n = TOWN_EXITS.north;
  const w = TOWN_EXITS.west;
  b.paint('bosque_mixto', [
    ...cells(0, 0, n.x0, 6), ...cells(n.x1 + 1, 0, W - n.x1 - 1, 6),        // franja norte (salida de la Ruta 1)
    ...cells(0, 6, 2, w.y0 - 6),                                             // borde oeste sobre el camino del Dintel
  ]);
  b.paint('bosque', [
    ...cells(0, w.y1 + 1, 2, H - w.y1 - 1),                                  // borde oeste bajo el camino
    ...cells(38, 6, 2, H - 6),                                               // borde este
  ]);
  b.paint('bosque_pinos', [...cells(2, 32, 16, 4), ...cells(22, 32, 16, 4)]); // linde sur (salida a la Ruta 2)
}

function paintStreets(b) {
  const n = TOWN_EXITS.north;
  const w = TOWN_EXITS.west;
  const doorPaths = [TOWN_DOORS.casa_dintel, TOWN_DOORS.zaguan_casa_vecina, TOWN_DOORS.zaguan_casa_huerto]
    .flatMap((d) => cells(d.x - 1, d.y + 1, 3, LANE.y - d.y - 1));
  b.paint('camino_arena', [
    ...cells(n.x0, 0, n.x1 - n.x0 + 1, H),                                   // calle mayor (norte-sur)
    ...cells(0, w.y0, n.x0, w.y1 - w.y0 + 1),                                // camino del Dintel (oeste)
    ...cells(n.x1 + 1, 15, 8, 4),                                            // plazuela del Centro
    ...cells(LANE.west[0], LANE.y, LANE.west[1] - LANE.west[0] + 1, LANE.h), // calleja del sur (oeste)
    ...cells(LANE.east[0], LANE.y, LANE.east[1] - LANE.east[0] + 1, LANE.h), // calleja del sur (este)
    ...doorPaths,
  ]);
}

function paintArboleda(b) {
  const a = ARBOLEDA;
  b.paint('cesped_claro', cells(a.area.x, a.area.y + 1, a.area.w, a.area.h - 1));
  b.stamp('arbol_alto', a.founder.x, a.founder.y);
  a.trees.forEach(([x, y], i) => b.stamp(i % 2 ? 'pino' : 'arbol', x, y));
  // placas con los nombres al pie de cada árbol (y la del Fundador, más grande)
  for (const [x, y] of a.trees) b.stamp('cartel_madera', x, y + 4);
  b.stamp('tablon_anuncios_2', a.founderPlaque.x, a.founderPlaque.y);
  b.stamp('flores_blancas', 14, 15);
  b.stamp('flores_rosas', 16, 11);
  b.stamp('macizo_flores', 11, 15);
}

function paintCampanario(b) {
  const c = CAMPANARIO;
  const t = c.terrace;
  b.blob(null, cells(t.x, t.y, t.w, t.h), 'terraza');
  b.stamp('escalera_terraza', c.stairs.x, c.stairs.y);
  b.stamp('capilla', c.chapel.x + 1, c.chapel.y);
  b.stamp('campana', c.bell.x, c.bell.y);
  b.paint('flores_amarillas', cells(t.x + 1, t.y + 4, 2, 1));
}

function paintHuertos(b) {
  const h = HUERTOS;
  // dos bancales labrados con hileras de brotes
  for (const x of [h.x + 1, h.x + 4]) {
    b.paint('huerta', cells(x, h.y + 1, 2, h.h - 2));
    for (let yy = h.y + 1; yy < h.y + h.h - 1; yy++) if (yy % 2) b.stamp('brotes', x + (yy % 4 === 1 ? 0 : 1), yy);
  }
  // valla rústica alrededor, con la cancela a la calleja (oeste, filas de la calleja)
  b.paint('valla_madera', cells(h.x, h.y, h.w, 1));
  b.paint('valla_madera', cells(h.x, h.y + h.h - 1, h.w, 1));
  b.paint('valla_madera_v', cells(h.x + h.w - 1, h.y + 1, 1, h.h - 2));
  b.paint('valla_madera_v', cells(h.x, h.y + 1, 1, LANE.y - h.y - 1));
  b.paint('valla_madera_v', cells(h.x, LANE.y + LANE.h, 1, h.y + h.h - 1 - LANE.y - LANE.h));
  b.stamp('barriles', 30, 20);
  b.stamp('troncos', 30, 16);
}

function paintSouth(b) {
  const p = POND;
  const water = cells(p.x, p.y, p.w, p.h - 1).concat(cells(p.x + 1, p.y + p.h - 1, p.w - 2, 1));
  b.paint('agua', water);
  b.paint('orilla', water);
  b.stamp('roca_agua', p.x + 4, p.y + 1);
  // prados de hierba alta con las esquinas redondeadas (sin bloques rectangulares)
  for (const g of GRASS) {
    const corner = (x, y) => (x === g.x || x === g.x + g.w - 1) && (y === g.y || y === g.y + g.h - 1);
    b.paint('hierba_alta', cells(g.x, g.y, g.w, g.h).filter(([x, y]) => !corner(x, y)));
  }
  // patio de Casilda: una columna quebrada que guarda «porque estaba ahí» y su buzón
  b.stamp('pilar_columna_quebrada', 2, 23);
  b.stamp('buzon_rojo', 9, 22);
  // prado al pie de los huertos: matas, setas y piedras del linde del pinar
  for (const [s, x, y] of [['arbustos', 32, 29], ['setas', 36, 31], ['roca_gris', 35, 29], ['tocon', 31, 31], ['guijarros', 34, 31]]) {
    b.stamp(s, x, y);
  }
}

function paintPlaza(b) {
  b.stamp('tablon_anuncios', 16, 20);
  b.stamp('banco', 27, 18);
  b.stamp('farola', 17, 10);
  b.stamp('farola', 22, 19);
  b.stamp('papelera', 30, 18);
  b.stamp('buzon_rojo', 22, 24);
  b.stamp('cartel_madera', 17, 2);
  b.stamp('cartel_madera', 17, 30);
  b.stamp('cartel_madera', 2, 15);
  b.stamp('flores_blancas', 22, 13);
  b.stamp('macizo_flores', 20, 21);
}

/** Florecillas y matojos sueltos sobre césped libre (deterministas). */
function scatterDetails(b) {
  const free = (x, y) => !b.get(1, x, y) && !b.get(2, x, y)
    && ![[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dy]) => b.get(1, x + dx, y + dy) || b.get(2, x + dx, y + dy));
  b.scatterStamps('flores_blancas', 2, 6, 36, 26, 8, { spacing: 3, onlyIf: free });
  b.scatterStamps('flores_rosas', 2, 6, 36, 26, 6, { spacing: 3, onlyIf: free });
  b.scatterStamps('brotes', 2, 6, 36, 26, 10, { spacing: 2, onlyIf: free });
}

export function buildZaguan(b) {
  b.fill(null, 'cesped');
  paintForest(b);
  paintStreets(b);
  paintArboleda(b);
  paintCampanario(b);
  for (const { stamp, x, y } of Object.values(BUILDINGS)) b.stamp(stamp, x, y);
  paintHuertos(b);
  paintSouth(b);
  paintPlaza(b);
  scatterDetails(b);
}
