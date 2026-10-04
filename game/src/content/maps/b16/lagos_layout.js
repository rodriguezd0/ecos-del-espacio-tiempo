// Coordenadas de los Lagos del Alma (B16; docs/CAMPANA.md §1.4 «Tres lagos glaciares con santuario central», 60×60,
// tileset 1 con piezas de nieve). Tres lagos que rodean un islote: el del Saber al oeste, el del Sentir al este (con su
// islote pequeño: C095) y el del Querer al norte, bajo el acantilado y su cascada. El canal sur une los tres; lo cruza
// el puente de hielo de la orilla al islote, cuyo tramo junto al islote se fundió cuando retrocedió el hielo-eco (P7):
// antes del P8 se llega al santuario NADANDO (G12). Orilla sur: camino desde Villa Boreal (borde sur), mirador de las
// auroras en la cabeza del puente, refugio de los observadores y campamento del Consorcio.
// FUENTE ÚNICA para el mapa, los eventos, las pruebas y el E2E. Módulo puro.

export const W = 60;
export const H = 60;

const P = (x, y, dir = 2) => Object.freeze({ x, y, dir });

/** Rectángulo inclusivo con esquinas redondeadas (radio r) → casillas. */
export function roundRect(x0, y0, x1, y1, r = 0) {
  const out = [];
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = Math.max(x0 + r - x, 0, x - (x1 - r));
      const dy = Math.max(y0 + r - y, 0, y - (y1 - r));
      if (r > 0 && dx * dx + dy * dy > r * r) continue;
      out.push([x, y]);
    }
  }
  return out;
}

export const rect = (x0, y0, x1, y1) => roundRect(x0, y0, x1, y1, 0);

/** Islote del santuario (tierra en medio de los lagos). */
export const ISLAND = Object.freeze({ x0: 23, y0: 14, x1: 37, y1: 31 });
/** Macizo de roca del santuario (brush acantilado; cara de 3 filas abajo) con la boca y su dintel. */
export const SANCTUARY = Object.freeze({
  rock: Object.freeze({ x: 25, y: 14, w: 11, h: 7 }),
  boquete: Object.freeze({ x: 27, y: 18 }),
  dintel: Object.freeze({ x: 26, y: 21 }),
  warps: Object.freeze([Object.freeze({ x: 28, y: 19 })]),
  out: P(28, 24, 2), // llegada al salir del santuario (bajo el dintel)
  plaza: Object.freeze({ x: 25, y: 25 }), // estrado 6×6
  stele: Object.freeze({ x: 33, y: 23 }), // pilar_placa_unown 2×2 (se lee desde abajo)
});

/** Puente de hielo (3 de ancho) de la orilla sur al islote. Huecos: A junto al islote (fundido) y B junto a la orilla. */
export const BRIDGE = Object.freeze({
  x0: 27, x1: 29, cx: 28,
  y0: 32, y1: 41, // de la punta del islote (y 31) a la orilla (y 42)
  gapA: Object.freeze({ y0: 32, y1: 33 }), // fundido desde que retrocedió el hielo-eco (agua: se nada)
  middle: Object.freeze({ y0: 34, y1: 38 }), // el arco donde miran la aurora los vecinos
  gapB: Object.freeze({ y0: 39, y1: 40 }), // se hunde en la escena del hito
  /** Zócalos de Reconstrucción: a cada lado de cada hueco (A: islote y arco; B: arco y orilla). */
  sockets: Object.freeze({
    A: Object.freeze([P(28, 31, 2), P(28, 34, 8)]),
    B: Object.freeze([P(28, 38, 2), P(28, 41, 8)]),
  }),
  villagers: Object.freeze([P(27, 35, 8), P(29, 36, 8), P(27, 37, 6), P(29, 38, 4)]),
});

