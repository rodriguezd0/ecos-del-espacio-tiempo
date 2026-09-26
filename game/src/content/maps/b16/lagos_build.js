// Construcción de los Lagos del Alma (tileset 1, Exterior1 con piezas de nieve y el kit exterior de Pilar). El calor
// del santuario mantiene verdes el islote y los prados de la orilla; más lejos, nieve y pinos nevados. Módulo puro.
import {
  W, H, ISLAND, SANCTUARY, BRIDGE, bridgeCells, waterCells, SENTIR_ISLET, SABER_ISLET, CLIFF_N, WATERFALL, PATH,
  MIRADOR, REFUGIO, CAMP, GRASS, rect, roundRect, NORTH_LEDGE,
} from './lagos_layout.js';

/** Pieza de terraza nevada: ID de la terraza de hierba + 503 filas (4024). */
const SN = (id) => id + 4024;

/**
 * Bosque de pinos nevados (Exterior1, pino_nevado 2×6 apilado cada 4 filas) y el hielo del puente: las losas gris
 * azuladas con bordillo blanco de las plazas de Ciudad Añil (Exterior1, filas 646–649; las mismas piezas que usa B15
 * en Boreal), que sobre el agua se leen como bloques de hielo prensado. Pasables, sin terrain tag.
 */
export const LAGOS_BRUSHES = Object.freeze({
  bosque_nevado: { forest: { trees: [[0, 563]], size: [2, 6], period: [2, 4] }, layer: 2, trunkLayer: 1, desc: 'Pinar nevado' },
  hielo_losas: { grid: [[5564, 5565], [5572, 5573]], layer: 2, desc: 'Bloques de hielo del puente' },
  /**
   * Acantilado nevado del norte: la terraza de muros finos con nieve de Exterior1 (las piezas de la `terraza` de hierba
   * desplazadas 503 filas, +4024 en el ID; las mismas que usa B15 en el Lago Viejo de Boreal).
   */
  terraza_nevada: {
    terrace: {
      rim: { w0: SN(824), w1: SN(817), mid: SN(818), e1: SN(819), e0: SN(828) },
      side: { w0: [SN(840)], w1: [SN(825), SN(833)], e1: [SN(827), SN(835)], e0: [SN(844)] },
      face: {
        w0: [SN(840), SN(848), SN(856)], w1: [SN(841), SN(849), SN(857)], mid: [SN(842), SN(850), SN(858)],
        e1: [SN(843), SN(851), SN(859)], e0: [SN(844), SN(852), SN(860)],
      },
    },
    layer: 1,
    desc: 'Terraza de nieve con cara de tierra (convexa)',
  },
  hielo_borde: { nine: 'ids', ids: [[5555, 5556, 5558], [5563, 0, 5566], [5579, 5580, 5582]], fill: 0, layer: 2, desc: 'Bordillo de hielo del puente' },
});

/** Prados verdes (calor del santuario): islote, orillas cercanas y los dos prados de hierba alta del sur. */
function greenMask() {
  const set = new Set();
  const add = (list) => { for (const [x, y] of list) set.add(`${x},${y}`); };
  add(rect(ISLAND.x0, ISLAND.y0, ISLAND.x1, ISLAND.y1));
  // (los prados acaban antes del pinar del sur: bajo los pinos sigue la nieve)
  add(roundRect(2, 41, 11, 53, 3));
  add(roundRect(17, 51, 27, 53, 2));
  add(roundRect(41, 48, 53, 53, 3));
  add(rect(SENTIR_ISLET.x0, SENTIR_ISLET.y0, SENTIR_ISLET.x1, SENTIR_ISLET.y1));
  add(rect(SABER_ISLET.x0, SABER_ISLET.y0, SABER_ISLET.x1, SABER_ISLET.y1));
  return (x, y) => set.has(`${x},${y}`);
}

function paintWater(b, water) {
  b.paint('agua', water);
  b.paint('orilla', water);
}

function paintSnow(b, water) {
  const wet = new Set(water.map(([x, y]) => `${x},${y}`));
  const green = greenMask();
  const near = (x, y) => {
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (wet.has(`${x + dx},${y + dy}`)) return true;
    return false;
  };
  const snow = b.cellsWhere((x, y) => !wet.has(`${x},${y}`) && !green(x, y) && !(near(x, y) && y > 6 && y < 42));
  // Fuera del mapa cuenta como nieve: sin borde de hierba en los lados (la costura con Boreal sigue nevada).
  const snowSet = new Set(snow.map(([x, y]) => `${x},${y}`));
  // Bajo los troncos del pinar también es nieve (no asoma césped): capa 0 nevada donde la nieve no tiene borde (las
  // casillas del borde del parche conservan el césped debajo: su canto suave se dibuja sobre él).
  const isSnow = (x, y) => snowSet.has(`${x},${y}`) || !b.inBounds(x, y);
  const inner = snow.filter(([x, y]) => [-1, 0, 1].every((dy) => [-1, 0, 1].every((dx) => isSnow(x + dx, y + dy))));
  b.paint('nieve', inner, { layer: 0 });
  b.paint('nieve_parche', snow, { mask: (x, y) => snowSet.has(`${x},${y}`) || !b.inBounds(x, y) });
  // matas nevadas sueltas sobre la nieve
  for (const [x, y] of [[5, 7], [49, 8], [8, 41], [49, 42]]) b.stamp('arbusto_nevado', x, y);
}

