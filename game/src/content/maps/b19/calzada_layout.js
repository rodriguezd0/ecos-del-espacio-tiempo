// Calzada del Rey (docs/CAMPANA.md B19 y §1.4: «brazo este de la Sima»; TABLILLAS.md T15). FUENTE ÚNICA de las
// coordenadas del mapa `calzada_rey` (tileset 1, 48×62): la usan la construcción, los eventos, las pruebas y el E2E.
// Módulo PURO. Geografía (y hacia abajo):
//   · y 0–13   la Peña del Rey (orilla norte): risco con el taller del Rey y la Puerta de la Bajada (warps), la cima
//              del noreste con el Salamence Alfa (escalera) y la calzada antigua que une los tres sitios.
//   · y 14–39  el brazo este de la Sima: vacío (panorama del abismo) de borde a borde, con dos pilas de roca (A y B),
//              dos agujas lejanas y los tres tramos de la Calzada que los Peregrinos alzan a la fuerza.
//   · y 40–61  el Mirador de la Calzada (orilla sur) y el campamento de los Peregrinos; al sur, el sendero que baja a
//              la Ruta 7 (x 2–5 = x 60–63 de la Ruta 7, content/maps/b09a/links.js: offset −58).
import { SPAN_DEFS } from '../../events/b19_spans_logic.js';

export const W = 48;
export const H = 62;

export const rect = (x0, y0, x1, y1) => {
  const out = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]);
  return out;
};
const P = (x, y, dir = 2) => Object.freeze({ x, y, dir });
const R = (x0, y0, x1, y1) => Object.freeze({ x0, y0, x1, y1 });
export const inRect = (r, x, y) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;

/** Última fila de tierra de la Peña y primera del Mirador: entre medias, la Sima. */
export const RIM_N = 13;
export const RIM_S = 40;

/** Salida sur a la Ruta 7 (conexión south, offset −58). */
export const EXITS = Object.freeze({ south: Object.freeze({ y: H - 1, x0: 2, x1: 5, offset: -58 }) });
/** Llegada desde la Ruta 7 (arranque de pruebas). */
export const ARRIVAL = P(3, H - 2, 8);

/** Pilas de roca: casillas de tierra (cima de hierba; la cara cuelga debajo sobre el vacío). */
export const STACK_A = R(9, 21, 18, 29);
export const STACK_B = R(30, 22, 38, 31);
/** Agujas lejanas (tierra sin acceso: decorado del abismo). */
export const ISLETS = Object.freeze([R(42, 17, 44, 18), R(2, 30, 4, 31), R(23, 34, 25, 34), R(44, 32, 46, 32), R(3, 17, 4, 17)]);

/** Tramos de la Calzada (lógica, trazado ASCII y conexiones en events/b19_spans_logic.js). */
export const SPANS = SPAN_DEFS;

/** ¿Tierra firme (orillas, pilas, agujas)? Fuera del mapa por los lados continúan las orillas y el vacío. */
export function isLand(x, y) {
  if (y < 0) return true;
  if (y >= H) return true;
  if (y <= RIM_N || y >= RIM_S) return true;
  return inRect(STACK_A, x, y) || inRect(STACK_B, x, y) || ISLETS.some((r) => inRect(r, x, y));
}
/** ¿Vacío de la Sima? (dentro del mapa) */
export const isChasm = (x, y) => x >= 0 && x < W && y >= 0 && y < H && !isLand(x, y);

/** Calzada antigua sobre tierra (estrado de 3 de ancho), además de los tramos. Rectángulos [x0, y0, x1, y1]. */
export const ROAD = Object.freeze({
  // pila A: de la escalera del primer tramo al arranque del segundo
  stackA: Object.freeze([[12, 25, 14, 29], [12, 25, 18, 27]]),
  // pila B: de la llegada del segundo tramo al arranque del tercero
  stackB: Object.freeze([[30, 25, 35, 27], [33, 22, 35, 27]]),
  // Peña del Rey: del último tramo al taller y a la Puerta de la Bajada
  pena: Object.freeze([[33, 9, 35, 13], [4, 9, 35, 11], [20, 5, 22, 8], [4, 5, 6, 8]]),
});
/** Cruces de la calzada (ladrillo liso). */
export const ROAD_JOINTS = Object.freeze([[12, 25, 14, 27], [33, 25, 35, 27], [33, 9, 35, 11], [20, 9, 22, 11], [4, 9, 6, 11]]);

