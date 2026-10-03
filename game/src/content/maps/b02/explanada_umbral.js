// Explanada del Umbral — la pradera enlosada delante de las Ruinas del Dintel (docs/CAMPANA.md B02, pasos 2–3 y
// 6–7). Tileset 7 (ExteriorBosqueCeleste) con el kit exterior de Pilar, 30×30. Al este, Villa Zaguán.
// Coordenadas en explanada_umbral_layout.js; guiones en content/events/b02_explanada.js.
import { zoneDefaults } from '../../services/zones.js';
import { W, H, ROCK, EXPLANADA_DOOR, PLAZA, EAST_PATH, ZAGUAN_OFFSET } from './explanada_umbral_layout.js';
import { BASE } from './ruinas_dintel_floors.js';
import { paintPillarExterior } from '../../stamps/pilarVertical.js';
import { EXPLANADA_ENCOUNTERS } from '../../encounters/b02.js';
import { explanadaEvents } from '../../events/b02_explanada.js';

function cells(x, y, w, h) {
  const out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.push([x + i, y + j]);
  return out;
}

function paintForest(b) {
  b.paint('bosque_mixto', [...cells(0, 0, ROCK.x, 14), ...cells(ROCK.x + ROCK.w + 1, 0, W - ROCK.x - ROCK.w - 1, 10)]);
  b.paint('bosque', [...cells(0, 14, 2, H - 14), ...cells(2, 26, 26, 4), ...cells(28, 16, 2, H - 16)]);
}

function paintRuin(b) {
  const d = EXPLANADA_DOOR;
  b.blob(null, cells(ROCK.x, ROCK.y, ROCK.w, ROCK.h), 'acantilado');
  // La columna se ve entera desde la explanada; el dintel antiguo conserva su escena de entrada.
  b.stamp('pilar_columna_quebrada', 10, 4);
  b.stamp('pilar_monolito', 19, 3);
  paintPillarExterior(b, { centerX: 15, doorY: 9 });
  b.stamp('pilar_dintel', d.dintel.x, d.dintel.y);
  // monolitos que flanquean la boca y columnas caídas al pie del macizo
  b.stamp('pilar_monolito', 10, 10);
  b.stamp('pilar_monolito', 19, 10);
  b.stamp('pilar_columna_quebrada', 12, 11);
  b.stamp('pilar_columna_quebrada', 18, 11);
  b.stamp('pilar_placa_unown', 24, 11);
  b.stamp('cartel_madera', 27, 12);
}

function paintPlaza(b) {
  const p = PLAZA;
  b.stamp('placa_piedra', p.x, p.y);
  b.stamp('placa_piedra', p.x + 6, p.y);
  b.stamp('placa_piedra', p.x, p.y + 3);
  b.stamp('placa_piedra', p.x + 6, p.y + 3);
  b.stamp('pilar_losa_eco', 15, 16);
  for (const [x, y] of [[p.x - 1, p.y - 4], [p.x + p.w, p.y - 4], [p.x - 1, p.y + 3], [p.x + p.w, p.y + 3]]) b.stamp('pilar_columna', x, y);
  b.stamp('pilar_glifo', 13, 15);
  b.stamp('pilar_glifo_2', 18, 18);
  // camino de arena desde Villa Zaguán (el mismo pincel que la calle del pueblo: sin costura en la conexión) y
  // tierra pisada bajo el dintel
  b.paint('camino_arena', cells(EAST_PATH.x0, EAST_PATH.y0, EAST_PATH.x1 - EAST_PATH.x0 + 1, EAST_PATH.y1 - EAST_PATH.y0 + 1));
  b.paint('camino_tierra', cells(14, 10, 3, 4));
}

/** Filas [y, x0, x1] → casillas (manchas de contorno irregular). */
function rows(list) {
  return list.flatMap(([y, x0, x1]) => cells(x0, y, x1 - x0 + 1, 1));
}

/** Hierba alta de los márgenes (encuentros de la tabla de Zaguán), con contorno irregular. */
const GRASS_WEST = rows([[18, 4, 8], [19, 3, 8], [20, 3, 8], [21, 3, 7], [22, 3, 7], [23, 4, 6]]);
const GRASS_EAST = rows([[18, 23, 26], [19, 23, 26], [20, 21, 26], [21, 21, 26], [22, 21, 25], [23, 22, 24]]);

function paintMeadow(b) {
  b.paint('hierba_alta', [...GRASS_WEST, ...GRASS_EAST]);
  b.paint('flores_azules', cells(4, 15, 3, 1));
  for (const [s, x, y] of [
    ['arbol', 2, 13], ['roca_turquesa', 26, 10], ['tocon', 9, 24], ['setas', 20, 24],
    ['lupinos', 12, 22], ['flores_blancas', 17, 23], ['flores_rosas', 23, 16], ['macizo_flores', 5, 25],
    ['roca_turquesa_peque', 26, 17], ['brotes', 11, 20], ['brotes', 19, 21],
    // restos de la obra antigua que asoman en la pradera y el linde del bosque
    ['pilar_columna_quebrada', 19, 22], ['tronco_caido_h', 15, 25], ['roca_gris', 6, 24], ['arbustos', 25, 24],
    ['guijarros', 10, 23], ['guijarros', 22, 25], ['flores_blancas', 8, 17], ['brotes', 27, 22],
  ]) b.stamp(s, x, y);
}

export default {
  id: 'explanada_umbral',
  ...zoneDefaults('explanada_umbral'),
  name: 'Explanada del Umbral',
  tileset: 7,
  width: W,
  height: H,
  outdoor: true,
  bgm: 'PrismaVilla2',
  battleback: 'Pradera',
  start: { x: EAST_PATH.x1, y: EAST_PATH.y0 + 1, dir: 4 },
  encounters: EXPLANADA_ENCOUNTERS,

  build(b) {
    b.fill(null, 'cesped');
    paintForest(b);
    paintMeadow(b);
    paintRuin(b);
    paintPlaza(b);
  },

  warps: EXPLANADA_DOOR.warps.map((w) => ({
    ...w, to: 'ruinas_dintel_base', tx: BASE.arrival.x, ty: BASE.arrival.y, dir: BASE.arrival.dir,
  })),

  connections: [{ dir: 'east', to: 'villa_zaguan', offset: -ZAGUAN_OFFSET }],

  events: explanadaEvents(),
};
