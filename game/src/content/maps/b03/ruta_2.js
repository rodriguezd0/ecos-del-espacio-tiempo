// Ruta 2 (docs/CAMPANA.md §1.4 y B03): pradera, estanque y puentes entre Villa Zaguán (norte, B02) y Ciudad
// Caudal (sur). Tileset 1 (Exterior1). Prados con un cercado de Wooloo, dos arroyos con puentes de tablones,
// el estanque (Caña Vieja; Nadar en la etapa F), el alto de la rampa de grava (Correr) con su mirador, el
// árbol de miel y la llegada a Caudal. Células C013 (bajo el puente), C015 (rampa) y C070 (estanque).
// Eventos: content/events/b03_ruta2.js · encuentros: content/encounters/b03.js.
import { ruta2Events } from '../../events/b03_ruta2.js';
import { RUTA_2 } from '../../encounters/b03.js';
import { linkIfReady, mapRegistered } from './pending_links.js';

export const W = 30;
export const H = 70;
/** Camino norte (Zaguán) y sur (Caudal): x 13–16. Caudal lo recibe en su x 30–33 (offset −17). */
export const PATH_X = Object.freeze([13, 16]);
export const CAUDAL_OFFSET = -17;
/** Puentes de tablones (x 13–15) sobre los dos arroyos. */
export const BRIDGES = Object.freeze([{ x: 13, y0: 15, y1: 18, stream: [16, 17] }, { x: 13, y0: 51, y1: 54, stream: [52, 53] }]);
/** Estanque (agua honda: Nadar) con embarcadero al oeste. */
export const POND = Object.freeze({ x: 18, y: 23, w: 10, h: 11, pier: { x: 17, y: 27, w: 3, h: 2 } });
/** Alto de la rampa: terraza con rampa de grava por la cara sur (Correr). */
export const HILL = Object.freeze({ x: 2, y: 34, w: 8, h: 8, ramp: [5, 6], rampY: [39, 42] });
/** Cercado de los Wooloo. */
export const PASTURE = Object.freeze({ x: 4, y: 3, w: 8, h: 7 });
/** Árbol de miel (stamp `arbol` 2×4; el evento está en el tronco). */
export const HONEY_TREE = Object.freeze({ x: 10, y: 34, event: { x: 10, y: 37 } });

const HAS_ZAGUAN = mapRegistered('villa_zaguan');

const t = (col, row) => 384 + row * 8 + col;
/** Puente de tablones vertical (Exterior1, filas 524–525), como el de la Ruta 1. */
const BRIDGE_ROWS = [[t(0, 524), t(1, 524), t(2, 524)], [t(0, 525), t(1, 525), t(2, 525)]];

export function rect(x, y, w, h) {
  const out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.push([x + i, y + j]);
  return out;
}
const minus = (cells, holes) => {
  const set = new Set(holes.map(([x, y]) => `${x},${y}`));
  return cells.filter(([x, y]) => !set.has(`${x},${y}`));
};

function paintBorders(b) {
  // Bordes de bosque (ancho par) con claros para que la pradera respire.
  const blocks = [
    ['bosque', 0, 0, 2, 70], ['bosque_mixto', 28, 0, 2, 70],
    ['bosque', 2, 0, 2, 2], ['bosque_pinos', 18, 0, 10, 2],
    ['bosque_mixto', 24, 12, 4, 6], ['bosque', 2, 12, 2, 6],
    ['bosque_pinos', 2, 47, 2, 12], ['bosque', 26, 36, 2, 10],
    ['bosque_mixto', 22, 58, 6, 12], ['bosque', 2, 62, 8, 8],
  ];
  for (const [brush, x, y, w, h] of blocks) b.paint(brush, rect(x, y, w, h));
}

const PATH = [
  ...rect(13, 0, 4, 15), // desde Zaguán hasta el primer puente
  ...rect(13, 19, 4, 5), // tras el puente
  ...rect(12, 24, 4, 11), // a la vera del estanque
  ...rect(12, 35, 7, 2), // quiebro al este junto al alto
  ...rect(15, 37, 4, 8),
  ...rect(13, 45, 6, 2), // vuelta al eje
  ...rect(13, 47, 4, 4), // hacia el segundo arroyo
  ...rect(13, 55, 4, 15), // hacia Caudal
  ...rect(9, 43, 6, 2), // ramal a la rampa
  ...rect(16, 27, 1, 2), // al embarcadero
];

function paintWater(b) {
  for (const br of BRIDGES) {
    const [s0, s1] = br.stream;
    const mask = rect(2, s0, 26, s1 - s0 + 1);
    const deck = new Set(rect(br.x, br.y0, 3, br.y1 - br.y0 + 1).map(([x, y]) => `${x},${y}`));
    b.paint('agua', mask.filter(([x, y]) => !deck.has(`${x},${y}`)));
    b.paint('orilla', mask);
    for (let y = br.y0; y <= br.y1; y++) BRIDGE_ROWS[y % 2].forEach((id, i) => b.set(1, br.x + i, y, id));
    // Bajo el tablero la capa 0 deja de ser agua (terrain tag): si no, al pulsar A a lo largo del puente saltaría
    // el aviso de nadar. Los tablones son opacos.
    for (let y = s0; y <= s1; y++) for (let i = 0; i < 3; i++) b.set(0, br.x + i, y, t(0, 0));
  }
  const p = POND;
  const pond = minus(rect(p.x, p.y, p.w, p.h), [[p.x, p.y], [p.x + p.w - 1, p.y], [p.x, p.y + p.h - 1], [p.x + p.w - 1, p.y + p.h - 1]]);
  b.paint('agua', pond);
  b.paint('orilla', pond);
  const pier = rect(p.pier.x, p.pier.y, p.pier.w, p.pier.h);
  b.paint('muelle', pier);
  // Igual que bajo los puentes: bajo los tablones del embarcadero la capa 0 deja de ser agua (si no, mirando a lo
  // largo del embarcadero saltaba el aviso de nadar). Los tablones son opacos.
  const inPond = new Set(pond.map(([x, y]) => `${x},${y}`));
  for (const [x, y] of pier) if (inPond.has(`${x},${y}`)) b.set(0, x, y, t(0, 0));
  for (const [x, y] of [[24, 25], [21, 32], [26, 30], [6, 16], [22, 17], [8, 53], [25, 52]]) b.stamp('roca_agua', x, y);
}

