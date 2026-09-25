// Coordenadas de la Gruta Escarcha (CAMPANA §1.4: «Cueva de hielo», 2 × 40×40, tileset 12, O Villa Boreal, tras P7) y
// del Mar Boreal (50×40, tileset 1, E Villa Boreal; Nadar) con su fondo (Buceo). Las dos salas de la gruta son recortes
// horneados de la Cueva Glaciada de Añil (content/stamps/cueva1_extras.js: sala_glaciar_cascada y sala_glaciar_bloques);
// `at` convierte sus coordenadas originales en casillas del mapa. Módulo puro.

/** Sala 1 (sala_glaciar_cascada, 28×35; en Añil x 5–32, y 3–37): colocada en (6, 2). */
const S1 = { x: 6, y: 2, ax: 5, ay: 3 };
/** Sala 2 (sala_glaciar_bloques, 33×39; en Añil x 1–33, y 44–82): colocada en (3, 1). */
const S2 = { x: 3, y: 1, ax: 1, ay: 44 };
const at2 = (x, y) => ({ x: x - S2.ax + S2.x, y: y - S2.ay + S2.y });

export const ESCARCHA = Object.freeze({
  width: 40,
  height: 40,
  room: S1,
  /**
   * Llegada desde Villa Boreal (repisa de abajo, mirando arriba) y salida: la claridad del recorte (fila 36) no se
   * pisa, así que el felpudo es la última fila de suelo (35) y se sale pulsando abajo (como la Gruta del Albo, B04).
   */
  entry: { x: 24, y: 34, dir: 8 },
  exit: { y: 35, x0: 23, x1: 25 },
  /** Boca de la cueva interior (repisa baja del oeste; se entra empujando contra ella desde `innerFront`) → sala 2. */
  inner: { x: 12, y: 19 },
  innerFront: { x: 12, y: 20, dir: 8 },
  /**
   * Repisas nevadas del lago bajo (solo a nado; el lago alto, sobre la cascada, no se alcanza): Glalita en la del este,
   * C094 y un objeto en la del oeste, junto a la boca de la sala honda.
   */
  glalita: { x: 29, y: 22 },
  item: { x: 10, y: 23 },
  /** C094 «Lago helado»: repisa nevada del oeste, solo a nado. */
  cell: { x: 10, y: 21 },
  trainers: { lucio: { x: 27, y: 34, dir: 4 } },
});

export const ESCARCHA2 = Object.freeze({
  width: 40,
  height: 40,
  room: S2,
  /** Llegada desde la sala 1 (bajo la boca de arriba) y vuelta (empujando contra la boca). */
  entry: { x: 21, y: 6, dir: 2 },
  back: { x: 21, y: 5 },
  /** Bocas cerradas por derrumbes de hielo (en Añil, x 8/28, y 60/64/74). */
  sealed: [at2(8, 60), at2(28, 64), at2(28, 74)],
  /** Al fondo, en el rincón de la cámara baja (se llega resbalando por la pista de hielo); Fidel la guarda. */
  baxcaliburita: { x: 32, y: 33 },
  items: [{ x: 8, y: 6, item: 'NEVERMELTICE' }, { x: 31, y: 11, item: 'ICESTONE' }, { x: 13, y: 31, item: 'ULTRABALL', count: 2, hidden: true }],
  fidel: { x: 31, y: 34, dir: 8 },
});

/** Mar Boreal (superficie) y su fondo. */
export const MAR = Object.freeze({
  width: 50,
  height: 40,
  east: { offset: 0 },
  /** Témpanos: islotes de nieve (meseta nevada) en el mar; C096 sobre el grande. */
  floes: [{ x: 24, y: 17 }, { x: 36, y: 6 }, { x: 10, y: 29 }],
  cell: { x: 26, y: 19 },
  /** Islote de la Instalación Cierzo (postgame): cerrado. */
  cierzo: { x: 3, y: 2, gate: { x: 6, y: 7 } },
  dive: { x: 40, y: 30 },
  teo: { x: 23, y: 19, dir: 4 },
  items: [{ x: 38, y: 6, item: 'BIGPEARL', hidden: true }, { x: 12, y: 30, item: 'PEARL' }],
});

export const FONDO = Object.freeze({
  width: 26, height: 18,
  entry: { x: 5, y: 8, dir: 6 },
  surface: { map: 'mar_boreal', x: MAR.dive.x, y: MAR.dive.y, dir: 2 },
  room: { x: 3, y: 3, w: 20, h: 12 },
  shallow: [[3, 6, 5, 5]],
  vent: { x: 13, y: 10 },
  items: [{ x: 19, y: 6, item: 'DEEPSEASCALE', hidden: true }, { x: 16, y: 12, item: 'HEARTSCALE' }],
  kelp: [[8, 4], [12, 5], [16, 4], [18, 9], [9, 11], [20, 12]],
  rocks: [[6, 4], [14, 13], [21, 7]],
});