// ───────────────────────────── Peña del Rey ─────────────────────────────

export const PENA = Object.freeze({
  band: R(0, 0, 37, 4), // risco (acantilado) con cara en las filas 2–4
  cima: R(38, 0, 47, 9), // cima (acantilado más alto), cara en 7–9
  cimaStairs: Object.freeze({ x: 41, y: 7 }), // escalera 3×3 sobre la cara (se pisa la columna x 42)
  cimaTop: R(39, 1, 46, 6), // cima: hierba rala donde anida el Salamence
  alfa: P(44, 3, 2),
  workshop: Object.freeze({ dintel: Object.freeze({ x: 19, y: 1 }), door: Object.freeze({ x: 21, y: 4 }), front: P(21, 5, 8), arrive: P(21, 5, 2) }),
  bajada: Object.freeze({ dintel: Object.freeze({ x: 3, y: 1 }), door: Object.freeze({ x: 5, y: 4 }), front: P(5, 5, 8), arrive: P(5, 5, 2) }),
  stele: Object.freeze({ x: 26, y: 5 }), // pilar_placa_unown 2×2 (base en y 6): se lee desde (26,7)
  steleBajada: Object.freeze({ x: 8, y: 5 }), // estela junto a la Puerta de la Bajada: se lee desde (8,7)
  land: R(0, 5, 37, 13), // explanada de la Peña (y la franja bajo la cima, x 38–47, y 10–13)
});

/**
 * Duelo con Casandra: aterriza con su Noivern ante el último tramo en cuanto se alza. El paso del tramo a la Peña
 * (x 33–35, y 14) dispara la revancha mientras no se le gane; reintento en el propio tramo.
 */
export const DUEL = Object.freeze({
  casandra: P(34, 12, 2),
  noivern: P(36, 12, 4),
  strip: Object.freeze([[33, 14], [34, 14], [35, 14]]),
  retry: P(34, 17, 8),
  after: P(22, 6, 4), // Casandra, junto al taller, tras el combate
  afterTaller: P(24, 7, 4), // y tras la Tablilla (se queda a cuidar la Calzada)
});

/** Alerce espera ante la Bajada tras la Tablilla (escena «antes de la bajada»). */
export const ALERCE = Object.freeze({ stand: P(21, 7, 8), after: P(8, 8, 4) });

// ───────────────────────────── Mirador y campamento ─────────────────────────────

/** Mirador de la Calzada: plaza de estrado sobre el labio sur; el primer tramo arranca de su borde (x 12–14). */
export const MIRADOR = Object.freeze({ plaza: R(8, 40, 18, 44), stele: Object.freeze({ x: 9, y: 41 }) });
/** Sendero de tierra de la Ruta 7 y caminos del campamento. */
export const TRAIL = Object.freeze([R(2, 45, 5, H - 1), R(2, 45, 31, 46), R(28, 47, 31, 53)]);

/** Campamento de los Peregrinos del Rey. */
export const CAMP = Object.freeze({
  tents: Object.freeze([[21, 47], [34, 44], [39, 50], [23, 53]]), // tienda_campana 4×5 (esquina)
  resonator: P(21, 41, 2),
  casandra: P(22, 42, 4),
  fire: P(30, 55, 2), // hoguera: se descansa mirándola (campamento)
  banners: Object.freeze([[7, 41], [19, 41], [27, 44], [42, 46], [33, 57]]),
  // provisiones junto al borde (las «cajas_madera» de puerto se pisaban: sus tiles no bloquean en Exterior1)
  barrels: Object.freeze([[19, 51], [41, 55], [35, 40]]),
  logs: Object.freeze([[27, 56], [38, 40]]),
  stall: Object.freeze({ x: 36, y: 50 }), // puesto_mercado 3×4 (x 36–38, y 50–53)
});

