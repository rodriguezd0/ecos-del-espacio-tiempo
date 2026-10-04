// Grieta del Porvenir (docs/CAMPANA.md B22 «Paradojas de hierro»: ecos de un futuro posible que abrió el Resonador de
// Genesis al sobrecargarse en el P9; nada que ver con el Pilar de los Ecos, biblia §6.7). Se baja desde el Mirador Sur
// (B17) por una boca abierta en el prado del este. 48×60, tileset 5 (Exterior3, como el Mirador): mesetas y repisas
// colgadas en la pared sur de la Sima, con el vacío (panorama de la Sima) alrededor. FUENTE ÚNICA de coordenadas para
// la construcción, los eventos, las pruebas y el E2E. Módulo puro.
//
//   Sur      Rellano de la bajada (llegada) y, al este, el Peñasco de la tormenta (Ferropúas, solo con tormenta).
//   Centro   Cauce seco entre dos macizos (Ferrodada: recorrerlo a pie, sin montura) → Explanada con el campamento de
//            Rosalía (esperar hasta el amanecer, el mediodía o la noche) y los restos del Resonador.
//   Oeste    Hondonada (Ferropolilla: de noche se acerca a la luz de Zygarde; con Destello, desde más lejos).
//   Este     Borde de escarcha (Ferrosaco: de noche, quedarse quieto cinco segundos) → Taller de hierro (Ferropalmas:
//            embestir tres bloques hasta su plataforma).
//   Noroeste Cuenca (Ferrocuello: vuela en círculos solo al amanecer).
//   Norte    Espolón del Porvenir, al final de la grieta (Ferropaladín: a mediodía, tras ver a los otros seis).
import { parseIronRoom } from '../../events/b22e_iron_logic.js';

export const W = 48;
export const H = 60;

const P = (x, y, dir = 2) => Object.freeze({ x, y, dir });
/** Rectángulo de tierra: suelo base `kind` y esquinas redondeadas de radio `r`. */
const R = (x0, y0, x1, y1, kind = 'cesped', r = 0) => Object.freeze({ x0, y0, x1, y1, kind, r });
const inRect = (r, x, y) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;

/** ¿Casilla dentro del rectángulo redondeado? */
export function inRound(r, x, y) {
  if (!inRect(r, x, y)) return false;
  if (!r.r) return true;
  const dx = Math.max(r.x0 + r.r - x, 0, x - (r.x1 - r.r));
  const dy = Math.max(r.y0 + r.r - y, 0, y - (r.y1 - r.r));
  return dx * dx + dy * dy <= r.r * r.r;
}

/**
 * Sala del Taller de hierro (reglas en b22e_iron_logic.js). Esquina superior izquierda en (33, 3): ocupa la meseta del
 * noreste entera; los `#` del borde son el vacío. Solución de referencia (7 embestidas, la del solucionador):
 *   1. el bloque del este de la fila 5 hacia el oeste (se para en la columna junto a la primera columna de hierro)
 *      y luego al norte, al zócalo del oeste;
 *   2. el bloque de la fila 7 hacia el oeste (lo para la columna central) y al norte, al zócalo del este;
 *   3. el bloque del suroeste hacia el este (lo para la columna central baja), al norte hasta la plataforma y, desde
 *      el lado este de la plataforma, hacia el oeste: cae en el zócalo del centro.
 * La palanca de la entrada devuelve a su sitio los bloques que aún no han encajado.
 */
export const IRON_ORIGIN = Object.freeze({ x: 33, y: 3 });
export const IRON_ROWS = Object.freeze([
  '##############',
  '####FFFFFF####',
  '###.S.S..S.###',
  '#..........o.#',
  '#.o..........#',
  '#..o......B..#',
  '#............#',
  '#.......o..B.#',
  '#.B.....o....#',
  '#............#',
  '#.o....kk..o.#',
  '######Lkk#####',
  '#######Ek#####',
]);
export const IRON_ROOM = parseIronRoom(IRON_ROWS, IRON_ORIGIN.x, IRON_ORIGIN.y);

/** Mesetas y pasos (tierra pisable); el resto del mapa es el vacío de la Sima. */
export const LAND = Object.freeze([
  // Sur: rellano de la bajada, salida al Mirador y peñasco de la tormenta
  R(15, 46, 33, 54, 'cesped', 2),
  R(23, 55, 25, 59, 'losas'),
  R(34, 48, 36, 50, 'cesped'),
  R(37, 44, 45, 53, 'ceniza', 2),
  // Cauce seco entre dos macizos de roca (los macizos también son tierra: se pintan con `acantilado`)
  R(17, 30, 31, 45, 'cesped'),
  // Explanada central
  R(13, 19, 35, 29, 'cesped', 3),
  // Oeste: paso y hondonada
  R(10, 24, 14, 27, 'cesped'),
  R(1, 24, 11, 36, 'ceniza', 2),
  // Noroeste: paso y cuenca (redonda)
  R(9, 16, 14, 23, 'cesped'),
  R(1, 3, 14, 17, 'cesped', 5),
  // Este: paso y borde de escarcha
  R(34, 23, 37, 26, 'cesped'),
  R(37, 20, 46, 31, 'ceniza', 2),
  // Noreste: paso al taller (la sala la dibuja IRON_ROOM)
  R(40, 16, 41, 20, 'ceniza'),
  // Norte: paso y espolón
  R(23, 11, 25, 19, 'losas'),
  R(17, 1, 29, 11, 'ceniza', 2),
]);

