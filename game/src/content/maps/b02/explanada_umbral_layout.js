// Coordenadas de la Explanada del Umbral (fuente única para el build, los eventos, las pruebas y el E2E).
// Documentado en content/maps/b02/README.md. Módulo puro.
//
// Explanada de 30×30 (tileset 7) delante de las Ruinas del Dintel: el macizo de roca al norte con la boca de la
// ruina, el dintel exento que le da nombre, la plaza enlosada y el camino al este hacia Villa Zaguán.

export const W = 30;
export const H = 30;

/** Macizo de roca que contiene la ruina (brush `acantilado`; cara de 3 filas abajo). Llega al borde norte. */
export const ROCK = Object.freeze({ x: 8, y: 0, w: 15, h: 10 });

/**
 * Boca de la ruina tallada en la cara del macizo (`mouth`: hueco oscuro de 3×2 entre dos jambas de piedra),
 * detrás de su dintel exento (stamp `pilar_dintel` 5×4, hueco x 14–16). Los warps están en la fila de abajo del hueco.
 */
export const EXPLANADA_DOOR = Object.freeze({
  mouth: { x: 14, y: 8, w: 3 },
  dintel: { x: 13, y: 10 },
  warps: [{ x: 15, y: 9 }],
  out: { x: 15, y: 13, dir: 2 }, // llegada al salir de las ruinas (al pie del dintel, con el Core a la vista)
});

/** Plaza enlosada (dos filas de `placa_piedra` 6×3) y camino al este. */
export const PLAZA = Object.freeze({ x: 10, y: 14, w: 12, h: 6 });
export const EAST_PATH = Object.freeze({ x0: 22, x1: 29, y0: 13, y1: 15 });
/** Salida este (conexión con Villa Zaguán): filas 13–15 = filas 16–18 del pueblo. */
export const ZAGUAN_OFFSET = 3;

/** Posiciones de la escena de entrada (CAMPANA B02, pasos 2–3). */
export const SCENE = Object.freeze({
  casilda: { x: 15, y: 13, dir: 2 },          // bloquea el paso bajo el dintel
  gael: { x: 19, y: 13, dir: 4 },             // espera junto al dintel
  gaelWait: { x: 21, y: 17, dir: 8 },         // se aparta a esperar mientras estás dentro
  gaelStrip: [{ x: 24, y: 13 }, { x: 24, y: 14 }, { x: 24, y: 15 }], // al llegar a la explanada
  gateStrip: [{ x: 14, y: 15 }, { x: 15, y: 15 }, { x: 16, y: 15 }, { x: 13, y: 14 }, { x: 17, y: 14 }],
  beam: { x: 15, y: 10 },                     // ranura central de la viga del dintel (brilla con el Core)
  // salida al atardecer (paso 6): el equipo de medición entra por el camino del este
  genesis: [{ id: 'cientifica', x: 29, y: 14, stop: { x: 19, y: 14 } }, { id: 'tecnico_a', x: 29, y: 13, stop: { x: 20, y: 13 } }, { id: 'tecnico_b', x: 29, y: 15, stop: { x: 20, y: 15 } }],
  casildaExit: { x: 16, y: 13, dir: 2 },
  gaelWatch: { x: 22, y: 14, dir: 4 },
});
