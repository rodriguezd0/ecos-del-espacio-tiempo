// Coordenadas de la Ruta 11 (CAMPANA §1.4: «Vertiente nevada», 30×70, tileset 1, S Villa Brontia · N Paso del
// Norte; hielo-eco hasta P7). Fuente única para el constructor, los eventos, los tests y el README. Módulo puro.
// Tres tramos de subida separados por dos caras de terraza nevada con escaleras.

export const RUTA11 = Object.freeze({
  width: 30,
  height: 70,
  start: { x: 14, y: 67, dir: 8 },
  /** Salida sur hacia Villa Brontia (x 20–23 de Brontia: `south`, offset −7) y norte hacia el Paso del Norte. */
  south: { y: 69, x0: 13, x1: 16, offset: -7 },
  north: { y: 0, x0: 13, x1: 16, offset: 0 },
  /** Línea de nieve: por debajo, pradera con parches de nieve (la meseta de Brontia). */
  snowLine: 60,
  /** Caras de terraza (3 filas; la última es `faceBottom`) y sus escaleras (x de la columna izquierda). */
  faces: [
    { name: 'baja', faceBottom: 45, stairs: { x: 20, stamp: 'escalera_terraza' } },
    { name: 'alta', faceBottom: 23, stairs: { x: 6, stamp: 'escalera_terraza' } },
  ],
  /** Tramos (filas transitables) de abajo arriba. */
  tiers: [{ y0: 46, y1: 69 }, { y0: 24, y1: 42 }, { y0: 0, y1: 20 }],
  /** Nieve honda (Terreno complicado) del rincón de C089, con su orilla de eventos roughTerrain. */
  deepSnow: { x0: 23, y0: 48, x1: 27, y1: 54, gate: [[22, 51], [22, 52]] },
  /** Escena de la desvinculación (primera entrada): la montañera y su Snover. La franja cubre todo el paso de la fila 63. */
  unbound: { trigger: { y: 63, x0: 8, x1: 25 }, woman: { x: 11, y: 58, dir: 6 }, snover: { x: 17, y: 59 } },
  /** Restos del hielo-eco que se deshace a los lados del camino. */
  iceRemains: [[10, 64], [19, 65], [11, 61], [18, 62], [12, 55], [16, 51]],
  sign: { x: 11, y: 66 }, // casilla central del cartel de postes (3×2, esquina en x − 1, y − 1)
  signTop: { x: 17, y: 3 },
  /** Repisa alta (terraza pequeña): se sube por su escalera, que tapa una roca nevada agrietada (Embestida). */
  ledge: { x0: 22, y0: 6, x1: 27, y1: 12, stairs: { x: 24, y: 10 }, rock: { x: 25, y: 12 }, item: { x: 26, y: 7 } },
  /** Células (CAMPANA §2.3: C089–C090 «Nieve de la vertiente»). */
  cells: { c089: { x: 25, y: 51 }, c090: { x: 24, y: 7 } },
  /** Entrenadores (casilla y dirección). */
  trainers: {
    begona: { x: 21, y: 51, dir: 4 },
    abel: { x: 12, y: 35, dir: 2 },
    sabina: { x: 20, y: 30, dir: 4 },
    hilario: { x: 10, y: 13, dir: 2 },
  },
  items: {
    hyper: { x: 22, y: 60 },
    iceStone: { x: 24, y: 36 },
    ultra: { x: 20, y: 6 },
    neverMelt: { x: 5, y: 27 },
  },
});
