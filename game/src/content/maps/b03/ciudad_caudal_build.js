// Construcción de Ciudad Caudal con el MapBuilder (tileset 3, Exterior2). Coordenadas: caudal_layout.js.
// Suelo de adoquín con bordillo (como la Ciudad Azulona de Añil), el Río Albo con orilla de hierba, canales de
// agua quieta, puentes (dorado N–S y de tablones E–O), pasarelas de la Esclusa mayor y los edificios.
import {
  W, H, RIVER, CANALS, BRIDGES, LOCK, BUILDINGS, NORTH_ENTRY, SOUTH_EXIT, EAST_EXIT, WEST_EXIT, PROMENADE, SPOTS,
} from './caudal_layout.js';

const T = (x, y) => 384 + y * 8 + x;

/** Pinceles propios del mapa (tileset 3). */
export const CAUDAL_BRUSHES = Object.freeze({
  adoquin_c: { pattern: [0, 456, 4, 2], layer: 0, desc: 'Adoquín de colores (mosaico 4×2)' },
  bordillo: { nine: [2, 458], inner: [0, 458], fill: 0, layer: 1, desc: 'Bordillo verde que enmarca el adoquín' },
});

export function rect(x, y, w, h) {
  const out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.push([x + i, y + j]);
  return out;
}
const span = (x0, x1, y0, y1) => rect(x0, y0, x1 - x0 + 1, y1 - y0 + 1);

// ── Piezas de puente ────────────────────────────────────────────────────────────────────────
const GOLD = { top: 333, mid: [334, 335], bot: 336, shadow: 337 };
const PLANK = { cols: [5, 6, 7], rows: { top: 266, walk: 267, bot: 268 }, shadow: T(5, 104) };
const DOCK = { cols: [0, 1, 2], top: 478, body: [480, 481], bot: 484 };

/** Puente dorado N–S de 7 columnas (postes en los bordes) entre y0 e y1 (extremos sobre tierra). */
function goldenBridge(b, x, y0, y1) {
  for (let y = y0; y <= y1; y++) {
    const row = y === y0 ? GOLD.top : (y === y1 ? GOLD.bot : GOLD.mid[(y - y0 - 1) % 2]);
    for (let i = 0; i < 7; i++) b.set(2, x + i, y, T(i, row));
  }
}

/** Puente de tablones E–O: barandilla (y), dos filas de paso (y+1, y+2), barandilla (y+3) y sombra. */
function plankBridge(b, y, x0, x1) {
  const rows = [PLANK.rows.top, PLANK.rows.walk, PLANK.rows.walk, PLANK.rows.bot];
  rows.forEach((r, j) => {
    for (let x = x0; x <= x1; x++) {
      const col = x === x0 ? PLANK.cols[0] : (x === x1 ? PLANK.cols[2] : PLANK.cols[1]);
      b.set(2, x, y + j, T(col, r));
    }
  });
}

/** Pasarela de tablones N–S de 3 de ancho (muelle) entre y0 e y1. */
function dockWalk(b, x, y0, y1) {
  for (let y = y0; y <= y1; y++) {
    const row = y === y0 ? DOCK.top : (y === y1 ? DOCK.bot : DOCK.body[(y - y0) % 2]);
    for (let i = 0; i < 3; i++) b.set(2, x + i, y, T(DOCK.cols[i], row));
  }
}

// ── Capas ───────────────────────────────────────────────────────────────────────────────────
function forests(b) {
  const blocks = [
    // Norte (troncos en y 3) con hueco para la entrada, el sendero de la ribera y las casas del paseo
    ['bosque', 6, 0, 4, 4], ['bosque_mixto', 16, 0, 12, 4], ['bosque', 36, 0, 4, 6], ['bosque_mixto', 48, 0, 16, 6],
    // Oeste y este (el oeste queda cerrado de y 14 a 55: el único paso a la Ruta 3 es el sendero de la ribera)
    ['bosque', 0, 14, 2, 16], ['bosque', 0, 30, 2, 14], ['bosque', 0, 44, 2, 12], ['bosque_mixto', 62, 6, 2, 22], ['bosque_mixto', 62, 32, 2, 24],
    // Sur (el hueco de x 44–47 es la Senda del Mirador)
    ['bosque', 2, 52, 20, 4], ['bosque_mixto', 22, 52, 22, 4], ['bosque', 54, 48, 8, 8],
  ];
  for (const [brush, x, y, w, h] of blocks) b.paint(brush, rect(x, y, w, h));
}

