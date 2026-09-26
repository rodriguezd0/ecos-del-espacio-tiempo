// Construcción de las Ruinas del Dintel (MapBuilder + Cueva1 + kit común de Pilar). Separado de la definición
// del mapa para mantener los archivos pequeños. Módulo puro. Coordenadas: ruinas_dintel_layout.js.
//
// Gramática de Pilar (biblia §6): la roca de la cueva ha engullido una obra antigua. Suelo enlosado con huecos
// de tierra y musgo, dinteles entre salas, columnas, monolitos, glifos, canales y cámara de núcleo; nada de
// «piedra en una sala vacía».
import { ROOMS, PASSAGES, TUNNEL, ENTRANCE, ANTESALA, STONES, GALERIA, CAMARA, NUCLEO, cells } from './ruinas_dintel_layout.js';

const T = (x, y) => 384 + y * 8 + x;
/** Suelo de cueva (brush `suelo`, mosaico 3×3 desde [0,0]) en la casilla (x, y). */
const floorId = (x, y) => T(((x % 3) + 3) % 3, ((y % 3) + 3) % 3);
/** Anillo de paredes de la sala (brush `sala`, ring [0,19]): fila 0..3 cara norte, 6 pared sur; col 3/4 centro. */
const ring = (col, row) => T(col, 19 + row);

const key = (x, y) => `${x},${y}`;
const RING_FIRST = ring(0, 0);
const RING_LAST = ring(7, 6);
/** (col, fila) del anillo si el tile es una pieza de pared de sala; si no, null. */
function ringCell(id) {
  if (id < RING_FIRST || id > RING_LAST) return null;
  return { col: (id - 384) % 8, row: Math.floor((id - 384) / 8) - 19 };
}

/**
 * Funde las paredes de salas vecinas: donde el borde exterior de una pared (con su filo negro) toca la pared de
 * otra sala, se cambia por la pieza de roca maciza equivalente. Así no quedan rendijas negras entre salas.
 */
function mergeRock(b) {
  const rock = (x, y) => Boolean(ringCell(b.get(1, x, y)));
  const writes = [];
  for (let y = 0; y < b.height; y++) {
    for (let x = 0; x < b.width; x++) {
      const c = ringCell(b.get(1, x, y));
      if (!c) continue;
      let { col, row } = c;
      if (col === 0 && rock(x - 1, y)) col = 1;
      if (col === 7 && rock(x + 1, y)) col = 6;
      if (row === 0 && rock(x, y - 1)) row = 1;
      if (row === 6 && rock(x, y + 1)) { row = 2; if (col < 3) col = 3; if (col > 4) col = 4; }
      if ((row === 4 || row === 5) && col >= 3 && col <= 4) continue;
      if (col !== c.col || row !== c.row) writes.push([x, y, ring(col, row)]);
    }
  }
  for (const [x, y, id] of writes) b.set(1, x, y, id);
}

function paintRooms(b) {
  b.fill(null, 'vacio');
  for (const r of Object.values(ROOMS)) b.rect(null, r.x0, r.y0, r.x1 - r.x0 + 1, r.y1 - r.y0 + 1, 'sala');
}

/** Talla un paso vertical: quita la pared (capa 1) y pone suelo (capa 0) en el hueco del dintel. */
function carvePassage(b, p) {
  for (let y = p.rows[0]; y <= p.rows[1]; y++) {
    for (let x = p.x; x < p.x + 3; x++) { b.set(1, x, y, 0); b.set(0, x, y, floorId(x, y)); }
  }
  b.stamp('pilar_dintel', p.dintel.x, p.dintel.y);
}

/**
 * Túnel horizontal de una casilla de alto pegado a la pared norte de las dos cámaras: la cara norte sigue
 * continua por encima (piezas centrales del anillo) y debajo queda el borde de pared sur.
 */
function carveTunnel(b) {
  const t = TUNNEL;
  for (let x = t.x0; x <= t.x1; x++) {
    for (let r = 0; r < 4; r++) b.set(1, x, t.y - 4 + r, ring(3 + (x % 2), r));
    b.set(1, x, t.y, 0);
    b.set(0, x, t.y, floorId(x, t.y));
    b.set(0, x, t.y - 1, floorId(x, t.y - 1));
    b.set(1, x, t.y + 1, ring(3 + (x % 2), 6));
    b.set(0, x, t.y + 1, floorId(x, t.y + 1));
  }
}

/** Enlosado de Pilar dentro de un rectángulo, con `holes` (casillas sin losa: tierra, musgo, agua). */
function pave(b, x, y, w, h, holes = []) {
  const skip = new Set(holes.map(([hx, hy]) => key(hx, hy)));
  b.paint('pilar_enlosado', cells(x, y, w, h).filter(([cx, cy]) => !skip.has(key(cx, cy))));
}

function paintAntesala(b) {
  const r = ROOMS.antesala;
  // losas rotas: bocados de tierra en los bordes y un tramo hundido
  const broken = [...cells(8, 29, 2, 2), ...cells(33, 33, 3, 2), ...cells(27, 29, 3, 1), [11, 34], [12, 34], [30, 34]];
  pave(b, r.x0, r.y0, r.x1 - r.x0 + 1, r.y1 - r.y0 + 1, broken);
  b.paint('mancha', cells(8, 29, 2, 2));
  b.paint('mancha', cells(33, 33, 3, 2));
  b.stamp(`salida_luz_sur`, ENTRANCE.stamp.x, ENTRANCE.stamp.y);
  b.stamp('pilar_placa_unown', ANTESALA.placa.x, ANTESALA.placa.y);
  // hilera de columnas en la pared norte (algunas quebradas) y monolitos a los lados de la entrada
  for (const x of [9, 17, 26, 30]) b.stamp('pilar_columna', x, 27);
  for (const x of [19, 24]) b.stamp('pilar_columna_quebrada', x, 28);
  b.stamp('pilar_monolito', 16, 32);
  b.stamp('pilar_monolito', 26, 32);
  for (const t of ANTESALA.torches) b.stamp('antorcha', t.x, t.y - 1);
  for (const [s, x, y] of [
    ['pilar_glifo', 20, 32], ['pilar_glifo_2', 23, 32], ['pilar_glifo', 13, 30], ['pilar_glifo_2', 30, 31],
    ['roca_peque', 35, 31], ['musgo_rocas', 8, 33], ['pilar_arista', 28, 28], ['roca_musgo', 33, 33],
  ]) b.stamp(s, x, y);
}