/** Caminos de tierra sobre la hierba (capa 1, con borde de hierba). */
export const PATHS = Object.freeze([
  R(23, 46, 25, 54), R(26, 48, 32, 50), // rellano: de la bajada al cauce y al peñasco
  R(22, 19, 26, 29), // explanada: del cauce al paso del espolón
  R(13, 24, 22, 26), R(28, 24, 35, 26), // explanada: hacia la hondonada y el borde de escarcha
  R(10, 16, 12, 23), // paso de la cuenca
  R(26, 21, 30, 23), // claro del campamento
]);

/** Anillo de vuelo de Ferrocuello en la cuenca: se pinta como un sendero hollado alrededor de la roca. */
export const RING = Object.freeze({ x0: 4, y0: 6, x1: 11, y1: 13 });

/** Macizos de roca (pincel `acantilado`, convexos): bloquean y dan forma de cañón. */
export const ROCKS = Object.freeze([
  R(17, 30, 20, 45), R(28, 30, 31, 45), // paredes del cauce
  R(6, 8, 9, 11), // roca central de la cuenca (Ferrocuello vuela a su alrededor)
  R(3, 26, 5, 29), R(8, 31, 10, 34), // hondonada
  R(42, 45, 44, 47), // peñasco de la tormenta
]);

/** Cicatrices de ceniza sobre la hierba (sin uso: los restos del Resonador son eventos). */
export const SCARS = Object.freeze([]);

export const ARRIVAL = P(24, 53, 8);
/** Salida al Mirador Sur: pulsar abajo en el borde sur del sendero de losas. */
export const EXIT = Object.freeze({ x0: 23, x1: 25, y: H - 1 });
/** Casilla del Mirador Sur a la que se vuelve (junto a la boca de la grieta; ver b22e/links.js). */
export const MIRADOR_RETURN = P(28, 19, 2);

// ───────────────────────────── zonas de las Paradojas ─────────────────────────────

/** Cauce seco: tramo que hay que recorrer a pie (de una franja a la otra, sin montar en ningún momento). */
export const CAUCE = Object.freeze({
  x0: 21, x1: 27, y0: 31, y1: 44, // zona del tramo (orillas y lecho)
  south: Object.freeze({ x0: 21, x1: 27, y: 44 }), // franja sur (lado del rellano)
  north: Object.freeze({ x0: 21, x1: 27, y: 31 }), // franja norte (lado de la explanada)
  bed: Object.freeze({ x0: 22, x1: 26 }), // lecho de arena
  stop: P(24, 37, 2), // donde se detiene Ferrodada
  ruts: P(23, 40), // marca: rodadas
});

/** Borde de escarcha: de noche, quieto cinco segundos dentro de la zona → Ferrosaco se acerca desde el borde. */
export const ESCARCHA = Object.freeze({
  zone: Object.freeze({ x0: 38, y0: 21, x1: 45, y1: 30 }),
  from: P(45, 26, 4), // aparece en el filo, entre la escarcha
  crystals: Object.freeze([[38, 20], [43, 21], [46, 22], [46, 24], [46, 28], [44, 30], [40, 31], [38, 30], [37, 29], [39, 22]]),
  mark: P(42, 23),
  frames: 300, // cinco segundos quieto
});

/** Hondonada: de noche la oscuridad la cubre; Ferropolilla revolotea y se acerca a la luz. */
export const HONDONADA = Object.freeze({
  zone: Object.freeze({ x0: 1, y0: 24, x1: 11, y1: 36 }),
  moth: P(4, 33, 2), // donde revolotea
  mark: P(8, 27),
  radius: 3, // casillas (luz de Zygarde)
  radiusFlash: 5, // con Destello en el equipo
});

/** Cuenca: Ferrocuello da vueltas a la roca central al amanecer (anillo de vuelo, sentido horario). */
export const CUENCA = Object.freeze({
  ring: RING,
  start: P(4, 6, 6),
  mark: P(12, 13),
});

/** Peñasco de la tormenta: Ferropúas, solo con tormenta. */
export const TORMENTA = Object.freeze({
  spot: P(40, 48, 2),
  spikes: Object.freeze([[38, 46], [41, 45], [44, 50], [39, 51], [43, 52], [45, 48]]),
  mark: P(38, 49),
});

/** Espolón del Porvenir: Ferropaladín a mediodía (tras ver a los otros seis). */
export const ESPOLON = Object.freeze({
  spot: P(23, 4, 2),
  dais: Object.freeze({ x: 21, y: 3 }), // losa_plaza 5×3 bajo Ferropaladín
  crystals: Object.freeze([[18, 3], [28, 3], [17, 6], [29, 7], [19, 9], [27, 10]]),
  mark: P(26, 7),
  bench: P(20, 8), // segunda piedra para esperar (cerca del final)
});