/** Lenguas de tierra entre los lagos: pinos nevados sueltos, rocas en la orilla y matas. */
function paintSpits(b) {
  for (const [s, x, y] of [
    ['pino_nevado_peque', 14, 12], ['roca_gris', 14, 20], ['arbusto_nevado', 13, 38], ['pino_nevado_peque', 14, 26],
    ['tocon_nevado', 15, 33], ['pino_nevado_peque', 45, 14], ['roca_gris', 45, 22], ['pino_nevado_peque', 45, 28],
    ['planta_nevada', 46, 35], ['roca_peque', 16, 36], ['flores_blancas', 15, 17], ['flores_rosas', 45, 18],
  ]) b.stamp(s, x, y);
  // rocas que asoman en el agua
  for (const [x, y] of [[20, 9], [40, 8], [6, 15], [54, 14], [11, 33], [49, 33], [34, 38], [21, 36]]) b.stamp('roca_agua', x, y);
  // orillas nevadas del norte, al pie del acantilado (a los lados del Lago del Querer): pinos, tocones y rocas
  for (const [s, x, y] of [
    ['pino_nevado_peque', 9, 6], ['tocon_nevado', 12, 8], ['roca_gris', 6, 9],
    ['pino_nevado_peque', 52, 6], ['tocon_nevado', 45, 7], ['roca_gris', 46, 9],
  ]) b.stamp(s, x, y);
}

function paintCliff(b) {
  b.blob(null, rect(CLIFF_N.x - 3, CLIFF_N.y - 4, CLIFF_N.x + CLIFF_N.w + 2, CLIFF_N.y + CLIFF_N.h - 1), 'terraza_nevada');
  // la cascada baja del borde del acantilado al Lago del Querer; arriba, el agua del deshielo
  const wf = WATERFALL;
  for (let y = 0; y < wf.y; y++) for (let x = wf.x; x < wf.x + wf.w; x++) { b.set(1, x, y, 0); b.set(2, x, y, 0); }
  b.paint('agua', rect(wf.x, 0, wf.x + wf.w - 1, wf.y - 1));
  b.paint('cascada', rect(wf.x, wf.y, wf.x + wf.w - 1, wf.y + wf.h - 1));
  // pinos nevados sobre el acantilado (la base queda en la cima)
  for (const [x, dy] of [[0, -1], [3, -2], [8, -1], [11, -2], [17, -1], [21, -2], [25, -1], [34, -2], [37, -1], [41, -2], [46, -1], [50, -2], [54, -1], [57, -2]]) {
    b.stamp(x % 2 ? 'pino_nevado_peque' : 'pino_nevado', x, dy - (x % 2 ? 0 : 2));
  }
  for (const [x, y] of [[5, 1], [14, 0], [31, 1], [43, 0], [51, 2]]) b.stamp('arbusto_nevado', x, y);
  // la repisa norte: nieve y rocas al pie del acantilado
  for (const x of [NORTH_LEDGE.x0 + 2, 26, 40]) b.stamp('roca_peque', x, NORTH_LEDGE.y);
}

function paintForest(b) {
  b.paint('bosque_nevado', rect(0, 6, 3, 59));
  b.paint('bosque_nevado', rect(56, 6, 59, 59));
  b.paint('bosque_nevado', rect(4, 54, 11, 59));
  b.paint('bosque_nevado', rect(16, 54, 55, 59));
  for (const [s, x, y] of [['pino_nevado_peque', 31, 50], ['arbusto_nevado', 33, 53]]) b.stamp(s, x, y);
  // lindes del bosque junto al camino: pinos pequeños y matas nevadas
  for (const [s, x, y] of [
    ['tocon_nevado', 26, 53],
    ['pino_nevado_peque', 4, 38], ['pino_nevado_peque', 52, 39],
  ]) b.stamp(s, x, y);
}