function paintHill(b) {
  const h = HILL;
  b.blob(null, rect(h.x, h.y, h.w, h.h), 'terraza');
  const [r0, r1] = h.rampY;
  b.paint('grava', rect(h.ramp[0], r0, h.ramp.length, r1 - r0 + 1));
  b.stamp('flores_blancas', h.x + 5, h.y + 2);
  b.stamp('macizo_flores', h.x + 1, h.y + 4);
  b.stamp('cartel_madera', h.x + 5, h.y + 1);
}

function paintPasture(b) {
  const p = PASTURE;
  b.paint('valla_blanca', rect(p.x, p.y, p.w, 1));
  b.paint('valla_blanca', rect(p.x, p.y + p.h - 1, p.w - 3, 1));
  b.paint('valla_blanca_v', rect(p.x, p.y + 1, 1, p.h - 2));
  b.paint('valla_blanca_v', rect(p.x + p.w - 1, p.y + 1, 1, p.h - 2));
  b.paint('cesped_claro', rect(p.x + 1, p.y + 1, p.w - 2, p.h - 2));
  b.stamp('troncos', p.x + 1, p.y + 1);
  b.stamp('tocon', p.x + 6, p.y + 1);
}

function paintDetails(b) {
  // Hierba alta (encuentros)
  for (const [x, y, w, h] of [[18, 3, 7, 7], [4, 23, 7, 8], [20, 37, 6, 8], [4, 56, 7, 5], [20, 47, 6, 4]]) b.rect(null, x, y, w, h, 'hierba_alta');
  // Saliente: atajo hacia el sur desde el alto
  b.rect(null, 3, 46, 8, 1, 'saliente');
  // Flores amarillas de la pradera
  b.paint('flores_amarillas', [...rect(17, 12, 3, 2), ...rect(5, 32, 3, 2), ...rect(19, 60, 3, 2), ...rect(8, 19, 3, 2)]);
  // Árbol de miel y árboles sueltos
  b.stamp('arbol', HONEY_TREE.x, HONEY_TREE.y);
  for (const [s, x, y] of [
    ['arbol', 21, 11], ['pino', 9, 11], ['arbol', 6, 11], ['pino', 17, 47], ['arbol', 6, 48],
    ['arbol', 18, 64], ['pino', 11, 60], ['arbol', 24, 18],
  ]) b.stamp(s, x, y);
  for (const [s, x, y] of [
    ['flores_rosas', 12, 3], ['flores_blancas', 17, 6], ['macizo_flores', 17, 21], ['flores_rosas', 17, 33],
    ['flores_blancas', 13, 38], ['macizo_flores', 10, 50], ['flores_rosas', 17, 58], ['flores_blancas', 12, 66],
    ['guijarros', 16, 18], ['guijarros', 12, 19], ['brotes', 20, 21], ['brotes', 11, 32], ['tocon', 21, 45],
    ['setas', 3, 21], ['lupinos', 5, 19], ['roca_gris', 20, 55], ['brotes', 24, 57], ['tocon', 9, 63],
    ['arbustos', 22, 20], ['roca_grande', 23, 45], ['lupinos', 18, 56], ['flores_blancas', 26, 22],
    ['macizo_flores', 4, 44], ['brotes', 19, 13], ['setas', 25, 11], ['guijarros', 17, 50], ['flores_rosas', 4, 13],
    ['flores_blancas', 21, 35], ['macizo_flores', 23, 34],
  ]) b.stamp(s, x, y);
  b.stamp('cartel_ruta', 17, 1);
  b.stamp('cartel_ruta', 17, 65);
  b.stamp('banco', 17, 60);
  b.stamp('tablon_anuncios', 10, 47);
}

export default {
  id: 'ruta_2',
  name: 'Ruta 2',
  tileset: 1,
  width: W,
  height: H,
  outdoor: true,
  bgm: 'Ruta 2',
  battleback: 'PraderaFlores',
  start: { x: 14, y: 2, dir: 2 },
  encounters: RUTA_2,

  build(b) {
    b.fill(null, 'cesped');
    paintBorders(b);
    b.paint('camino_arena', PATH);
    paintWater(b);
    paintHill(b);
    paintPasture(b);
    paintDetails(b);
  },

  connections: [
    { dir: 'south', to: 'ciudad_caudal', offset: CAUDAL_OFFSET },
    ...[linkIfReady('ruta_2', 'villa_zaguan')].filter(Boolean),
  ],

  events: ruta2Events({ zaguanOpen: HAS_ZAGUAN, pathX: PATH_X, pond: POND, hill: HILL, pasture: PASTURE, honeyTree: HONEY_TREE }),
};