/** Gente del campamento (sin combate). */
export const NPC = Object.freeze({
  leocadia: P(7, 47, 4), // da la bienvenida al subir del sendero
  tadeoPaso: P(13, 40, 8), // guarda la entrada del primer tramo hasta hablar con Casandra
  tadeo: P(15, 41, 4),
  tarsicio: P(16, 48, 2), // el más viejo: cuenta el mito del Rey
  cocinera: P(28, 55, 6),
  nino: P(25, 50, 2),
  mercader: P(37, 54, 2), // delante del puesto, de cara a quien llega (se le habla desde (37,55))
  cuidador: P(11, 41, 6), // tras la Tablilla: cuida el primer tramo
});

/** Franja de llegada (bienvenida de Leocadia): el sendero entero a la altura y = 55. */
export const ARRIVAL_STRIP = Object.freeze(rect(2, 55, 5, 55));

/** Bosques del sur y del este (alto 4k+2: la última fila es de troncos). [x0, y0, x1, y1, pincel]. */
export const FORESTS = Object.freeze([
  Object.freeze([0, 52, 1, 61, 'bosque_pinos']),
  Object.freeze([6, 52, 17, 61, 'bosque_pinos']),
  Object.freeze([18, 58, 43, 61, 'bosque_mixto']),
  Object.freeze([44, 40, 47, 61, 'bosque_pinos']),
]);

// ───────────────────────────── Contenido ─────────────────────────────

/** Zonas con encuentros (Cueva / ruina de POKEDEX_DISTRIBUCION): las pilas, la Peña y la cima; nunca los tramos. */
export const ENCOUNTER_RECTS = Object.freeze([
  R(STACK_A.x0, STACK_A.y0, STACK_A.x1, STACK_A.y1),
  R(STACK_B.x0, STACK_B.y0, STACK_B.x1, STACK_B.y1),
  R(0, 5, 47, 13),
  PENA.cimaTop,
]);

/** Objetos del mapa. */
export const ITEMS = Object.freeze([
  Object.freeze({ id: 'objeto_calzada_1', x: 10, y: 22, item: 'DRAGONSCALE' }),
  Object.freeze({ id: 'objeto_calzada_2', x: 37, y: 30, item: 'MAXREVIVE' }),
  Object.freeze({ id: 'objeto_calzada_3', x: 1, y: 6, item: 'RARECANDY' }),
  Object.freeze({ id: 'objeto_calzada_4', x: 46, y: 5, item: 'PPUP' }),
  // (en la pila A, no en el campamento: el Mirador se visita desde el P4 y la Restauración Total es de final de campaña)
  Object.freeze({ id: 'objeto_calzada_5', x: 9, y: 29, item: 'FULLRESTORE', hidden: true }),
  Object.freeze({ id: 'objeto_calzada_6', x: 2, y: 49, item: 'ULTRABALL', count: 3 }),
]);

/** Peregrinos que combaten (entrenadores de content/trainers/b19.js). */
export const TRAINERS = Object.freeze([
  Object.freeze({ id: 'peregrino_ciriaco', trainer: 'b19_peregrino_ciriaco', x: 16, y: 23, dir: 4, sight: 3 }),
  Object.freeze({ id: 'peregrina_benigna', trainer: 'b19_peregrina_benigna', x: 10, y: 27, dir: 6, sight: 3 }),
  Object.freeze({ id: 'peregrino_nicanor', trainer: 'b19_peregrino_nicanor', x: 37, y: 24, dir: 4, sight: 3 }),
  Object.freeze({ id: 'peregrina_ursula', trainer: 'b19_peregrina_ursula', x: 31, y: 30, dir: 8, sight: 4 }),
  Object.freeze({ id: 'veterano_isidro', trainer: 'b19_veterano_isidro', x: 13, y: 13, dir: 6, sight: 4 }),
]);