function paintIsland(b) {
  const S = SANCTUARY;
  const r = S.rock;
  b.blob(null, rect(r.x, r.y, r.x + r.w - 1, r.y + r.h - 1), 'acantilado');
  b.stamp('boquete', S.boquete.x, S.boquete.y);
  b.stamp('pilar_dintel', S.dintel.x, S.dintel.y);
  b.stamp('estrado', S.plaza.x, S.plaza.y);
  b.stamp('pilar_losa_eco', 27, 27);
  b.stamp('pilar_placa_unown', S.stele.x, S.stele.y);
  // monolitos y columnas del recinto; en lo alto de la roca, aristas y un monolito caído
  for (const [s, x, y] of [
    ['pilar_monolito', 23, 21], ['pilar_monolito', 31, 20], ['pilar_columna', 24, 25], ['pilar_columna', 31, 26],
    ['pilar_columna_quebrada', 36, 23], ['pilar_columna_quebrada', 23, 28], ['pilar_glifo', 26, 24], ['pilar_glifo_2', 30, 30],
    ['pilar_monolito', 28, 13], ['lupinos', 33, 30], ['flores_blancas', 36, 25], ['flores_rosas', 24, 23],
    ['flores_blancas', 35, 20], ['macizo_flores', 32, 16], ['lupinos', 25, 14],
  ]) b.stamp(s, x, y);
  // islotes de los lagos laterales
  b.stamp('pilar_columna_quebrada', SABER_ISLET.x0, SABER_ISLET.y0);
  b.stamp('flores_blancas', SENTIR_ISLET.x1, SENTIR_ISLET.y1);
  b.stamp('lupinos', SENTIR_ISLET.x0, SENTIR_ISLET.y0 - 1);
}

function paintBridge(b) {
  // Bloques de hielo con bordillo sobre el agua (capa 2, para que queden sobre la orilla); el tramo junto al islote
  // está fundido (hueco A).
  const ice = bridgeCells({ withGapA: false });
  b.paint('hielo_losas', ice, { layer: 2 });
  b.paint('hielo_borde', ice, { layer: 2 });
  // zócalos gastados a los lados de los huecos (lectura de Reconstrucción)
  for (const y of [BRIDGE.gapA.y0 - 1, BRIDGE.gapA.y1 + 1]) for (const x of [BRIDGE.x0, BRIDGE.x1]) b.stamp('pilar_zocalo_gastado', x, y);
}

function paintShore(b) {
  // Camino de Villa Boreal al mirador (tierra pisada con bordes de nieve) y el mirador enlosado
  // Las tres últimas filas del sendero quedan nevadas: enlazan con la calle nevada de Villa Boreal (costura del borde sur).
  const path = PATH.flatMap((r) => rect(r.x0, r.y0, r.x1, r.y1)).filter(([, y]) => y < H - 3);
  b.paint('arena_nevada', path);
  b.paint('arena_nevada', rect(31, 47, 38, 48)); // ramal al refugio
  b.stamp('placa_piedra', MIRADOR.x0, MIRADOR.y0);
  b.stamp('placa_piedra', MIRADOR.x0 + 6, MIRADOR.y0);
  b.stamp('placa_piedra', MIRADOR.x0 + 12, MIRADOR.y0 - 0);
  for (const [s, x, y] of [
    ['banco', 22, 45], ['banco', 33, 45], ['farola_hierro', 21, 41], ['farola_hierro', 35, 41],
    ['cartel_madera', 17, 52],
  ]) b.stamp(s, x, y);
  // Refugio de los observadores (al este del mirador)
  b.stamp('cabana_turquesa', REFUGIO.stamp.x, REFUGIO.stamp.y);
  for (const [s, x, y] of [['troncos', 43, 47], ['empalizada', 44, 43], ['farola_hierro', 36, 46]]) b.stamp(s, x, y);
  // Campamento del Consorcio (la tienda; el trípode y las cajas son eventos)
  b.stamp('tienda_campana', CAMP.tent.x, CAMP.tent.y);
  b.stamp('barrera_obras', 46, 42);
  // Prados: hierba alta, flores y rocas
  b.paint('hierba_alta', GRASS.filter(([x, y]) => !b.get(2, x, y))); // (no bajo las copas del pinar)
  for (const [s, x, y] of [
    ['flores_rosas', 11, 44], ['lupinos', 6, 52], ['roca_gris', 10, 52],
    ['flores_blancas', 42, 49], ['lupinos', 52, 51], ['roca_grande', 48, 48], ['flores_rosas', 26, 53],
    ['roca_gris', 6, 40], ['arbusto_nevado', 49, 40], ['tocon_nevado', 55, 46],
    ['planta_nevada', 20, 45], ['tocon_nevado', 16, 46], ['arbusto_nevado', 18, 43],
  ]) b.stamp(s, x, y);
}

export function buildLagos(b) {
  b.fill(null, 'cesped');
  const water = waterCells();
  paintWater(b, water);
  paintSnow(b, water);
  paintCliff(b);
  paintForest(b);
  paintSpits(b);
  paintIsland(b);
  paintShore(b);
  paintBridge(b);
}

export const SIZE = Object.freeze({ W, H });
