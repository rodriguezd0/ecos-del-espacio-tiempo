// Construcción de la Ruta 9 y el Bosque Neblino (tileset 7, 50×60): bosque lila y denso de pinos morados (con
// algún rodal verde), hierba alta morada y cristales. Se definen los CLAROS, los SENDEROS y las VEREDAS (pasos sin
// camino pintado) y el resto se rellena de bosque con árboles completos (paint.js#forestFill). El sendero serpentea
// de norte (Ruta 10) a sur (Aldea Mnemos); el Albo baja por el oeste haciendo meandros y gira al este bajo un puente
// de troncos. Claros: el escondite de Nilo junto al río (T10, de noche), la loma del tronco hueco (C047, Trepar), el
// estanque de musgo, la pradera del este, el claro de la hoguera (descanso), la repisa de cristal (C048, Trepar), el
// claro del santuario musgoso (Lopunnita), las praderas del suroeste y del sur y el rincón escondido del sureste.
// Los detalles se colocan con paint.js#decorate: nunca sustituyen árboles, caminos, orillas ni hierba alta, ni tapan
// eventos o sus accesos. Coordenadas en ./layout.js (NEBLINO).
import { NEBLINO } from './layout.js';
import { rect, union, forestFill, fillGaps, openMask, decorate } from './paint.js';
import { neblinoEvents } from '../../events/b11_neblino.js';

const N = NEBLINO;
export { rect };

const t = (col, row) => 384 + row * 8 + col;
/** Puente de troncos vertical de la Ruta 1 (tablones con barandilla, filas 524–525 del tileset original). */
const BRIDGE = [[t(0, 524), t(1, 524), t(2, 524)], [t(0, 525), t(1, 525), t(2, 525)]];

/**
 * El Albo: entra por el norte en x 7–10 (la misma x que en la Ruta 10), baja con meandros y gira al este; bajo el
 * puente (x 23–25) corre por las filas 30–32.
 */
export const RIVER_CELLS = Object.freeze(union(
  rect(7, 0, 10, 7), rect(6, 8, 9, 13), rect(7, 14, 10, 21), rect(8, 22, 11, 28),
  rect(8, 29, 18, 32), rect(19, 30, 28, 32), rect(29, 31, 36, 33), rect(37, 30, 43, 32), rect(44, 29, 49, 31),
));
/** Rocas que asoman en el agua (siempre en casillas interiores del cauce). */
const RIVER_ROCKS = [[8, 5], [7, 11], [9, 18], [9, 25], [13, 31], [33, 32], [40, 31], [47, 30]];

/** Sendero principal (norte → sur). */
export const PATH_CELLS = Object.freeze(union(
  rect(N.north.x0, 0, N.north.x1, 9), // desde la Ruta 10
  rect(20, 8, 28, 11), // recodo al este
  rect(25, 11, 28, 20),
  rect(22, 19, 28, 22), // recodo al oeste
  rect(22, 22, 25, 28), // hacia el puente
  rect(23, 34, 26, 40), // tras el puente
  rect(N.south.x0, 40, N.south.x1, N.height - 1), // hacia Mnemos
));

/** Veredas secundarias (camino pintado). */
export const SIDE_PATHS = Object.freeze(union(
  rect(15, 17, 21, 18), // al escondite de Nilo
  rect(29, 11, 35, 12), // a la loma del tronco hueco
  rect(27, 42, 29, 43), // del sendero al claro de la hoguera
  rect(36, 43, 41, 44), // del claro a la repisa de cristal
  rect(17, 46, 21, 47), // al claro del santuario
));

/**
 * Claros (sin árboles), con los bordes alineados a las parejas de columnas del bosque (x0 par, x1 impar) para que
 * el bosque llegue hasta ellos sin franjas de césped sueltas. El resto del bosque solo deja la cuneta del sendero.
 */
export const CLEARINGS = Object.freeze({
  entrance: rect(18, 0, 25, 2),
  meadowNW: rect(12, 1, 19, 7),
  nilo: union(rect(10, 12, 13, 12), rect(10, 13, 17, 20)),
  hollow: rect(30, 1, 39, 12),
  pond: rect(40, 1, 47, 8),
  meadowE: rect(32, 13, 45, 21),
  camp: rect(26, 38, 37, 46),
  crystal: rect(36, 34, 47, 45),
  shrine: rect(8, 41, 17, 50),
  meadowSW: rect(10, 35, 19, 40),
  meadowS: rect(28, 47, 35, 55),
  exit: rect(18, 55, 29, 59),
  hideout: rect(40, 48, 46, 54),
});

