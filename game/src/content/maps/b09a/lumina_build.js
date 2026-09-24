// Construcción de Ciudad Lúmina con el MapBuilder (tileset 3, Exterior2). Coordenadas: lumina_layout.js.
// Losas grises de ciudad con bordillo verde (capital cultural; Caudal usa adoquín de colores), terraza del museo con
// escalinata, plaza con rosetón, parque con estanque y hierba alta, vía del tren y bosque perimetral.
import { W, H, EXITS, STREETS, TERRACE, STAIRS, BUILDINGS, RAIL, YARD, PARK } from './lumina_layout.js';

const T = (x, y) => 384 + y * 8 + x;

/** Pinceles y piezas propias del mapa (tileset 3). */
export const LUMINA_BRUSHES = Object.freeze({
  losa_c: { tile: T(1, 475), variants: [T(2, 475), T(1, 476), T(2, 476)], chance: 0.35, layer: 0, desc: 'Losas grises de ciudad' },
  bordillo: { nine: [2, 458], inner: [0, 458], fill: 0, layer: 1, desc: 'Bordillo verde que enmarca la calle' },
});

export const LUMINA_STAMPS = Object.freeze({
  // Edificio clásico de frontón y columnas (filas 172–180 de Exterior2): el Museo de las Eras.
  museo_eras: { src: [0, 172, 8, 9], layer: 2, door: [4, 7], desc: 'Museo de las Eras (frontón, columnas y arco)' },
});

export function rect(x, y, w, h) {
  const out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.push([x + i, y + j]);
  return out;
}

const inMap = ([x, y]) => x >= 0 && y >= 0 && x < W && y < H;

function forests(b) {
  const blocks = [
    // Norte (detrás de los edificios del paseo; hueco del Mirador Sur en x 33–36)
    ['bosque', 0, 0, 2, 9], ['bosque_mixto', 0, 0, 12, 2], ['bosque', 12, 0, 4, 2], ['bosque', 16, 0, 8, 2], ['bosque_mixto', 24, 0, 8, 2],
    // (la columna del este empieza en x 39: el pino y el árbol del lado del camino ocupan x 37–38 sin apilarse)
    ['bosque', 39, 0, 2, 9], ['bosque_mixto', 48, 0, 2, 9], ['bosque', 37, 0, 12, 2], ['bosque_mixto', 50, 0, 8, 2],
    ['bosque', 70, 0, 2, 14], ['bosque_pinos', 58, 0, 12, 2],
    // Este (junto a la vía y hasta la avenida)
    ['bosque_pinos', 66, 17, 6, 12], ['bosque', 70, 34, 2, 24],
    // Oeste (entre la salida de la Ruta 8 y el parque)
    ['bosque', 0, 13, 2, 26], ['bosque_mixto', 0, 38, 2, 20],
    // Sur (hueco de la Puerta del Delta en x 34–37)
    ['bosque', 0, 58, 34, 6], ['bosque_mixto', 38, 58, 34, 6],
  ];
  for (const [brush, x, y, w, h] of blocks) b.paint(brush, rect(x, y, w, h).filter(inMap));
}

function pavement(b) {
  const cells = new Map();
  for (const [x, y, w, h] of Object.values(STREETS)) {
    for (const c of rect(x, y, w, h)) if (inMap(c)) cells.set(`${c[0]},${c[1]}`, c);
  }
  const list = [...cells.values()];
  // El césped claro del parque (capa 1) no debe asomar en el centro de la calle: el bordillo no toca su interior.
  for (const [x, y] of list) b.set(1, x, y, 0);
  b.paint('losa_c', list);
  b.paint('bordillo', list);
}

function terrace(b) {
  const t = TERRACE;
  b.paint('terraza', rect(t.x, t.y, t.w, t.h));
  b.stamp('escalera_terraza_ancha', STAIRS.x, STAIRS.y);
  // Explanada de losas delante del museo (sobre la terraza)
  b.paint('losa_c', rect(31, 22, 10, 3));
}

