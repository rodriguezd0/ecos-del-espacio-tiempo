// Coordenadas del Puente de la Convergencia (B18, Pilar de la Convergencia; docs/CAMPANA.md B18, §1.4 «Sima del Eje»:
// N Senda del Mirador · S Mirador Sur). Tileset 1 (Exterior1 + kit exterior de Pilar). Es el TRAMO CENTRAL del Puente:
// el estribo norte y el arranque del tablero están en la Senda del Mirador (B17, tablero x 18–22 hasta su borde sur) y el
// estribo sur en el Mirador Sur (B17, tablero x 19–21 desde su borde norte). Conexiones norte y sur con offset 0
// (pending_links.js).
// La Sima es vacío (casillas sin tiles, `voidBlocks`) sobre el panorama de la Sima de B17. De norte a sur:
//   · Tablero norte y el Rellano de los Custodios (y 5–12): el campamento de Alerce (tienda, hoguera, catalejo), la
//     buhonera y una estela Unown.
//   · El tramo central roto: tres huecos con sus zócalos señalizados (Reconstrucción, «desde el borde norte»).
//   · La plataforma del Cruce (y 31–51): la boca de la Cámara del Cruce, el Resonador Sintético de Genesis, Casia,
//     Garrido, Vértice y el aerodeslizador.
//   · Tramo sur (y 52–59): losas viejas y tablones de Genesis hacia el Mirador Sur.
// FUENTE ÚNICA del mapa, los eventos, las pruebas y el E2E. Módulo puro.

export const W = 40;
export const H = 60;

const P = (x, y, dir = 2) => Object.freeze({ x, y, dir });
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const rectCells = (x0, y0, x1, y1) => {
  const out = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]);
  return out;
};
/** Octógono (rectángulo con las esquinas recortadas `cut` casillas en escalera). */
function octagon({ x0, y0, x1, y1, cut }) {
  const out = [];
  for (let y = y0; y <= y1; y++) {
    const inset = Math.max(0, cut - Math.min(y - y0, y1 - y));
    for (let x = x0 + inset; x <= x1 - inset; x++) out.push([x, y]);
  }
  return out;
}

/** El puente: losas de x0 a x1 (5 de ancho); tres huecos del tramo central con dos estribos rotos. */
export const BRIDGE = Object.freeze({
  x0: 18, x1: 22, cx: 20,
  north: Object.freeze({ y0: 0, y1: 18 }),
  gaps: Object.freeze([
    Object.freeze({ n: 1, y0: 19, y1: 20, socket: P(20, 18, 2), flag: 'b18_tramo_1' }),
    Object.freeze({ n: 2, y0: 24, y1: 25, socket: P(20, 23, 2), flag: 'b18_tramo_2' }),
    Object.freeze({ n: 3, y0: 29, y1: 30, socket: P(20, 28, 2), flag: 'b18_tramo_3' }),
  ]),
  piers: Object.freeze([Object.freeze({ y0: 21, y1: 23 }), Object.freeze({ y0: 26, y1: 28 })]),
  south: Object.freeze({ y0: 52, y1: 55 }),
  /** Columnas del pretil (pilar_columna 1×3): casilla de la base (bloquea) en cada lado del tablero. */
  rails: Object.freeze([[18, 4], [22, 4], [18, 15], [22, 15], [18, 18], [22, 18], [18, 23], [22, 28], [18, 55], [22, 55]]),
  broken: Object.freeze([[22, 23], [18, 28]]), // columnas quebradas en los estribos (1×2: base)
  /** Anchura reconstruida en los huecos (las piedras se alzan en x 19–21). */
  rebuiltX: Object.freeze([19, 20, 21]),
});

/** Casillas de un hueco reconstruido (x 19–21). */
export function gapCells(gap) {
  const out = [];
  for (let y = gap.y0; y <= gap.y1; y++) for (const x of BRIDGE.rebuiltX) out.push([x, y]);
  return out;
}

/** Rellano de los Custodios: ensanche del tablero donde acampa Alerce (y 5–12). */
export const LANDING = Object.freeze({ x0: 11, y0: 5, x1: 29, y1: 12, cut: 2 });
export const landingCells = () => octagon(LANDING);

/** Tablero con losas (sin huecos, sin rellano ni plataforma). */
export function deckCells() {
  const spans = [BRIDGE.north, ...BRIDGE.piers, BRIDGE.south];
  const out = [];
  for (const s of spans) out.push(...rectCells(BRIDGE.x0, s.y0, BRIDGE.x1, s.y1));
  return out;
}

/** Plataforma del Cruce: octógono de losas (y 31–51). */
export const PLATFORM = Object.freeze({ y0: 31, y1: 51, x0: 10, x1: 30, cut: 3 });
export const platformCells = () => octagon(PLATFORM);

/** Tablones de Genesis del tramo sur (sobre el vacío) hasta el final del mapa. */
export const PLANKS = Object.freeze({ x0: 19, x1: 21, y0: 56, y1: 59 });
export const plankCells = () => rectCells(PLANKS.x0, PLANKS.y0, PLANKS.x1, PLANKS.y1);

// ───────────────────────────── plataforma ─────────────────────────────

/** Boca de la Cámara del Cruce (escalera de bajada 3×4 de Exterior1, abierta al sur): el warp en el centro. */
export const MOUTH = Object.freeze({
  x0: 19, y0: 39, // esquina del stamp 3×4
  warp: Object.freeze({ x: 20, y: 41 }),
  seal: Object.freeze({ x: 20, y: 42 }), // la Cadena Sintética la sella hasta la escena
  front: P(20, 43, 8), // se entra desde aquí mirando al norte
  arrive: P(20, 43, 2), // al volver de la Cámara
});