/** Veredas sin camino pintado entre claros (pasos de hierba). */
export const TRAILS = Object.freeze(union(
  rect(25, 50, 28, 53), // del sendero a la pradera del sur
  rect(42, 45, 45, 48), // de la repisa de cristal al rincón escondido
));

/** Casillas que ningún detalle puede ocupar: caminos, veredas y cada evento con su entorno (y la vista de los entrenadores). */
function reservedCells() {
  const cells = [...PATH_CELLS, ...SIDE_PATHS, ...TRAILS];
  const DV = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };
  for (const e of neblinoEvents({ mnemosOpen: true })) {
    if (e.type === 'zygardeCell') { cells.push([e.x, e.y]); continue; }
    const visible = e.type || e.sprite || e.pages?.some((p) => p.sprite) || e.trigger === 'action';
    if (!visible) continue;
    for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) cells.push([e.x + dx, e.y + dy]);
    if (e.type === 'trainer') {
      const [vx, vy] = DV[e.dir] || [0, 1];
      for (let i = 1; i <= (e.sight || 4); i++) cells.push([e.x + vx * i, e.y + vy * i]);
    }
  }
  for (const w of [N.hollow, N.crystal]) cells.push(w.from, w.to, [w.from[0], w.from[1] - 1]);
  return openMask([cells], 0);
}

function forests(b, reserved) {
  const areas = openMask([RIVER_CELLS, TRAILS, ...Object.values(CLEARINGS)], 0);
  const verge = openMask([PATH_CELLS, SIDE_PATHS], 1); // cuneta de una casilla a cada lado del sendero
  const open = (x, y) => areas(x, y) || verge(x, y) || reserved(x, y);
  forestFill(b, {
    width: N.width, height: N.height, seed: 11, maxRun: 22, open,
    brushes: ['bosque_morado', 'bosque_morado', 'bosque_morado', 'bosque_morado', 'bosque_mixto'],
    small: ['pino_morado_peque', 'arbol_morado_peque'],
    fringe: ['arbustos'],
  });
  fillGaps(b, {
    width: N.width, height: N.height, open, seed: 11,
    stamps: ['arbustos', 'arbustos', 'arbustos', 'cristal_grande', 'roca_turquesa'],
  });
}

function river(b) {
  b.paint('agua', RIVER_CELLS);
  b.paint('orilla', RIVER_CELLS);
  const br = N.bridge;
  for (let y = br.y0; y <= br.y1; y++) BRIDGE[y % 2].forEach((id, i) => b.set(1, br.x0 + i, y, id));
  for (const [x, y] of RIVER_ROCKS) b.stamp('roca_agua', x, y);
}

function paths(b) {
  b.paint('camino_tierra', PATH_CELLS.filter(([, y]) => y < N.bridge.y0 || y > N.bridge.y1));
  b.paint('camino_tierra', SIDE_PATHS);
}

function terraces(b) {
  const h = N.hollow;
  b.blob(null, rect(h.x0, h.y0, h.x1, h.y1), 'terraza');
  const c = N.crystal;
  b.blob(null, rect(c.x0, c.y0, c.x1, c.y1), 'terraza');
}

/**
 * Hierba alta morada (encuentros) en manchas de bordes irregulares, solo sobre suelo libre (no se vacía alrededor
 * de los eventos: un objeto oculto no debe delatarse por un hueco en la hierba). Nada de hierba al norte de la franja
 * de niebla (fila 5): esas casillas se pisan desde la Ruta 10 baja antes del P5, con un equipo de nivel ~5, y las
 * tablas del Neblino son de nivel 37–43.
 */
function grass(b) {
  const patches = union(
    rect(12, 6, 17, 7), rect(13, 8, 16, 8), rect(18, 6, 18, 7), // pradera del noroeste (bajo la franja de niebla)
    rect(33, 14, 38, 17), rect(34, 13, 37, 13), rect(36, 18, 43, 21), rect(37, 22, 40, 22), // pradera del este
    rect(12, 19, 14, 20), rect(11, 20, 11, 20), rect(15, 21, 16, 21), // junto al escondite
    rect(12, 37, 17, 41), rect(13, 36, 16, 36), rect(11, 39, 11, 40), // pradera del suroeste
    rect(29, 49, 34, 53), rect(30, 48, 33, 48), rect(31, 54, 33, 54), // pradera del sur
    rect(41, 49, 43, 52), rect(40, 50, 40, 51), // rincón escondido
  );
  const free = patches.filter(([x, y]) => !b.get(1, x, y) && !b.get(2, x, y));
  b.paint('hierba_alta_morada', free);
}