/** Celdas de adoquín (calles, paseos, plaza, muelles). */
function pavementCells() {
  const cells = [
    ...span(NORTH_ENTRY.x0, NORTH_ENTRY.x1, NORTH_ENTRY.paveY, 8), // entrada desde la Ruta 2 (desde el arco)
    ...span(3, PROMENADE.x1, PROMENADE.y0, PROMENADE.y1), // Paseo del Albo (orilla norte), desde el sendero de la ribera
    ...span(11, 13, 7, 7), ...span(43, 45, 7, 7), // delante de las puertas del paseo
    ...span(2, 48, 14, 15), // paseo de la orilla sur (el bosque del oeste lo cierra)
    ...span(16, 46, 16, 33), // plaza mayor
    ...span(2, 7, 25, 39), ...span(3, 7, 24, 24), // calle de los molinos (orilla oeste)
    ...span(11, 16, 25, 29), // calle de los molinos (orilla este)
    ...span(11, 47, 38, 39), ...span(18, 47, 34, 37), // muelle del Mercado fluvial
    ...span(22, 47, 43, 51), // Barrio bajo
    ...span(SOUTH_EXIT.x0, SOUTH_EXIT.x1, 43, 50), // hacia la Senda del Mirador (luego, camino de tierra)
    ...span(13, 21, 49, 50), // paseo del Jardín del Canal
    ...span(53, 59, EAST_EXIT.y0 - 1, EAST_EXIT.y1 + 1), // Camino de la Vega (Ruta 4; luego, camino de tierra)
    ...span(53, 60, 20, 27), // vivienda del este
    ...span(53, 61, 32, 47), // explanada de la estación
  ];
  return cells;
}

/** Zonas ajardinadas dentro de la plaza y del barrio (césped encima del adoquín). */
const LAWNS = [
  [25, 26, 4, 5], [34, 26, 3, 5], [25, 17, 3, 2], [34, 17, 3, 2], [23, 44, 4, 4],
];

function water(b) {
  const r = [...span(RIVER.h.x0, RIVER.h.x1, RIVER.h.y0, RIVER.h.y1), ...span(RIVER.v.x0, RIVER.v.x1, RIVER.v.y0, RIVER.v.y1)];
  b.paint('agua', r);
  b.paint('orilla', r);
  const c = [...span(CANALS.mills.x0, CANALS.mills.x1, CANALS.mills.y0, CANALS.mills.y1),
    ...span(CANALS.market.x0, CANALS.market.x1, CANALS.market.y0, CANALS.market.y1)];
  b.paint('estanque', c);
}

/** Agua sin terrain tag para debajo de los tableros (como bajo el puente de la Ciudad Azulona de Añil). */
const DECK_WATER = T(1, 639);

/** Celdas de agua (río y canales) del mapa. */
function waterSet() {
  const set = new Set();
  const add = (x0, x1, y0, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set.add(`${x},${y}`); };
  add(RIVER.h.x0, RIVER.h.x1, RIVER.h.y0, RIVER.h.y1);
  add(RIVER.v.x0, RIVER.v.x1, RIVER.v.y0, RIVER.v.y1);
  for (const c of Object.values(CANALS)) add(c.x0, c.x1, c.y0, c.y1);
  return set;
}

/**
 * Bajo los tableros (puentes, pasarelas y embarcadero) el agua deja de ser «agua» para el motor: si no, al pulsar A
 * mirando a lo largo del puente saltaría el aviso de nadar (el terrain tag se lee de la capa 0).
 */
function dryUnderDecks(b, cells) {
  const water = waterSet();
  for (const [x, y] of cells) {
    if (!water.has(`${x},${y}`)) continue;
    b.set(0, x, y, 0);
    b.set(1, x, y, DECK_WATER);
  }
}