function paintGaleria(b) {
  const r = ROOMS.galeria;
  const g = GALERIA;
  const s = g.stream;
  const water = cells(s.x, s.y0, s.w, s.y1 - s.y0 + 1).filter(([, y]) => y !== s.bridge);
  const pond = cells(g.pond.x, g.pond.y, g.pond.w, g.pond.h);
  pave(b, r.x0 + 1, r.y0, r.x1 - r.x0 - 1, r.y1 - r.y0 + 1, [...water, ...pond, ...cells(16, 22, 2, 2), [23, 23], [4, 23]]);
  // estanque quieto (oeste) y arroyo que brota de la pared y sale de la sala por el sur (señuelo); una losa lo
  // cruza (el agua pasa por debajo)
  b.paint('estanque', pond);
  for (const [x, y] of water) if (y > r.y1) b.set(1, x, y, 0);
  b.paint('agua', water);
  b.stamp('chorro_agua', s.spout.x, s.spout.y);
  b.paint('pilar_enlosado', cells(s.x, s.bridge, s.w, 1));
  b.paint('mancha', cells(16, 22, 2, 2));
  // tres alcobas: columnas a cada lado de las piedras y un glifo delante de cada una
  for (const x of g.columns) b.stamp('pilar_columna', x, 16);
  for (const st of STONES) b.stamp('pilar_glifo', st.x, st.y + 1);
  // arcos quebrados, raíces y aristas: la cueva se ha comido parte de la galería
  for (const [n, x, y] of [
    ['pilar_columna_quebrada', 4, 22], ['pilar_columna_quebrada', 19, 22], ['roca_musgo', 21, 21],
    ['pilar_arista', 20, 17], ['musgo_rocas', 5, 22], ['roca_peque', 24, 22],
  ]) b.stamp(n, x, y);
}

function paintCamaras(b) {
  const geo = ROOMS.geodude;
  pave(b, geo.x0 + 1, geo.y0 + 1, geo.x1 - geo.x0 - 1, geo.y1 - geo.y0 - 1, [...cells(4, 6, 4, 3), ...cells(9, 10, 4, 1), ...cells(18, 6, 3, 2)]);
  b.paint('mancha', cells(4, 6, 4, 3));
  // derrumbe de los temblores: escombros y rocas junto a la grieta y ante el túnel
  for (const [n, x, y] of [
    ['escombros', 7, 5], ['roca_grande', 3, 9], ['roca_musgo', 19, 10], ['musgo_rocas', 20, 6], ['roca_peque', 9, 10],
    ['pilar_columna_quebrada', 10, 5], ['pilar_columna', 14, 4], ['pilar_monolito', 17, 5],
  ]) b.stamp(n, x, y);
  const gua = ROOMS.guardiana;
  pave(b, gua.x0, gua.y0 + 1, gua.x1 - gua.x0 + 1, gua.y1 - gua.y0, [[28, 6], [28, 11], [40, 11], [40, 6]]);
  // sala de la Guardiana: columnata y losas de eco ante el paso al Núcleo
  for (const x of [29, 39]) b.stamp('pilar_columna', x, 4);
  for (const x of [31, 37]) b.stamp('pilar_monolito', x, 4);
  b.stamp('pilar_losa_eco', 33, 6);
  b.stamp('pilar_losa_eco', 35, 6);
  b.paint('pilar_canal', cells(29, 11, 3, 1));
  b.paint('pilar_canal', cells(37, 11, 3, 1));
}

function paintNucleo(b) {
  const r = ROOMS.nucleo;
  pave(b, r.x0, r.y0, r.x1 - r.x0 + 1, r.y1 - r.y0 + 1);
  b.stamp('pilar_camara_nucleo', NUCLEO.camara.x, NUCLEO.camara.y);
  b.stamp('pilar_pedestal', NUCLEO.column.x, NUCLEO.column.y - 1); // la columna hueca del centro
  b.paint('pilar_canal_v', cells(31, 18, 1, 5));
  b.paint('pilar_canal_v', cells(40, 20, 1, 3));
  for (const [n, x, y] of [
    ['pilar_arista', 38, 14], ['pilar_columna', 32, 17], ['pilar_columna', 38, 16],
    ['pilar_glifo', 37, 22], ['pilar_glifo_2', 33, 23],
  ]) b.stamp(n, x, y);
}

/** Construye todo el mapa (llamado desde la definición). */
export function buildRuinas(b) {
  paintRooms(b);
  mergeRock(b);
  for (const p of Object.values(PASSAGES)) carvePassage(b, p);
  carveTunnel(b);
  paintAntesala(b);
  paintGaleria(b);
  paintCamaras(b);
  paintNucleo(b);
  // Geodude: grieta en la pared norte (el gráfico lo pone el evento; aquí, cascotes al pie)
  b.stamp('pilar_glifo_2', CAMARA.cell.x + 2, CAMARA.cell.y);
}