/** Casillas del puente (todas, con los dos huecos). */
export function bridgeCells({ withGapA = true, withGapB = true } = {}) {
  const out = [];
  for (let y = BRIDGE.y0; y <= BRIDGE.y1; y++) {
    if (!withGapA && y >= BRIDGE.gapA.y0 && y <= BRIDGE.gapA.y1) continue;
    if (!withGapB && y >= BRIDGE.gapB.y0 && y <= BRIDGE.gapB.y1) continue;
    for (let x = BRIDGE.x0; x <= BRIDGE.x1; x++) out.push([x, y]);
  }
  return out;
}

/** Casillas de un hueco del puente ('A' | 'B'). */
export function gapCells(gap) {
  const g = BRIDGE[gap === 'A' ? 'gapA' : 'gapB'];
  const out = [];
  for (let y = g.y0; y <= g.y1; y++) for (let x = BRIDGE.x0; x <= BRIDGE.x1; x++) out.push([x, y]);
  return out;
}

/**
 * Los tres lagos (agua navegable). El del Querer rodea el islote del santuario (lo alimenta la cascada); el del Saber
 * y el del Sentir quedan a los lados, separados por dos lenguas de tierra que bajan hasta la orilla sur.
 */
const RR = (x0, y0, x1, y1, r) => Object.freeze({ x0, y0, x1, y1, r });
export const LAKES = Object.freeze({
  querer: Object.freeze([RR(17, 7, 43, 22, 5), RR(18, 18, 42, 41, 5), RR(16, 11, 20, 30, 2), RR(40, 12, 44, 34, 2)]),
  saber: Object.freeze([RR(4, 11, 12, 27, 4), RR(6, 21, 13, 37, 4), RR(4, 30, 9, 36, 2)]),
  sentir: Object.freeze([RR(48, 10, 55, 24, 4), RR(47, 19, 54, 37, 4), RR(51, 31, 55, 36, 2)]),
});
/** Lenguas de tierra entre los lagos (se llega a pie desde la orilla sur). */
export const SPITS = Object.freeze({ west: Object.freeze({ x0: 14, x1: 16 }), east: Object.freeze({ x0: 44, x1: 46 }) });
/** Islote del Lago del Sentir (C095) e islote del Lago del Saber (un objeto). */
export const SENTIR_ISLET = Object.freeze({ x0: 50, y0: 22, x1: 52, y1: 24 });
export const SABER_ISLET = Object.freeze({ x0: 7, y0: 22, x1: 9, y1: 24 });

/** Casillas de agua del mapa (sin los islotes). */
export function waterCells() {
  const set = new Map();
  const add = (list) => { for (const [x, y] of list) set.set(`${x},${y}`, [x, y]); };
  for (const lake of Object.values(LAKES)) for (const l of lake) add(roundRect(l.x0, l.y0, l.x1, l.y1, l.r));
  const land = new Set([
    ...roundRect(ISLAND.x0, ISLAND.y0, ISLAND.x1, ISLAND.y1, 3), ...rect(SENTIR_ISLET.x0, SENTIR_ISLET.y0, SENTIR_ISLET.x1, SENTIR_ISLET.y1),
    ...rect(SABER_ISLET.x0, SABER_ISLET.y0, SABER_ISLET.x1, SABER_ISLET.y1),
  ].map(([x, y]) => `${x},${y}`));
  return [...set.values()].filter(([x, y]) => !land.has(`${x},${y}`));
}

/** Acantilado norte (macizo convexo) y la cascada que cae al Lago del Querer. */
export const CLIFF_N = Object.freeze({ x: 0, y: 0, w: 60, h: 6 });
export const WATERFALL = Object.freeze({ x: 29, y: 2, w: 2, h: 5 }); // de la cima (y 2) al lago (y 7)
/** Repisa estrecha al pie del acantilado (orilla norte del Querer; se llega nadando). */
export const NORTH_LEDGE = Object.freeze({ x0: 18, x1: 42, y: 6 });