function bridges(b) {
  const e = BRIDGES.entrance;
  const m = BRIDGES.market;
  goldenBridge(b, e.x, e.y0, e.y1);
  goldenBridge(b, m.x, m.y0, m.y1);
  plankBridge(b, BRIDGES.mills.y, BRIDGES.mills.x0, BRIDGES.mills.x1);
  plankBridge(b, BRIDGES.east.y, BRIDGES.east.x0, BRIDGES.east.x1);
  for (const w of LOCK.walks) dockWalk(b, w.x, w.y0, w.y1);
  const p = SPOTS.pier;
  dockWalk(b, p.x, p.y, p.y + p.h - 1); // embarcadero del mercado
  // Solo bajo el tablero que se pisa: bajo las barandillas (medio transparentes) sigue el agua del río, sin la franja
  // de agua clara que se veía a los lados del puente (la barandilla ya impide nadar desde el puente, waterAccess.js).
  dryUnderDecks(b, [
    ...span(e.x + 1, e.x + 5, e.y0, e.y1), ...span(m.x + 1, m.x + 5, m.y0, m.y1),
    ...span(BRIDGES.mills.x0, BRIDGES.mills.x1, BRIDGES.mills.y + 1, BRIDGES.mills.y + 2),
    ...span(BRIDGES.east.x0, BRIDGES.east.x1, BRIDGES.east.y + 1, BRIDGES.east.y + 2),
    ...LOCK.walks.flatMap((w) => span(w.x, w.x + 2, w.y0, w.y1)),
    ...span(p.x, p.x + p.w - 1, p.y, p.y + p.h - 1),
  ]);
}

function buildings(b) {
  for (const k of Object.keys(BUILDINGS)) {
    const d = BUILDINGS[k];
    b.stamp(d.stamp, d.x, d.y);
  }
  // El stamp `restaurante` trae en su fila 0 una barra gris suelta (resto del mapa de Añil): se quita.
  const t = BUILDINGS.taberna;
  for (let i = 0; i < 5; i++) b.set(2, t.x + i, t.y, 0);
}

function details(b) {
  b.stamp('arco_puente', NORTH_ENTRY.gate.x, NORTH_ENTRY.gate.y); // puerta de la ciudad (entrada desde la Ruta 2)
  // Plaza: rosetón, farolas, bancos, estatuas y jardineras
  b.stamp('roseton_plaza', 29, 20);
  for (const [s, x, y] of [
    ['farola', 27, 17], ['farola', 35, 17], ['farola', 28, 27], ['farola', 32, 27], ['farola_rosa', 16, 14], ['farola_rosa', 46, 14],
    ['jardinera_flores', 25, 27], ['jardinera_flores', 34, 27], ['estatua', 26, 22], ['estatua_2', 35, 22],
    ['papelera', 33, 31], ['buzon_rojo', 24, 23], ['fuente_grande', 18, 28], ['arbol', 22, 28], ['pino', 42, 32],
    ['flores_rosas', 25, 17], ['flores_blancas', 26, 18], ['flores_rosas', 36, 18], ['flores_blancas', 34, 17],
    ['tablon_anuncios_2', 29, 31],
  ]) b.stamp(s, x, y);
  // Paseos del río: barandillas y árboles
  b.paint('valla_blanca', span(2, 7, 16, 16));
  b.paint('valla_blanca', span(11, 15, 16, 16));
  for (const [s, x, y] of [['arbol', 7, 4], ['pino', 20, 4], ['arbol', 24, 4], ['arbol', 50, 6], ['pino', 57, 6]]) b.stamp(s, x, y);
  b.stamp('cartel_madera', 6, 6);
  // Mercado fluvial
  for (const [s, x, y] of [
    ['puesto_azul', 19, 34], ['puesto_rosa', 23, 34], ['barriles', 30, 34], ['estandarte', 18, 34], ['estandarte', 33, 34],
    ['farolillos_postes', 38, 34], ['puesto_azul', 44, 34],
  ]) b.stamp(s, x, y);
  // Barrio bajo (la calle se inunda de día: charcos y sacos son eventos)
  for (const [s, x, y] of [
    ['arbol', 24, 44], ['tocon', 46, 50], ['barrera_obras', 33, 50], ['cartel_madera', 43, 43], ['flores_rosas', 26, 46],
    ['arbustos', 60, 22], ['jardinera_flores', 57, 24], ['farola_rosa', 53, 31], ['farola_rosa', 61, 31],
  ]) b.stamp(s, x, y);
  // Jardín del Canal (suroeste): arboleda, parterres y un estanque de piedra
  for (const [s, x, y] of [
    ['arbol', 2, 43], ['pino', 5, 44], ['arbol', 19, 43], ['arbol', 16, 44], ['estatuas_gemelas', 9, 44],
    ['jardinera_flores', 4, 48], ['jardinera_flores', 12, 46], ['lupinos', 7, 48], ['macizo_flores', 10, 48],
    ['flores_rosas', 3, 47], ['flores_blancas', 18, 48], ['seto_corto', 20, 47], ['farola', 15, 43],
  ]) b.stamp(s, x, y);
  b.stamp('troncos', 2, 26);
  // Prado del noreste (al otro lado del codo del río): que no quede vacío
  for (const [s, x, y] of [
    ['lupinos', 53, 7], ['flores_blancas', 56, 7], ['arbol', 59, 8], ['flores_rosas', 56, 11], ['macizo_flores', 54, 12],
    ['tocon', 57, 12], ['brotes', 61, 13],
  ]) b.stamp(s, x, y);
  // Orilla oeste del codo del río junto a la verja: vallada, para que la Senda solo se tome por su camino
  b.paint('valla_blanca_v', span(SOUTH_EXIT.x1 + 1, SOUTH_EXIT.x1 + 1, SOUTH_EXIT.gate.y, H - 1));
  // …y la orilla este igual: su franja de guijarros bajaba a la Senda sin pasar por la verja (auditoría de fugas,
  // DECISIONES X35).
  b.paint('valla_blanca_v', span(RIVER.v.x1 + 1, RIVER.v.x1 + 1, SOUTH_EXIT.gate.y, H - 1));
  // Carteles (los textos son eventos de content/events/b03_caudal.js)
  for (const [x, y] of [[NORTH_ENTRY.sign.x, NORTH_ENTRY.sign.y], [LOCK.sign.x, LOCK.sign.y], [12, 25], [60, 45]]) b.stamp('cartel_madera', x, y);
  // Rocas en el río
  for (const [x, y] of [[6, 11], [19, 12], [51, 22], [50, 41]]) b.stamp('roca_agua', x, y);
  // Cierre de la Senda del Mirador (se quita cuando exista el mapa)
  if (!b.senderoAbierto) {
    b.stamp('verja_puerta', SOUTH_EXIT.gate.x, SOUTH_EXIT.gate.y);
    b.stamp('cartel_madera', SOUTH_EXIT.x0 - 1, SOUTH_EXIT.gate.y - 1);
  }
}