function clearings(b) {
  // Estanque de musgo morado en el claro del nordeste y flores azules en la pradera del noroeste.
  b.rect(null, 40, 3, 5, 4, 'estanque_morado');
  b.rect(null, 14, 3, 3, 2, 'flores_azules');
  // Claro de la hoguera: césped claro de forma redondeada alrededor del fuego.
  const f = N.camp.fire;
  b.paint('cesped_claro', union(rect(f.x - 3, f.y - 3, f.x + 3, f.y + 3), rect(f.x - 4, f.y - 2, f.x + 4, f.y + 2), rect(f.x - 2, f.y - 4, f.x + 2, f.y + 4)));
  // Santuario: corro de flores azules alrededor de la piedra musgosa.
  const s = N.shrine;
  b.paint('cesped_claro', union(rect(s.x - 3, s.y - 2, s.x + 3, s.y + 2), rect(s.x - 2, s.y - 3, s.x + 2, s.y + 3)));
  for (const [x, y] of [[s.x - 4, s.y - 3], [s.x + 3, s.y - 3], [s.x - 4, s.y + 2], [s.x + 3, s.y + 2]]) b.rect(null, x, y, 2, 2, 'flores_azules');
}

/** Piezas que describen los eventos de examinar (tronco hueco, piedra del santuario, cristal de Nilo). */
function landmarks(b) {
  const h = N.hollow;
  b.stamp('tocon_gigante', h.x0 + 2, h.y0 + 2);
  b.stamp('tocon_gigante', N.shrine.x - 1, N.shrine.y - 1);
  b.stamp('cristal_grande', 13, 15);
  b.stamp('portal_raices', 11, 12);
}

function details(b, reserved) {
  const opts = { avoid: reserved };
  // Claro de la hoguera: leña, troncos y un cristal sobre el césped claro.
  decorate(b, [
    ['tronco_caido_h', 29, 39], ['troncos', 34, 39], ['tronco_caido_v', 35, 42], ['tocon', 28, 44], ['cristal_grande', 29, 45],
  ], { ...opts, over: [1] });
  decorate(b, [
    // Vestigios, cristales y rocas.
    ['cristal_grande', 46, 6], ['cristal_grande', 46, 36], ['roca_turquesa', 40, 36],
    ['roca_turquesa_peque', 15, 50], ['roca_turquesa_peque', 45, 49], ['cristal_grande', 44, 53], ['cristal_grande', 18, 38],
    // Tocones y troncos.
    ['tocon', 44, 19], ['tocon', 12, 50], ['tronco_caido_v', 45, 13], ['tocon', 19, 36], ['tocon', 31, 13],
    // Matas y setas.
    ['arbustos', 36, 35], ['arbustos', 40, 53], ['setas', 47, 1],
    ['setas', 30, 3], ['setas', 46, 52], ['setas', 45, 21], ['setas', 11, 38], ['setas', 26, 26],
    ['setas', 31, 55], ['setas', 15, 42], ['setas', 36, 41], ['setas', 18, 57],
  ], opts);
  decorate(b, [
    // Flores (capa 1): solo sobre césped libre.
    ['lupinos', 40, 15], ['flor_lila_grande', 47, 3], ['flor_lila_grande', 17, 2], ['flores_rosas', 12, 4],
    ['flores_blancas', 14, 2], ['flor_lila_grande', 19, 4], ['flor_lila_grande', 44, 13], ['flor_lila_grande', 20, 25],
    ['flor_lila_grande', 43, 54],
    ['brotes', 23, 16], ['flores_blancas', 27, 24], ['brotes', 27, 29], ['flores_blancas', 31, 47], ['guijarros', 26, 45],
    ['flores_blancas', 14, 13], ['flores_rosas', 37, 41], ['brotes', 25, 57], ['guijarros', 29, 22],
    ['flores_blancas', 18, 2], ['brotes', 34, 38], ['flores_rosas', 20, 44], ['flores_blancas', 44, 49],
    ['flores_blancas', 35, 21], ['brotes', 19, 35],
  ], opts);
  b.stamp('cartel_madera', 19, 1);
  b.stamp('cartel_madera', 26, 56);
}

export function buildNeblino(b) {
  const reserved = reservedCells();
  b.fill(null, 'cesped');
  terraces(b);
  forests(b, reserved);
  river(b);
  paths(b);
  clearings(b);
  landmarks(b);
  grass(b);
  details(b, reserved);
}