function water(b) {
  const [x, y, w, h] = PARK.pond;
  b.paint('estanque', rect(x, y, w, h));
}

function park(b) {
  const p = PARK;
  b.paint('cesped_claro', rect(p.x + 1, p.y + 1, p.w - 2, p.h - 2));
  // Senderos de tierra del parque
  b.paint('camino_tierra', [...rect(20, 38, 4, 4), ...rect(3, 46, 27, 3), ...rect(14, 41, 3, 5), ...rect(19, 49, 3, 8)]);
  for (const [x, y, w, h] of p.grass) b.paint('hierba_alta', rect(x, y, w, h));
}

function buildings(b) {
  for (const d of Object.values(BUILDINGS)) {
    b.stamp(d.stamp, d.x, d.y);
    // El stamp `restaurante` trae en su fila 0 una barra gris suelta (resto del mapa de Añil): se quita.
    if (d.stamp === 'restaurante') for (let i = 0; i < 5; i++) b.set(2, d.x + i, d.y, 0);
  }
}

function railway(b) {
  b.paint('valla_blanca', rect(RAIL.x0 - 1, RAIL.fenceN, RAIL.x1 - RAIL.x0 + 2, 1));
  b.paint('valla_blanca', rect(RAIL.x0 - 1, RAIL.fenceS, RAIL.x1 - RAIL.x0 + 2, 1));
}

function yard(b) {
  const y = YARD;
  b.paint('cesped_claro', rect(y.x + 1, y.y, y.w - 2, y.h - 1));
  b.paint('valla_blanca', rect(y.x, y.y + y.h - 1, y.w, 1));
  b.paint('valla_blanca_v', rect(y.x, y.y, 1, y.h - 1));
  for (const [s, x, yy] of [['comedero', 61, 3], ['abrevadero', 65, 3], ['arbol', 68, 3], ['flores_rosas', 60, 6], ['flores_blancas', 66, 7], ['brotes', 63, 7]]) b.stamp(s, x, yy);
}