/**
 * Salida sur hacia Villa Boreal (B15): sendero en x 12–15 (= x 20–23 de Villa Boreal; content/maps/b15/links.js pide
 * offset 8 desde Boreal, −8 desde aquí). El camino sube hacia el norte y gira al este hasta el mirador.
 */
export const EXITS = Object.freeze({ south: Object.freeze({ x0: 12, x1: 15, y: 59, offset: -8 }) });
export const PATH = Object.freeze([
  Object.freeze({ x0: 12, y0: 49, x1: 15, y1: 59 }), // del borde sur hacia el norte
  Object.freeze({ x0: 16, y0: 49, x1: 30, y1: 51 }), // hacia el este, al pie del mirador
  Object.freeze({ x0: 27, y0: 45, x1: 30, y1: 48 }), // subida al mirador
]);
export const ARRIVAL = P(13, 57, 8);

/** Mirador de las auroras (cabeza del puente) con bancos y farola. */
export const MIRADOR = Object.freeze({ x0: 22, y0: 42, x1: 35, y1: 44 });

/** Refugio de los observadores (cabana_turquesa 6×9, puerta en [2, 6]). */
export const REFUGIO = Object.freeze({ stamp: Object.freeze({ x: 37, y: 43 }), door: Object.freeze({ x: 39, y: 49 }) });
/** Campamento del Consorcio (tienda 4×5) con su trípode apuntando al santuario. */
export const CAMP = Object.freeze({
  tent: Object.freeze({ x: 48, y: 42 }),
  tripod: P(46, 44, 8),
  tecnica: P(47, 45, 8),
  tecnico: P(52, 47, 4),
  crates: Object.freeze([[53, 44], [54, 44]]),
});

/** Hierba alta (encuentros «Hierba»): prados de la orilla sur y del islote. */
export const GRASS = Object.freeze([
  ...rect(3, 43, 10, 47), ...rect(4, 48, 9, 51),
  ...rect(18, 52, 25, 53),
  ...rect(43, 50, 51, 53),
  ...rect(33, 27, 36, 29),
]);

/** Casillas donde aparecen personajes y cosas (fuente de las pruebas de alcanzabilidad). */
export const NPC = Object.freeze({
  marta: P(24, 43, 8),
  snorunt: P(20, 45, 6),
  snorunt_after: P(25, 43, 4),
  elder: P(33, 45, 8),
  kid: P(31, 43, 8),
  observer: P(41, 51, 4),
  sign: Object.freeze({ x: 17, y: 52 }),
  arrivalStrip: Object.freeze([[12, 55], [13, 55], [14, 55], [15, 55]]),
});

/** Objetos de los lagos. */
export const LAGOS_ITEMS = Object.freeze([
  Object.freeze({ id: 'objeto_lagos_1', x: 5, y: 52, item: 'ULTRABALL', count: 3 }),
  Object.freeze({ id: 'objeto_lagos_2', x: 54, y: 52, item: 'FULLRESTORE', hidden: true }),
  Object.freeze({ id: 'objeto_lagos_3', x: 24, y: 29, item: 'MAXREVIVE' }), // islote del santuario
  Object.freeze({ id: 'objeto_lagos_4', x: 36, y: 6, item: 'PPUP' }), // repisa norte
  Object.freeze({ id: 'objeto_lagos_5', x: 8, y: 23, item: 'NEVERMELTICE' }), // islote del Saber (nadando)
  Object.freeze({ id: 'objeto_lagos_6', x: 34, y: 51, item: 'DUSKBALL', count: 2 }),
]);

/** C095: islote del Lago del Sentir (etapa H: Nadar). */
export const CELL_LAGOS = Object.freeze({ x: 51, y: 23 });
/** Zona del Lago del Sentir (Supercaña; casillas especiales de Feebas con la Caña Buena). */
export const SENTIR_ZONE = Object.freeze({ x0: 47, y0: 11, x1: 55, y1: 37 });
/** Punto de aparición del refugio al salir. */
export const REFUGIO_OUT = P(39, 50, 2);