export const RESONATOR = Object.freeze({ x: 16, y: 42, solid: Object.freeze([[15, 41], [16, 41], [17, 41], [15, 42], [16, 42], [17, 42]]) });
/** Cadena Sintética: del Resonador a la boca y al monolito del este (decorado; se parte en la escena). */
export const CHAIN = Object.freeze({
  horizontal: Object.freeze([[18, 42], [22, 41], [23, 41], [24, 41], [25, 41], [26, 41], [13, 42], [14, 42]]),
  vertical: Object.freeze([[27, 42], [27, 43]]),
});

export const HOVER = Object.freeze({ x: 25, y: 48, solid: Object.freeze([[24, 48], [25, 48], [26, 48]]), takeoff: P(25, 47, 8) });

/** Monolitos del Pilar (pilar_monolito 2×3: casilla de la base izquierda). */
export const MONOLITHS = Object.freeze([[12, 36], [28, 36], [12, 47], [28, 47]]);

export const CAST = Object.freeze({
  // Rellano
  alerceCamp: P(17, 8, 6), // junto a su catalejo, mirando al puente
  vendor: P(26, 9, 4),
  // Plataforma
  alerceEdge: P(15, 31, 2), // «desde el borde»: donde espera entre combate y combate
  casia: P(20, 34, 8),
  casiaAside: P(13, 38, 6),
  garrido: P(20, 37, 8),
  garridoAside: P(27, 38, 4),
  vertice: P(20, 44, 2),
  tecnico: P(11, 40, 6),
  tecnica: P(29, 40, 4),
  gaelArrive: P(21, 46, 8),
  gaelFrom: P(20, 57, 8), // sube por el tramo sur desde el Mirador Sur
  olmedoArrive: P(17, 36, 2), // a un lado del tablero: los detenidos salen por los carriles x 19 y 21
  // Tras la escena
  alerceMouth: P(18, 44, 6),
  olmedoAfter: P(18, 40, 2), // junto a lo que queda del Resonador, a la vista de la boca de la Cámara
  agentAfter: P(14, 43, 6), // agente que vigila lo que queda del Resonador
  notebook: Object.freeze({ x: 23, y: 46 }),
});

/** Disparadores de las intercepciones (franjas de la plataforma). */
export const STRIPS = Object.freeze({
  casia: Object.freeze(range(12, 28).map((x) => Object.freeze({ x, y: 32 }))),
  garrido: Object.freeze(range(10, 30).map((x) => Object.freeze({ x, y: 35 }))),
});

/** Casillas de reintento de los combates de guion (CAMPANA §2.6). */
export const RETRY = Object.freeze({
  casia: P(20, 31, 2),
  garrido: P(20, 34, 2),
  vertice: P(20, 45, 8),
});

// ───────────────────────────── extremos y rellano ─────────────────────────────

/** Llegada por defecto (se entra caminando desde el tablero de la Senda del Mirador). */
export const ARRIVAL = P(20, 1, 2);
/** Borde norte: el tablero sigue en la Senda del Mirador (B17), mismas x. */
export const NORTH_EXIT = Object.freeze({ x0: 18, x1: 22, y: 0 });
/** Borde sur: los tablones siguen en el tablero del Mirador Sur (B17), mismas x. */
export const SOUTH_EXIT = Object.freeze({ x0: 19, x1: 21, y: H - 1 });
/** Vallado de Genesis en el tramo sur (hasta la escena). */
export const BARRIER_Y = 53;

export const CAMP = Object.freeze({
  tent: Object.freeze({ x: 13, y: 6 }), // tienda_campana 4×5 (puerta en (14, 9))
  rest: Object.freeze({ x: 14, y: 9 }), // se descansa mirando la puerta desde (14, 10)
  fire: Object.freeze({ x: 16, y: 11 }),
  logs: Object.freeze({ x: 11, y: 8 }), // troncos 2×2
  scope: Object.freeze({ x: 17, y: 7 }), // catalejo de Alerce (trípode)
  healPoint: P(14, 10, 8),
});

export const SIGNS = Object.freeze({
  stele: Object.freeze({ x: 25, y: 5 }), // estela Unown (2×2): se lee desde abajo (fila 7)
});

export const ITEMS = Object.freeze([
  Object.freeze({ id: 'objeto_rellano', x: 28, y: 10, item: 'ULTRABALL', count: 2 }),
  Object.freeze({ id: 'objeto_rellano_oculto', x: 12, y: 11, item: 'MAXPOTION', hidden: true }),
  Object.freeze({ id: 'objeto_estribo', x: 18, y: 26, item: 'RARECANDY' }),
  Object.freeze({ id: 'objeto_plataforma', x: 29, y: 44, item: 'FULLRESTORE' }),
  Object.freeze({ id: 'objeto_tramo_sur', x: 22, y: 52, item: 'DUSKBALL', count: 3 }),
]);

/** Grietas luminosas en las losas (la Sima se ensancha hasta que se restaura el P9). */
export const CRACKS = Object.freeze([P(21, 13, 2), P(19, 22, 2), P(12, 43, 2), P(28, 34, 2), P(20, 54, 2)]);

/** Zonas de encuentros (Sima del Eje, Cueva / ruina): el rellano y la plataforma. */
export const ENCOUNTER_ZONES = Object.freeze([
  Object.freeze({ x0: LANDING.x0, y0: LANDING.y0, x1: LANDING.x1, y1: LANDING.y1 }),
  Object.freeze({ x0: PLATFORM.x0, y0: PLATFORM.y0, x1: PLATFORM.x1, y1: PLATFORM.y1 }),
]);
