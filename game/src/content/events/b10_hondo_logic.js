// Reglas PURAS de los puzles del Archivo Hondo (docs/CAMPANA.md B10, «Mazmorra: Archivo Hondo»). Sin motor ni ctx:
// las usan los eventos (b10_hondo_*.js), el arte (tools/b10_assets.mjs) y las pruebas (tests/b10_*.test.mjs).
//   1 Suelo Olvidado: el recorrido del custodio es el único seguro (layout: SUELO.path).
//   2 Dos Manos: dos palancas de cuatro posiciones; cada custodio deja la suya en una posición concreta.
//   3 Lectura: la custodia lee un relato de seis glifos; el jugador los toca en ese orden en la puerta glífica.
//   4 Rollos: el custodio coloca cuatro rollos de colores en cuatro huecos, en un orden; se reproduce color y hueco.
//   5 Mural: seis paneles que se ordenan según la historia (basta con lo leído en los Pilares y el relato de la
//     Estancia 3; cada Tablilla que se tenga añade una pista opcional). Los errores no penalizan.
import { chronicleFor } from '../story/chronicle.js';

// ───────────────────────────── 2 · Dos Manos ─────────────────────────────

export const LEVER_POSITIONS = 4;
export const LEVER_NAMES = Object.freeze(['tumbada a la izquierda', 'algo a la izquierda', 'algo a la derecha', 'tumbada a la derecha']);
/** Posición final de cada palanca en el recuerdo de los custodios (palanca oeste, palanca este). */
export const LEVER_TARGET = Object.freeze([2, 3]);
/** Posición en la que el jugador encuentra las palancas (var sin definir). */
export const LEVER_START = Object.freeze([0, 1]);

export const nextLever = (pos) => (((Number(pos) || 0) + 1) % LEVER_POSITIONS);
export const leversSolved = (p1, p2) => Number(p1) === LEVER_TARGET[0] && Number(p2) === LEVER_TARGET[1];

/** Pulsaciones de cada custodio en el recuerdo: empieza con la palanca tumbada a la izquierda (0). */
export function leverPresses(i) {
  return LEVER_TARGET[i] % LEVER_POSITIONS;
}

// ───────────────────────────── 3 · Lectura ─────────────────────────────

export const GLYPHS = Object.freeze({
  piedras: 'PIEDRAS', agua: 'AGUA', oido: 'ESCUCHAR', corona: 'CORONA', grieta: 'GRIETA', flauta: 'FLAUTA',
});

/** El relato que lee la custodia: una línea por glifo, en orden. */
export const RELATO = Object.freeze([
  Object.freeze({ glyph: 'piedras', text: 'Cuando llegamos, las diez \\c[3]piedras\\c[0] ya estaban en pie.' }),
  Object.freeze({ glyph: 'agua', text: 'Una mujer tocó en lo alto, y el \\c[3]agua\\c[0] volvió a su sitio.' }),
  Object.freeze({ glyph: 'oido', text: 'Desde entonces aprendimos a \\c[3]escuchar\\c[0] lo que decían.' }),
  Object.freeze({ glyph: 'corona', text: 'Un rey quiso que le obedecieran y forjó una \\c[3]corona\\c[0].' }),
  Object.freeze({ glyph: 'grieta', text: 'La tierra se abrió en una \\c[3]grieta\\c[0] bajo el puente.' }),
  Object.freeze({ glyph: 'flauta', text: 'Y la \\c[3]flauta\\c[0] se rompió en diez: una pieza para cada Pilar.' }),
]);
export const GLYPH_SEQUENCE = Object.freeze(RELATO.map((l) => l.glyph));

/** Colocación de los glifos en la puerta, en orden de lectura (izquierda→derecha, arriba→abajo). */
export const DOOR_GLYPHS = Object.freeze(['corona', 'agua', 'flauta', 'piedras', 'grieta', 'oido']);

/** Texto del relato sin códigos de color (para la Libreta). */
export function relatoPlain() {
  return RELATO.map((l) => l.text.replace(/\\c\[\d+\]/g, '')).join(' ');
}

/** Toca un glifo con `step` aciertos previos → { step, ok, done }. Un error apaga la puerta (step 0). */
export function touchGlyph(step, glyph) {
  const s = Math.max(0, Number(step) || 0);
  if (s >= GLYPH_SEQUENCE.length) return { step: s, ok: true, done: true };
  if (GLYPH_SEQUENCE[s] !== glyph) return { step: 0, ok: false, done: false };
  const next = s + 1;
  return { step: next, ok: true, done: next === GLYPH_SEQUENCE.length };
}

// ───────────────────────────── 4 · Rollos ─────────────────────────────

export const SCROLL_COLORS = Object.freeze(['rojo', 'azul', 'verde', 'ocre']);
export const SCROLL_LABELS = Object.freeze({ rojo: 'Rollo rojo', azul: 'Rollo azul', verde: 'Rollo verde', ocre: 'Rollo ocre' });
/** Orden del custodio: color y hueco (0–3 de izquierda a derecha). */
export const SCROLL_SEQUENCE = Object.freeze([
  Object.freeze({ color: 'verde', cubby: 2 }),
  Object.freeze({ color: 'rojo', cubby: 0 }),
  Object.freeze({ color: 'ocre', cubby: 3 }),
  Object.freeze({ color: 'azul', cubby: 1 }),
]);
export const EMPTY_SLOTS = '----';
const COLOR_CODE = Object.freeze({ rojo: 'R', azul: 'A', verde: 'V', ocre: 'O' });
const CODE_COLOR = Object.freeze(Object.fromEntries(Object.entries(COLOR_CODE).map(([k, v]) => [v, k])));