/** Taller de hierro: estrado de Ferropalmas, zócalos y palanca (coordenadas del mapa). */
export const TALLER = Object.freeze({
  palmas: P(39, 4, 2), // Ferropalmas, dormido sobre el estrado
  mark: P(45, 12),
  room: IRON_ROOM,
});

/** Explanada: campamento de Rosalía (esperar), restos del Resonador y paso a cada zona. */
export const EXPLANADA = Object.freeze({
  rosalia: P(29, 22, 4),
  fire: P(28, 23),
  board: Object.freeze({ x: 30, y: 20 }), // tablón con las notas de Rosalía (tablon_anuncios_2, 2×2)
  debris: Object.freeze([[16, 22, 2], [18, 23, 4], [15, 24, 6]]), // [x, y, fila de la hoja]
  sign: P(22, 28),
});

export const RELLANO = Object.freeze({
  sign: P(22, 51),
});

/** Objetos (en suelo libre; lo comprueba tests/b22e_reach.test.mjs). */
export const ITEMS = Object.freeze([
  Object.freeze({ id: 'objeto_grieta_1', x: 32, y: 47, item: 'BOOSTERENERGY' }),
  Object.freeze({ id: 'objeto_grieta_2', x: 2, y: 35, item: 'MAXELIXIR', hidden: true }),
  Object.freeze({ id: 'objeto_grieta_3', x: 13, y: 10, item: 'RARECANDY' }),
  Object.freeze({ id: 'objeto_grieta_4', x: 45, y: 29, item: 'NEVERMELTICE' }),
  Object.freeze({ id: 'objeto_grieta_5', x: 28, y: 9, item: 'PPMAX' }),
  Object.freeze({ id: 'objeto_grieta_6', x: 44, y: 51, item: 'ELECTRICSEED', hidden: true }),
  Object.freeze({ id: 'objeto_grieta_7', x: 20, y: 24, item: 'BOOSTERENERGY', hidden: true }),
]);

/** Decorado (stamps de Exterior3) sobre suelo libre: [nombre, x, y]. */
export const PROPS = Object.freeze([
  // rellano
  ['pino', 16, 47], ['arbol', 30, 51], ['roca_gris', 19, 52], ['roca_gris', 28, 46], ['brotes', 18, 50],
  ['flores_blancas', 20, 49], ['brotes', 31, 53], ['lupinos', 27, 52], ['tocon', 21, 53],
  // explanada
  ['pino', 33, 26], ['arbol', 14, 26], ['roca_gris', 32, 20], ['brotes', 20, 20], ['flores_blancas', 17, 27],
  ['flores_rosas', 31, 27], ['arbustos', 26, 27], ['brotes', 29, 28], ['troncos', 31, 23],
  // cuenca
  ['arbol', 2, 7], ['pino', 12, 5], ['flores_blancas', 5, 15], ['flores_rosas', 13, 9], ['brotes', 3, 12],
  ['lupinos', 8, 15], ['brotes', 11, 4], ['flores_blancas', 7, 4],
  // hondonada, escarcha, espolón, tormenta
  ['roca_gris', 9, 24], ['guijarros_mina', 6, 34], ['roca_gris', 2, 30], ['guijarros_mina', 40, 27],
  ['roca_gris', 44, 25], ['roca_gris', 18, 5], ['guijarros_mina', 24, 8], ['roca_gris', 38, 52],
  // cauce: piedras de la orilla
  ['roca_gris', 21, 34], ['roca_gris', 26, 41],
]);

/** ¿Es tierra (x, y)? (mesetas, pasos y la sala del taller) */
export function isLand(x, y) {
  if (x < 0 || y < 0 || x >= W || y >= H) return false;
  if (LAND.some((r) => inRound(r, x, y))) return true;
  const rx = x - IRON_ORIGIN.x;
  const ry = y - IRON_ORIGIN.y;
  if (rx >= 0 && ry >= 0 && rx < IRON_ROOM.w && ry < IRON_ROOM.h) return IRON_ROWS[ry][rx] !== '#';
  return false;
}

/** Suelo base de una casilla de tierra ('cesped' | 'ceniza' | 'losas' | 'chapa'). */
export function groundAt(x, y) {
  const rx = x - IRON_ORIGIN.x;
  const ry = y - IRON_ORIGIN.y;
  if (rx >= 0 && ry >= 0 && rx < IRON_ROOM.w && ry < IRON_ROOM.h && IRON_ROWS[ry][rx] !== '#') return 'chapa';
  let kind = null;
  for (const r of LAND) if (inRound(r, x, y)) kind = r.kind;
  return kind;
}

/** Zona de Paradoja que contiene (x, y) o null. */
export function zoneOf(x, y) {
  if (inRect(HONDONADA.zone, x, y)) return 'hondonada';
  if (inRect(ESCARCHA.zone, x, y)) return 'escarcha';
  if (inRect(CAUCE, x, y)) return 'cauce';
  return null;
}

export const START = ARRIVAL;