function details(b, { northOpen }) {
  // Paseo del Mirador: farolas, jardineras y bancos frente al hotel y la guardería
  for (const [s, x, y] of [
    ['farola_rosa', 10, 9], ['farola_rosa', 31, 9], ['farola_rosa', 38, 9], ['farola_rosa', 49, 9], ['farola_rosa', 57, 9],
    ['jardinera_flores', 47, 4], ['jardinera_flores', 28, 3], ['arbol', 30, 3], ['arbol', 37, 4], ['flores_rosas', 29, 7],
    ['flores_blancas', 38, 7], ['papelera', 9, 8], ['buzon_rojo', 17, 7], ['arbol', 22, 2], ['arbol', 9, 2],
    ['cartel_madera', 32, 8], ['arbol', 44, 13],
  ]) b.stamp(s, x, y);
  if (!northOpen) b.stamp('verja_puerta', EXITS.north.gate.x, EXITS.north.gate.y);
  // Pinos a los lados del camino del Mirador (con bloqueos invisibles en los eventos: GATE_SIDES)
  b.stamp('pino', EXITS.north.x0 - 2, 0);
  b.stamp('pino', EXITS.north.x1 + 1, 0);
  // Terraza del museo: jardines simétricos, estatuas y farolas
  for (const [s, x, y] of [
    ['arbol', 26, 14], ['arbol', 29, 14], ['arbol', 41, 14], ['arbol', 44, 14], ['estatua', 27, 19], ['estatua_2', 43, 19],
    ['flores_rosas', 26, 22], ['flores_blancas', 28, 22], ['flores_rosas', 43, 22], ['flores_blancas', 45, 22],
    ['farola', 31, 20], ['farola', 40, 20], ['macizo_flores', 26, 24], ['macizo_flores', 44, 24], ['lupinos', 28, 18], ['lupinos', 40, 17],
  ]) b.stamp(s, x, y);
  // Plaza de las Eras
  for (const [s, x, y] of [
    ['roseton_plaza', 33, 31], ['fuente_grande', 22, 29], ['estatuas_gemelas', 44, 30], ['farola', 26, 29], ['farola', 45, 34],
    ['farola', 31, 34], ['farola', 40, 34], ['jardinera_flores', 48, 34],
    ['tablon_anuncios_2', 49, 29], ['papelera', 30, 30], ['banderines', 32, 36],
  ]) b.stamp(s, x, y);
  // Estación y vía
  for (const [s, x, y] of [['farola_rosa', 52, 20], ['arbol', 53, 23], ['arbustos', 55, 18], ['maquinas_expendedoras', 56, 26], ['cartel_madera', 57, 28]]) b.stamp(s, x, y);
  // Avenida del Este y sureste
  for (const [s, x, y] of [
    ['farola_rosa', 53, 34], ['farola_rosa', 69, 28], ['cartel_ruta', 67, 26], ['arbol', 51, 38], ['pino', 51, 42],
    ['jardinera_flores', 53, 41], ['papelera', 61, 44], ['farola', 38, 44], ['farola', 69, 44], ['seto_corto', 60, 38],
  ]) b.stamp(s, x, y);
  // Jardín de la galería (entre la plaza y los almacenes) y jardín del barrio del oeste
  b.stamp('galeria_arte', 43, 39);
  for (const [s, x, y] of [
    ['arbol', 39, 39], ['jardinera_flores', 39, 44], ['flores_rosas', 50, 41], ['flores_blancas', 49, 43], ['pino', 50, 44],
    ['seto_corto', 42, 46], ['seto_corto', 47, 46], ['seto_largo', 4, 35], ['arbol', 14, 34], ['flores_blancas', 7, 33],
  ]) b.stamp(s, x, y);
  // Barrio del oeste
  for (const [s, x, y] of [
    ['arbol', 9, 26], ['arbol', 16, 26], ['pino', 18, 30], ['jardinera_flores', 13, 32], ['flores_rosas', 10, 32],
    ['farola_rosa', 8, 21], ['arbustos', 16, 34], ['arbol', 2, 32], ['macizo_flores', 5, 34], ['buzon_azul', 19, 24],
  ]) b.stamp(s, x, y);
  // Sur: arco de la Puerta del Delta y bloques del barrio de los almacenes
  b.stamp('arco_puente', 32, 55);
  for (const [s, x, y] of [['arbol', 38, 52], ['arbol', 65, 52], ['pino', 68, 54], ['farola', 33, 53], ['farola', 38, 53], ['cartel_madera', 38, 57]]) b.stamp(s, x, y);
}

function parkDetails(b) {
  const m = PARK.monument;
  b.stamp('estatuas_gemelas', m.x, m.y);
  for (const [s, x, y] of [
    ['arbol', 3, 38], ['arbol', 9, 38], ['arbol', 26, 38], ['pino', 29, 41], ['arbol', 28, 44], ['arbol', 3, 50],
    ['pino', 6, 53], ['arbol', 9, 54], ['arbol', 25, 44], ['pino', 18, 44], ['arbol', 29, 51], ['arbustos', 22, 56],
    ['lupinos', 15, 38], ['flores_rosas', 11, 44], ['flores_blancas', 18, 42], ['macizo_flores', 23, 45],
    ['tocon', 5, 45], ['farola', 17, 45], ['farola', 26, 49], ['tocon', 8, 44], ['seto_corto', 27, 46],
    ['columpio', 23, 46], ['flor_amarilla_grande', 20, 44], ['flor_lila_grande', 21, 44],
  ]) b.stamp(s, x, y);
}

/** Construcción completa. `opts.northOpen` quita la verja del Mirador Sur cuando el mapa existe. */
export function buildLumina(b, { northOpen = false } = {}) {
  b.fill(null, 'cesped');
  forests(b);
  park(b);
  pavement(b);
  terrace(b);
  water(b);
  yard(b);
  railway(b);
  buildings(b);
  parkDetails(b);
  details(b, { northOpen });
}