/** Color que hay en el hueco `i` de la cadena de huecos (o null). */
export function slotColor(slots, i) {
  return CODE_COLOR[String(slots || EMPTY_SLOTS)[i]] || null;
}

/** Colores que aún no se han colocado. */
export function remainingScrolls(slots) {
  const placed = new Set(String(slots || EMPTY_SLOTS).split('').map((c) => CODE_COLOR[c]).filter(Boolean));
  return SCROLL_COLORS.filter((c) => !placed.has(c));
}

/**
 * Coloca `color` en el hueco `cubby` con `step` aciertos → { step, slots, ok, done }. Si no es el siguiente del orden
 * del custodio, los rollos se caen (todo vuelve a la cesta: step 0 y huecos vacíos).
 */
export function placeScroll(step, slots, color, cubby) {
  const s = Math.max(0, Number(step) || 0);
  const want = SCROLL_SEQUENCE[s];
  if (!want || want.color !== color || want.cubby !== cubby) return { step: 0, slots: EMPTY_SLOTS, ok: false, done: false };
  const arr = String(slots || EMPTY_SLOTS).split('');
  arr[cubby] = COLOR_CODE[color];
  const next = s + 1;
  return { step: next, slots: arr.join(''), ok: true, done: next === SCROLL_SEQUENCE.length };
}

// ───────────────────────────── 5 · Mural ─────────────────────────────

/**
 * Paneles del Mural (1–6 = orden de la historia, CAMPANA: (1) los Pilares ya existían; (2) la Tañedora y el mar;
 * (3) los pueblos aprenden a escuchar; (4) el rey y la corona; (5) la tierra se abre; (6) la flauta rota).
 * `name` es lo que ve el jugador (describe la imagen, no la respuesta); `tablets` = pistas opcionales.
 */
export const PANELS = Object.freeze([
  Object.freeze({ n: 1, name: 'Las diez piedras', text: 'Diez piedras altas en un valle vacío. Encima, un sol.', tablets: ['MEADOWPLATE'] }),
  Object.freeze({ n: 2, name: 'La figura del monte', text: 'Una figura en lo alto de un monte, con algo azul en las manos. Abajo, las olas se retiran.', tablets: ['SPLASHPLATE'] }),
  Object.freeze({ n: 3, name: 'La piedra y los que escuchan', text: 'Dos figuras de rodillas junto a una piedra alta. Alrededor, anillos grabados, como ondas.', tablets: ['ZAPPLATE', 'STONEPLATE'] }),
  Object.freeze({ n: 4, name: 'La figura coronada', text: 'Una figura con corona en el centro. Las piedras de los lados se inclinan, como apartándose de ella.', tablets: ['FISTPLATE', 'IRONPLATE'] }),
  Object.freeze({ n: 5, name: 'El puente y la grieta', text: 'Un puente en arco. Debajo, una grieta parte el valle de arriba abajo.', tablets: ['MINDPLATE', 'TOXICPLATE', 'INSECTPLATE'] }),
  Object.freeze({ n: 6, name: 'Los trozos azules', text: 'Trozos de algo azul, esparcidos, y alrededor, diez puntos.', tablets: ['PIXIEPLATE'] }),
]);
export const panelById = (n) => PANELS.find((p) => p.n === Number(n)) || null;

export const MURAL_SOLUTION = '123456';
/** Orden inicial de los paneles (el que se encuentra el jugador). */
export const MURAL_START = '415263';

export function muralOrder(value) {
  const s = String(value || '');
  return /^[1-6]{6}$/.test(s) && new Set(s).size === 6 ? s : MURAL_START;
}

/** Intercambia los paneles de los huecos i y j. */
export function swapPanels(order, i, j) {
  const arr = muralOrder(order).split('');
  [arr[i], arr[j]] = [arr[j], arr[i]];
  return arr.join('');
}

/** Pone el panel `n` en el hueco `slot` (intercambiándolo con el que estuviera allí). */
export function placePanel(order, slot, n) {
  const cur = muralOrder(order);
  const from = cur.indexOf(String(n));
  return from < 0 ? cur : swapPanels(cur, slot, from);
}

export const muralSolved = (order) => muralOrder(order) === MURAL_SOLUTION;

/** Paneles bien colocados. */
export function muralCorrect(order) {
  const o = muralOrder(order);
  let n = 0;
  for (let i = 0; i < 6; i++) if (o[i] === MURAL_SOLUTION[i]) n += 1;
  return n;
}

/** Pistas opcionales de un panel según las Tablillas que tenga el jugador (textos de la Crónica). */
export function panelHints(panel, tablets = []) {
  const have = new Set(tablets);
  return (panel?.tablets || []).filter((t) => have.has(t)).map((t) => chronicleFor(t)).filter(Boolean)
    .map((e) => `Crónica ${e.numeral}: «${e.text}»`);
}
