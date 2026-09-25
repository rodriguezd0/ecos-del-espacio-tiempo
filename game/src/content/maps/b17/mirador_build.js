// Construcción del Mirador Sur (tileset 5, Exterior3). Avenida arbolada desde Lúmina, explanada de losas con barandilla
// sobre el borde, estribo sur del Puente de la Convergencia y el espolón de la Torre del Temblor. La ocupación de Genesis
// (valla, caravana, contenedores, andamios) NO se construye aquí: la ponen parches de eventos del P8 al P9
// (content/events/b17_mirador.js), para que antes y después el Mirador sea un paseo público. Módulo puro.
import {
  W, H, RIM_Y, AVENUE, PLAZA, DECK, TOWER, DESCENT, DESCENT_GAP, FORESTS,
} from './mirador_layout.js';
import { paintVoid, paintVoidEdges, rect } from './rim.js';

const inRect = (x, y, r) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;
const GAP_CELLS = new Set(DESCENT_GAP.cells.map(([x, y]) => `${x},${y}`));
/** Casillas de la bajada que siguen en pie (sin el tramo desprendido). */
const inDescent = (x, y) => inRect(x, y, DESCENT) && !GAP_CELLS.has(`${x},${y}`);

function towerLand() {
  const set = new Set();
  TOWER.room.rows.forEach((row, y) => [...row].forEach((c, x) => { if ('#EoPX'.includes(c)) set.add(`${TOWER.ox + x},${TOWER.oy + y}`); }));
  return set;
}
const TOWER_LAND = towerLand();

/** ¿Tierra pisable sobre la Sima? (estribo del Puente, bajada sin su tramo desprendido y sala de la torre) */
export function isSimaLand(x, y) {
  return inRect(x, y, DECK) || inDescent(x, y) || TOWER_LAND.has(`${x},${y}`);
}

/** ¿Vacío de la Sima? (al norte del borde, lo que no es tierra) */
export function isVoid(x, y) {
  if (x < 0 || x >= W || y < 0) return false;
  if (y >= RIM_Y) return false;
  return !isSimaLand(x, y);
}

function isLand(x, y) {
  if (y >= H) return true;
  if (x < 0 || x >= W) return y >= RIM_Y;
  if (y < 0) return false;
  return y >= RIM_Y || isSimaLand(x, y);
}

function paintGround(b) {
  // explanada y avenida de losas de ciudad (como la avenida de Lúmina que llega por el sur)
  for (const [x, y] of [...rect(PLAZA.x0, PLAZA.y0, PLAZA.x1, PLAZA.y1), ...rect(AVENUE.x0, AVENUE.y0, AVENUE.x1, AVENUE.y1)]) b.set(0, x, y, 0);
  b.paint('suelo_ciudad', [...rect(PLAZA.x0, PLAZA.y0, PLAZA.x1, PLAZA.y1), ...rect(AVENUE.x0, AVENUE.y0, AVENUE.x1, AVENUE.y1)]);
  b.stamp('roseton_plaza', 13, 23);
  // sendas de tierra: al espolón del este (entrada de la torre en x 32) y a la bajada del oeste (x 3–4)
  const seen = new Set();
  const trail = [...rect(26, 24, 33, 25), ...rect(32, 16, 33, 23), ...rect(0, 24, 5, 25), ...rect(3, 16, 4, 23)]
    .filter(([x, y]) => (seen.has(`${x},${y}`) ? false : seen.add(`${x},${y}`)));
  b.paint('camino_tierra', trail);
}

function paintForests(b) {
  for (const [x, y, w, h, brush] of FORESTS) b.paint(brush || 'bosque_pinos', rect(x, y, x + w - 1, y + h - 1));
  for (const [s, x, y] of [
    ['pino', 12, 30], ['arbol', 17, 32], ['pino', 12, 35], ['arbol', 17, 36], ['arbol', 30, 30], ['pino', 36, 18],
    ['arbol', 0, 24], ['pino', 2, 26], ['roca_gris', 32, 26], ['lupinos', 28, 27], ['flores_blancas', 3, 23],
    ['flores_rosas', 27, 22], ['macizo_flores', 5, 27], ['brotes', 33, 20], ['roca_gris', 37, 20], ['guijarros', 29, 19],
  ]) b.stamp(s, x, y);
}

function paintMirador(b) {
  // barandilla sobre el borde, abierta en el estribo (x 19–21), la bajada (x 3–4) y el espolón (x 26–35)
  b.paint('valla_blanca', [...rect(0, RIM_Y, 2, RIM_Y), ...rect(5, RIM_Y, 18, RIM_Y), ...rect(22, RIM_Y, 25, RIM_Y), ...rect(36, RIM_Y, 39, RIM_Y)]);
  for (const [s, x, y] of [
    ['estatua', 9, 22], ['estatua_2', 21, 22], ['farola_hierro', 12, 17], ['farola_hierro', 19, 17], ['farola_hierro', 7, 20],
    ['farola_hierro', 24, 20], ['jardinera_flores', 6, 24], ['jardinera_flores', 22, 24], ['papelera', 12, 26],
    ['cartel_madera', 17, 30], ['cartel_madera', 8, 24], ['farola_hierro', 12, 27], ['farola_hierro', 17, 27],
    ['flores_blancas', 11, 16], ['flores_rosas', 20, 16], ['macizo_flores', 7, 16],
  ]) b.stamp(s, x, y);
}

function paintSima(b) {
  const voidCells = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (isVoid(x, y)) voidCells.push([x, y]);
  paintVoid(b, voidCells);
  // estribo del Puente: losas viejas hasta el borde norte; bajada y espolón: roca
  for (const y of [0, 4, 8, DECK.y1 - 3]) b.stamp('losas_piedra', DECK.x0, y);
  for (let y = DECK.y0; y <= DECK.y1; y++) b.set(1, DECK.x0 + 3, y, 0); // el stamp mide 4: la cuarta columna es vacío
  b.paint('camino_tierra', rect(DESCENT.x0, DESCENT.y0, DESCENT.x1, DESCENT.y1).filter(([x, y]) => inDescent(x, y)));
  b.paint('camino_tierra', [...TOWER_LAND].map((k) => k.split(',').map(Number)).filter(([, y]) => y < RIM_Y));
  paintVoidEdges(b, isVoid, isLand, { W, H });
}

export function buildMirador(b) {
  b.fill(null, 'cesped');
  paintGround(b);
  paintForests(b);
  paintMirador(b);
  paintSima(b);
}

export { W, H };