/** Construcción completa. `opts.southOpen` quita la verja cuando la Senda del Mirador existe. */
export function buildCaudal(b, { southOpen = false } = {}) {
  b.senderoAbierto = southOpen;
  b.fill(null, 'cesped');
  forests(b);
  const lawn = new Set(LAWNS.flatMap(([x, y, w, h]) => rect(x, y, w, h)).map(([x, y]) => `${x},${y}`));
  const seen = new Set();
  const pav = pavementCells().filter(([x, y]) => {
    const k = `${x},${y}`;
    if (lawn.has(k) || seen.has(k) || x < 0 || y < 0 || x >= W || y >= H) return false;
    seen.add(k);
    return true;
  });
  b.paint('adoquin_c', pav);
  b.paint('bordillo', pav);
  // El camino de arena de la Ruta 2 sigue hasta el arco de entrada de la ciudad (sin salto brusco en la costura).
  b.paint('camino_arena', span(NORTH_ENTRY.x0, NORTH_ENTRY.x1, 0, NORTH_ENTRY.paveY - 1));
  // Sendero de la ribera (Ruta 3): el mismo camino de tierra de la ruta hasta el Paseo del Albo.
  b.paint('camino_tierra', [...span(0, 5, WEST_EXIT.y0, WEST_EXIT.y1), ...span(3, 5, WEST_EXIT.y1 + 1, PROMENADE.y0 - 1)]);
  // Y los caminos de la Vega (Ruta 4) y de la Senda del Mirador salen de la ciudad en tierra, como en sus mapas.
  b.paint('camino_tierra', [...span(60, W - 1, EAST_EXIT.y0, EAST_EXIT.y1), ...span(SOUTH_EXIT.x0, SOUTH_EXIT.x1, 51, H - 1)]);
  water(b);
  bridges(b);
  buildings(b);
  details(b);
}

export const CAUDAL_SIZE = Object.freeze({ W, H });
